# Research Notes — Lesson 4: Poker Math (outs, odds, pot odds, equity, EV)

**Purpose:** Verify the poker-math facts encoded in `docs/poker-course-design.md` (§3.4 outs & Rule of 2 & 4, §3.5 pot odds, §3.6 EV, Appendix A) against reputable sources, in our own words.
**Status:** Research complete. All core Lesson 4 numbers in the design doc are **correct**. Two issues flagged below (one minor labeling nit in Lesson 4; one factual error in §3.2, which is Lesson 2 / out of scope but verified here).
**Method:** Every figure was (a) recomputed from first-principles combinatorics and (b) cross-checked against **≥ 2** independent reputable sources. Numbers are summarized in our own words; no copyrighted text copied. Sources listed at the bottom with URLs.

---

## 0. TL;DR — verification verdict

| Design-doc claim | Verdict |
| --- | --- |
| Flush draw = 9 outs, OESD = 8, gutshot = 4 | ✅ Correct (universal) |
| Rule of 4 (flop) / Rule of 2 (turn) | ✅ Correct |
| Big-draw correction `(outs×4) − (outs−8)` for outs > 8 | ✅ Correct & matches sources |
| Exact draw equities (8.5/17.0/19.1; 16.5/31.5/35.0; 54.1) | ✅ Correct |
| Pot odds = `call / (pot + call)` | ✅ Correct |
| Bet-size → required-equity table (16.7 / 25 / 28.6 / 33.3%) | ✅ Correct |
| Pot-odds worked example (→ 16.7%, call) | ✅ Correct |
| EV formula & worked example (= +$3.52) | ✅ Correct |
| ⚠️ §3.4 "Exact 1-card" column labeled "(turn)" but uses flop→turn `/47` values | ⚠️ Minor: see §9, issue A |
| ⚠️ §3.2 note: "in 7-card play a full house is more common than a flush" | ❌ Reversed — see §9, issue B (Lesson 2, out of scope) |

---

## 1. Outs

**Definition.** An **out** is any unseen card that, if it comes, improves your hand to (very likely) the best hand. You count outs from the cards you *cannot* see (the deck + opponents' cards), i.e. from your own point of view there are `52 − (your 2) − (board)` unseen cards.

**Why a flush draw = 9 outs.** A suit has 13 cards. If you hold 2 of that suit and 2 more are on the board, you have *seen* 4 of the 13 → `13 − 4 = 9` of that suit remain unseen. Any one completes the flush. (Confirmed: Wikipedia, PokerNews, thepokerbank, pokercoaching, RiverOdds — all give 9.)

**Common out counts (verified across multiple sources):**

| Draw | Outs | Reasoning |
| --- | --- | --- |
| Flush draw | **9** | 13 of a suit − 4 seen |
| Open-ended straight draw (OESD) | **8** | 4 cards on each open end |
| Gutshot (inside) straight draw | **4** | one rank fills the gap, 4 of it |
| Two overcards (e.g. AK on a low board) | **6** | 3 of each overcard pairs you up |
| Pocket pair → set (trips) | **2** | the 2 remaining cards of your rank |
| One pair → trips OR two pair | ~5 | 2 (set) + 3 (pair the kicker) |
| Two pair → full house | **4** | pair either of your two ranks (2 + 2) |
| Flush draw **+ gutshot** (combo) | **12** | 9 + 4 − 1 shared card |
| Flush draw **+ OESD** (combo) | **15** | 9 + 8 − 2 shared cards |

> **Combo-draw caution (no double-counting):** when adding draws together, subtract any card that completes *both*. Classic example: `9♦8♦` on `7♦6♠2♦` is an OESD (four 10s + four 5s = 8) plus a flush draw (9 diamonds). The `10♦` and `5♦` are *already* in the 9 flush outs, so the total is `9 + 6 = 15`, **not 17**. (pokercoaching, bluffthespot.)

---

## 2. The Rule of 2 and 4

**Statement.**
- **Rule of 4** — on the **flop** (two cards still to come, turn + river): `equity% ≈ outs × 4`.
- **Rule of 2** — on the **turn** (one card to come, the river): `equity% ≈ outs × 2`.
- (Bonus, "Rule of 2" on the flop for the single next card: `outs × 2` ≈ chance the *turn* alone helps.)

This is the standard at-the-table shortcut (Wikipedia, Upswing, PokerNews, thepokerbank, etc.).

### 2.1 Accuracy table — Rule vs. exact (verified)

There are **two different "one-card" numbers** because the denominator changes by street:
- **Flop → turn:** `outs / 47` (you've seen 5 cards: your 2 + flop 3).
- **Turn → river:** `outs / 46` (you've seen 6 cards: your 2 + flop 3 + turn 1).
- **Flop → river (two cards):** `1 − [(47−outs)/47 × (46−outs)/46]`.

| Outs | Draw | Flop→turn (1 card, `/47`) | Turn→river (1 card, `/46`) | Rule of 2 | Flop→river (2 cards) | Rule of 4 |
| --- | --- | --- | --- | --- | --- | --- |
| 2 | pair→set | 4.3% | 4.3% | 4% | 8.4% | 8% |
| 4 | gutshot | 8.5% | 8.7% | 8% | **16.5%** | 16% |
| 6 | two overcards | 12.8% | 13.0% | 12% | 24.1% | 24% |
| 8 | OESD | 17.0% | 17.4% | 16% | **31.5%** | 32% |
| 9 | flush draw | **19.1%** | **19.6%** | 18% | **35.0%** | 36% |
| 12 | flush + gutshot | 25.5% | 26.1% | 24% | 45.0% | 48% |
| 15 | flush + OESD | 31.9% | 32.6% | 30% | **54.1%** | 60% |

(Exact values recomputed by hand and matched against thepokerbank percentage chart, deucescracked, pokerology, oddsreference, RiverOdds, Calcipedia.)

### 2.2 Accuracy & caveats (must teach — design doc gets these right)

1. **×4 = all-in equity (assumes you see *both* cards).** The Rule of 4 estimates your chance of hitting *by the river*, which is only guaranteed if you're all-in on the flop. If there's more betting, you may have to pay again on the turn — so for a single call facing more action, your "right now" chance for the next card is the **×2** single-card number, not ×4. (Wikipedia, pokerskill.com, GTO sources all stress this.)
2. **×4 overestimates as outs grow.** For ≲ 8 outs it's within ~1%. From ~9 outs up it drifts high; at 15 outs `15×4 = 60%` vs. the true `54.1%` (≈ 6 points too high). The simple fix used in the design doc and by sources:

   `equity% ≈ (outs × 4) − (outs − 8)`   for outs > 8

   - 9 outs → `36 − 1 = 35%` (exact 35.0% — essentially perfect)
   - 12 outs → `48 − 4 = 44%` (exact 45.0%)
   - 15 outs → `60 − 7 = 53%` (exact 54.1% — within ~1%)

   (Correction formula confirmed by pokercoaching.com and others.)
3. **Rule of 2 slightly *under*-estimates** the single-card chance (e.g. flush 18% vs. exact 19.6% on the turn). Small, and safely conservative for calling decisions.

---

## 3. Pot odds

**Definition.** Pot odds compare **the price of a call** to **the size of the pot you're trying to win**. They tell you the *break-even* win-rate for a call.

**Percentage formula (the one to teach):**

```
required equity to call = call / (pot_after_your_call)
                        = call / (pot_before_call + call)
```

where `pot_before_call` already includes the opponent's bet. (Identical across Wikipedia, Upswing, PokerNews, GTO Wizard, beatthefish, ThinkGTO.)

**Ratio form & conversions.**
- Ratio = `pot_before_call : call` (e.g. `$100 : $20 = 5 : 1`).
- Ratio → % : divide the call side by the sum of both sides, `1 / (5 + 1) = 16.7%`.
- % → ratio : `25% = 1/4 → (4−1):1 = 3:1`.

**Decision rule.** If your **hit probability (equity) ≥ required equity → call** (profitable on direct odds). Otherwise **fold** (ignoring implied odds). (Universal.)

### 3.1 Worked example (matches design doc §3.5)

> Turn is out. You hold a **9-out flush draw** → equity ≈ **19.6%** (`9/46`); Rule of 2 ≈ 18%. Pot is **$80**; opponent bets **$20**, so the pot is now **$100** and it costs **$20** to call.

```
required equity = call / (pot + call) = 20 / (100 + 20) = 20/120 = 16.7%
your equity ≈ 19.6%   →   19.6% > 16.7%   →   CALL (profitable)
```

This is a **quarter-pot bet** ($20 into $80), which is why the required equity lands on **16.7%** (see table). ✅ Verified.

### 3.2 Bet size → required equity for the caller (verified)

Derived from `required = B / (P + 2B)` for a bet `B` into a pot `P`:

| Bet size | Required equity to call |
| --- | --- |
| Quarter pot (`B = P/4`) | **16.7%** (`= 1/6`) |
| Half pot (`B = P/2`) | **25.0%** (`= 1/4`) |
| Two-thirds pot (`B = 2P/3`) | **28.6%** (`= 2/7`) |
| Pot-sized (`B = P`) | **33.3%** (`= 1/3`) |

All four recomputed and confirmed. (Upswing/Wikipedia give the same percentages for the same sizings.)

---

## 4. Equity

**Definition.** Your **equity** is your *share of the pot right now* — the percentage of the time your hand would win if **all remaining cards were dealt out to showdown** (i.e. if everyone were all-in). Formally:

```
equity % = win% + (tie% / 2)
```

If the pot is $100 and your equity is 60%, your "fair share" is $60. (Wikipedia "Pot odds"; GTO Gecko; ThinkGTO; Seeker Start — all agree.)

**Equity vs. EV.** Equity is the *ingredient* (your raw win chance); EV is the *recipe* (combines equity with the pot size, the price, and future betting). You can have > 50% equity and still make a losing call if the price is too high — and < 50% equity calls are routinely profitable when the price is low (e.g. a flush draw at 35% calling a quarter-pot bet that only needs 16.7%).

### 4.1 Rough all-in equities (handy reference, verified)

**Preflop matchups** (approximate, suit-dependent):

| Matchup type | Example | Favorite ≈ | Underdog ≈ |
| --- | --- | --- | --- |
| Pair vs. two lower cards | TT vs. 8♦7♦ | ~80% | ~20% |
| Overpair vs. underpair | QQ vs. 88 | ~80% | ~20% |
| Pair vs. **two overcards** ("coin flip") | JJ vs. AKo | ~57% (pair) | ~43% |
| Pair vs. two overcards (suited) | QQ vs. AKs | ~54% | ~46% |
| Dominated (shared card) | AK vs. AQ | ~70% | ~30% |
| Pair vs. one overcard | 88 vs. A5 | ~70% | ~30% |
| Two overcards vs. two undercards | KQ vs. 87 | ~65% | ~35% |

- The "coin flip" pair-vs-overcards is **rarely an exact 50/50**: the pair is usually a 52–57% favorite because it's already made. The closest-to-even common spot is `22 vs. AKs` (~50/50). (RiverOdds, PokerGods, Seeker Start.)
- `AKs vs. QQ` exact ≈ **AKs 47%, QQ 52%, tie ~1%** — AK is a slight dog, not a true flip. (PokerGods enumeration.)

**Postflop draw vs. made hand:** a flopped flush draw is ~**35%** vs. a made one pair (e.g. top pair `KQ` vs. nut flush draw on `K72ss` ≈ **65/35**). This is the same 9-out, 35%-by-river number from §2. (PokerGods, oddsreference.)

---

## 5. Expected value (EV) of a call

**Formula.**

```
EV(call) = P(win) × (amount won)  −  P(lose) × (amount lost)
```

- `amount won` = the chips already in the pot that you'd scoop (your own call is **not** counted as "won" — you're just getting it back).
- `amount lost` = the chips you put in to call.

**Link to pot odds (why the break-even matches).** Set `EV = 0` and solve for the win rate `Q`:

```
0 = Q·W − (1−Q)·L   →   Q = L / (W + L) = call / (pot + call)
```

i.e. the break-even equity from EV **is exactly the pot-odds requirement**. (Derivation matches GTO Wizard's; same formula in Wikipedia.)

### 5.1 Worked example (matches design doc §3.6)

> Same spot: call **$20**, equity **19.6%**. If you hit you win the **$100** already in the pot; if you miss you lose your **$20**. (Simplifying assumption: this $20 takes you to showdown — no more betting.)

```
EV = 0.196 × (+$100)  −  0.804 × ($20)
   = $19.60          −  $16.08
   = +$3.52     →     profitable call
```

Cross-check with break-even: at the pot-odds threshold 16.7%, `0.167×100 − 0.833×20 ≈ 0`. Since 19.6% > 16.7%, EV is positive. ✅ Arithmetic verified.

---

## 6. Common beginner errors (verified themes)

1. **Counting "dirty" outs as clean outs.** An out that completes your hand but hands your opponent an *even better* hand isn't a real out. Classic: a flush card that also pairs the board (opponent makes a full house), or hitting your straight when a flush is possible. PokerStars Learn's advice: be pessimistic — better to discount one out too many than too few. (PokerStars Learn, pokercoaching, bluffingmonkeys.)
2. **Double-counting in combo draws.** Adding 9 (flush) + 8 (straight) = 17 is wrong; the 2 cards that make *both* are already in the 9, so it's **15**. (pokercoaching, bluffthespot.)
3. **Trusting ×4 with many outs.** With 13–15+ outs the Rule of 4 overshoots badly (15 outs: 60% est. vs. 54% real). Use the `−(outs−8)` correction or the exact table. (irishlucky, pokercoaching.)
4. **Applying ×4 when you'll have to pay again.** ×4 is *all-in* equity. Facing a flop bet with more betting to come, your immediate price should be compared to the **×2** (single-card) number unless you're getting it all-in. (Wikipedia, pokerskill.)
5. **Overestimating implied odds.** Implied odds = extra chips you expect to win on later streets *if* you hit. Beginners assume they'll always get paid; in reality the opponent may check/fold, may not have enough stack, or you may run into **reverse implied odds** (you hit but lose to a bigger hand). (Wikipedia, irishlucky, bluffthespot.)
6. **Counting outs but never comparing to the price.** Outs/equity are only useful *against pot odds*. Knowing "I have 9 outs" means nothing until you check it against what the call costs. (bluffingmonkeys.)
7. **Confusing percentages with ratios** (e.g. thinking 3:1 = 33% instead of 25%). Convert carefully: `ratio a:b → b/(a+b)`. (irishlucky.)
8. **Overvaluing gutshots / overcards.** 4-out gutshots (~16.5% by river) and bare overcards (whose "6 outs" are often dirty) are weak; chasing them at a bad price is a common leak. (bluffthespot, bluffingmonkeys.)

---

## 7. Quick-reference cheat sheet (verified)

- Flush draw = **9** outs; OESD = **8**; gutshot = **4**; overcards = **6**; pair→set = **2**; flush+OESD ≈ **15**.
- Rule of **4 on the flop**, **2 on the turn**; ×4 assumes you see both cards (all-in) and overestimates for ≥ 9 outs — correct with `−(outs−8)`.
- Flush draw equity: **~19.1%** flop→turn, **~19.6%** turn→river, **~35.0%** flop→river. OESD: ~31.5% by river. Gutshot: ~16.5% by river.
- Required equity = `call / (pot + call)`. Pot bet → 33.3%; ⅔ pot → 28.6%; half pot → 25%; quarter pot → 16.7%.
- `EV(call) = P(win)·(won) − P(lose)·(lost)`; call when EV > 0 ⇔ equity > required equity.
- Equity = your share of the pot if all-in = `win% + tie%/2`. Pair vs. two overcards ≈ 55/45 (a "coin flip," but the pair is the favorite).

---

## 8. Per-claim source coverage (≥ 2 each)

- **Outs counts / flush=9 reasoning:** Wikipedia (Pot odds), PokerNews, thepokerbank, pokercoaching, RiverOdds, Calcipedia.
- **Rule of 2 & 4 + caveats:** Wikipedia (Pot odds), pokerskill.com, pokercoaching, RiverOdds, thepokerbank.
- **Exact draw equities table:** thepokerbank (percentage chart), deucescracked, pokerology, oddsreference, RiverOdds, Calcipedia (+ hand recomputation).
- **Big-draw correction `(outs×4)−(outs−8)`:** pokercoaching; consistent with thepokerbank's accuracy deltas.
- **Pot odds formula / conversions / decision:** Wikipedia (Pot odds), Upswing, PokerNews, GTO Wizard, ThinkGTO, beatthefish.
- **Bet-size → required equity:** Upswing, Wikipedia, beatthefish (+ recomputation).
- **Equity definition + preflop matchups:** Wikipedia (Pot odds), GTO Gecko, ThinkGTO, Seeker Start, RiverOdds, PokerGods.
- **EV formula + pot-odds derivation:** GTO Wizard, Wikipedia (Pot odds).
- **Beginner errors / dirty outs / implied odds:** PokerStars Learn, irishlucky, pokercoaching, bluffthespot, bluffingmonkeys, Wikipedia (implied & reverse implied odds).

---

## 9. Discrepancies & corrections vs. `poker-course-design.md`

### Issue A — §3.4 table: "Exact 1-card" column mixes streets (Lesson 4, **minor / clarity**)

The §3.4 table column header reads **"Rule of 2 (turn)"** next to **"Exact 1-card,"** but the exact values listed are the **flop→turn** numbers (`/47`): `8.5% (4/47)`, `17.0% (8/47)`, `19.1% (9/47)`, `31.9% (15/47)`.

- The Rule of 2 is taught as a **turn** tool (one card to come = the river), whose exact values use `/46`: **gutshot 8.7%, OESD 17.4%, flush 19.6%, 15-out 32.6%.**
- Indeed, the doc's **own worked examples** in §3.5 and §3.6 correctly use **19.6% (`9/46`)** for the flush draw on the turn — which is mildly inconsistent with the **19.1% (`9/47`)** shown in the §3.4 table for the "same" draw.
- **Each number is individually correct;** this is only a labeling/alignment nit.
- **Recommended fix:** either (a) relabel the column "Exact (flop→turn, `/47`)", or (b) add a `turn→river (/46)` column, and note that the Rule of 2 on the turn corresponds to the `/46` value. The doc's footnote already explains both denominators, so a one-word header tweak resolves it.

> Bonus validation: the design doc's gutshot **16.5%** (exact, `1−(43/47)(42/46)`) is actually **more precise** than Wikipedia's "actual equity of 17.2%," which uses the simple addition law `4/47 + 4/46` and slightly **over**counts (it doesn't subtract the small both-streets overlap). Keep the doc's 16.5%.

### Issue B — §3.2 note: 7-card "full house vs flush" is **reversed** (Lesson 2, **out of scope but factually wrong**)

The §3.2 accuracy note states: *"in 7-card play a full house is actually more common than a flush."* Per Wikipedia's exact **7-card** frequencies (`C(52,7) = 133,784,560`):

- **Full house:** 3,473,184 hands (**2.60%**)
- **Flush:** 4,047,644 hands (**3.03%**)

So a **flush is more common than a full house** in 7-card poker — the **opposite** of what the doc says. Note this still means a full house remains **rarer** than a flush (2.60% < 3.03%), which is *consistent* with the ranking (full house outranks flush). The doc's intended teaching point ("rarer = stronger, and 7-card absolute frequencies can differ from 5-card") is fine; only the specific flush/full-house example is inverted.

- **Recommended fix:** delete or correct the parenthetical. A genuinely correct 5-card→7-card illustration to use instead: in **7-card** hands, **no-pair/high-card (17.4%) becomes *rarer* than both one pair (43.8%) and two pair (23.5%)** — even though high card is the single most common *5-card* result (50.1%). That inversion is real and citable (Wikipedia's 7-card table). (Flush has always been more common than a full house — in 5-card too: 0.197% vs. 0.144% — so it was never an inversion.)
- **Impact on Lesson 4:** none. Flagged only because the task asked to verify all encoded math facts.

---

## 10. Sources (URLs)

**Primary / encyclopedic**
- Wikipedia — *Pot odds*: https://en.wikipedia.org/wiki/Pot_odds
- Wikipedia — *Poker probability* (5- & 7-card frequencies): https://en.wikipedia.org/wiki/Poker_probability

**Pot odds / Rule of 2 & 4 / EV**
- Upswing Poker — *How to Calculate Pot Odds (step by step)*: https://upswingpoker.com/pot-odds-step-by-step/
- PokerNews — *How to Calculate Pot Odds (with GTO Wizard)*: https://www.pokernews.com/strategy/how-to-calculate-pot-odds-42847.htm
- GTO Wizard — *What are Pot Odds in poker?* (EV derivation): https://blog.gtowizard.com/what-are-pot-odds-in-poker/
- ThinkGTO — *Pot Odds, Equity & Expected Value Explained*: https://thinkgto.com/blog/pot-odds-equity-expected-value-explained
- beatthefish — *Pot Odds Made Simple*: https://beatthefish.com/poker/strategy/pot-odds/
- thepokerbank — *The Rule of 4 and 2* (accuracy tables): https://www.thepokerbank.com/strategy/mathematics/pot-odds/4-2/
- thepokerbank — *Percentage Odds Chart*: https://www.thepokerbank.com/tools/odds-charts/percentage/
- pokercoaching.com — *How to Count Poker Outs (Rule of 2 and 4)*: https://pokercoaching.com/blog/outs-in-poker/
- pokerskill.com — *Rule of 2 and 4*: https://www.pokerskill.com/poker-glossary/rule-of-2-and-4/

**Draw equity charts / outs**
- DeucesCracked — *Poker Odds & Outs*: https://www.deucescracked.com/learn/odds-and-outs
- pokerology — *Poker Probability and Hand Odds*: https://www.pokerology.com/poker/math/probability/
- oddsreference — *Poker Outs Calculator*: https://oddsreference.com/poker/tools/poker-outs-calculator
- RiverOdds — *Flush Draw Odds*: https://riverodds.app/flush-draw-odds/
- RiverOdds — *How to Calculate Poker Odds*: https://riverodds.app/how-to-calculate-poker-odds/
- Calcipedia — *Poker Odds Calculator*: https://www.calcipedia.org/calculators/poker-odds-calculator/

**Equity / preflop matchups**
- GTO Gecko — *Poker Equity Explained*: https://gtogecko.com/blog/poker-equity-explained
- Seeker Start — *What Is Equity in Poker?*: https://www.seekerstart.com/en/learn/intermediate/equity-basics
- RiverOdds — *Coin Flip Poker Odds*: https://riverodds.app/coin-flip-poker-odds/
- PokerGods — *Hold'em Odds Calculator* (AKs vs QQ enumeration): https://pokergods.com/calculators/holdem-odds-calculator/

**Beginner errors / dirty outs / implied odds**
- PokerStars Learn — *Miscalculating outs*: https://www.pokerstars.com/poker/learn/lesson/miscalculating-outs/
- irishlucky — *Common Mistakes Using Poker Odds*: https://irishlucky.com/poker/math/common-mistakes-using-odds/
- bluffthespot — *Mastering Poker Odds and Outs*: https://www.bluffthespot.com/blog/mastering-poker-odds-and-outs-a-guide-to-making-better-decisions
- bluffingmonkeys — *How to Count Outs in Poker*: https://bluffingmonkeys.com/how-to-count-outs-in-poker/
