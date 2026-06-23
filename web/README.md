# Brilliant Alpha Clone — Web App

React + Vite + Tailwind + Firebase frontend for the Phase 1 MVP.

## Setup

```bash
cd web
npm install
cp .env.example .env.local
```

Add your Firebase Web app config to `.env.local` from:
[Firebase Console → brilliant-alpha-clone-54be9](https://console.firebase.google.com/project/brilliant-alpha-clone-54be9/overview)

Register a **Web app** if one does not exist yet (Project settings → Your apps → Add app → Web).

## Development

```bash
npm run dev
```

Open **`http://localhost:5173`** (or whatever port Vite prints). Use `localhost`, not `127.0.0.1`, unless both are in Firebase authorized domains.

### Google sign-in (local dev)

Firebase CLI **`firebase deploy --only auth` does not add authorized domains** — those must be set in the Firebase Console (or via `scripts/add-auth-domains.mjs`).

1. [Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/brilliant-alpha-clone-54be9/authentication/settings)
2. Click **Add domain** and add **`localhost`**
3. Optionally add **`127.0.0.1`** if you use that host instead
4. Confirm **`brilliant-alpha-clone-54be9.firebaseapp.com`** and **`.web.app`** are listed

Or from the repo root (requires `firebase login`):

```bash
node scripts/add-auth-domains.mjs
```

Then redeploy Google OAuth redirect URIs:

```bash
npx -y firebase-tools@latest deploy --only auth
```

Hard-refresh the app and try **Continue with Google** again.

## Build

```bash
npm run build
```

Output goes to `web/dist` for Firebase Hosting.

## Deploy (Firebase Hosting)

From the **repository root** (where `firebase.json` lives):

```bash
cd web && npm run build && cd ..
firebase deploy --only hosting
```

Or as two steps:

```bash
cd web
npm run build
cd ..
npx -y firebase-tools@latest deploy --only hosting
```

**Prerequisites:** `firebase login` and access to project `brilliant-alpha-clone-54be9`. Hosting serves the built app from `web/dist` (configured in root `firebase.json`).

Do **not** deploy unless credentials are configured — the build step alone validates the app compiles.

## Phase 1 build stages

1. **Stage 1** — Project scaffold, responsive Brilliant-style shell, Firebase wiring, routing, 6-lesson course data
2. **Stage 2** — Auth + profile setup (email, Google, username, animal avatar)
3. **Stage 3** — JSON lesson model + renderer + interactive Lessons 1–3
4. **Stage 4** — Firestore progress persistence + lesson unlock logic ✅

   **Progress schema** (`users/{uid}/lessonProgress/{lessonId}`):

   | Field | Type | Notes |
   |-------|------|-------|
   | `attempted` | boolean | User opened the lesson |
   | `lessonFinished` | boolean | All lesson steps done |
   | `completed` | boolean | Skill check passed (unlocks next lesson) |
   | `lessonAccuracy` | number \| null | First-try accuracy % |
   | `skillCheckCorrect` | number \| null | Skill check score |
   | `skillCheckTotal` | number \| null | Skill check question count |
   | `pendingProblemAttempts` | object \| null | Submit counts per problem step (saved at lesson finish) |
   | `lastLessonXpBreakdown` | object \| null | `{ base, bonus }` from last first-time completion |
   | `session` | object? | `{ stepIndex, solvedStepIds, problemAttempts? }` while in progress |
   | `updatedAt` | timestamp | Server time on last write |

   **Sync:** On sign-in, Firestore is the source of truth. If the user has no remote progress yet, local `localStorage` data is uploaded once. All writes go to Firestore (session saves debounced ~400ms) and mirror to `localStorage` for offline resilience. Signed-out users use `localStorage` only.

5. **Stage 5** — Streaks + XP + levels on home dashboard ✅

   **Gamification** (on `users/{uid}`):

   | Field | Type | Notes |
   |-------|------|-------|
   | `totalXp` | number | Lifetime XP (100 base + up to 50 bonus per first lesson completion) |
   | `level` | number | Derived from total XP |
   | `streak` | number | Consecutive qualifying days |
   | `lastActivityDate` | string \| null | Last CAT day (`YYYY-MM-DD`) with a full lesson completion |

   **XP:** 100 base XP on first completion only (lesson steps + skill check). Up to **+50 bonus** based on first-try performance on lesson problems. Replays award nothing.

   **Bonus formula** (`computeLessonXp` in `src/lib/gamification.ts`):

   ```
   baseXp = 100
   extraAttempts = sum(problemAttempts) − problemCount
   bonusXp = max(0, 50 − extraAttempts × 10)
   totalXp = baseXp + bonusXp
   ```

   Examples (5 lesson problems): all first try → **150 XP**; one problem took 3 submits → **130 XP** (2 extra attempts → bonus 50 − 20 = 30).

   **Levels:** `xpToNextLevel(level) = 100 + (level − 1) × 25` — e.g. 100 XP for 1→2, 125 for 2→3, 150 for 3→4.

   **Streak:** +1 per CAT calendar day (`America/Guatemala`, UTC−6) with at least one full lesson completion; once per day; missing a day resets displayed streak to 0.

   **Award hook:** `saveSkillCheckResult` → `awardLessonCompletion` (Firestore transaction). Profile refreshes via `gamification-updated` event.

6. **Stage 6** — Lessons 4–6 + Firebase deploy prep ✅
