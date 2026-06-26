# Security Fixes — Pre-production Hardening

**Date:** 2026-06-23
**Scope:** Findings from the security audit + PM review, applied to `firestore.rules`, the auth/progress-sync layer, and the E2E bypass. Build stays green (`cd web && npm run build`).

> ⚠️ **Rules are NOT auto-deployed.** Editing `firestore.rules` only changes the local file. You must deploy it (see [Deploy steps](#deploy-steps)) for any of the C1/M1/M2 protections below to take effect in production.

---

## C1 (critical) — Public `usernames` collection leaked email + allowed bulk harvest

**Before:** `match /usernames/{username} { allow read: if true; }` with each doc storing `{ uid, email }`. `allow read` covers **both** single-doc `get` **and** collection `list`, so anyone could enumerate the whole collection and scrape every user's email.

**After (`firestore.rules`):**

- Split read into `allow get: if true;` (single exact-key lookup — keeps username→email login working) and `allow list: if false;` (blocks enumeration / bulk harvest).
- Tightened `create` so a doc can only be written by its owner, pinned to the caller's own uid and verified token email, and limited to exactly the `{uid, email}` keys:

  ```
  allow create: if request.auth != null
    && !exists(/databases/$(database)/documents/usernames/$(username))
    && request.resource.data.uid == request.auth.uid
    && request.resource.data.email == request.auth.token.email
    && request.resource.data.keys().hasOnly(['uid', 'email']);
  ```

  This also closes **M2** (the old rule only checked `email is string`, so any string could be written).

### Residual risk + recommended future step (not done now)

Single-doc `get` is still public, so the login form can resolve `username → email` before sign-in. That means an attacker who already **knows a username** can still confirm it exists and read the associated email via a direct `get`. Fully hiding the email requires moving the lookup server-side:

- Add a **Cloud Function `resolveUsername`** that takes a username and either returns nothing or mints a **custom auth token** (custom-token login), so the email never leaves the backend and the `usernames` docs no longer need to store an email at all.
- This was intentionally **not** implemented now because Cloud Functions require the **Blaze (paid) plan** and we're avoiding adding paid infra for this pass.

### Also recommended: enable **Firebase App Check**

Turn on [App Check](https://firebase.google.com/docs/app-check) (reCAPTCHA Enterprise / v3 for web) and enforce it on Firestore. This attests requests come from our real app and blocks scripted abuse of the still-public `get` path and the auth endpoints — a cheap, high-leverage mitigation that complements the rules above.

---

## M1 (medium) — Firestore user-doc validation + identity integrity

**Before:** `users/{userId}` writes only validated gamification field *types*; any extra field could be injected, and `email`/`username` could be overwritten.

**After (`firestore.rules`):**

- `validUserFields(...)` whitelists exactly the fields the app writes: `email, username, profileAnimal, profileComplete, level, totalXp, streak, lastActivityDate, chips, bankrollGranted, createdAt` — applied on both `create` and `update`. (`chips` / `bankrollGranted` are the play-money casino-bankroll fields added later; `validGamificationFields` bounds their types/ranges.)
- `identityFieldsValid(prev, next)` constrains `email` and `username` on `update` so a profile can never point at an address or name the caller hasn't proven they own: `email` may only be set to the caller's **verified token email** (or left unchanged), and `username` may be absent, null, unchanged, or changed only to a name the caller **owns in the `usernames` index** after the commit (this also closes **M3** — username impersonation / index desync). Profile setup still works (the initial null→value set), and the gamification/bankroll transactions leave identity fields untouched. (`profileAnimal` stores the chosen avatar; despite the name, the shipped avatars are poker icons — the field name is kept for back-compat.)

---

## XP integrity (PM P1 #6) — idempotent lesson-completion XP

**Before:** XP was awarded in a `users/{uid}`-only transaction, gated only by the **local** `completed` flag. A stale second device, a double-tap, or a re-completion could double-award.

**After (`web/src/lib/progress/FirestoreProgressBackend.ts` → `completeLesson`, behind the `ProgressBackend` seam):** completion now runs in **one** transaction that reads `users/{uid}/lessonProgress/{lessonId}`, writes `completed: true` + an `xpAwarded: true` flag, and bumps `users/{uid}` XP **only if `xpAwarded` (or an already-`completed` doc) was not already set**. The persisted flag (not in-memory state) is the single source of truth, so re-completion / double-tap / multi-device can never double-award. The base+bonus amount logic is unchanged. (The progress-layer refactor replaced the former `gamificationFirestore.ts` / `lessonProgress.ts` path with this `ProgressStore` / `ProgressBackend` seam.)

---

## H1 (high) — Shared-device account contamination

**Before:** logout never cleared local progress, and the auth-sync uploaded the previous user's local data into a newly-signed-in user's empty Firestore.

**After:** the H1 reset is the explicit `ProgressStore.resetLocalUserState()` orchestrator, called from `AuthContext` on logout and whenever the authenticated uid changes from a different previous uid. It wipes **all per-user local state** — lesson progress **plus** casino table-clears and the play-money bankroll (the latter two via an injected `onLocalReset`) — so a shared device never leaks one account's data into the next. A freshly signed-in different account starts from cleared local state and treats the remote backend as the source of truth. (This replaces the former `clearLocalProgress()` / `syncProgressOnAuth` in `lessonProgressStore.ts`.)

---

## H2 (high) — E2E auth bypass could ship to prod

**Before:** `E2E_BYPASS_AUTH = import.meta.env.VITE_E2E_BYPASS_AUTH === 'true'` — a leaked env var in a prod build would disable auth.

**After (`e2eBypass.ts`):** `E2E_BYPASS_AUTH = import.meta.env.DEV && import.meta.env.VITE_E2E_BYPASS_AUTH === 'true'`. `import.meta.env.DEV` is statically `false` after `vite build`, so a production bundle can never enable the bypass (the dead branch is also tree-shaken out).

---

## L1 (low) — Login username enumeration

**Before:** an unknown username threw `"No account found with that username."`, distinguishing it from a wrong password.

**After (`AuthContext.signInWithUsername`):** both unknown-username and wrong-password now surface the identical generic `"Incorrect username or password."` (the password cases already mapped to that in `authErrors.ts`).

---

## Deploy steps

These rules changes have **no effect** until deployed:

```bash
# from the repository root (where firestore.rules + firebase.json live)
npx -y firebase-tools@latest deploy --only firestore:rules
```

After deploy, verify in the [Firestore Rules console](https://console.firebase.google.com/project/brilliant-alpha-clone-54be9/firestore/rules) and smoke-test: username login still works, and a `list` on `usernames` is denied.
