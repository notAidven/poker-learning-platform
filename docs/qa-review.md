# Product-Experience QA Review — Brilliant Alpha Clone (Phase 1)

> **⚠️ Historical (2026-06-23) — predates the poker product.** This QA review covers the **earlier
> "Probability & Random Variables" app**: it audits 13 probability interactions (sample-space-picker,
> coin-flip-lab, two-dice-grid, venn-diagram, …) across "lessons 1–6" and references modules
> (`lessonProgress.ts`, `lessonProgressStore.ts`, `lessonProgressFirestore.ts`) that have since been
> **replaced**. The product is now **Suited** (Texas Hold'em) — a 9-lesson / 3-section course plus a
> Casino Floor — with a refactored `ProgressStore` / `ProgressBackend` persistence seam (see
> `CONTEXT.md`, `docs/ARCHITECTURE.md`). Preserved as history and **not** rewritten into a poker QA
> pass. **Current verified quality bar:** `npm run test` → **514 tests pass across 12 files**;
> `npm run build` (`tsc -b && vite build`) → **green**. A poker-specific QA pass is **pending**.

**Date:** 2026-06-23
**Scope:** `web/` SPA — lesson flow, all 13 interaction types, answer validation (lessons 1–6 + 6 skill checks), progress/persistence, gamification, edge cases, routing.
**Method:** Full static read of the lesson player, skill-check player, every interaction component, all lesson/skill-check data, gamification + progress libs, auth/Firestore sync, hooks, and routing. Build + logic-check run before and after fixes.
**Build:** `cd web && npm run build` — **PASS** (before and after).
**Logic check:** `node web/scripts/mvp-logic-check.mjs` — **PASS**.
**Note:** The Playwright scenario script (`web/scripts/mvp-scenarios.mjs`) was **not** run — `playwright` is not installed in `web/node_modules`. Findings below are from code review + build/logic checks.

## Summary by severity

| Severity | Found | Fixed | Deferred |
|----------|-------|-------|----------|
| P0 (blocker) | 0 | 0 | 0 |
| P1 | 2 | 2 | 0 |
| P2 | 6 | 2 | 4 |
| Nit | 6 | 0 | 6 |
| **Total** | **14** | **4** | **10** |

**Headline:** No P0 blockers. Answer-validation logic is **correct for all 13 interactions across all 6 lessons and 6 skill checks** — every authored answer is mathematically correct and each widget's correct/incorrect check matches it (no off-by-one, set-equality, or fraction-reduction bugs found). The two P1s were a pervasive **raw-LaTeX rendering bug** in interactive input labels and a **Firestore session-clear bug** that broke restart-on-exit for signed-in users across sessions. Both are fixed; build stays green.

---

## P1 — Fixed

### P1-1 · Raw LaTeX shown to learners in interactive input labels & the Venn reference panel
**Where:** `web/src/components/lesson/interactions/SelectCombination.tsx`, `CoinFlipProbability.tsx`, `DerangementMatch.tsx`, `VennDiagram.tsx`; `web/src/data/lessons/lesson-6.ts`, `web/src/data/skillChecks/skill-check-6.ts`.
**Description:** `NumericAnswerInput` / `FractionAnswerInput` render their `label` as **plain text** (not through `MathContent`), and the Venn interaction's reference panel + the coin-flip-probability "Reference" line are plain JSX text. Several of these strings contained KaTeX markup, so learners saw literal `$\binom{5}{2}$`, `$|A|$`, `$D_{3}$`, `$|A \cup B|$`, `$|A^c| = |\Omega| - |A|$`, and the Lesson-6 panel rendered `$|A| = 12$ · $|B| = 10$ · $|A \cap B| = 4$` / `$|\Omega| = 30$` verbatim.
**Impact:** Visible across **all** Lesson 4 (combinations/coin-flip-probability), Lesson 5 (derangements), Lesson 6 (every Venn step), and skill checks 4 & 6 — makes the counting/sets lessons look broken.
**Fix:** Replaced the LaTeX with the plain-Unicode convention already used by every other label in the app (`C(5, 2)`, `|A|`, `Ω`, `D₃`, `|A ∪ B|`, `|A ∩ B|`, `|Aᶜ| = |Ω| − |A|`). No rendering-pipeline change (intentionally avoided coupling to the in-flight `index.css` rewrite). **Fixed.**

### P1-2 · Firestore session clears never persist (restart-on-exit / review break for signed-in users)
**Where:** `web/src/lib/lessonProgressFirestore.ts` → `writeLessonProgress`.
**Description:** Writes used `setDoc(..., { merge: true })` and **omitted** the `session` field when there was no active session instead of deleting it. Under merge semantics, omitting a key leaves the old value in place, so a previously-saved mid-lesson `session` was never removed from Firestore on restart-on-exit (`abandonLessonAttempt`) or on lesson-body finish.
**Impact:** For **signed-in** users, after exiting mid-lesson (which clears local session) the stale Firestore session survives; on next load/another device, `fetchAllLessonProgress` → `applyRemoteProgress` rehydrates `localStorage`, so the lesson **resumes mid-way instead of restarting** — directly contradicting the "restart-on-exit" and "review-from-start" behaviors. (Signed-out/local path was already correct.)
**Fix:** Build the write body so `session` is set to `deleteField()` when there is no active session (and to the session object otherwise), so a clear actually removes the field under `merge: true`. **Fixed.**

---

## P2 — Fixed

### P2-1 · Exit-lesson modal copy is inaccurate
**Where:** `web/src/components/ExitLessonModal.tsx`.
**Description:** Copy read "you will lose any XP earned in this attempt…". No XP is earned during the lesson or skill check — XP is only awarded on skill-check completion (`saveSkillCheckResult` → `awardLessonCompletion`), so there is never XP to "lose" at this point. (The "restart from the beginning" part is accurate given restart-on-exit.)
**Fix:** Reworded to "this lesson will restart from the beginning next time — progress on this attempt will not be saved." Accurate for both the lesson and skill-check exit paths. **Fixed.**

### P2-2 · No catch-all route (bare React Router error page on unknown URLs)
**Where:** `web/src/App.tsx`.
**Description:** The router had no `path: '*'` route, so a totally unknown URL (e.g. `/xyz`) rendered React Router's default error UI outside the app shell. (Unknown **lessonId** routes like `/lesson/99` were already handled gracefully — `LessonPage`/`SkillCheckPage` show "Lesson not found" with a back link.)
**Fix:** Added `{ path: '*', element: <Navigate to="/" replace /> }` inside the `Layout` route so unknown paths redirect home (which then routes to login when signed out). **Fixed.**

---

## P2 — Deferred (recorded, not changed)

### P2-3 · A lesson with no skill check can never be completed / award XP
**Where:** `web/src/components/lesson/LessonPlayer.tsx` (`finishLesson`) + `web/src/lib/lessonProgress.ts`.
**Description:** `completed`/XP are only set via the skill-check path (`saveSkillCheckResult`). For a lesson lacking a skill check, `finishLesson` marks `lessonFinished` and navigates to `/course` but never sets `completed` and never awards XP, so it would stay "current" forever and never unlock the next node.
**Why deferred:** Latent only — all 6 current lessons have skill checks (`skillCheckLoaders` 1–6), so it cannot trigger today. A fix (mark complete + award base XP when `!hasSkillCheck`) adds completion-path risk; flagging for when content without a skill check is added.

### P2-4 · Returning to a body-finished lesson restarts the body instead of routing to the pending skill check
**Where:** `web/src/lib/lessonProgress.ts` (`getNextLessonPath`) + `web/src/pages/LessonPage.tsx`.
**Description:** After finishing the lesson body but before the skill check, the lesson is not `completed`, so `getNextLessonPath` (used by Home "Continue learning") returns `/lesson/:id`, which reloads the lesson body from step 0 (session was cleared on finish). The course-path modal handles this correctly via "Continue skill check", but the Home CTA / direct URL makes the learner redo the body.
**Why deferred:** Not a crash and partly a consequence of intentional restart-on-exit; the XP/attempts stay consistent on redo. Worth a follow-up (route body-finished lessons straight to the skill check).

### P2-5 · `LessonCompleteModal` has no dismiss affordance
**Where:** `web/src/components/lesson/LessonCompleteModal.tsx`.
**Description:** The "Lesson complete!" modal offers only **Start skill check** — Escape is swallowed (no-op) and the backdrop has no click handler, so there's no "later"/close. A learner who wants to defer the skill check must use browser Back.
**Why deferred:** Appears to be an intentional gate; behavior change could conflict with product intent. Recommend adding a "Later" / close that returns to the course path.

### P2-6 · Stale test docs vs. current restart-on-exit behavior
**Where:** `docs/mvp-test-results.md`, `web/scripts/mvp-logic-check.mjs`.
**Description:** `mvp-test-results.md` (Scenario 3) documents the **old** "exit preserves mid-lesson progress" behavior and says the modal "copy now states progress is saved", but the current intended behavior is **restart-on-exit** (modal + `abandonLessonAttempt` clear the session). `mvp-logic-check.mjs`'s `testExitPreservesSession` still asserts `exitClearsSession = false` (hard-coded), so it passes but no longer reflects the app.
**Why deferred:** Documentation/test drift, not an app bug. Recommend updating the doc and inverting the logic-check assertion to match restart-on-exit.

---

## Nits — Deferred

- **N-1 · Fraction validator accepts equivalent / non-reduced fractions.** `web/src/components/lesson/interactions/fractionAnswer.ts` (`fractionMatches`) reduces both sides, so `2/12` is accepted for `1/6` even though prompts say "reduced fraction." Lenient by design; tighten only if "reduced" must be enforced.
- **N-2 · Navigating Back to a solved step shows an emptied widget.** Solved problem steps remount with `initialSolved` (submitted/solved = true) but empty selection/inputs, so the correct chips highlight green while "Your list" reads "No outcomes selected yet" and count/fraction inputs are hidden. Cosmetic; selections aren't restored on review-back. (Affects all selection/count interactions.)
- **N-3 · `LessonCompleteModal` Escape handler calls `preventDefault()` but doesn't close** (see P2-5) — harmless but dead-feeling.
- **N-4 · Unused config fields.** `TwoDiceGridConfig.exactCount`, `CoinEventGridConfig.maxHeads`, and `DieSampleSpaceConfig.selectAll` are declared/authored but never read by their components. No effect on correctness (counts are validated via the numeric input); remove or wire up for clarity.
- **N-5 · `CoinFlipLab` picker-mode count input uses the default element id.** `web/src/components/lesson/interactions/CoinFlipLab.tsx` renders `NumericAnswerInput` without an `id`, so it falls back to `numeric-count-answer`. Harmless (one interaction per step → unique on page), but inconsistent with the other widgets that pass scoped ids.
- **N-6 · Bundle size / chunking.** Initial `index-*.js` ≈ 892 KB (gzip ≈ 269 KB) and the `useActivityExitGuard-*` chunk ≈ 397 KB actually carries Firebase (pulled in transitively via `lessonProgress` → `firebase`). Vite warns >500 KB. Perf-only; consider isolating Firebase into its own lazily-loaded chunk.

---

## Areas reviewed and found correct

- **Answer validation (all 13 interactions × 6 lessons + 6 skill checks):** sample-space-picker, coin-flip-lab, die-sample-space, two-dice-grid, coin-event-grid, counting-product, seat-permutation, select-combination, coin-flip-probability, birthday-simulation, derangement-match, venn-diagram, fairness-scale. Set-equality checks, count inputs, fraction inputs, and combinatorics (`binomial`, `coinPatterns`, `countHeads`, derangements D₃=2/D₄=9, factorials, inclusion–exclusion) all match the authored answers.
- **Lesson flow:** Back/Continue gating (`canContinue`), per-step hints (incremental reveal, none in skill checks), "Why?" modal + structured Venn, numeric/fraction input gating, correct/incorrect feedback paths. The derangement widget's green=wrong-envelope / red=matching-envelope coloring is correct for the "build a derangement" task.
- **Skill checks:** 3 questions, no hints, score = first-correct count, XP awarded only on first completion (`isFirstCompletion`), navigation to/from, `allowRetry=false` locks the widget after one submit.
- **Gamification:** XP = 100 base + `max(0, 50 − extraAttempts×10)` bonus; level thresholds `100 + (level−1)×25`; streak day logic (same-day no-op / +1 yesterday / reset) in CAT timezone; **no duplicate XP** on replay or review (`isCompletedReview` short-circuits; XP guarded by `isFirstCompletion`).
- **Persistence / guards:** all Firestore writes are `uid`-guarded (no crashes when signed out or under `VITE_E2E_BYPASS_AUTH`); `loadLessonSession` validates/sanitizes stored data; sequential unlock logic (`getLessonStatus` / `lessonUnlocked`) is consistent across Home and the course path.
- **Edge cases:** rapid "Check"/double-submit is blocked (submit button hidden once `submitted`; `onCorrect` guarded by `if (solved) return`); flip/roll animations gate submission; unknown lessonId routes handled; no React key warnings spotted.

## Contended files (not edited — per concurrency note)
`Layout.tsx`, `HomePage.tsx`, `LoginPage.tsx`, `SignUpPage.tsx`, `ProfileSetupPage.tsx`, `CoursePage.tsx`, and `index.css` are being restyled by another agent. `HomePage.tsx` was read (logic only) — its unlock logic matches `CoursePath`/`getNextLessonPath` and it depends on new `components/ui/*` primitives (`Badge`, `Button`, `NightPanel`, `StatToken`, `cx`) that exist (build passes). No functional issues noted; the others were not deep-reviewed to avoid conflicting with the in-flight restyle.

## Verification
- `cd web && npm run build` → **PASS** (green) after all fixes.
- `node web/scripts/mvp-logic-check.mjs` → **PASS**.
- Grep confirms no remaining `$…$` / `\binom` / `\Omega` / `\cup` / `\cap` / `D_{` in interaction labels or data-file labels.
- `ReadLints` on all edited files → no errors.

---

## Addendum (2026-06-23) — Mid-lesson exit reverted to **resume-where-you-left-off**

Product decision: leaving an **in-progress** lesson now **preserves** the session and the learner resumes at the saved `stepIndex` + `solvedStepIds`. This supersedes the "restart-on-exit" framing in some findings above:

- **P2-1 (modal copy):** The "restart from the beginning…" copy was reverted. `ExitLessonModal` now reads "Leave this lesson?" / "Your progress is saved — you can pick up right where you left off anytime." with **Stay** / **Leave** buttons. `LessonPage.handleConfirmExit` no longer calls `abandonLessonAttempt`; confirming "Leave" just allows navigation.
- **P2-6 (test docs):** `mvp-test-results.md` (Scenario 3) now documents the resume contract, and `mvp-logic-check.mjs`'s `testExitPreservesSession` (asserting `exitClearsSession = false`) is **correct as-is — do not invert it**.
- **P1-2 (Firestore `deleteField()`):** Still valid and unchanged. Session clears now fire only on the **completed-lesson review restart**, **skill-check reset**, and **lesson completion** paths — all of which still need `deleteField()` to drop a stale Firestore session under `merge:true`. A normal mid-lesson leave no longer clears.
- **Skill-check exit (`SkillCheckPage`):** Unchanged — still resets `lessonFinished`; its exit modal now passes scoped copy ("Leave the skill check?").

---

## Addendum (2026-06-23) — Pre-production product-policy fixes (PM P1 + QA deferred)

This pass tightened the skill-check gate, fixed the streak dead-end, enforced sequential unlock on direct URLs, and improved completion routing. The one product-policy call is documented here so it can be **tuned**.

### ⚙️ Skill-check pass policy (PM P1 #3) — **tunable**

- **Threshold: pass with ≥ 2 of 3 correct.** Only a passing score marks the lesson `completed`, awards XP, and unlocks the next lesson. A score < 2/3 does **not** complete the lesson or award XP.
- **Free skill-check retries.** A failing learner sees a "Not quite yet" screen and can **Retake skill check** directly — the lesson body stays finished (`lessonFinished` is preserved), so they never have to redo the lesson to try again. Exiting mid–skill check no longer forces a lesson redo either.
- **Where to tune:** `SKILL_CHECK_PASS_RATIO` + `isSkillCheckPassing(correct, total)` in `web/src/lib/gamification.ts`. The gate is enforced in `SkillCheckPlayer.handleContinue`. Change the ratio (or make it an absolute count) to retune; copy lives in `SkillCheckPlayer` and the `SkillCheckPage` subheading ("Pass with 2 of 3").

### P1 #5 — Sequential unlock enforced on direct URLs

`LessonPage` and `SkillCheckPage` now redirect to `/course` when a lesson is locked, using the shared `isLessonUnlocked(lessonId, completedIds)` (`web/src/lib/lessonProgress.ts`) — same rule as Home/`CoursePath` (lesson 1 always open; lesson N needs N-1 completed). Unknown lesson ids fall through to the existing "Lesson not found" view. (Auth gating awaits Firestore sync before rendering protected routes, so `completedIds` is authoritative on first paint.)

### P1 #4 — Streak dead-end fixed (no extra XP)

The streak previously only advanced on first-ever completion, so after all 6 lessons it could never be maintained. Now a **qualifying daily activity** advances the streak once per CAT day **without re-awarding XP**:

- a **skill-check retake pass** (folded into the idempotent `awardLessonCompletion` transaction — XP only on first completion, streak on any pass), and
- a **completed-lesson review finish** (`recordReviewActivity()` → `touchStreakForActivity`).

XP remains first-completion-only (idempotent via the persisted `xpAwarded` flag — see `docs/security-fixes.md`).

### #9 — Home "Continue learning" routes to a pending skill check

`getNextLessonPath` now returns `/lesson/:id/skill-check` when a lesson's body is finished but its skill check is still pending, instead of restarting the lesson body from step 0.

### P2-5 / N-3 (resolved) — `LessonCompleteModal` is now dismissible

Escape, backdrop click, and a new **Later** button all dismiss the "Lesson complete!" modal and return to the course path (where a "Continue skill check" CTA is shown). Previously only "Start skill check" existed.

### P2-3 (resolved) — Lessons without a skill check can now complete

`LessonPlayer.finishLesson` calls `completeLessonWithoutSkillCheck` when `hasSkillCheck(lesson.id)` is false, marking completion + awarding XP directly. Latent today (all 6 lessons have skill checks) but safe for future content.
