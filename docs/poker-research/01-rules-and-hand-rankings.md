# Research Notes — Lessons 1–2: Poker Fundamentals, the Deck, Hand Rankings & Hand Evaluation

**Purpose:** Verify and gather authoritative content for the "Suited" Texas Hold'em course (Lessons 1–2), and flag any inaccuracies/gaps in `docs/poker-course-design.md` (§3.1–§3.3, Lesson 1–2 plans, Appendix A).

**Method:** Facts below were cross-checked across ≥2 reputable public sources (full list at the bottom). Everything is summarized in our own words; no copyrighted text is reproduced verbatim. 5-card frequency counts were confirmed against 4 independent sources; 7-card frequency counts against 4 independent sources.

**Bottom line:** The design doc's poker content is **highly accurate** — the deck, the full ranking order, every tie-breaker, all 5-card frequencies, and the best-5-of-7 worked example all check out. There is **one factual error** (a parenthetical claim about 7-card frequencies in §3.2) plus a handful of small clarity/teaching gaps. Details in the "Discrepancies & improvements" section.

---

## 1. Verified facts

### 1.1 The deck

- A standard deck has **52 cards = 13 ranks × 4 suits**. *(Wikipedia Poker probability; UCLA Stats; List of poker hands.)*
- **Ranks**, low → high: **2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A.** Individual card ranks, high → low, are A, K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2. *(Wikipedia List of poker hands.)*
- **Suits:** ♠ spades, ♥ hearts, ♦ diamonds, ♣ clubs. **Suits have no relative value** for ranking hands: "hands that differ by suit alone are of equal rank." *(Wikipedia List of poker hands; Bicycle: "all suits are equal.")*
- **The Ace is usually high but can play low** to make the smallest straight, A-2-3-4-5 (the "wheel" / "bicycle"). An ace cannot be high and low at the same time, so K-A-2-3-4 does **not** wrap around and is **not** a straight. *(Wikipedia List of poker hands: "Q♠ K♠ A♣ 2♥ 3♦ is an ace-high hand," i.e. not a straight.)*

> Aside (out of scope for L1–2, do not teach yet): suits are sometimes used for *non-ranking* tie-breaks like awarding a single leftover odd chip in a split pot, or the stud bring-in. This never changes which **hand** wins. Keep the course's "suits never break ties" message — it is correct for hand strength.

### 1.2 What Texas Hold'em is (at a glance) and the objective

- Each player is dealt **2 private "hole" cards** (face down). **5 community cards** are dealt face up in three stages: the **flop** (3 cards), the **turn** (1 card), and the **river** (1 card). *(Wikipedia Texas hold 'em; Bicycle; Community card poker.)*
- Your hand is the **best 5-card poker hand you can make from your 7 available cards** (2 hole + 5 community). *(Wikipedia Texas hold 'em; Bicycle; PokerSkill.)*
- **Objective:** win the **pot** (all chips wagered on the hand). The best 5-card hand at showdown wins; if everyone else folds first, the last player standing wins without showing cards. *(Wikipedia Texas hold 'em.)*
- **Ties split** ("chop the pot") when two or more players have hands of equal value. *(Wikipedia; Bicycle.)*

### 1.3 Hand-ranking order with exact tie-breakers (verified against Wikipedia "List of poker hands")

Ranking is a **fixed rule**: a hand in a higher category always beats any hand in a lower category. Within a category, **kickers** (the side cards not part of the main combination) break ties, compared high → low. **Suits never break ties**; truly identical 5-card hands split.

| # (strong→weak) | Category | What it is | Tie-breaker, in order | Beginner example |
| --- | --- | --- | --- | --- |
| 1 | **Royal flush** | A-K-Q-J-10, all one suit | None — best possible hand; can only tie (split) | A♦ K♦ Q♦ J♦ 10♦ |
| 2 | **Straight flush** | 5 consecutive ranks, all one suit | Highest top card. Wheel A-2-3-4-5 is the **lowest** (5-high), not ace-high | 9♥ 8♥ 7♥ 6♥ 5♥ (9-high) beats 6♠ 5♠ 4♠ 3♠ 2♠ |
| 3 | **Four of a kind (quads)** | 4 cards of one rank + 1 kicker | Rank of the quads, then the kicker | K K K K 3 beats 7 7 7 7 Q; with equal quads, higher kicker wins |
| 4 | **Full house** | 3 of a kind + a pair | Rank of the trips, then rank of the pair | 8-8-8-7-7 beats 4-4-4-9-9 (trips compared first) |
| 5 | **Flush** | 5 cards of one suit, not in sequence | Highest card, then 2nd, 3rd, 4th, 5th | K♣-J♣-9♣-6♣-4♣ beats Q♣-J♣-7♣-6♣-5♣ |
| 6 | **Straight** | 5 consecutive ranks, mixed suits | Highest top card; ace high **or** low; no wrap (K-A-2-3-4 is not a straight) | J-10-9-8-7 beats 10-9-8-7-6 |
| 7 | **Three of a kind (trips/set)** | 3 of one rank + 2 kickers | Rank of the trips, then highest kicker, then 2nd kicker | 6-6-6-Q-4 beats 3-3-3-K-2 |
| 8 | **Two pair** | 2 pairs + 1 kicker | Higher pair, then lower pair, then kicker | 10-10-2-2-K beats 5-5-4-4-10 |
| 9 | **One pair** | 1 pair + 3 kickers | Pair rank, then 3 kickers high → low | A-A-K-x-x beats A-A-10-x-x (**kicker matters!**) |
| 10 | **High card** | none of the above | Highest card, then next, … all 5 | K-J-8-7-4 beats Q-J-6-5-3 |

Notes confirmed from sources:
- A **royal flush is just the best straight flush** (ace-high straight flush). It is unbeatable and can at most tie. *(888poker; Wikipedia.)*
- For **four of a kind**, the 5th card (kicker) is part of the ranking. This matters in Hold'em when quads are on/near the board and the highest remaining card "plays." *(Wikipedia.)*
- For **flush** and **high card**, all five cards are compared in order until a difference is found. *(Wikipedia.)*
- The **worst possible 5-card hand** is **7-5-4-3-2** (offsuit) — seven-high, no straight, no flush. Useful "floor" anchor for beginners. *(PokerNews.)*

### 1.4 How the best 5-of-7 hand is determined + the big beginner myth

- At showdown each remaining player makes the **best 5-card hand from their 7 cards** (2 hole + 5 community). There are **C(7,5) = 21** possible 5-card subsets; the best one is your hand. *(Wikipedia; design doc §3.3.)*
- **MYTH (must preempt): "You have to use both of your hole cards."** **False in Hold'em.** You may use **both, one, or none (zero)** of your hole cards — any 5 of the 7 that make the strongest hand. *(Wikipedia Texas hold 'em; Bicycle; PokerSkill; The Playbook USA — unanimous.)*
  - This is the #1 thing beginners import incorrectly from **Omaha**, where you **must** use *exactly two* of your four hole cards. Hold'em is permissive; Omaha is strict. *(PokerSkill.)*
- **"Playing the board":** if your best 5 cards are exactly the 5 community cards (your hole cards don't improve anything), you are "playing the board." You can then only **tie at best**, because every opponent shares those same 5 cards. *(Wikipedia; PokerSkill.)*
  - Classic example: the board makes **Broadway** (A-K-Q-J-10). If you hold 7♣ 2♦, your best hand is the board's A-K-Q-J-10; you can't beat anyone who also can't be beaten by the board.

**Worked example (matches design doc §3.3, verified correct):** Hole **A♠ K♠**, board **Q♠ J♠ 9♦ 4♥ 2♣** → 7 cards A♠ K♠ Q♠ J♠ 9♦ 4♥ 2♣.
- Flush? Only 4 spades (A♠ K♠ Q♠ J♠) — need 5 → **no flush**.
- Straight? Ranks A-K-Q-J then a gap at 10 → **no straight** (no wrap).
- Pairs? All 7 ranks distinct → **no pair**.
- **Result: high card, best five = A-K-Q-J-9.** ✓

### 1.5 5-card frequencies (for the "rarer = stronger" intuition)

These are **frequencies for a random 5-card deal** from a 52-card deck. Total distinct 5-card hands = **C(52,5) = 2,598,960**. Counts below sum **exactly** to that total. Verified identical across Wikipedia (Poker probability), Wizard of Odds, UCLA Statistics, and All Math Considered.

| Category | # of 5-card hands | Probability |
| --- | --- | --- |
| Royal flush | 4 | 0.000154% |
| Straight flush (excl. royal) | 36 | 0.00139% |
| Four of a kind | 624 | 0.0240% |
| Full house | 3,744 | 0.144% |
| Flush (excl. straight/royal flush) | 5,108 | 0.197% |
| Straight (excl. straight/royal flush) | 10,200 | 0.392% |
| Three of a kind | 54,912 | 2.11% |
| Two pair | 123,552 | 4.75% |
| One pair | 1,098,240 | 42.3% |
| High card | 1,302,540 | 50.1% |
| **Total** | **2,598,960** | **100%** |

✅ **These exactly match the design doc's §3.2 table.** Use them to motivate "rarer = stronger." The ordering of these counts (rarest at top) is the *reason* the ranking ladder is what it is.

> Teaching caveat (keep this — the design doc already states it correctly): these are **5-card-deal** frequencies. They perfectly mirror the hand-ranking order. The ranking itself is a **rule**; teach it as a rule and use this table only for intuition.

### 1.6 7-card frequencies (the subtle part — and where the design doc errs)

In Hold'em you choose your best 5 from **7** cards, so absolute hand frequencies differ. Total distinct 7-card hands = **C(52,7) = 133,784,560**. Verified identical across Wikipedia (Poker probability), Wizard of Odds, OEIS sequence A002879, and SFU/Alspach "7-Card Poker Hands."

| Category | # of 7-card hands | Probability |
| --- | --- | --- |
| Royal flush | 4,324 | 0.0032% |
| Straight flush (excl. royal) | 37,260 | 0.0279% |
| Four of a kind | 224,848 | 0.168% |
| Full house | **3,473,184** | **2.60%** |
| Flush (excl. straight/royal flush) | **4,047,644** | **3.03%** |
| Straight (excl. straight/royal flush) | 6,180,020 | 4.62% |
| Three of a kind | 6,461,620 | 4.83% |
| Two pair | 31,433,400 | 23.5% |
| One pair | 58,627,800 | 43.8% |
| High card (no pair) | 23,294,460 | 17.4% |
| **Total** | **133,784,560** | **100%** |

**Two key takeaways:**

1. **Full house vs flush (corrects the design doc):** In 7-card play the full house (**3,473,184**) is **still rarer** than the flush (**4,047,644**) — the flush is *more* common. So the ranking "full house beats flush" stays consistent with rarity even with 7 cards. The design doc's parenthetical claim that "in 7-card play a full house is actually **more common** than a flush" is **backwards / incorrect.**

2. **The genuine 7-card anomaly (use this instead):** "**No pair / high card**" (**23,294,460**) is actually **rarer than both two pair (31,433,400) and one pair (58,627,800)** in 7-card hands. With 7 cards it's *hard to avoid* making at least a pair. Wikipedia explicitly notes "the probability of a no-pair hand is *lower* than the probability of a one-pair or two-pair hand," and SFU/Alspach notes that if you ranked purely by 7-card frequency, high card and one pair would swap. The standard ranking still keeps **high card weakest by rule** (it's the weakest *category* of made hand), which is why the rule is taught as a rule, not derived from 7-card counts.

> For the course: keep teaching the **5-card** table for "rarer = stronger" (it lines up perfectly with the ranking). If Lesson 2 wants a "fun fact" about 7 cards, cite the **high-card-is-rare** anomaly — not a full-house/flush swap.

---

## 2. Beginner-friendly explanations, analogies & memory tricks

Gathered/synthesized from PokerNews, 888poker, and Americas Cardroom (in our own words):

- **One rule for every showdown:** "Compare the **category** first; only if both hands are the same category do you compare **card strength** (kickers)." This single sentence resolves almost every beginner question. *(PokerNews.)*
- **Rarer = stronger.** The whole ladder is ordered by how hard a hand is to make. Hard-to-make hands (flush, full house) sit above easy ones (pair, high card). Reinforce with the 5-card frequency table.
- **Anchor the extremes first.** Memorize that **Royal flush = best, High card = worst**, then fill in the middle. *(PokerNews "anchoring.")*
- **Mnemonics / verbal hooks** (the middle of the ladder is what beginners forget):
  - **"Full beats Flush"** → Full House outranks Flush (similar words = easy recall).
  - **"Feeling Flush against a Straight"** → Flush beats Straight.
  - Acronym (one option): **"Royals Shine For Full Flush Straights..."** style lists exist, but the two short hooks above cover the two most-confused pairs and are more reliable.
- **Pattern recognition.** A full house is *always* "3 + 2"; a flush is *always* "5 of one suit"; two pair is *always* "2 + 2 + 1." Teaching the shape helps learners classify quickly. *(Americas Cardroom.)*
- **Tiered grouping** for a mental map: Monsters (straight flush, quads, full house) → Strong (flush, straight) → Medium (trips, two pair) → Weak (one pair) → Nothing (high card). *(PokerNews.)*
- **"Kicker = tie-breaker side card."** Analogy: same last name (the pair), first name (the kicker) decides who's listed first. A-A with a K kicker beats A-A with a 10 kicker.
- **Best-5-of-7 framing.** "You get 7 cards; pick your best 5 — like choosing your 5 strongest players from a 7-person roster. The 2 you don't use don't count." Pairs naturally with the "use 0, 1, or 2 hole cards" rule.

---

## 3. Common misconceptions to preempt (high-value for the course)

1. **"A straight beats a flush."** ❌ **Flush beats straight.** This is *the* most common beginner error. Hook: "matching suits beat consecutive numbers." *(PokerNews; Americas Cardroom.)*
2. **"A flush beats a full house."** ❌ **Full house beats flush.** Hook: "Full beats Flush." *(PokerNews.)*
3. **"You must use both hole cards."** ❌ In Hold'em you use **any 5 of 7** — both, one, or none. (Omaha is the variant that forces exactly two.) *(Wikipedia; PokerSkill.)*
4. **"Kickers don't matter / same pair = always a tie."** ❌ With the same pair, the **highest kicker wins** (A-A-K > A-A-Q). Beginners correctly name the category but forget the side cards. *(PokerNews; 888poker.)*
5. **"Two pair / trips is a monster."** ❌ Commonly **overvalued**; both lose to straights, flushes, full houses, etc. *(Americas Cardroom.)*
6. **"A better suit wins."** ❌ **Suits are equal**; identical hands split the pot. *(Wikipedia; Bicycle.)*
7. **"A-K-Q-J... and the ace also loops to 2-3 — that's a straight."** ❌ **No wrap.** A is high (10-J-Q-K-A) or low (A-2-3-4-5), never both; K-A-2-3-4 is not a straight. *(Wikipedia.)*
8. **"My pair in the hole always counts."** ❌ If the **board** makes a better 5-card hand than anything you can add to it, you're **playing the board** and can only tie. *(Wikipedia; PokerSkill.)*
9. **"Aces are always high."** ⚠️ Mostly true, but the ace plays **low** in the wheel (A-2-3-4-5). Worth one explicit beat in Lesson 2.

---

## 4. Discrepancies & improvements vs. the design doc

### 4.1 Correction needed (factual error)

- **§3.2, the "Accuracy note for authors" paragraph (line ~101):** The claim *"in 7-card play a full house is actually more common than a flush"* is **incorrect**. Verified 7-card counts: **full house = 3,473,184** vs **flush = 4,047,644**, so the **flush is more common** and the full house remains **rarer** (consistent with the ranking). 
  - **Fix suggestion:** Replace the parenthetical with the real anomaly: *"With 7 cards the absolute frequencies differ — e.g., 'no pair / high card' becomes **rarer** than one pair and two pair, since it's hard to avoid making a pair across 7 cards — but the rules still rank flush above straight, full house above flush, etc."*
  - This does **not** affect any lesson logic (the ranking is a rule and is taught correctly elsewhere); it's a single inaccurate motivating fact.

### 4.2 Everything else verified accurate (no change needed)

- §3.1 deck description (52 cards, ranks, suits, ace high/low, wheel) — ✅ correct.
- §3.1 Hold'em at a glance (2 hole + 5 community = best 5 of 7; best hand wins the pot) — ✅ correct.
- §3.2 full ranking ladder and **every tie-breaker/kicker rule** — ✅ matches Wikipedia "List of poker hands" exactly.
- §3.2 **5-card frequency table** — ✅ matches 4 sources exactly; sums to 2,598,960.
- §3.2 "suits never break ties; identical hands split" — ✅ correct.
- §3.3 best-5-of-7 logic and the **A♠K♠ / Q♠J♠9♦4♥2♣ → high card A-K-Q-J-9** worked example — ✅ correct.
- §9 evaluator test cases spot-checked: wheel `A♠5♠4♠3♠2♠ = straight flush, 5-high` ✅; `Q♣ A♠ 2♦ 3♥ 4♠ = high card (no wrap)` ✅; `A♠K♠Q♠J♠10♦... = A-high straight from 7` ✅.
- Appendix A ranking cheat-sheet line — ✅ correct.

### 4.3 Suggested additions / gaps (teaching, not corrections)

- **Lesson 1 — add an explicit "use 0, 1, or 2 hole cards" beat.** The design doc states "best 5 of 7" (correct), but the most common beginner myth ("must use both hole cards") isn't explicitly preempted in the L1 step table. The plan's p4/p5 `pick-best-five` problems are a perfect place to include at least one case where the **best hand uses only one (or zero) hole cards** (e.g., one card plays, or the learner is "playing the board"). Add a `feedback.why` busting the "both cards" myth and contrasting with Omaha.
- **Lesson 1 — introduce "playing the board"** as a one-line concept (it's a natural, memorable consequence of best-5-of-7 and explains a real split-pot situation). Currently absent.
- **Lesson 2 — replace any 7-card "fun fact"** with the corrected high-card anomaly if used at all; keep the 5-card table as the primary "rarer = stronger" device (it lines up cleanly with the ranking and avoids confusing learners).
- **Lesson 2 — explicitly preempt the "straight beats flush" and "flush beats full house" confusions** with the mnemonic hooks ("Full beats Flush," "Feeling Flush against a Straight"). The design doc's p4 (rarity) and p5 (kickers) are good; consider one targeted "which is higher: flush or straight?" item, since this is the single most common beginner error.
- **Lesson 2 — kicker emphasis.** p5 already covers "both have a pair of Kings — which wins?" Keep it; consider a second kicker case on **one pair with 3 kickers** (A-A-K-x-x vs A-A-Q-x-x) since one-pair kickers are where kickers bite most often in real play.
- **Optional anchor:** mention the **worst hand 7-5-4-3-2** as the "floor" when introducing high card — a concrete, sticky reference point.

---

## 5. Sources (all reputable, cross-checked)

**Rules / what Hold'em is / best-5-of-7:**
- Wikipedia, "Texas hold 'em" — https://en.wikipedia.org/wiki/Texas_hold_%27em
- Wikipedia, "Community card poker" — https://en.wikipedia.org/wiki/Community_card_poker
- Bicycle Cards, "Texas Hold'em Poker" (rules) — https://bicyclecards.com/how-to-play/texas-holdem-poker
- PokerSkill, "Best Five-Card Hand Rule in Texas Hold'em" — https://www.pokerskill.com/blog/best-five-card-hand-rule/
- The Playbook USA, "Texas Hold'em Rules" — https://theplaybookusa.com/playbook/games/poker/texas-holdem-rules/

**Hand rankings + tie-breakers/kickers (with examples):**
- Wikipedia, "List of poker hands" — https://en.wikipedia.org/wiki/List_of_poker_hands
- PokerNews, "Poker Hands / Hand Rankings Explained" — https://www.pokernews.com/poker-hands/
- PokerNews, "What Beats What in Poker?" — https://www.pokernews.com/poker-hands/what-beats-what-in-poker.htm
- 888poker, "How to Play Poker" — https://www.888poker.ca/how-to-play-poker/
- Americas Cardroom, "Poker Hands Ranked" (mnemonics, common mistakes) — https://www.americascardroom.eu/how-to/poker-hands-ranked/

**5-card and 7-card frequencies/probabilities:**
- Wikipedia, "Poker probability" (5-card and 7-card tables) — https://en.wikipedia.org/wiki/Poker_probability
- Wizard of Odds, "Poker Probabilities" (5-card and 7-card) — https://wizardofodds.com/games/poker/
- UCLA Department of Statistics, poker probability handout (5-card) — http://www.stat.ucla.edu/~nchristo/statistics13/stat13_poker_prob.pdf
- All Math Considered, "The probabilities of poker hands" (5-card) — https://allmathconsidered.wordpress.com/2017/05/23/the-probabilities-of-poker-hands/
- OEIS A002879, 7-card hand counts — https://oeis.org/A002879
- B. Alspach (SFU), "7-Card Poker Hands" — http://people.math.sfu.ca/~alspach/comp20/

*Researched and written for the Suited course; no code modified, no git operations performed.*
