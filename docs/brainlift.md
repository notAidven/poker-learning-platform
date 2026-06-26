# BrainLift — Teaching Poker by Doing

**Project:** *Suited* — an interactive, play-money Texas Hold'em course (9 lessons across 3 sections + a two-room Casino Floor; ≥75% interactive problem steps; immediate authored feedback; skill-check mastery gating; XP / streaks / levels). The subject **is poker**: how to read a board, rank hands, count outs, use position, size bets, and decide call/fold.
**Owners:** Evan Cabrera — builder/author of *Suited*.
**Date:** June 2026 · **Format:** BrainLift (Nessie template)
**Audience:** anyone deciding **how to teach poker** (course builders, poker schools/coaches, EdTech founders) — and, more broadly, how to teach any skill that is fundamentally about **decisions under uncertainty**.

---

## Purpose

**Core goal.** Make the case — and build the proof — that the fastest path from "never played" to "competent Texas Hold'em player" is **interactive, learn-by-doing practice with instant per-decision feedback**, sequenced the way reputable poker schools already teach, and reinforced with retrieval, mastery gating, and gamified repetition — *not* videos, articles, or charts to memorize.

**Thesis being pressure-tested (the SPOVs below sharpen it).**
> Poker is mostly taught as *knowledge transfer* (strategy articles, hour-long videos, range charts). But poker is a *skill* — making good decisions, fast, with hidden information and money on the line — and the learning-science evidence says skill is built by **doing**, not watching. So the bet behind *Suited* is to keep the curriculum order the best schools agree on and **replace their passive delivery with learn-by-doing**.

**In Scope**
- Teaching a beginner the foundations of No-Limit Hold'em: the deck & board, hand rankings, the flow of a hand, betting actions, preflop open/fold + position, outs & equity, pot odds, EV, and bet sizing / value betting.
- Learn-by-doing mechanics: ≥75% interactive problem steps, immediate authored feedback, progressive hints, skill-check mastery gating, and an XP / level / daily-streak habit loop.
- A **play-money** Casino Floor (two rooms) to apply the skills against rule-based and LLM-driven opponents, with an AI coach and an always-on rule-based hint bar — fully functional with **AI turned off**.

**Out of Scope**
- Real-money play or any gambling integration — **play-money only**.
- AI anywhere inside the **core teaching loop**: lessons and skill checks are authored and deterministic by design.
- Advanced/exploitative theory (GTO solving, ICM, multi-street bluff construction), tournament play, and non-Hold'em variants.
- A multi-subject catalog — this is **poker only**.

---

## DOK 4 — Spiky Points of View (SPOVs)

> Prescriptive, debatable, evidence-backed stances about how to teach poker. Each names what *Suited* does about it.

### SPOV 1 — Grade the decision, not the result. (the spiciest)
A poker trainer must reward the **quality of the decision**, not the outcome of the hand. Any trainer that celebrates "you won the pot" is reinforcing **"resulting"** — the single biggest beginner leak — and is teaching the game backwards.

*Why:* Duke names "resulting" — equating decision quality with how the hand happened to turn out — as the cardinal error [S2.3]; because poker hides information and pays out noisily, a correct fold can lose and a reckless call can win in the short run, and skill only surfaces over many hands [S2.4, S1.2]. So XP-for-winning trains the exact bias the game punishes. *In Suited:* lessons and skill checks grade the **decision** (did you price the call, count the outs, pick the right line?); the casino is play-money so a lucky pot is never a real reward; and the Room 1 coach's end-of-hand reflection is **result-aware but decision-focused** — it can tell you that you played a spot well and still lost. The spiky part: that sometimes means praising a fold that lost and flagging a bluff that won.

### SPOV 2 — Poker is a skill, so teach it by playing hands with instant feedback — not by reading charts or watching videos.
The strategy-content industry ships **knowledge** (articles, training videos, range charts). Poker is a **skill**, and knowledge ≠ skill. The fastest route to competence is reps with immediate per-decision feedback.

*Why:* active learning beats lecture across every STEM discipline measured (+0.47 SD; lecture students ~1.5× likelier to fail) [M1], and being tested beats restudy for retention [M2]. A range chart is restudy; a hand you must actually play is **retrieval**. *In Suited:* ≥75% of every lesson is interactive problem steps (count the outs, price the call, pick the line), progress is blocked until you solve, and feedback is instant and authored — the chart becomes something you **build**, not memorize.

### SPOV 3 — Fold discipline and position belong in the first hour, not the last lesson — and only drilling builds the fold-reflex.
The two skills that most separate a losing beginner from a break-even one — **folding most hands** and **using position** — should be trained from the start, by repetition, not deferred to "advanced" prose.

*Why:* reputable schools treat starting-hand selection as foundational and early, and the beginner default is tight-aggressive: fold ~80%+, bet/raise rather than call [P1.2, P1.3]; the documented leaks are "play too many hands" and sunk-cost calling [P1.4]. You cannot read your way out of the urge to play every suited hand — the fold-reflex is a **trained behavior**. *In Suited:* preflop open/fold and position are drilled early ("Playing Preflop") with immediate feedback, so the reflex is built by reps, not described in a paragraph.

### SPOV 4 — In a skill trainer, AI belongs at the table as a sparring partner and explainer — never as the source of truth, and never inside the core lessons.
The right home for AI in a learn-by-doing app is the **optional practice arena** (opponents, a coach, hint phrasing), grounded in the app's own engine. The lessons that teach must work with AI **off**, and the model must never be the arbiter of a poker answer.

*Why (the Phase-2 decision):* *Suited* deliberately kept lessons and skill checks **100% AI-free** and put AI only on the two Casino Floor tables — a reactive coach (Room 1) and guard-railed LLM opponents + light table talk (Room 2). Every AI feature is grounded in structured `analyzeSpot` facts and the enumerated legal actions (not raw text) and **soft-fails to deterministic rule-based logic** on any error/timeout/AI-off: `aiClient` returns `null`, the coach falls back to a rule read, opponents to a Tier-3 strategy. The shared `handEvaluator` is the single source of truth — LLM opponent actions are validated and clamped to legal moves, and all coach math (pot odds, equity, EV) is computed in code. We deliberately **skipped** AI-generated lessons, AI problem/hint generation, and LLM wrong-answer explanations: in a domain with a ground-truth evaluator, an unverified model is exactly the wrong thing to trust. Spiky claim: most "AI tutors" get this backwards by letting the model both teach and grade.

### SPOV 5 — Active learning + mastery without spaced repetition is only half a learning system — and a daily streak is a motivational proxy, not scheduled resurfacing.
An app can nail **acquisition** (retrieval, mastery gating, instant feedback) and still under-deliver on **retention** if it never brings concepts back at spaced intervals. Streaks make people return; they do not decide what to re-test.

*Why:* retrieval's biggest payoff is long-term — after a week, repeated testing recalled 61% vs 40% for restudy [M2.2] — but that gain depends on **spaced** re-testing, not one pass. *In Suited:* the acquisition half ships honestly (≥2/3 skill checks gate each lesson and unlock the next; problems require recall; feedback is immediate and explanatory). What's deferred — by explicit scope decision — is **spaced repetition and adaptive routing**: no scheduler resurfaces a missed outs-count three days later, and "review" is manual replay that credits a streak but no XP. The self-critical stance: until a trainer schedules resurfacing of each learner's weak spots, its retention claim rests on a streak — that's motivation, not memory science.

---

## Experts — the intellectual supply chain

> Six authorities across three pillars — *the subject* (poker is a teachable skill), *domain pedagogy* (how beginners should learn poker), and *method* (how any skill is taught so it sticks). They are chosen to disagree at the seams; that tension is where the DOK 3 insights come from.

### Steven D. Levitt (with Thomas J. Miller)
- **Who:** Economist, University of Chicago (co-author of *Freakonomics*).
- **Focus:** Empirical skill-vs-luck in poker, using real World Series of Poker results.
- **Why Follow:** Provides the empirical backbone for the whole project — if skill, not luck, drives long-run results, then poker can be *taught* and improvement is real. This is the permission slip for SPOV 2.
- **Where:** NBER WP 17023 — https://www.nber.org/papers/w17023 · PDF: https://pricetheory.uchicago.edu/levitt/Papers/WSOP2011.pdf

### Annie Duke
- **Who:** Former professional poker player with a cognitive-science background; author of *Thinking in Bets*.
- **Focus:** Decisions as bets; the discipline of separating decision quality from outcomes; the error of "resulting."
- **Why Follow:** Supplies the mental model and vocabulary at the heart of SPOV 1. The single most important reframe a beginner can adopt — judge the decision, not the result — is hers.
- **Where:** *Thinking in Bets* (Portfolio/Penguin, 2018), ISBN 9780735216372 — https://www.penguinrandomhouse.com/books/552885/thinking-in-bets-by-annie-duke/ · https://www.annieduke.com/

### Scott Freeman
- **Who:** Biologist and education researcher, University of Washington.
- **Focus:** Whether active learning outperforms lecture across STEM, at scale.
- **Why Follow:** His 225-study meta-analysis is the empirical case that *doing beats watching* — the foundation of the learn-by-doing format (SPOV 2) and of grading via interactive problems.
- **Where:** *PNAS* 111(23):8410–8415 (2014) — https://www.pnas.org/doi/10.1073/pnas.1319030111 · open access: https://pmc.ncbi.nlm.nih.gov/articles/PMC4060654/

### Henry L. Roediger III & Jeffrey D. Karpicke
- **Who:** Cognitive psychologists (Washington University in St. Louis; Karpicke at Purdue).
- **Focus:** The testing effect — retrieval practice as a cause of long-term retention, not just a measure of it.
- **Why Follow:** Their work is why *Suited*'s problems and skill checks are recall tasks, and why the deferred spaced-resurfacing feature is the highest-leverage gap (SPOV 5).
- **Where:** *Psychological Science* 17(3):249–255 (2006) — https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x

### Louis Deslauriers
- **Who:** Physicist and physics-education researcher, Harvard University.
- **Focus:** The gap between *actual* learning and the *feeling* of learning under active instruction.
- **Why Follow:** He explains why the most effective practice feels worst in the moment — the motivation trap that gamification must offset (DOK 3 / SPOV 5).
- **Where:** *PNAS* 116(39):19251–19257 (2019) — https://www.pnas.org/doi/10.1073/pnas.1821936116 · open access: https://pmc.ncbi.nlm.nih.gov/articles/PMC6765278/

### Michael Sailer (with Lisa Homner)
- **Who:** Educational psychologist, LMU Munich.
- **Focus:** Meta-analytic effects of gamification on learning, motivation, and behavior.
- **Why Follow:** Quantifies both the promise and the limit of XP/streaks/levels — small but real gains — which keeps gamification in its lane as a motivational layer, not the teaching itself.
- **Where:** *Educational Psychology Review* 32(1):77–112 (2020) — https://link.springer.com/article/10.1007/s10648-019-09498-w

### Reputable poker-school consensus (a body, not a person)
- **Who:** PokerStars Learn/School, Upswing Poker, PokerNews, PokerCoaching, DeucesCracked — cross-checked in this repo's `docs/poker-research/`.
- **Focus:** The agreed beginner curriculum order, the tight-aggressive default, and the misconceptions a good course must defeat.
- **Why Follow:** The domain "experts of record" for *what* to teach and *in what order* (SPOV 3). *Suited* adopts their sequence and TAG default wholesale, then swaps their passive delivery for learn-by-doing.
- **Where:** PokerStars Learn (https://www.pokerstars.com/poker/learn/), Upswing Poker (https://upswingpoker.com/texas-holdem-starting-hands-guide/), PokerNews (https://www.pokernews.com/poker-hands/best-starting-hands.htm), PokerCoaching (https://pokercoaching.com/blog/how-to-learn-poker/) · synthesized in `docs/poker-research/04-pedagogy-and-strategy.md`.

---

## DOK 3 — Insights (the synthesis)

> Novel connections across the sources that none of the authors states alone. Each is tagged to the SPOV it feeds.

**Insight 1 — Right curriculum, wrong format.** The schools already agree on the *order* to teach [P1.1]; the failure is the *delivery* — articles, videos, and charts, which are restudy. Combine P1 + M1 + M2: an interactive course should **keep** the consensus sequence and **throw out** the passive delivery, turning each chart into a drilled retrieval. The industry isn't wrong about *what* to teach, only *how*. → **SPOV 2**

**Insight 2 — The reward paradox: gamifying poker can teach the disease.** Gamification reliably moves behavior [M4], but its default currency is **outcomes** (points for winning) — and the cardinal poker error is "resulting" [S2.3]. So naïve XP-for-winning would actively reinforce the bias the game punishes. The resolution is to make the reward currency "right line," not "won pot." → **SPOV 1**

**Insight 3 — Gamification's real job is to pay the felt cost of effort.** Skill needs volume [S1], retention needs many retrievals [M2], but effortful active learning *feels worse* and depresses motivation early [M3]. Connect S1 + M2 + M3 + M4: streaks and XP aren't decoration — they're the mechanism that buys enough reps to cross from "this feels bad" to "I got good." That reframes gamification from engagement-bait to a **retention enabler**. → **SPOV 5** (and the habit loop)

**Insight 4 — Per-decision feedback does what an article structurally cannot: it's surgical.** Beginner misconceptions are emotional and identity-level ("I have to defend," "poker is luck," over-bluffing) [P1.4]. An article addresses the *average* reader; an in-the-moment "Why?" addresses the *exact* wrong decision you just made, applying Duke's resulting frame [S2] at the only moment it lands [M1]. → **SPOV 2** (and Suited's authored "Why?" explanations)

**Insight 5 — Ground truth changes where AI is safe.** In most tutoring domains the model is the only "expert" in the room; poker has a deterministic evaluator and closed-form odds. That asymmetry is the design key: put AI where it can be wrong *without misleading* (opponent style, coaching tone, hint phrasing) and let code own every checkable answer. The engineering corollary — soft-fail to rules, validate model output against the evaluator — is what makes "AI-off still teaches" a fact rather than a hope. → **SPOV 4**

**Insight 6 — The retention gap is the honest edge of this build.** The same evidence (M1/M2) that justifies the interactive core also indicts the current scope: without spaced resurfacing, the week-later retention advantage of retrieval is left partly on the table. Naming this is itself a stance — the next highest-leverage feature isn't more lessons or more AI, it's a **scheduler**. → **SPOV 5**

---

## DOK 2 — Knowledge Tree

> Categories → Sources → **DOK 1 Facts** (objective, verifiable, source-located) → **DOK 2 Summary** (the same facts compressed in our own words). Every DOK 1 fact passes the litmus test: two readers of the source would extract the same claim.

### Category 1 — Poker is a teachable game of skill

**Source S1 — Levitt & Miller (2011/2012), "The Role of Skill versus Luck in Poker: Evidence from the WSOP."**
- **DOK 1 Facts:**
  - **S1.1.** Analyzed the **2010 World Series of Poker**, using **720 players identified as highly skilled *before*** the events. [S1, abstract]
  - **S1.2.** High-skill players earned an **average ROI of +30.5%** (≈ **$1,200 profit** per player per event); **all others earned −15.6%** (a loss of **>$400** per event). [S1, results]
  - **S1.3.** The authors call this large, statistically significant gap **strong evidence that poker is a game of skill**, and note courts judging online-poker legality lean on the skill-vs-luck question. [S1, abstract]
- **DOK 2 Summary:** Using players flagged as skilled *beforehand*, the pre-identified pros returned +30.5% while everyone else lost 15.6% — a gap far too large and consistent to be luck, which the authors read as strong evidence poker is a game of skill. For a course, this is the permission slip: if skill dominates over the long run, instruction and practice can measurably move a beginner toward winning play.
- **Link:** https://www.nber.org/papers/w17023

**Source S2 — Duke (2018), *Thinking in Bets*.**
- **DOK 1 Facts:**
  - **S2.1.** Defines a bet as **"a decision about an uncertain future"** and argues **every decision is a bet.** [S2, Ch.1]
  - **S2.2.** How outcomes turn out is determined by **two things: the quality of decisions and luck.** [S2, Ch.1]
  - **S2.3.** Defines **"resulting"** as the tendency to **equate the quality of a decision with the quality of its outcome.** [S2, Ch.1]
  - **S2.4.** "Life Is Poker, Not Chess": with hidden information and luck, **good decisions can lose and bad ones can win** short-term, so learning requires **separating decision quality from outcomes.** [S2, Ch.1]
- **DOK 2 Summary:** Duke reframes every poker choice as a bet — a decision about an uncertain future — whose outcome is set by two things: decision quality and luck. The cardinal error is "resulting": grading a decision by how the hand happened to end. Because poker hides information and pays out noisily, good decisions lose and bad ones win in the short run, so learning means deliberately separating the two. This is the conceptual core *Suited* grades against.
- **Link:** https://www.penguinrandomhouse.com/books/552885/thinking-in-bets-by-annie-duke/

### Category 2 — What competent poker is, and how beginners should learn it

**Source C — Poker content of record (design doc §3 + `docs/poker-research/01` & `03`, verified vs. Wikipedia, Bicycle, PokerNews, thepokerbank, standard combinatorics).**
- **DOK 1 Facts:**
  - **C.1.** A deck is **52 cards (13 ranks × 4 suits)**. In Hold'em your hand is the **best 5-card hand from 7** (2 hole + 5 community); there are **C(7,5)=21** subsets, and you may use **both, one, or zero** hole cards. [C; research 01]
  - **C.2.** Hand-ranking order (strong→weak): **royal flush, straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, one pair, high card.** The principle is **"rarer = stronger,"** and **suits never break ties.** [C; design §3.2; research 01]
  - **C.3.** A **flush draw = 9 outs**, an **open-ended straight draw = 8**, a **gutshot = 4.** [C; research 03]
  - **C.4.** **Rule of 4 (flop) / Rule of 2 (turn):** hit-equity% ≈ **outs × 4** (two cards to come) or **outs × 2** (one card). [C; research 03]
  - **C.5.** **Required equity to call = call / (pot + call)**; a **pot-sized bet → 33.3%**, **half-pot → 25%**, **quarter-pot → 16.7%.** [C; research 03]
  - **C.6.** **EV(call) = P(win) × (amount won) − P(lose) × (amount lost).** [C; research 03]
- **DOK 2 Summary:** The objective material a competent player must command is small and exact — a 52-card deck, best-5-of-7, the rarity-ordered ranking where suits never break ties, the canonical out-counts (9 / 8 / 4), the Rule of 4 and 2 for equity, the `call / (pot + call)` required-equity formula, and the EV expression. Because these are closed-form, they can be authored once and **checked by code** — which is precisely why *Suited* can grade them deterministically and keep AI out of the answer.
- **Links:** `docs/poker-research/01-rules-and-hand-rankings.md`, `docs/poker-research/03-poker-math.md`

**Source P1 — Reputable poker-school consensus (cross-checked in `docs/poker-research/04`).**
- **DOK 1 Facts:**
  - **P1.1.** Schools converge on a beginner **order**: rules & the five betting actions → **hand rankings** → **position** → **starting-hand selection** → **pot odds / outs.** [P1; research 04 §1]
  - **P1.2.** **Starting-hand selection is universally treated as foundational, early, and heavily emphasized** — not advanced. [P1; research 04 §1–2]
  - **P1.3.** The recommended beginner default is **tight-aggressive (TAG)**: play the **top ~15–20% of hands** (fold ~80%+), and **bet/raise rather than call.** [P1; research 04 §2–3]
  - **P1.4.** Common misconceptions a good course must defeat: "poker is mostly luck" (skill dominates over the **long run**), "bluffing is how you win" (most profit is **value-betting**), "play too many hands," and **sunk-cost calling** without the pot odds. [P1; research 04 §4]
  - **P1.5.** Reputable bodies note the **rake + stronger players mean the pool loses over time**; framing poker as a **skill/odds game** (and, for a learning app, play-money) is standard responsible practice. [P1; research 04 §5]
- **DOK 2 Summary:** Independent reputable schools converge on the same beginner arc — rules/actions → rankings → position → starting hands → pot odds/outs — and the same defaults: tight-aggressive play and starting-hand selection as a foundational early skill, not an advanced one. They agree on the misconceptions a course must defeat and on responsible framing (rake + stronger players → play-money for learning). *Suited* adopts the sequence and the TAG default wholesale.
- **Links:** `docs/poker-research/04-pedagogy-and-strategy.md`; PokerStars Learn, Upswing, PokerNews, PokerCoaching (URLs above).

### Category 3 — How a skill is taught so it sticks

**Source M1 — Freeman et al. (2014), *PNAS*.**
- **DOK 1 Facts:**
  - **M1.1.** Meta-analysis of **225 studies**; exam/concept-inventory scores rose **+0.47 SD** under active learning (n=158). [M1, abstract]
  - **M1.2.** The **odds ratio for failing was 1.95** under lecturing (n=67) — lecture students were **~1.5× more likely to fail** (failure rates **33.8% vs. 21.8%**). [M1, abstract/results]
  - **M1.3.** Effects **held across all STEM disciplines and class sizes** (largest in classes ≤50). [M1, abstract]
- **DOK 2 Summary:** Across 225 studies, active learning raised scores by 0.47 SD and cut failure rates from ~34% to ~22% (lecture students ~1.5× likelier to fail), holding across every discipline and class size. The blunt implication for a poker course: doing beats watching, reliably and at scale — so the default unit of instruction should be a **problem the learner acts on**, not a passage they read.
- **Link:** https://www.pnas.org/doi/10.1073/pnas.1319030111

**Source M2 — Roediger & Karpicke (2006), *Psychological Science*.**
- **DOK 1 Facts:**
  - **M2.1.** Compared **repeated testing vs. repeated studying**, with **no feedback** on the tests. [M2, abstract]
  - **M2.2.** Immediately (5 min), repeated study recalled more (≈**83% vs. 71%**, Exp. 2); after **one week**, repeated testing recalled far more (**61% vs. 40%**). [M2, results]
  - **M2.3.** The testing group read the passage only **3.4×** vs. **14.2×** for the study group, yet retained more; repeated study **inflated confidence** despite the worst retention. [M2, results/discussion]
- **DOK 2 Summary:** With testing pitted against restudy (no feedback even), restudy won immediately but lost badly after a week (61% vs 40% recall), while the testing group read the material far less yet remembered more — and restudy inflated confidence despite the worst retention. Retrieval is not assessment *after* learning; retrieval *is* the learning. This is why *Suited* makes problems and skill checks recall tasks — and why the deferred spaced-resurfacing feature matters so much.
- **Link:** https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x

**Source M3 — Deslauriers et al. (2019), *PNAS*.**
- **DOK 1 Facts:**
  - **M3.1.** Harvard intro-physics students were **randomly assigned** to active vs. passive instruction with **identical content**; actual learning and "feeling of learning" were both measured. [M3, methods]
  - **M3.2.** Active-classroom students **learned more** but **rated their feeling of learning lower**; actual and felt learning were **strongly anticorrelated.** [M3, abstract]
  - **M3.3.** Learners read the **higher cognitive effort** of active learning as a signal of **poorer** learning, which can depress early motivation. [M3, abstract]
- **DOK 2 Summary:** With identical content and random assignment, students in active classrooms actually learned more but *felt* they learned less — actual and felt learning were strongly anticorrelated, because the higher effort reads as a signal of failure. The design lesson: expect learners to dislike the most effective parts, and build motivation scaffolding (progress, streaks, XP) precisely to carry them through the effort.
- **Link:** https://www.pnas.org/doi/10.1073/pnas.1821936116

**Source M4 — Sailer & Homner (2020), *Educational Psychology Review*.**
- **DOK 1 Facts:**
  - **M4.1.** Meta-analysis: gamification yields significant **small positive effects** — cognitive **g=0.49**, motivational **g=0.36**, behavioral **g=0.25.** [M4, abstract]
  - **M4.2.** The **cognitive** effect was **stable** among high-rigor studies; **motivational/behavioral** effects were **less stable**; **"game fiction"** and **competition + collaboration** helped most. [M4, abstract]
- **DOK 2 Summary:** Meta-analytically, gamification produces small but real gains — cognitive g=0.49, motivational g=0.36, behavioral g=0.25 — with the cognitive effect most stable. So XP/streaks/levels are evidence-based, but as a **modest motivational layer**, not a teaching mechanism in themselves — which is why *Suited* leans on them to drive return visits while keeping the actual teaching in the interactive problems.
- **Link:** https://link.springer.com/article/10.1007/s10648-019-09498-w

---

## References

### Full source list (with links)
- **S1 —** Levitt, S. D., & Miller, T. J. (2011). *The Role of Skill versus Luck in Poker: Evidence from the World Series of Poker.* NBER WP 17023 (publ. *J. Sports Economics*, 2012). https://www.nber.org/papers/w17023 · PDF: https://pricetheory.uchicago.edu/levitt/Papers/WSOP2011.pdf
- **S2 —** Duke, A. (2018). *Thinking in Bets.* Portfolio/Penguin. ISBN 9780735216372. https://www.penguinrandomhouse.com/books/552885/thinking-in-bets-by-annie-duke/
- **P1 —** Reputable poker-school consensus, cross-checked in `docs/poker-research/04-pedagogy-and-strategy.md`: PokerStars Learn (https://www.pokerstars.com/poker/learn/), Upswing Poker (https://upswingpoker.com/texas-holdem-starting-hands-guide/), PokerNews (https://www.pokernews.com/poker-hands/best-starting-hands.htm), PokerCoaching (https://pokercoaching.com/blog/how-to-learn-poker/).
- **C —** Poker content of record: design doc §3 + `docs/poker-research/01-rules-and-hand-rankings.md` & `03-poker-math.md` (verified vs. Wikipedia *List of poker hands* / *Poker probability*, Bicycle, PokerNews, thepokerbank).
- **M1 —** Freeman, S., et al. (2014). *Active learning increases student performance in science, engineering, and mathematics.* PNAS 111(23):8410–8415. https://www.pnas.org/doi/10.1073/pnas.1319030111 · open access: https://pmc.ncbi.nlm.nih.gov/articles/PMC4060654/
- **M2 —** Roediger, H. L., & Karpicke, J. D. (2006). *Test-Enhanced Learning…* Psychological Science 17(3):249–255. https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x
- **M3 —** Deslauriers, L., et al. (2019). *Measuring actual learning versus feeling of learning…* PNAS 116(39):19251–19257. https://www.pnas.org/doi/10.1073/pnas.1821936116 · open access: https://pmc.ncbi.nlm.nih.gov/articles/PMC6765278/
- **M4 —** Sailer, M., & Homner, L. (2020). *The Gamification of Learning: a Meta-analysis.* Educational Psychology Review 32(1):77–112. https://link.springer.com/article/10.1007/s10648-019-09498-w

### How the DOK 1 facts map to *Suited*'s design
| App design choice | Backed by |
| --- | --- |
| ≥75% interactive **problem** steps (play, don't read) | M1 (active learning), M2 (retrieval > restudy) |
| Lesson order: deck → rankings → streets/position → odds → betting | P1.1 (poker-school consensus curriculum) |
| Skill checks + free **retries**, "Check / Try again" | M2 (being tested *is* learning) |
| Immediate per-decision **feedback** + "Why?" explanations | M1; P1.4 (kill misconceptions in the moment); M3 (counter the feeling-of-learning trap) |
| **XP / streaks / levels**, sequential mastery unlock | M4 (gamification's motivational/behavioral gains) |
| AI grounded in `analyzeSpot`, validated against `handEvaluator`, soft-fail to rules | S2, P1.4 (explainable reasons teach *why*; never let an unverified model grade) |
| Play-money only; "judge the decision, not the result" framing | S1, S2, P1.5 |

### Notes on rigor
- Every numeric DOK 1 fact was cross-checked against the **primary source** (PNAS / NBER / journals) or, for poker content, against this repo's multi-source research notes (which themselves verify ≥2 reputable sources per claim).
- **S2 (Duke)** is popular-press — excellent for *framing and vocabulary* ("bet," "resulting," "life is poker not chess") — so lean on **S1, P1, M1–M4** for empirical weight. That credibility gap is itself useful tension for DOK 3/4.
- Helpline/program details and figures should be re-verified before any public/graded submission. *Accessed June 2026.*

---

## AI-First Build Process (Phase-2 BrainLift)

> Per the *Build Brilliant* brief, this documents the AI-first build process and the point of view that emerged from it: the tools and workflow, the prompting patterns that worked, the Phase-2/Phase-3 decisions, a rough AI-vs-hand-written split, and the key learnings.

### 1. Tools & workflow
- **Cursor** as the primary agentic IDE (the canonical branch is `cursor/complete-brilliant-prd`), driving the bulk of the implementation.
- **Parallel agent worktrees.** Rather than one linear branch, the work fanned out into many git worktrees — `suited-fix-auth`, `suited-fix-poker`, `suited-fix-worker`, `suited-fix-lessons`, `suited-openai-proxy`, `fixc-content`, `fixc-lib`, `fixc-ux`, `suited-harden`, `suited-docs`, `casino-2rooms-worktree` — so several agents could work isolated features at once, then merge through an `integration-harden` branch before `main` (~55 commits).
- **Phase discipline is visible in the history**, in the brief's required order: a probability scaffold → `Scaffold Suited poker revamp` (hand evaluator, interaction skeleton, rebrand) → a 5–6-lesson **no-AI** course → a sectioned 8-then-9-lesson path → **Phase 2** AI casino tables → the Cloudflare OpenAI proxy → security/cost hardening → docs. The MVP taught with **AI off** before any AI was added.
- **Free-tier by design.** Firebase stays on the free Spark plan; the OpenAI path runs through a Cloudflare **Worker** (free Workers plan) instead of a Blaze-only Cloud Function, so the API key never touches the browser.

### 2. Prompting strategies (patterns that worked)
*(Representative of the patterns used; swap in exact prompt text where you want verbatim records.)*
- **A — "Typed content model first."** *"Define a TypeScript type for a lesson as a sequence of `concept`/`problem` steps with `interaction`, `config`, `answer`, and `feedback{correct, incorrect, hints, why}`; then author Lesson N as data conforming to it — ≥75% problem steps, one new idea per concept, no two concepts in a row, no forward references."* Forcing **data, not HTML** made every later lesson (and any future AI generation) cheap and consistent.
- **B — "Ground the coach; don't let it free-write."** *"Write the Room 1 coach message from this structured `analyzeSpot` object (street, pot odds, equity, draw type, legal actions) and glossary terms only; never invent board cards or numbers; return `null` on any error."* Kept AI grounded in engine facts and made **soft-fail** the default.
- **C — "Progressive hints that never solve it."** *"Author a 3-tier hint array: hint 1 nudges toward the concept, hint 2 narrows the method, hint 3 walks the method but still requires the learner to answer — never reveal the final answer."* Matches the Brilliant/learning-science pattern and is checkable by reading the tiers.
- **D — "Validate the model against ground truth."** *"After the LLM proposes an opponent action, validate it against `handEvaluator` + the enumerated legal actions and clamp to the nearest legal move; if invalid or timed out, fall back to the deterministic Tier-3 `decideAI`."* The model can be creative about **style**, never about legality or hand strength.
- **E — "Make 'AI-off' a test, not a hope."** *"Add logic checks (`web/scripts/mvp-logic-check.mjs`) asserting sequential unlock, the ≥2/3 skill-check threshold, XP idempotency, and that each AI feature has a deterministic fallback path."* Turns "works with AI off" into a verifiable property.

### 3. Phase decisions
**Phase 2 (AI) — shipped:**
- A **reactive AI coach** (Room 1) grounded in `analyzeSpot`, including a **result-aware end-of-hand reflection** that praises a good decision even when the hand lost.
- **LLM-driven opponents** + light table talk (Room 2), every action validated against the evaluator and clamped to legal moves.
- An **always-on rule-based hint bar** (Room 2) as the assist that never depends on a model.

**Phase 2 (AI) — deliberately skipped:**
- **AI inside lessons/skill checks** — kept 100% authored and deterministic.
- **AI problem/hint generation and LLM wrong-answer explanations** — a domain with a ground-truth evaluator does not need an unverified generator; the risk (a confidently wrong poker answer) outweighs the reward.
- **Direct browser-side OpenAI/Anthropic in production** — prototyping placeholders only; the key lives in the Worker.

**Phase 3 (learning science) — added:** retrieval practice (recall-based problems & skill checks), **mastery gating** (≥2/3 to pass + strictly sequential unlock + casino gated behind all lessons), **scaffolding with fading** (3-tier lesson hints, stripped in skill checks), **desirable difficulty** (first-try XP bonus decays per extra attempt), and **immediate explanatory feedback** ("Why?" modals). Problem **variants are interleaved within a session**.

**Phase 3 — deferred (named honestly):** **spaced repetition / scheduled resurfacing** and **adaptive mastery routing** — the two techniques the PRD itself labels "Phase 3." Today, retention rests on the daily streak + optional manual review, not a scheduler. This is the single highest-leverage next feature (see SPOV 5 / Insight 6).

### 4. Code analysis (AI-vs-hand-written — estimate)
> Git history doesn't record per-line authorship, so treat these as an **informed estimate to adjust**, not a measurement.
- **~80–90% AI-generated:** React components and routing, the typed lesson/skill-check **data**, the poker engine/evaluator scaffolding, the AI provider layer and Worker, tests, and docs.
- **~10–20% hand-written / hand-directed:** the spiky decisions and the seams — the pedagogy sequencing, the "grade the decision, not the result" stance, the **AI-as-fallback-first** architecture, the prompt designs, and the hand-verification of the poker math/evaluator correctness.
- **Honest framing:** AI wrote most of the *lines*; the human owned the *architecture seams, the pedagogy, and the points of view*.

### 5. Key learnings (spiky takeaways)
- **Ground truth is a superpower.** In any domain with a checkable answer, let code own the answer and AI own the vibe — and make "AI-off still teaches" a unit test, not a slogan.
- **Gamify the decision, not the result**, or you train the exact bias the subject exists to cure.
- **The best lessons are data, not screens.** A typed content model made both human authoring and (potential) AI generation cheap and consistent.
- **Effective learning feels bad in the moment** — budget motivation scaffolding (streaks/XP) for that deliberately, because learners will misjudge the parts that work best.
- **Be honest about the half you didn't build.** Naming the spaced-repetition gap is more useful than papering over it — and it points straight at the next build.
