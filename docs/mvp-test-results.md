# MVP Test Results (Phase 1, lines 93–110)

**Date:** 2026-06-23  
**App:** Brilliant Alpha Clone (`web/`)  
**Method:** Playwright automation (`web/scripts/mvp-scenarios.mjs`) against dev server with `VITE_E2E_BYPASS_AUTH=true` (port 5176), plus logic checks (`web/scripts/mvp-logic-check.mjs`).  
**Build:** `npm run build` — **PASS**

## Summary

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 1 | End-to-end lesson with wrong answers + recovery | **PASS** | Lesson 1: wrong chip → feedback → Try again → hint → correct; finished lesson + 3-question skill check |
| 2 | Interactive manipulation + visual response | **PASS** | Coin flip animation runs; sample-space chips toggle `aria-pressed` in real time |
| 3 | Mid-lesson leave + return | **PASS** | Leave modal → course path → return resumes at saved `stepIndex` in `lesson-session-2`; progress is preserved (see contract below) |
| 4 | Path recommends next step | **PASS** | After L1 completion: Home **Continue learning** → `/lesson/2`; CoursePath L2 modal shows “Events & Basic Probability” |
| 5 | Phone-sized screen (~375px) | **PASS** | No horizontal overflow on `/`, `/course`, `/lesson/2`; touch targets adequate |

## Mid-lesson exit contract (Scenario 3)

**Contract:** Leaving an **in-progress** lesson **preserves progress — the learner resumes exactly where they left off**. Confirming "Leave" in the exit guard only allows navigation away; the `lesson-session-*` entry (localStorage + the Firestore session) written by `LessonPlayer` is kept, so the next visit reopens at the saved `stepIndex` + `solvedStepIds` via `loadLessonSession`.

**Exit modal copy (`ExitLessonModal.tsx`):** title **"Leave this lesson?"**, body **"Your progress is saved — you can pick up right where you left off anytime."**, buttons **Stay** (dismiss) / **Leave** (navigate away). Reassures rather than warning about lost progress.

**Completed-lesson review (unchanged):** Opening a lesson whose `getLessonStats(lessonId).completed === true` is a fresh review — it still starts at step 0 with no solved steps, and finishing it does **not** overwrite completion/accuracy/XP/skill-check scores. That step-0 reset lives in `LessonPlayer` (`isCompletedReview`), not on the leave path.

**Skill-check exit (unchanged):** Exiting mid–skill check still resets `lessonFinished` (intentional — learner redoes the lesson body before retrying the skill check); its exit modal copy is scoped accordingly.

**Files:** `web/src/pages/LessonPage.tsx`, `web/src/components/ExitLessonModal.tsx`, `web/src/hooks/useActivityExitGuard.ts`

## Additional notes

- **Streak / XP (Firestore):** Completion flow calls `saveSkillCheckResult` → `awardLessonCompletion` when `auth.currentUser` is set. Automated runs use E2E auth bypass (no Firestore writes), so home XP stayed at 0 in automation; local completion state (`completed-lesson-ids`, `lesson-stats`) persisted correctly. Verify streak/XP with a real signed-in account in Firebase console.
- **Skill check exit:** Exiting mid–skill check still resets `lessonFinished` (intentional — learner must redo lesson body before retrying skill check).
- **Re-run tests:**
  ```bash
  cd web
  VITE_E2E_BYPASS_AUTH=true npm run dev -- --port 5176 --strictPort
  MVP_E2E_BYPASS=1 MVP_TEST_URL=http://localhost:5176 node scripts/mvp-scenarios.mjs
  ```

## Manual spot-check (recommended)

1. Sign in with a real account, complete Lesson 1 + skill check, confirm XP/streak update on Home and in Firestore.
2. On a phone or 375px devtools, open exit modal and CoursePath modal — confirm no clipped content.
