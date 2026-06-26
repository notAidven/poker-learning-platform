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

## Casino floor

- **Casino table-clear** — a room is "cleared" the first time a hand reaches showdown
  (or the hero wins one). Tracked outside the lesson XP economy in its own
  **casinoProgress** module (not inside lesson progress). Gates the two-room unlock.
