# CONTEXT — Domain glossary

The shared language for this codebase (a poker-training web app, "Suited"). Names here
should match the names in code. This file is the place an architecture review looks first
to name good **seams** in domain terms; grow it lazily as concepts crystallize.

> Architecture vocabulary used throughout: **module, interface, implementation, depth,
> deep, shallow, seam, adapter, leverage, locality.**

## Learner progress

- **Lesson progress aggregate** — everything about one learner's journey through the
  lessons: per-lesson stats (attempted / finished / completed, accuracy, skill-check
  score, pending attempts) plus the XP / level / streak counters. The deep
  **ProgressStore** module owns this aggregate; it is read synchronously from an
  intrinsic, offline-first local cache and written through to the backend.

- **Lesson session** — the *in-progress* state of a single lesson: `stepIndex`,
  `solvedStepIds`, and per-problem submit counts. Distinct from the lesson's *stats*;
  a session is dropped once the lesson is completed.

- **Lesson completion award** — the single atomic, idempotent operation that, on a
  qualifying skill-check pass, persists completion **and** awards XP exactly once and
  advances the streak. Idempotency is anchored on the persisted `xpAwarded` flag, not on
  in-memory `completed` state. Lives behind the progress seam as `completeLesson(...)`.

- **Skill-check pass** — answering ≥ 2/3 correctly; the event that marks a lesson
  `completed`, awards XP, and unlocks the next lesson.

- **Streak (CAT day)** — consecutive calendar days (Central American Time, UTC−6) with a
  qualifying activity. Advances once per day; a review of an already-completed lesson
  advances the streak without awarding XP.

## Seams & adapters

- **ProgressStore** — the deep, instantiable module that holds the lesson progress
  aggregate, exposes a small synchronous read interface plus `subscribe`/`getSnapshot`
  for React (`useProgress` via `useSyncExternalStore`), and hides cache, debounce, and
  sanitization. Replaces the former split across `lessonProgress*`, `progressSync`, and
  `lessonSession`, and the module-level singletons.

- **ProgressBackend** — the seam in front of remote persistence. Contract:
  `loadAll · writeLesson · completeLesson (atomic, idempotent) · touchStreak · clear`.
  - **FirestoreProgressBackend** — production adapter (`users/{uid}` + `lessonProgress`
    subcollection; the completion transaction).
  - **InMemoryProgressBackend** — test adapter reproducing the same contract, including
    idempotent completion — so the completion/streak/H1 paths are unit-testable.
  (Two adapters justify the seam: Firestore in prod, in-memory in tests. Local storage is
  *not* an adapter — it is the store's intrinsic offline-first cache.)

- **H1 reset (`resetLocalUserState`)** — the explicit orchestrator at the auth seam that,
  on sign-out or account switch, wipes all per-user *local* state (progress + casino
  table-clears + bankroll) so a shared device never leaks one account's data into another.

- **AuthService** — the deep, framework-free module that owns the auth orchestration:
  username->email sign-in, enumeration-safe password reset, reauth-retry credential
  linking, the shared re-authentication flow, email/password change, and the
  verify-before-update **email reconciliation**. It depends only on two ports
  (`AuthPort`, `ProfilePort`) and imports neither `firebase/*` nor React, so the
  security-sensitive flows are exercised through the service interface — *the interface
  is the test surface*. `AuthContext` is the thin React adapter that binds it to state,
  subscribes to the Firebase auth listeners, and wires the **ProgressStore** seam.

- **AuthPort / ProfilePort** — the seams in front of Firebase Auth and the Firestore
  profile/username-index. Contracts: `AuthPort` = current-user snapshot + sign-in/up,
  reset, single-attempt link, re-auth (password / Google), reload, verify-email,
  update-password; `ProfilePort` = `getEmailForUsername · getUserProfile ·
  syncProfileEmail`. `FirebaseAuthPort` / `FirebaseProfilePort` are the production
  adapters; in-memory fakes reproduce the same contracts in tests (as
  `InMemoryProgressBackend` does for progress). The lowercased id-token snapshot the
  reconcile rule compares is the **token snapshot** (`shouldReconcileEmailOnToken`).

## Poker reads

- **Spot strength** — "what do I hold and how likely am I to win this spot": the
  equity/odds layer that sits ON TOP of the hand evaluator. The deep **spotStrength**
  module (`lib/poker/spotStrength`) owns it — a draw's outs → equity, the pot-odds
  price, "priced in", and the EV of a call — and is the single source of truth read
  by the casino bots (`opponentAI`), the coach (`lib/ai/coach`), the always-on hints
  (`poker/hints`), the drill grader (`poker/decisionDrill`), and the Lesson 5/6 math
  widgets. It never re-implements hand ranking; that stays in **handEvaluator**.
  - **Equity convention** — a draw's rough equity is the Rule of 2 & 4 *with the
    big-draw correction* (subtract one point per out above 8 with two cards to come),
    so a 9-out flush draw on the flop is **35%** (matching Lesson 5 and the exact
    hypergeometric value), never the uncorrected 36%. Pot odds is an exact price;
    equity is a deliberately rough teaching estimate.

## Casino floor

- **Casino table-clear** — a room is "cleared" the first time a hand reaches showdown
  (or the hero wins one). Tracked outside the lesson XP economy in its own
  **casinoProgress** module (not inside lesson progress). Gates the two-room unlock.
