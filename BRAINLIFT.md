# Brainlift — *Suited* (AI-First Build Process)

**Subject:** teaching No-Limit Texas Hold'em through a play-money, learn-by-doing course.
**The point of view I developed:** **grade the decision, not the result.** A poker trainer must reward *decision quality*, never the outcome of a hand — because rewarding wins just trains "resulting," the biggest beginner leak, in a game where good decisions lose and bad ones win in the short run. Every build choice below served that POV.

## 1. Tools & workflow
Built almost entirely in **Cursor** (agentic edits; canonical branch `cursor/complete-brilliant-prd`). I ran the work as **parallel git worktrees** (`suited-fix-*`, `fixc-*`, `casino-2rooms-*`) so several agent sessions could build isolated features at once, then merged them through an `integration-harden` branch into `main` (~55 commits). I kept the brief's phase order visible in history — a **no-AI MVP first**, AI second — and stayed free-tier (Firebase Spark + a Cloudflare **Worker** instead of paid Cloud Functions, so the OpenAI key never touches the browser).

## 2. Prompting strategies (what worked)
- **Interactive lessons as data** *(how I got AI to build the lessons):* "Define a TypeScript type for a lesson as `concept`/`problem` steps with `interaction`, `config`, `answer`, and `feedback{correct, incorrect, hints, why}`; then author Lesson N as data — ≥75% problem steps, no two concepts in a row, no forward references." This produced real interactive poker widgets (deal-the-board, rank-hands, count-outs, price-the-call) fast and consistently.
- **Grade in code, let AI explain** *(my POV as a prompt contract):* "Score call/fold from `analyzeSpot` (outs, equity, pot odds, EV) deterministically; the coach only explains *why* the graded decision was good or bad — it never decides correctness; return `null` on error."
- **Hints that never solve it:** "Author a 3-tier hint array: nudge → narrow the method → walk the method, but never reveal the final answer."
- **Validate AI against ground truth:** "After the LLM proposes an opponent action, validate it against `handEvaluator` + the legal actions and clamp to the nearest legal move; else fall back to deterministic Tier-3 logic."
- **Make 'AI-off' a test:** "Add `web/scripts/mvp-logic-check.mjs` asserting sequential unlock, the ≥2/3 skill-check threshold, XP idempotency, and a deterministic fallback for every AI feature."

## 3. Phase decisions
**Phase 2 — AI features I chose:** a reactive, decision-focused **coach** (Room 1) with a *result-aware* end-of-hand read; **LLM-driven opponents** + light table talk (Room 2), validated against the evaluator; an always-on **rule-based hint bar**.
**Skipped on purpose:** any AI inside lessons/skill-checks, AI problem/hint generation, and LLM wrong-answer explanations — in a domain with a ground-truth evaluator, letting an unverified model *grade* a decision is the one thing my POV forbids. (No browser-side keys; the OpenAI key lives in the Worker.)
**Phase 3 — learning science I added, and why:** **retrieval practice** (recall, not recognition — testing beats restudy for retention); **mastery gating** (skill-check ≥2/3 + sequential unlock, so you advance on good *decisions*, not luck); **scaffolding with fading** (3-tier hints in lessons, stripped in skill checks); **desirable difficulty** (first-try XP bonus decays per extra attempt); **immediate explanatory "Why?" feedback** (correct mistakes in the moment); and now a **spaced-repetition Review system** — every problem is tagged with a concept, a Leitner scheduler resurfaces missed concepts *sooner* and mastered ones *later*, and a **Daily Review** serves an **interleaved** (mixed-concept) queue. That is the retention half of Roediger & Karpicke (the one-week recall gain) a single pass leaves on the table. I also went **deeper on content** with a new **Advanced Play** section (preflop ranges, board texture & c-betting, implied odds & SPR, combinatorics & blockers, ICM intro) on a new 13×13 range-grid widget. **Still deferred:** *adaptive* mastery routing (dynamic difficulty / automatic remediation).

## 4. Code analysis (rough split)
≈ **85% AI-generated** — React UI and routing, the typed lesson/skill-check **data**, the poker engine/evaluator scaffolding, the AI provider layer + Worker, tests, and docs. ≈ **15% hand-written / hand-directed** — the POV itself, the *AI-coaches-but-never-grades* architecture, the prompt contracts, and hand-verification of the poker math. (Git doesn't track per-line authorship, so this is an informed estimate.)

## 5. Key learnings (spiky)
- **Gamify the decision, not the result** — or you train the exact bias the game punishes.
- **Ground truth is a superpower:** where the answer is checkable, let code grade and AI explain — and make "AI-off still teaches" a unit test, not a slogan.
- **Lessons should be data, not screens** — a typed content model is what made AI-built lessons cheap *and* gradable by code.
- **Effective practice feels bad** ("good decision, bad result" is unsatisfying), so gamification's real job is to fund the reps that build skill.
- **Build the retention half, not just acquisition:** active learning + mastery *teaches*, but **spaced, interleaved retrieval** is what makes it *stick* — so a Review system that resurfaces your misses sooner is now core, not a nice-to-have. (Adaptive routing is the next build, not more AI.)
