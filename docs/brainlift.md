# BrainLift — Teaching Poker by Doing

**Topic:** The most effective way to **teach poker** — taking a complete beginner to a competent Texas Hold'em player.
**Project:** *Suited* — an interactive, play-money Texas Hold'em course (5 lessons, ≥75% interactive problem steps, immediate feedback, skill checks, XP / streaks / levels, sequential mastery unlock). The subject **is poker**: how to read a board, rank hands, count outs, use position, size bets, and decide call/fold.
**Author:** _[your name]_ · **Date:** _[fill in]_ · **Format:** 1-page markdown BrainLift

> **Status of this document.** The **Experts** and **DOK 1 (Facts)** sections are complete and source-verified. **DOK 2, DOK 3, and DOK 4 are scaffolded for you to write** — each has instructions, prompts, and (for DOK 3) the cross-source tensions worth mining. Don't let me write your DOK 3/4; those must originate in your brain. That's the whole point of the exercise.

---

## Purpose — why this matters & who owns it

**Why it matters.** Poker is a learnable game of skill, but it's mostly taught badly: strategy articles, hour-long training videos, and range charts to memorize. That's a *knowledge-transfer* model for what is actually a *skill* — making good decisions, fast, with incomplete information and money on the line. The learning-science evidence says skill is built by **doing** (active practice, retrieval, immediate feedback), not by watching. So the bet behind *Suited* is that the fastest way to make a beginner a real poker player is an interactive, feedback-rich, gamified course — using the curriculum order the best poker schools already agree on, but replacing their passive delivery with learn-by-doing.

**Who owns it.** _[Your name]_ — builder/author of *Suited*. Audience: anyone deciding **how to teach poker** (course builders, poker schools/coaches, EdTech founders) — and, more broadly, how to teach any skill that is fundamentally about decisions under uncertainty.

**The thesis we are pressure-testing (your eventual SPOV will sharpen or overturn this):**
> *The fastest path from "never played" to "competent player" is interactive, learn-by-doing practice — sequenced the way reputable poker schools teach (rules → rankings → position → starting hands → pot odds), and reinforced with retrieval, instant per-decision feedback, and gamified repetition — not videos, articles, or charts.*

---

## Experts — the source curation (your intellectual supply chain)

Seven authoritative sources across **three pillars**: (1) **the subject** — poker is a teachable game of skill; (2) **domain pedagogy** — how beginners should learn poker; (3) **method** — how any skill is taught so it sticks. They're chosen to **disagree at the seams** — that tension is where your DOK 3 insights come from (see flagged tensions in DOK 3).

> The BrainLift template asks for **3–5** sources; seven are provided (with one cluster and an optional 6th-pillar source) so you can trim. The assignment minimum is three.

### Pillar 1 — The subject: poker is a teachable game of skill

| # | Source | What it establishes | Credibility |
| --- | --- | --- | --- |
| **S1** | **Levitt & Miller (2011/2012).** "The Role of Skill versus Luck in Poker: Evidence from the WSOP." *NBER WP 17023* / *J. Sports Economics* 13. | Poker results are driven by **skill**, empirically — so it can be *taught* and improvement is real. | **High** — economists' analysis of real WSOP data; peer-reviewed. |
| **S2** | **Duke, A. (2018).** *Thinking in Bets.* Portfolio/Penguin. | What "good poker" actually is: decisions as **bets**; the cardinal error is **"resulting."** | **Medium** — popular-press by a cognitive-science-trained pro; strong for *framing*, pair with S1/P1 for rigor. |

### Pillar 2 — Domain pedagogy: how beginners should learn poker

| # | Source | What it establishes | Credibility |
| --- | --- | --- | --- |
| **P1** | **Reputable poker-school consensus** — PokerStars Learn/School, Upswing Poker, PokerNews, PokerCoaching, DeucesCracked (cross-checked in this project's `docs/poker-research/`). | The agreed beginner **curriculum order**, the **TAG** default, and the **common misconceptions** good courses must defeat. | **High (as consensus)** — multiple independent reputable schools agree; cross-checked ≥2 sources per claim. |
| **C** | **Poker content of record** — design doc §3 + `docs/poker-research/01–03` (verified vs. Wikipedia, Bicycle, PokerNews, thepokerbank, and standard combinatorics). | The **objective rules/math** a competent player must command (rankings, outs, pot odds, EV). | **High** — combinatorial facts + multi-source verification. |

### Pillar 3 — Method: how a skill is taught so it sticks

| # | Source | What it establishes | Credibility |
| --- | --- | --- | --- |
| **M1** | **Freeman et al. (2014).** *PNAS* 111(23):8410–8415. | Active learning beats lecture, at scale, across STEM. | **Very high** — meta-analysis of 225 studies. |
| **M2** | **Roediger & Karpicke (2006).** *Psychological Science* 17(3):249–255. | Retrieval practice (being tested) beats restudy for long-term retention. | **Very high** — foundational controlled experiments. |
| **M3** | **Deslauriers et al. (2019).** *PNAS* 116(39):19251–19257. | Effortful active learning **works but feels worse** — learners misjudge it. | **Very high** — randomized controlled experiment. |
| **M4** | **Sailer & Homner (2020).** *Educational Psychology Review* 32(1):77–112. | Gamification produces small-but-real gains in learning, motivation, behavior. | **High** — meta-analysis; *optional source*. |

---

## DOK 1 — FACTS (the bricks)

> Objective, verifiable claims extracted directly from the sources. Litmus test passed: two readers of the same source would extract the same list. **No interpretation here** — that begins in DOK 2. Each fact is tagged and locatored for re-checking.

### Pillar 1 — Poker is a teachable game of skill

**From S1 — Levitt & Miller (2011/2012):**
- **S1.1.** The paper analyzed the **2010 World Series of Poker**, using **720 players identified as highly skilled *before*** the events. [S1, abstract]
- **S1.2.** High-skill players earned an **average ROI of +30.5%** (≈ **$1,200 average profit** per player per event); **all other players earned −15.6%** (a loss of **>$400** per event). [S1, results]
- **S1.3.** The paper states this large, statistically significant gap is **strong evidence that poker is a game of skill**, and notes courts judging online-poker legality rely on the skill-vs-luck question. [S1, abstract]

**From S2 — Duke (2018):**
- **S2.1.** The book defines a bet as **"a decision about an uncertain future"** and argues **every decision is a bet.** [S2, Ch.1]
- **S2.2.** It states that how outcomes turn out is determined by **two things: the quality of decisions and luck.** [S2, Ch.1]
- **S2.3.** It defines **"resulting"** as the tendency to **equate the quality of a decision with the quality of its outcome.** [S2, Ch.1]
- **S2.4.** "Life Is Poker, Not Chess": unlike chess, poker has **hidden information and luck**, so **good decisions can lose and bad ones can win** short-term; learning requires **separating decision quality from outcomes.** [S2, Ch.1]

### Pillar 2 — What competent poker is, and how beginners learn it

**From C — poker content of record (verified):**
- **C.1.** A deck is **52 cards (13 ranks × 4 suits)**. In Hold'em your hand is the **best 5-card hand from 7** (2 hole + 5 community); there are **C(7,5)=21** subsets, and you may use **both, one, or zero** hole cards. [C; research 01]
- **C.2.** Hand-ranking order (strong→weak): **royal flush, straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, one pair, high card.** The organizing principle is **"rarer = stronger,"** and **suits never break ties.** [C; design §3.2; research 01]
- **C.3.** A **flush draw = 9 outs**, an **open-ended straight draw = 8**, a **gutshot = 4.** [C; research 03]
- **C.4.** **Rule of 4 (flop) / Rule of 2 (turn):** hit-equity% ≈ **outs × 4** (two cards to come) or **outs × 2** (one card). [C; research 03]
- **C.5.** **Required equity to call = call / (pot + call)**; a **pot-sized bet → 33.3%**, **half-pot → 25%**, **quarter-pot → 16.7%.** [C; research 03]
- **C.6.** **EV(call) = P(win) × (amount won) − P(lose) × (amount lost).** [C; research 03]

**From P1 — reputable poker-school consensus (cross-checked):**
- **P1.1.** Reputable schools converge on a beginner **learning order**: rules & the five betting actions → **hand rankings** → **position** → **starting-hand selection** → **pot odds / outs.** [P1; research 04 §1]
- **P1.2.** **Starting-hand selection is universally treated as a foundational, early, heavily-emphasized** beginner skill — not an advanced topic. [P1; research 04 §1–2]
- **P1.3.** The recommended beginner default style is **tight-aggressive (TAG)**: play roughly the **top ~15–20% of hands** (fold ~80%+), and **bet/raise rather than call.** [P1; research 04 §2–3]
- **P1.4.** Documented **common beginner misconceptions** good courses must defeat: "poker is mostly luck" (skill dominates over the **long run**), "bluffing is how you win" (most profit comes from **value-betting**), "play too many hands," and **sunk-cost calling** without the pot odds. [P1; research 04 §4]
- **P1.5.** Reputable bodies note the **house rake + stronger players mean the player pool loses money over time**; framing poker as a **skill/odds game** (and, for a learning app, play-money) is standard responsible practice. [P1; research 04 §5]

### Pillar 3 — How a skill is taught so it sticks

**From M1 — Freeman et al. (2014):**
- **M1.1.** Meta-analysis of **225 studies**; exam/concept-inventory scores rose **+0.47 SD** under active learning (n=158). [M1, abstract]
- **M1.2.** The **odds ratio for failing was 1.95** under lecturing (n=67) — lecture students were **~1.5× more likely to fail** (failure rates **33.8% vs. 21.8%**). [M1, abstract/results]
- **M1.3.** Effects **held across all STEM disciplines and class sizes** (largest in classes ≤50). [M1, abstract]

**From M2 — Roediger & Karpicke (2006):**
- **M2.1.** Compared **repeated testing vs. repeated studying**, with **no feedback** on the tests. [M2, abstract]
- **M2.2.** Immediately (5 min), repeated study recalled more (≈**83% vs. 71%**, Exp. 2); after **one week**, repeated testing recalled far more (**61% vs. 40%**). [M2, results]
- **M2.3.** The testing group read the passage only **3.4×** vs. **14.2×** for the study group, yet retained more; repeated study **inflated confidence** despite the worst retention. [M2, results/discussion]

**From M3 — Deslauriers et al. (2019):**
- **M3.1.** Harvard intro-physics students were **randomly assigned** to active vs. passive instruction with **identical content**; both actual learning and "feeling of learning" were measured. [M3, methods]
- **M3.2.** Active-classroom students **learned more** but **rated their feeling of learning lower**; actual and felt learning were **strongly anticorrelated.** [M3, abstract]
- **M3.3.** Learners read the **higher cognitive effort** of active learning as a signal of **poorer** learning, which can depress early motivation. [M3, abstract]

**From M4 — Sailer & Homner (2020) — *optional*:**
- **M4.1.** Meta-analysis: gamification yields significant **small positive effects** — cognitive **g=0.49**, motivational **g=0.36**, behavioral **g=0.25.** [M4, abstract]
- **M4.2.** The **cognitive** effect was **stable** among high-rigor studies; **motivational/behavioral** effects were **less stable**; **"game fiction"** and **competition + collaboration** helped most. [M4, abstract]

---

## DOK 2 — SUMMARY (your turn: the compression)

> **What to do:** Restate the DOK 1 facts **in your own words** to prove you understand them. Low agency — you own the wording, the authors own the ideas. **Litmus test:** every sentence traces to a specific fact above. ~1 tight paragraph (or 2–3 sentences) per theme.

**2.1 — The subject: poker is a learnable skill, and here's what a beginner must master.**
> _Compress S1, S2, C, P1 in 2–4 sentences. (Springboard: poker is skill-driven over the long run [S1]; good play = good *decisions*, not good results [S2]; the concrete skills are rankings → position → starting hands → pot odds/EV [C, P1.1]; beginners arrive with predictable misconceptions [P1.4].)_
>
> _[your summary here]_

**2.2 — The method: how you teach a skill so it sticks.**
> _Compress M1–M4 in 2–4 sentences. (Springboard: active learning beats lecture [M1]; retrieval beats restudy for retention [M2]; effortful learning feels worse and is misjudged [M3]; gamification adds small reliable gains [M4].)_
>
> _[your summary here]_

---

## DOK 3 — INSIGHTS (your turn: the synthesis)

> **What to do:** Make a **novel connection across sources that none of the authors stated.** High agency — this originates in *your* brain. Move from "what the text says" to "what it *implies* when you combine sources." Generate **1–2** insights. Below are the richest **tensions** — mine these or find your own.

**Tension 1 — Right curriculum, wrong format.**
Poker schools agree on the *order* to teach [P1.1] but deliver it as **articles, videos, and charts to memorize**; learning science says skill comes from **doing + retrieval**, not watching [M1, M2].
> _What does combining P1 + M1 + M2 imply about where the entire poker-training industry goes wrong — and what an interactive course should *keep* vs. *throw out*?_
>
> _[your insight here]_

**Tension 2 — "Resulting" vs. outcome-based rewards (the spiciest, and poker-specific).**
The #1 thing that makes a beginner good is judging the **decision, not the result** [S2.3, P1.4]. But gamification/XP usually rewards **outcomes** — winning the hand, getting the answer "right" [M4].
> _When you gamify a poker trainer, are you accidentally rewarding the exact bias ("resulting") that poker exists to cure? What would it mean to grade and reward **decision quality** instead of results?_
>
> _[your insight here]_

**Tension 3 — Skill needs volume; durable learning needs reps; effort feels bad.**
Skill only *shows up* over **many hands** [S1]; retention needs **many spaced retrievals** [M2]; but effortful practice **feels worse** and saps early motivation [M3].
> _Is gamified repetition (streaks/XP) [M4] the mechanism that "pays the felt cost" so beginners actually do enough reps to get good? Connect S1 + M2 + M3 + M4._
>
> _[your insight here]_

**Tension 4 — Misconceptions are emotional; feedback can be surgical.**
Beginner errors are ego/luck-driven ("I have to defend," "poker is luck," over-bluffing) [P1.4] — and an interactive **"Why?"** can correct the exact decision in the moment [M1], using Duke's resulting frame [S2].
> _What can in-the-moment, per-decision feedback do about misconceptions that a strategy article fundamentally cannot?_
>
> _[your insight here]_

---

## DOK 4 — SPIKY POINT OF VIEW (your turn: the stance)

> **What to do:** Take a **prescriptive, defensible, debatable** position about teaching poker. Maximum agency. **Spikiness test:** *if 20 poker coaches / EdTech people wouldn't argue about it, it isn't spiky enough.* It must be (1) prescriptive, (2) debatable, (3) evidence-backed (lean on your DOK 3), (4) actionable.

**Your SPOV (write 1):**
> _[your spiky point of view here]_

**Springboard directions** (derived from the tensions — *pick one to sharpen, or write your own; the stance must be yours and defensible in a review*):
- *On format:* "Poker should be taught by **playing hands with instant feedback**, not by reading charts or watching training videos — the strategy-content industry transfers *knowledge*, but poker is a *skill*, and knowledge ≠ skill."
- *On rewards (spiciest):* "A poker trainer must **grade your decision, not your result.** Any app that celebrates 'you won the pot' is reinforcing **resulting** — the single biggest beginner leak — and is teaching the game backwards."
- *On sequencing:* "**Fold discipline and position belong in the first hour, not the last lesson** — and only interactive drilling can build the fold-reflex a beginner lacks; explaining it in prose never will."

**Self-check before you commit:**
- [ ] Prescriptive? (tells someone what to *do*)
- [ ] Debatable? (a smart poker coach could disagree)
- [ ] Evidence-backed? (cite your DOK 3 + the DOK 1 facts)
- [ ] Would you defend it in a review?

---

## Appendix

### Full source list (with links)
- **S1 —** Levitt, S. D., & Miller, T. J. (2011). *The Role of Skill versus Luck in Poker: Evidence from the World Series of Poker.* NBER WP 17023 (publ. *J. Sports Economics*, 2012). https://www.nber.org/papers/w17023 · PDF: https://pricetheory.uchicago.edu/levitt/Papers/WSOP2011.pdf
- **S2 —** Duke, A. (2018). *Thinking in Bets.* Portfolio/Penguin. ISBN 9780735216372. https://www.penguinrandomhouse.com/books/552885/thinking-in-bets-by-annie-duke/
- **P1 —** Reputable poker-school consensus, cross-checked in `docs/poker-research/04-pedagogy-and-strategy.md`: PokerStars Learn (https://www.pokerstars.com/poker/learn/), Upswing Poker (https://upswingpoker.com/texas-holdem-starting-hands-guide/), PokerNews (https://www.pokernews.com/poker-hands/best-starting-hands.htm), PokerCoaching (https://pokercoaching.com/blog/how-to-learn-poker/).
- **C —** Poker content of record: design doc §3 + `docs/poker-research/01-rules-and-hand-rankings.md` & `03-poker-math.md` (verified vs. Wikipedia *List of poker hands* / *Poker probability*, Bicycle, PokerNews, thepokerbank).
- **M1 —** Freeman, S., et al. (2014). *Active learning increases student performance in science, engineering, and mathematics.* PNAS 111(23):8410–8415. https://www.pnas.org/doi/10.1073/pnas.1319030111 · open access: https://pmc.ncbi.nlm.nih.gov/articles/PMC4060654/
- **M2 —** Roediger, H. L., & Karpicke, J. D. (2006). *Test-Enhanced Learning…* Psychological Science 17(3):249–255. https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x
- **M3 —** Deslauriers, L., et al. (2019). *Measuring actual learning versus feeling of learning…* PNAS 116(39):19251–19257. https://www.pnas.org/doi/10.1073/pnas.1821936116 · open access: https://pmc.ncbi.nlm.nih.gov/articles/PMC6765278/
- **M4 —** Sailer, M., & Homner, L. (2020). *The Gamification of Learning: a Meta-analysis.* Educational Psychology Review 32(1):77–112. https://link.springer.com/article/10.1007/s10648-019-09498-w

### How the DOK 1 facts map to *Suited*'s design (reference for DOK 3/4)
| App design choice | Backed by |
| --- | --- |
| ≥75% interactive **problem** steps (play, don't read) | M1 (active learning), M2 (retrieval > restudy) |
| Lesson order: deck → rankings → streets/position → odds → betting | P1.1 (poker-school consensus curriculum) |
| Skill checks + free **retries**, "Check / Try again" | M2 (being tested *is* learning) |
| Immediate per-decision **feedback** + "Why?" explanations | M1; P1.4 (kill misconceptions in the moment); M3 (counter the feeling-of-learning trap) |
| **XP / streaks / levels**, sequential mastery unlock | M4 (gamification's motivational/behavioral gains) |
| Scripted/deterministic opponents (no opaque AI) | explainable reasons teach *why* a play works (P1.4, S2) |
| Play-money only; "judge the decision, not the result" framing | S1, S2, P1.5 |

### Notes on rigor
- Every numeric DOK 1 fact was cross-checked against the **primary source** (PNAS / NBER / journals) or, for poker content, against this repo's multi-source research notes (which themselves verify ≥2 reputable sources per claim).
- **S2 (Duke)** is popular-press — excellent for *framing and vocabulary* ("bet," "resulting," "life is poker not chess"), but lean on **S1, P1, M1–M4** for empirical weight. The credibility gap between S2 and the peer-reviewed sources is itself useful tension for DOK 3/4.
- Helpline/program details and figures should be re-verified before any public/graded submission. _Accessed June 2026._
