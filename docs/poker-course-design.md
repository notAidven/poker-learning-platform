# Design Doc: Texas Hold'em Poker Course Revamp

**Status:** Proposed (planning only — no code written)
**Scope:** Replace the 6 probability lessons with 6 Texas Hold'em poker lessons, reusing the existing lesson engine, skill-check flow, gamification, and card widgets.
**Audience for this doc:** implementation agents and content authors. The "Poker content reference" section is the **source of truth** for poker correctness.

---

## 1. Overview & goals

### What we are building

A learn-by-doing **Texas Hold'em** course that takes a complete beginner from "what is a deck of cards" to **playing a full hand against AI opponents** — preflop → flop → turn → river → showdown → award the pot — with the light poker math (outs, rule of 2 & 4, pot odds, simple EV) needed to make real decisions.

The course keeps the existing app's identity: 6 sequential lessons, each a sequence of `concept` and `problem` steps, each gated by a 3-question skill check, with XP / streaks / levels and sequential unlock. **Only the content and the card-specific interactions change.**

### Audience

College students and other complete beginners. No prior poker knowledge assumed. Design rules (carried from the PRD and tightened for this audience):

- **Define every term in plain language before it is used.** "Pot," "blind," "out," "equity," "position" — each gets a one-line plain definition in a micro-concept or inside the problem prompt immediately before its first use.
- **One new idea per concept step** (≤ 120 words, never two concept steps in a row).
- **≥ 75% of steps are interactive `problem` steps.**
- **No forward references** — a lesson never relies on a concept introduced in a later lesson. The ordering below is built so each idea is fully grounded before it is used.

### What a learner can do by the end

| Lesson | After it, the learner can… |
| --- | --- |
| 1 | Name the 52 cards (ranks & suits) and state the goal of poker (best 5-card hand wins the pot); explain Hold'em's 2 hole + 5 community = best 5 of 7. |
| 2 | Rank any hand into the 10 categories, explain why rarer = stronger, and decide which of two hands wins (incl. kickers). |
| 3 | Walk through a full hand's structure: blinds, hole cards, the four streets, position, action order, and showdown. |
| 4 | Count outs, convert outs → hit probability with the rule of 2 & 4, compute pot odds, and make a call/fold decision. |
| 5 | Use check / bet / call / raise / fold correctly, size a bet as a fraction of the pot, and evaluate the EV of a call. |
| 6 | **Play a complete hand** vs. multiple AI opponents with betting on every street, reach showdown, and award the pot; apply starting-hand intuition. |

### No real money (responsible-play note)

The app never involves real money, wagering, or links to gambling sites. All chips are play-money learning tokens. **Lesson 6 ends with a brief, non-preachy note** (2–3 sentences) framing this as a skill/odds game, reminding the learner that real-money gambling carries financial risk and the house/rake means most players lose over time, and pointing to help resources in one neutral line. Tone: matter-of-fact, not moralizing.

---

## 2. How this fits the existing system (engine recap)

These pieces already exist and are **reused unchanged**. New work plugs into them through the same contracts.

- **Step model** (`web/src/types/lesson.ts`): a `LessonDefinition` is `{ id, title, steps: LessonStep[] }`. `LessonStep = ConceptStep | ProblemStep`. `ProblemStep` is a **discriminated union** keyed by `interaction` (e.g. `'card-deck'`, `'compare-events'`), each variant pairing a `config` and an `answer` on top of `ProblemStepBase` (`{ type:'problem', id, prompt, feedback }`).
- **Feedback** (`ProblemFeedback`): `{ correct, incorrect, hints[], why?, venn? }`. Markdown + KaTeX rendered by `MathContent`. The "Why?" button shows `feedback.why`.
- **Dispatch** (`web/src/components/lesson/InteractionRenderer.tsx`): a `switch (step.interaction)` lazy-loads and renders the matching component, passing `config`, `answer`, and the shared `InteractionProps`.
- **Interaction contract** (`web/src/components/lesson/interactions/types.ts`): `{ onCorrect, onIncorrect?, onAttemptReset?, disabled?, initialSolved?, allowRetry? }`. A widget calls **`onCorrect()` exactly when** the learner's submission matches `answer`; `onIncorrect()` otherwise. `CheckPanel` renders the Check / Try again button.
- **Answer helpers**: `NumericAnswerInput` + `numericAnswer.ts` (`countMatches`, `percentMatches` with tolerance), `FractionAnswerInput` + `fractionAnswer.ts` (`fractionMatches`, `reduceFraction`).
- **Skill checks** (`web/src/types/skillCheck.ts`): `SkillCheckQuestion = Omit<ProblemStep,'type'|'feedback'> & { incorrectFeedback? }`. A skill check is 3 questions; `SkillCheckPlayer` enforces **pass = ≥ 2/3** (`isSkillCheckPassing`, `SKILL_CHECK_PASS_RATIO = 2/3`), free retries, no hints.
- **Gamification / progress** (`lib/gamification.ts`, `lib/lessonProgress*.ts`): XP (100 base + first-try bonus), streaks, levels, sequential unlock (lesson N needs N−1 completed). **Lesson IDs stay `'1'`–`'6'`**, so routing, unlock, progress, and Firestore sync carry over with zero changes.
- **Registries**: `data/lessonContent.ts` and `data/skillCheckContent.ts` map id → lazy import. Keeping ids `'1'`–`'6'` means these files barely change (same keys, new modules).
- **Card primitives already in `types/lesson.ts`**: `CardId` (`` `${rank}${suit}` ``, e.g. `"AS"`, `"10H"`, `"KD"`), `CardSuit`, `CardRank`, `fullDeck()`, `cardsBySuit()`, `cardsByRank()`, `parseCardId()`, `cardLabel()`. **Reused as the foundation of all poker card handling.** Note: the ten is the string `'10'` (not `'T'`).

---

## 3. Poker content reference — **VERIFY CORRECTNESS** (source of truth)

> Content authors: copy numbers from here. All figures below were verified against standard combinatorics and current poker references.

### 3.1 The deck

A standard deck is **52 cards** = 13 ranks × 4 suits. Ranks low→high: **2,3,4,5,6,7,8,9,10,J,Q,K,A**. Suits (no rank in poker): ♠ spades, ♥ hearts, ♦ diamonds, ♣ clubs. The Ace is usually high but can act **low** in the straight A-2-3-4-5.

In Texas Hold'em each player gets **2 private "hole" cards**; **5 community cards** are shared. Your hand is the **best 5-card combination out of those 7 cards** (your 2 + the 5 community). The best 5-card hand at showdown wins the **pot** (all the chips wagered).

### 3.2 Hand rankings (strongest → weakest) with tie-breakers

Ranking is a **fixed rule** based on rarity: the rarer the hand, the stronger. Tie-breakers use **kickers** — cards in your 5-card hand that are not part of the main combination, compared high-to-low. **Suits never break ties**; identical 5-card hands split the pot.

| # | Category | Definition | Tie-breaker (in order) |
| --- | --- | --- | --- |
| 1 | **Royal flush** | A-K-Q-J-10 all one suit | None (only split possible) |
| 2 | **Straight flush** | 5 consecutive ranks, same suit | Highest top card (A-2-3-4-5 is the lowest, "the wheel," = 5-high) |
| 3 | **Four of a kind (quads)** | 4 cards of one rank + 1 kicker | Rank of the quads, then the kicker |
| 4 | **Full house** | 3 of a kind + a pair | Rank of the trips, then rank of the pair |
| 5 | **Flush** | 5 cards same suit, not consecutive | Highest card, then 2nd, 3rd, 4th, 5th |
| 6 | **Straight** | 5 consecutive ranks, mixed suits | Highest top card (Ace high *or* low; no "wrap" like K-A-2-3-4) |
| 7 | **Three of a kind (trips/set)** | 3 of one rank + 2 kickers | Rank of the trips, then kickers high→low |
| 8 | **Two pair** | 2 pairs + 1 kicker | Higher pair, then lower pair, then kicker |
| 9 | **One pair** | 1 pair + 3 kickers | Pair rank, then 3 kickers high→low |
| 10 | **High card** | none of the above | Highest card, then next, … (all 5) |

**Rarity check (5-card hands dealt from 52; total = 2,598,960):** these illustrate *why* the order is what it is.

| Category | # of 5-card hands | Approx. probability |
| --- | --- | --- |
| Royal flush | 4 | 0.000154% |
| Straight flush (excl. royal) | 36 | 0.00139% |
| Four of a kind | 624 | 0.0240% |
| Full house | 3,744 | 0.144% |
| Flush (excl. str. flush) | 5,108 | 0.197% |
| Straight (excl. str. flush) | 10,200 | 0.392% |
| Three of a kind | 54,912 | 2.11% |
| Two pair | 123,552 | 4.75% |
| One pair | 1,098,240 | 42.3% |
| High card | 1,302,540 | 50.1% |

> Accuracy note for authors: the **ranking order is a rule** and never changes. The table above is the canonical *5-card-dealt* frequency (sums exactly to 2,598,960). With 7 cards the absolute frequencies differ (e.g., in 7-card play a full house is actually more common than a flush), but the **rules still rank flush above straight, full house above flush, etc.** Teach the order as a rule; use the 5-card table only to motivate "rarer = stronger."

### 3.3 Evaluating the best 5 of 7

Given 7 cards (2 hole + 5 community), the player's hand is the **highest-ranking 5-card subset**. There are C(7,5) = **21** possible 5-card subsets. Evaluate each, keep the maximum under the ranking + tie-break order. (Algorithm & data structures in §5.1.)

**Worked example.** Hole `A♠ K♠`, board `Q♠ J♠ 9♦ 4♥ 2♣` → 7 cards: `A♠ K♠ Q♠ J♠ 9♦ 4♥ 2♣`.
- **Flush?** Spades present = A♠ K♠ Q♠ J♠ → only **4** spades, need 5 → no flush.
- **Straight?** Ranks present = A, K, Q, J, 9, 4, 2 → run A-K-Q-J then a gap at 10 → no straight (no wrap).
- **Pairs/trips?** All seven ranks are distinct → no pair.
- **Result: high card**, best five = **A-K-Q-J-9**.

This case is reused as an evaluator **test case** in §9 so authors and code agree.

### 3.4 Outs, hit probability, and the Rule of 2 & 4

- **Out:** an unseen card that improves your hand to a likely winner.
- **Rule of 4** (on the **flop**, two cards to come): equity % ≈ **outs × 4**.
- **Rule of 2** (on the **turn**, one card to come): equity % ≈ **outs × 2**.

**Caveats (must teach so learners aren't misled):**
1. The **×4 (flop)** estimate assumes you'll see **both** the turn and river — i.e., it's your all-in equity. If there's more betting to come, you might have to pay again on the turn, so for a single call facing more action, your true "right now" chance is the **×2** single-card number.
2. **×4 overestimates** as outs grow (≥ ~9 outs). Correction for big draws: `equity% ≈ (outs × 4) − (outs − 8)` for outs > 8 (within ~1% of exact).

**Outs → equity reference (verified):**

| Draw | Outs | Rule of 2 (turn) | Exact 1-card | Rule of 4 (flop→river) | Exact 2-card |
| --- | --- | --- | --- | --- | --- |
| Gutshot straight | 4 | 8% | 8.5% (4/47) | 16% | 16.5% |
| Open-ended straight | 8 | 16% | 17.0% (8/47) | 32% | 31.5% |
| Flush draw | 9 | 18% | **19.1% (9/47)** | 36% | **35.0%** |
| Flush + OESD (combo) | 15 | 30% | 31.9% | 60% (corrected ≈ 53–54%) | 54.1% |

> Denominators: after the flop you've seen 5 cards → **47 unseen**, so one card to come = outs/47 (flush draw 9/47 = 19.1%). After the turn you've seen 6 cards → **46 unseen**, so turn→river = outs/46 (flush 9/46 ≈ 19.6%). Two cards from the flop: `1 − (38/47)(37/46) = 34.97%`. A flush draw is **9 outs** because a suit has 13 cards and you can see 4 of them (2 in hand + 2 on board) → 13 − 4 = 9.

### 3.5 Pot odds (formula + worked example)

**Pot odds** compare the price of a call to what you can win.

- **Required equity to call** = `call ÷ (pot_after_your_call)` = `call ÷ (pot_before_call + call)`, where `pot_before_call` already includes the opponent's bet.
- Equivalent ratio form: `(pot_before_call) : (call)`. (e.g. $100 : $20 = 5:1.)
- **Decision rule:** if your **hit probability (equity) ≥ required equity → call** (profitable); otherwise **fold** (ignoring implied odds).

**Worked example (call):** Turn is out; you hold a **9-out flush draw** (equity ≈ 19.6%; Rule of 2 ≈ 18%). Pot is **$80**, opponent bets **$20**, so the pot is now **$100** and it costs you **$20** to call.

```
required equity = call / (pot + call) = 20 / (100 + 20) = 20/120 = 16.7%
your equity ≈ 18–19.6%   →   19.6% > 16.7%   →   CALL (profitable)
```

**Bet size → required equity for the caller** (handy reference; derived from the formula above with bet `B` into pot `P`, required = `B/(P+2B)`):

| Bet size | Required equity to call |
| --- | --- |
| Quarter pot (B = P/4) | 16.7% |
| Half pot (B = P/2) | 25.0% |
| Two-thirds pot | 28.6% |
| Pot-sized (B = P) | 33.3% |

### 3.6 EV of a call (simple example)

**Expected value (EV)** of a call = `P(win) × (amount won) − P(lose) × (amount lost)`.

Using the same spot (call $20, equity 19.6%; if you hit you win the $100 already in the pot, if you miss you lose your $20; simplifying assumption: this $20 takes you to showdown):

```
EV = 0.196 × (+$100)  −  0.804 × ($20)
   = $19.60  −  $16.08
   = +$3.52   →   profitable call
```

This ties back to pot odds: break-even equity = 16.7%; since 19.6% > 16.7%, EV is positive.

### 3.7 Betting actions

| Action | Meaning | When available |
| --- | --- | --- |
| **Check** | Pass action, bet nothing | Only when there is no bet to you |
| **Bet** | Put the first chips in this round | When no one has bet yet this round |
| **Call** | Match the current bet | When facing a bet |
| **Raise** | Increase the current bet (no-limit min-raise = at least the size of the last bet/raise) | When facing a bet |
| **Fold** | Give up the hand, forfeit the pot | Any time facing a bet |

A betting round **ends** when every still-active player has either matched the largest bet or folded (or everyone checked). Folding when you could check for free is always a mistake (you can see the next card for nothing).

### 3.8 Flow of a hand (one full Hold'em hand)

1. **Blinds (forced bets).** The **button** (dealer) marks position; the player to its left posts the **small blind (SB)**, next the **big blind (BB)**. Blinds seed the pot before any cards.
2. **Hole cards.** Each player is dealt **2 face-down** cards.
3. **Preflop betting.** Action starts **left of the BB** ("under the gun") and goes clockwise; the **BB acts last** and may check if no one raised.
4. **Flop.** **3 community cards** face up; betting round. Postflop, action starts with the **first active player left of the button** (SB first); the **button acts last** (positional advantage).
5. **Turn.** **4th community card**; betting round.
6. **River.** **5th community card**; final betting round.
7. **Showdown.** If ≥ 2 players remain, hands are revealed; **best 5-card hand wins the pot**. Ties split ("chop"). If everyone folds to one player earlier, that player wins without showing.

**Position matters:** acting **later** (closer to the button) is an advantage because you see opponents' actions first. This is introduced concretely in Lesson 3 and used in Lessons 5–6.

---

## 4. Reuse map — carry over vs. new

### Carries over **unchanged** (do not touch)

| Area | Files |
| --- | --- |
| Lesson engine | `LessonPlayer.tsx`, `ProblemStepView.tsx`, `ConceptStepView.tsx`, `LessonProgressBar.tsx`, `MathContent.tsx`, `WhyExplanationModal.tsx`, `LessonCompleteModal.tsx` |
| Skill-check flow | `SkillCheckPlayer.tsx`, `SkillCheckStepView.tsx`, `types/skillCheck.ts` |
| Interaction infra | `InteractionRenderer.tsx` (extended, not rewritten), `interactions/types.ts`, `CheckPanel.tsx`, `NumericAnswerInput.tsx`, `numericAnswer.ts`, `FractionAnswerInput.tsx`, `fractionAnswer.ts`, `usePrefersReducedMotion.ts` |
| Card primitives | `CardId`/`CardSuit`/`CardRank`, `fullDeck`, `cardsBySuit`, `cardsByRank`, `parseCardId`, `cardLabel`, `isRedSuit` in `types/lesson.ts` |
| Reused card widgets | **`CardDeck.tsx`** (both `select-all` and `draw-tally` modes), **`CompareEvents.tsx`** (generic two-option comparator) |
| Gamification & progress | `gamification.ts`, `lessonProgress.ts`, `lessonProgressStore.ts`, `lessonProgressFirestore.ts`, `gamificationFirestore.ts`, `progressSync.ts`, `lessonSession.ts` |
| Auth / routing / shell | `AuthContext.tsx`, `ProtectedRoute.tsx`, `App.tsx`, pages, `firebase.ts`, course-path UI |

### Reused **with light reconfiguration** (no code change, just new content)

- **`card-deck` (`select-all`)** — "tap all the cards that make a flush," "tap the two hole cards," "select the 5 cards of a straight."
- **`card-deck` (`draw-tally`)** — Lesson 4 empirical convergence: draw repeatedly to watch a draw's hit-rate approach the theoretical equity (e.g. tally "is the next card a heart" to ground a flush draw's ~19% / ~25% feel). Tie-in noted in §5.4.
- **`compare-events`** — "which hand is more likely to be ahead?" / "which event is rarer: flush or straight?" using `label`/`detail`/`favorable`/`total`. Good for the lightweight "which wins" without bespoke card art.

### **New** (built for poker)

| New piece | Kind | Used by |
| --- | --- | --- |
| `lib/poker/handEvaluator.ts` (+ `types/poker.ts`) | Pure core module | Lessons 2–6, several interactions |
| `lib/poker/opponentAI.ts` | Pure core module | Lessons 5–6 |
| `hand-ranker` | Interaction | L2 (also L1 light) |
| `board-dealer` | Interaction | L3 (also L1, L6) |
| `outs-odds` | Interaction | L4 |
| `betting-round` | Interaction | L5 |
| `full-hand` | Interaction | L6 capstone |

---

## 5. New interaction components — detailed specs

All `config`/`answer` shapes below follow the existing discriminated-union convention: add each `*Step` to the `ProblemStep` union (§7), add a `case` to `InteractionRenderer`, and build the component against `InteractionProps`, calling `onCorrect()` only when the submission matches `answer`.

> **Shared domain types** (proposed `web/src/types/poker.ts`), reusing `CardId` from `types/lesson.ts`:

```ts
import type { CardId } from './lesson'

/** Numeric rank value for comparisons: 2–10 face value, J=11, Q=12, K=13, A=14 (Ace also 1 for the wheel). */
export type RankValue = number

export type HandCategory =
  | 'high-card' | 'pair' | 'two-pair' | 'trips' | 'straight'
  | 'flush' | 'full-house' | 'quads' | 'straight-flush' | 'royal-flush'

/** 1 = high-card … 10 = royal-flush. Higher beats lower. */
export const HAND_CATEGORY_RANK: Record<HandCategory, number> = {
  'high-card': 1, 'pair': 2, 'two-pair': 3, 'trips': 4, 'straight': 5,
  'flush': 6, 'full-house': 7, 'quads': 8, 'straight-flush': 9, 'royal-flush': 10,
}

export type EvaluatedHand = {
  category: HandCategory
  /** The exact 5 cards that make the hand. */
  cards: CardId[]
  /**
   * Lexicographic tiebreak vector, high→low, already category-aware:
   * e.g. full house [tripRank, pairRank]; two pair [hiPair, loPair, kicker];
   * flush/high-card = 5 ranks desc; straight = [topRank] (wheel topRank = 5).
   */
  tiebreak: RankValue[]
  /** Precomputed comparable score = [categoryRank, ...tiebreak]; compare arrays elementwise. */
  score: number[]
  /** Human label, e.g. "Flush, Ace-high" or "Two pair, Kings and Sevens". */
  label: string
}
```

### 5.1 Core: poker hand evaluator / comparator (`lib/poker/handEvaluator.ts`)

The backbone reused by Lessons 2–6. **Pure functions, no React** → trivially unit-testable.

**Public API (proposed):**

```ts
import type { CardId } from '../../types/lesson'
import type { EvaluatedHand, HandCategory, RankValue } from '../../types/poker'

/** Evaluate exactly 5 cards into a category + tiebreak + label. */
export function evaluateFive(cards: CardId[]): EvaluatedHand

/** Best 5-card hand among 5, 6, or 7 cards (tries all C(n,5) subsets). */
export function evaluateBest(cards: CardId[]): EvaluatedHand

/** Compare two evaluated hands: >0 a wins, <0 b wins, 0 exact tie (split pot). */
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number

/** Convenience: best hand from 2 hole + up to 5 board cards. */
export function evaluateHoldem(hole: [CardId, CardId], board: CardId[]): EvaluatedHand

/** Outs helpers for Lesson 4 (see §5.4). */
export function rankValue(card: CardId): RankValue          // A=14 etc.
export function countOuts(hole: [CardId, CardId], board: CardId[], madeTarget?: HandCategory): { outs: CardId[]; count: number }
```

**Algorithm for `evaluateFive`:**
1. Parse each card via `parseCardId`; map rank → `RankValue` (A=14).
2. Build a **rank-count histogram** (`Map<RankValue, count>`) and a **suit-count histogram**.
3. `isFlush` = some suit has 5. `isStraight` = 5 distinct consecutive values **or** the wheel `{14,5,4,3,2}` (Ace counts as 1, top card = 5).
4. Determine category from `(isFlush, isStraight, sorted count multiset)`:
   - straight-flush (royal if top = Ace) > quads `[4,1]` > full house `[3,2]` > flush > straight > trips `[3,1,1]` > two-pair `[2,2,1]` > pair `[2,1,1,1]` > high-card.
5. Build `tiebreak` per the table in §3.2 (group by count desc, then rank desc; wheel uses top = 5).
6. `score = [HAND_CATEGORY_RANK[category], ...tiebreak]`.

**`evaluateBest`:** enumerate `C(n,5)` subsets (max 21 for 7 cards), `evaluateFive` each, keep max by `compareHands`. (Clarity over micro-optimization; 21 evaluations is instant. A histogram-based single-pass evaluator is a later optimization if needed.)

**`compareHands`:** compare `score` arrays element by element; first difference decides; fully equal → `0` (tie/split). Suits are never compared.

### 5.2 `hand-ranker`

Identify a hand's category, order hands/categories, or build a target hand. Reuses `evaluateBest` for validation.

```ts
export type HandRankerMode =
  | 'identify-category'   // show 5–7 cards → pick the category
  | 'order-categories'    // arrange category chips strongest→weakest
  | 'order-hands'         // arrange N concrete hands strongest→weakest
  | 'build-hand'          // pick 5 cards from a deck to make a target category
  | 'pick-best-five'      // from 7 cards, tap the 5 that form the best hand

export type HandRankerConfig = {
  mode: HandRankerMode
  /** identify-category / pick-best-five: the cards shown. */
  cards?: CardId[]
  /** order-categories: the category chips to arrange (subset of the 10). */
  categories?: HandCategory[]
  /** order-hands: each "hand" is a labeled set of 5 cards. */
  hands?: { id: string; cards: CardId[] }[]
  /** build-hand: which category to build, plus the deck/area to pick from. */
  targetCategory?: HandCategory
  /** build-hand: optional fixed pool to pick from (defaults to fullDeck()). */
  pool?: CardId[]
  helperText?: string
}

export type HandRankerAnswer = {
  /** identify-category / build-hand target. */
  category?: HandCategory
  /** order-categories: correct order strongest→weakest. */
  categoryOrder?: HandCategory[]
  /** order-hands: correct order of hand ids strongest→weakest (ties allowed via equal groups). */
  handOrder?: string[]
  /** build-hand / pick-best-five: the exact 5 cards (validated by category, not identity, for build-hand). */
  cards?: CardId[]
}
```

**Validation:** `identify-category` → learner's pick equals `answer.category` (cross-check by running `evaluateBest(config.cards)`). `order-*` → submitted order matches (for `order-hands`, compare via `compareHands` so any correct ordering of tied hands passes). `build-hand` → `evaluateBest(selected).category === targetCategory` (any valid example accepted). `pick-best-five` → `compareHands(evaluateFive(selected), evaluateBest(config.cards)) === 0`. Mobile: prefer **tap-to-sequence** (tap chips in order) over drag for ordering, with up/down reordering as fallback.

### 5.3 `board-dealer`

Deal hole + community cards street by street and (optionally) ask for the best current hand. Teaches the streets and "your hand can change as cards come."

```ts
export type BoardDealerConfig = {
  /** Fixed hole cards, or 'random' to deal from a shuffled deck (seedable). */
  hole?: [CardId, CardId] | 'random'
  /** Fixed full board (5), or deal street-by-street from the deck. */
  board?: CardId[] | 'deal'
  seed?: number                       // reproducible deals for testing
  /** Number of opponents to deal (cards shown face-down unless revealAtShowdown). */
  opponents?: number
  /** Which streets to step through. */
  streets?: ('preflop' | 'flop' | 'turn' | 'river')[]
  /** Ask the learner to name their best hand at each street where this is set. */
  askBestHandAt?: ('preflop' | 'flop' | 'turn' | 'river')[]
  /** Label each street with its name as it's revealed (default true). */
  annotateStreets?: boolean
  helperText?: string
}

export type BoardDealerAnswer = {
  /** Expected best-hand category at each asked street (validated against evaluateHoldem). */
  bestHandByStreet?: Partial<Record<'preflop'|'flop'|'turn'|'river', HandCategory>>
  /** Minimum streets the learner must reveal before Check unlocks (experiential gate). */
  minStreetsRevealed?: number
}
```

**Behavior:** "Deal flop / turn / river" buttons reveal cards with the existing card deal/flip animation (mirror `CardDeck`'s CSS). When `askBestHandAt` includes a street, show a category picker; validate against `evaluateHoldem(hole, boardSoFar)`. Pure experiential variants (L1) just require revealing all streets (`minStreetsRevealed`) — same pattern as `CardDeck` `draw-tally`'s `minDraws` gate.

### 5.4 `outs-odds`

Count outs, convert to hit probability (rule of 2 & 4), compute pot odds, decide call/fold. Reuses `NumericAnswerInput`/`percentMatches` and the `compare`/choice UI.

```ts
export type OutsOddsConfig = {
  hole: [CardId, CardId]
  board: CardId[]                     // 3 (flop) or 4 (turn) cards
  /** The draw the learner is chasing, for hinting + out highlighting. */
  drawLabel: string                   // e.g. "a flush"
  street: 'flop' | 'turn'             // selects ×4 vs ×2
  /** Which sub-questions to ask (in this order). */
  ask: ('outs' | 'equity' | 'potOdds' | 'decision')[]
  /** Pot situation for potOdds/decision. */
  pot?: number
  betToCall?: number
  /** Optional draw-tally tie-in: render a CardDeck draw-tally below to build empirical feel. */
  empiricalTieIn?: boolean
  helperText?: string
}

export type OutsOddsAnswer = {
  outs?: number                                   // exact integer (countMatches)
  /** Rule-of-2/4 estimate; validated with percentMatches tolerance (default ±2–3%). */
  equityPercent?: number
  equityTolerance?: number
  /** required equity = betToCall/(pot+betToCall), as a percent (tolerance applies). */
  potOddsPercent?: number
  decision?: 'call' | 'fold'                      // correct = (equity ≥ requiredEquity)
}
```

**Validation:** `outs` via `countMatches` (cross-check with `countOuts`). `equityPercent` via `percentMatches` with a generous tolerance because the rule is an estimate (teach the rule, accept the estimate band). `potOddsPercent` via `percentMatches` on `betToCall/(pot+betToCall)×100`. `decision` correct when sign of `(equity − requiredEquity)` matches. `empiricalTieIn` renders a `CardDeck` `draw-tally` (target = the suit/cards that complete the draw) so the learner sees the empirical frequency settle toward the equity — directly reusing existing convergence UX.

### 5.5 `betting-round`

A single street of betting vs. one AI: choose an action (and size), see the opponent respond, watch the pot grow. Teaches actions, sizing, and the EV of a call.

```ts
export type BettingAction = 'check' | 'bet' | 'call' | 'raise' | 'fold'

export type BettingRoundConfig = {
  hole: [CardId, CardId]
  board: CardId[]
  street: 'preflop' | 'flop' | 'turn' | 'river'
  pot: number
  heroStack: number
  villainStack: number
  /** Bet/raise sizes offered as fractions of the pot (e.g. [0.5, 0.75, 1]). */
  sizingOptions?: number[]
  /** What the learner faces: nothing (can check/bet) or an existing bet (call/raise/fold). */
  facing?: { action: 'bet' | 'raise'; amount: number }
  /** AI tier controlling the villain's response (see §5.6). */
  aiTier?: 1 | 2 | 3
  seed?: number
  /** Sub-question to validate completion. */
  task: 'choose-action' | 'choose-size' | 'ev-of-call'
  helperText?: string
}

export type BettingRoundAnswer = {
  /** choose-action: the +EV / correct action. */
  action?: BettingAction
  /** choose-size: target fraction of pot (percentMatches-style tolerance on resulting $). */
  sizeFraction?: number
  sizeTolerance?: number
  /** ev-of-call: expected EV in chips (percentMatches with tolerance), plus its sign decides call/fold. */
  evChips?: number
  evTolerance?: number
}
```

**Validation:** `choose-action` → matches `answer.action` (the action whose EV is highest given the spot; computed from `evaluateBest` + pot odds). `choose-size` → chosen fraction within tolerance of `answer.sizeFraction`. `ev-of-call` → entered EV within tolerance (reuse `percentMatches` against `evChips`). The villain's reaction is rendered for feedback but the *correctness* is the learner's decision vs. the authored answer.

### 5.6 `full-hand` (capstone) + opponent AI

Play a complete hand vs. **multiple** AI opponents: blinds posted, hole cards dealt, bet on every street, showdown, award pot. Because the engine needs a binary correct/incorrect, the capstone uses **decision checkpoints**: at authored decision points the learner must choose within the acceptable set; `onCorrect()` fires when the hand completes **and** the learner met the checkpoint threshold (e.g., ≥ 3 of 4 good decisions). Free retries via the standard `allowRetry`.

```ts
export type FullHandConfig = {
  opponents: number                   // 1 (heads-up) … 3 (multiway)
  aiTier: 1 | 2 | 3
  heroHole?: [CardId, CardId] | 'random'
  seed?: number                       // reproducible hand for authoring/testing
  blinds: { sb: number; bb: number }
  startingStack: number
  /** Authored decision checkpoints the learner must pass. */
  checkpoints: {
    street: 'preflop' | 'flop' | 'turn' | 'river'
    prompt: string
    acceptableActions: BettingAction[]   // any of these counts as correct
    why?: string                          // feeds the "Why?" explanation
  }[]
  /** Minimum checkpoints passed to count the capstone solved (default = all but one). */
  passThreshold?: number
  /** Show the responsible-play note on completion (Lesson 6 only). */
  showResponsiblePlayNote?: boolean
}

export type FullHandAnswer = {
  /** Mirror of checkpoint expectations; the component enforces passThreshold. */
  passThreshold: number
}
```

**Opponent AI (`lib/poker/opponentAI.ts`) — difficulty ramp:**

```ts
export type AIDecision = { action: BettingAction; amount?: number }

export function decideAI(params: {
  tier: 1 | 2 | 3
  hole: [CardId, CardId]
  board: CardId[]
  pot: number
  toCall: number
  position: 'ip' | 'oop'      // in/out of position
  rng: () => number           // seeded for reproducibility
}): AIDecision
```

| Tier | Used in | Behavior |
| --- | --- | --- |
| **1 — Calling station** | L3 intro, early L5 (heads-up) | Transparent: never bluffs, never folds a made pair, calls with any draw, only bets very strong hands. Easy to read; good for teaching basics. |
| **2 — Pot-odds aware** | Later L5, L6 (heads-up→one opp) | Estimates hand strength via `evaluateBest` + draw equity (`countOuts` + rule of 2 & 4); calls when equity ≥ required equity; value-bets strong hands ~⅔ pot; folds weak hands to big bets; rare (~10%) seeded bluff. |
| **3 — Multiway, position-aware** | L6 capstone (2–3 opponents) | Tier-2 logic + tightens ranges multiway, uses position (acts more aggressively in position), varied per-seat thresholds (one "tight," one "loose") for realistic multiway feel; occasional seeded bluff. |

All randomness is **seeded** (`rng` from `seed`) so hands are reproducible for authoring and tests. The AI is intentionally **rule-based and explainable** (no ML) — consistent with the app's "No AI" content principle; this is deterministic game logic, not a model.

---

## 6. Per-lesson detailed plan

Conventions: **C** = concept step, **P** = problem step. Each lesson keeps **≥ 75% problems** and never stacks two concepts. Every new term is defined in the C step (or prompt) immediately before its first P. "Why?" = author a `feedback.why` walkthrough.

### Lesson 1 — Poker & the deck

**Objectives:** know the 52-card deck (ranks, suits); state poker's goal (best 5-card hand wins the pot); understand Hold'em's 2 hole + 5 community = best 5 of 7.

| # | Type | Teaches | Interaction | Prompt intent | Answer / validation |
| --- | --- | --- | --- | --- | --- |
| c1 | C | Deck = 13 ranks × 4 suits = 52; goal of poker (one plain paragraph) | — | Orient | — |
| p1 | P | Suits & ranks: select one suit | `card-deck` (select-all) | "Tap all 13 hearts" | `cards = cardsBySuit('H')`, count 13 |
| p2 | P | Ranks across suits | `card-deck` (select-all) | "Tap all four Kings" | `cards = cardsByRank('K')`, count 4 |
| c2 | C | "Hole cards" + "community cards" + "the pot" defined in plain words | — | Define terms before use | — |
| p3 | P | Hole vs community | `board-dealer` (experiential) | "Deal your 2 hole cards, then the flop/turn/river — watch 2 + 5 appear" | `minStreetsRevealed` = all (experiential gate) |
| p4 | P | Best 5 **of 7** idea | `hand-ranker` (`pick-best-five`) | "From these 7 cards, tap the 5 that make your hand" (obvious case, e.g. a flush) | `compareHands(selected, evaluateBest(cards)) === 0` |
| p5 | P | A second best-of-7, different shape | `hand-ranker` (`pick-best-five`) | Another 7-card spot (e.g. a pair + kickers) | as above |

**Ratio:** 5 P / 7 steps = **71%** → add one more short problem (e.g. p2b "tap both red Aces") to clear 75%, or fold c2 into p3's prompt. **Target final: 6 P / 7 (86%).** *(Authoring note: keep exactly one of the two concepts; merge the other into a prompt.)*

**Skill check 1** (`hand-ranker`/`card-deck`): (q1) tap all spades; (q2) deal a full board and confirm 5 community cards revealed; (q3) pick the best 5 of 7 in a clear case. **Why?** on p4/p5 (how to scan 7 cards for the best 5).

### Lesson 2 — Hand rankings

**Objectives:** know the 10 categories strongest→weakest; explain rarer = stronger; decide which hand wins including kickers.

| # | Type | Teaches | Interaction | Prompt intent | Answer / validation |
| --- | --- | --- | --- | --- | --- |
| c1 | C | The 10 categories at a glance (the §3.2 ladder) | — | Reference image in words | — |
| p1 | P | Identify a category | `hand-ranker` (`identify-category`) | "What does this 5-card hand make?" (e.g. a flush) | `answer.category = 'flush'` |
| p2 | P | Identify a trickier one | `hand-ranker` (`identify-category`) | full house vs trips+pair confusion | `answer.category = 'full-house'` |
| p3 | P | Order by strength | `hand-ranker` (`order-categories`) | "Arrange these 5 categories strongest→weakest" | `categoryOrder` exact |
| p4 | P | Rarer = stronger | `compare-events` | "Which hand shows up **more often**: a straight or a flush?" (uses §3.2 counts; `compare-events` picks the *more likely* side) | `more` = straight; `detail`/`favorable`/`total` show counts (10,200 vs 5,108) so feedback lands "flush is rarer → ranks higher" |
| p5 | P | Kickers decide ties | `hand-ranker` (`order-hands`) or `compare-events` | "Both have a pair of Kings — which wins?" (kicker) | `handOrder` / `more` via `compareHands` |
| p6 | P | Which hand wins (showdown) | `compare-events` | "Hand A vs Hand B — who wins?" | `more` set by `compareHands` |

**Ratio:** 6 P / 7 = **86%**. **Why?** on p4 (rarity table), p5 (how kickers break ties). Skill-check pulls from p1/p3/p5 shapes.

**Skill check 2:** (q1) identify a category; (q2) order 4 categories; (q3) which of two hands wins (kicker case).

### Lesson 3 — Flow of a hand

**Objectives:** know blinds, hole cards, the four streets, showdown, action order, and position.

| # | Type | Teaches | Interaction | Prompt intent | Answer / validation |
| --- | --- | --- | --- | --- | --- |
| c1 | C | Blinds + button defined; why forced bets exist | — | Define SB/BB/button | — |
| p1 | P | The streets in order | `board-dealer` | "Deal preflop → flop → turn → river in order; name the street as each appears" | reveal all streets; `annotateStreets` |
| p2 | P | Your best hand changes by street | `board-dealer` (`askBestHandAt: flop, river`) | "What's your best hand on the flop? On the river?" | `bestHandByStreet` via `evaluateHoldem` |
| c2 | C | Position & action order (button acts last postflop) | — | Define position | — |
| p3 | P | Who acts first/last | `compare-events` or tap-order | "Preflop, who acts first?" / "Postflop, who acts last?" | choice = correct seat |
| p4 | P | Showdown decides winner | `board-dealer` → `compare-events` | "Board is out; who wins at showdown?" | `compareHands` |
| p5 | P | Fold-to-one ends it early | single-choice problem | "Everyone folds to the button — does a showdown happen?" | choice = "no, button wins" |

**Ratio:** 5 P / 7 = **71%** → add p2b (best hand on the **turn**) to reach 6/8 = 75%, or merge c2 into p3 prompt → 5/6 (83%). **Why?** on p2 (re-evaluating each street), p3 (why position matters).

**Skill check 3:** (q1) order the streets; (q2) best hand at a given street; (q3) who acts last postflop.

### Lesson 4 — Outs, odds & pot odds (math-forward)

**Objectives:** count outs; convert with rule of 2 & 4 (+ caveats); compute pot odds; make a call/fold decision; feel equity empirically.

| # | Type | Teaches | Interaction | Prompt intent | Answer / validation |
| --- | --- | --- | --- | --- | --- |
| c1 | C | "Out" defined; flush draw = 9 outs reasoning | — | Define out | — |
| p1 | P | Count outs (flush draw) | `outs-odds` (`ask:['outs']`) | "How many cards complete your flush?" | `outs = 9` (`countOuts`) |
| p2 | P | Count outs (open-ended straight) | `outs-odds` (`ask:['outs']`) | OESD spot | `outs = 8` |
| c2 | C | Rule of 2 & 4 + the two caveats (§3.4) | — | The heuristic | — |
| p3 | P | Outs → equity | `outs-odds` (`ask:['equity']`, street flop/turn) | "Estimate your equity by the river" | `equityPercent ≈ 36` (±tol) |
| p4 | P | Empirical feel | `card-deck` (`draw-tally`) | "Draw repeatedly — watch hearts hit ~1/4 of the time" (grounds the flush-draw number) | reach `minDraws`, confirm P |
| p5 | P | Pot odds | `outs-odds` (`ask:['potOdds']`) | "Pot $100, call $20 — what equity do you need?" | `potOddsPercent ≈ 16.7` |
| p6 | P | Put it together: call or fold | `outs-odds` (`ask:['decision']`) | "Your equity vs the price — call or fold?" | `decision = 'call'` |

**Ratio:** 6 P / 8 = **75%**. **Why?** on p3 (rule of 2 & 4 derivation + caveat), p5/p6 (pot-odds formula + the compare-to-equity decision). This lesson explicitly reuses `card-deck` `draw-tally` for empirical convergence per scope.

**Skill check 4:** (q1) count outs; (q2) outs → equity (rule of 2 or 4); (q3) pot-odds call/fold decision.

### Lesson 5 — Betting

**Objectives:** use check/bet/call/raise/fold correctly; build the pot; size bets as a fraction of pot; evaluate EV of a call.

| # | Type | Teaches | Interaction | Prompt intent | Answer / validation |
| --- | --- | --- | --- | --- | --- |
| c1 | C | The 5 actions defined (§3.7) | — | Define actions | — |
| p1 | P | Legal action (no bet yet) | `betting-round` (`task:'choose-action'`, `facing` none) | "No one has bet — check or bet?" | `action = 'check'` or `'bet'` per spot |
| p2 | P | Legal action (facing a bet) | `betting-round` (`facing` a bet) | "Villain bet — call / raise / fold?" | `action` = +EV choice |
| p3 | P | Bet sizing | `betting-round` (`task:'choose-size'`) | "Make a half-pot value bet" | `sizeFraction = 0.5` (±tol) |
| c2 | C | EV of a call defined (§3.6), tie to pot odds | — | Define EV | — |
| p4 | P | Compute EV of a call | `betting-round` (`task:'ev-of-call'`) | "Equity 30%, pot $100, call $20 — EV?" | `evChips` (±tol); sign → call |
| p5 | P | Value bet vs fold (heads-up Tier 1→2 AI) | `betting-round` | "You have top pair — best action vs this villain?" | `action` correct |

**Ratio:** 5 P / 7 = **71%** → add p2b (a raise-sizing or a fold spot) → 6/8 (75%). **Why?** on p3 (sizing → price you lay), p4 (EV arithmetic). Introduces the **opponent AI (Tier 1→2, heads-up)** per the ramp.

**Skill check 5:** (q1) pick the legal/best action facing a bet; (q2) size a half-pot bet; (q3) sign/*value* of an EV-of-call.

### Lesson 6 — Play a full hand (capstone)

**Objectives:** play a complete hand vs. multiple opponents with betting on every street → showdown → award pot; apply starting-hand intuition; read the responsible-play note.

| # | Type | Teaches | Interaction | Prompt intent | Answer / validation |
| --- | --- | --- | --- | --- | --- |
| c1 | C | Starting-hand intuition (which 2 cards play well, plainly) | — | One idea | — |
| p1 | P | Starting hands | `compare-events` | "Which starting hand is stronger: A♠K♠ or 7♦2♣?" | `more` (suited broadway > worst hand) |
| p2 | P | Heads-up full hand (warm-up) | `full-hand` (`opponents:1`, `aiTier:2`) | "Play this hand vs one opponent to showdown" | checkpoints ≥ threshold |
| p3 | P | **Capstone: multiway full hand** | `full-hand` (`opponents:2–3`, `aiTier:3`, `showResponsiblePlayNote`) | "Play a full hand vs the table: bet each street, reach showdown, award the pot" | checkpoints ≥ threshold |
| p4 | P | Read the result | review/choice | "Who won and why?" (best 5-card hand) | `compareHands`-derived |

**Ratio:** 4 P / 5 = **80%**. **Why?** authored on each capstone checkpoint via `checkpoints[].why` (preflop range, pot-odds call, value bet, river decision). The **responsible-play note** renders on capstone completion (`showResponsiblePlayNote: true`).

**Skill check 6:** (q1) stronger starting hand; (q2) correct action at a given street of a described hand; (q3) award the pot (who wins at showdown). *(Skill-check questions reuse `compare-events`/`hand-ranker`, not the full simulator, to stay within the 3-quick-question format.)*

> **Forward-reference audit:** L1 cards → L2 rankings (needs cards) → L3 flow (needs rankings for "best hand by street") → L4 odds (needs outs/draws, which need rankings) → L5 betting (needs pot odds from L4) → L6 capstone (needs everything). No step uses a term defined later. ✔

---

## 7. Data / types changes

### 7.1 `web/src/types/lesson.ts`

Add the five new step variants to the `ProblemStep` union (config/answer shapes per §5):

```ts
export type ProblemStep =
  | CoinFlipLabStep | SampleSpacePickerStep | /* …existing… */ | CardDeckStep | CompareEventsStep
  // NEW (poker):
  | HandRankerStep
  | BoardDealerStep
  | OutsOddsStep
  | BettingRoundStep
  | FullHandStep
```

Each `*Step = ProblemStepBase & { interaction: '<id>'; config: ...; answer: ... }`. New `interaction` ids: **`'hand-ranker'`, `'board-dealer'`, `'outs-odds'`, `'betting-round'`, `'full-hand'`**. The reusable poker domain types (`HandCategory`, `EvaluatedHand`, etc.) go in a new **`web/src/types/poker.ts`** and are imported where needed. (Probability step variants can remain in the union during transition; poker lessons simply don't use them — see §8.)

### 7.2 `web/src/components/lesson/InteractionRenderer.tsx`

Add a `lazy(() => import(...))` for each new component and a `case` per new `interaction` id, mirroring the existing pattern (pass `config`, `answer`, `...props`, `key={step.id}`).

### 7.3 New source files

| File | Purpose |
| --- | --- |
| `web/src/types/poker.ts` | `HandCategory`, `EvaluatedHand`, `RankValue`, constants |
| `web/src/lib/poker/handEvaluator.ts` | `evaluateFive`, `evaluateBest`, `compareHands`, `evaluateHoldem`, `countOuts`, `rankValue` |
| `web/src/lib/poker/opponentAI.ts` | `decideAI` + tier logic, seeded RNG |
| `web/src/components/lesson/interactions/HandRanker.tsx` | `hand-ranker` |
| `web/src/components/lesson/interactions/BoardDealer.tsx` | `board-dealer` |
| `web/src/components/lesson/interactions/OutsOdds.tsx` | `outs-odds` |
| `web/src/components/lesson/interactions/BettingRound.tsx` | `betting-round` |
| `web/src/components/lesson/interactions/FullHand.tsx` | `full-hand` |
| (optional) `web/src/components/lesson/interactions/PlayingCard.tsx` | extract the `PlayingCard`/`SuitIcon`/`DeckPile` render helpers from `CardDeck.tsx` into a shared module so all poker widgets share one card visual |

> Recommend extracting the card-render helpers currently private to `CardDeck.tsx` into a shared `PlayingCard.tsx` so `board-dealer`/`betting-round`/`full-hand` reuse identical card art and animation. This is a refactor of existing code (move, not rewrite) and is optional but reduces duplication.

### 7.4 Content files (id-stable, content-swapped)

| File | Change |
| --- | --- |
| `web/src/data/lessons/lesson-1.ts` … `lesson-6.ts` | **Replace contents** with the 6 poker lessons (keep exported names `lesson1`…`lesson6`, keep `id:'1'`…`'6'`). |
| `web/src/data/skillChecks/skill-check-1.ts` … `skill-check-6.ts` | **Replace contents** with the 6 poker skill checks (keep names + `lessonId`). |
| `web/src/data/lessonContent.ts` | No structural change (same `'1'`–`'6'` keys, same lazy imports). |
| `web/src/data/skillCheckContent.ts` | No structural change. |
| `web/src/data/lessons.ts` | **Update `LessonMeta`** titles/units/`primaryInteraction` to poker (see below). |
| `web/src/data/course.ts` | **Update branding** strings (title, hero, descriptions). |

Proposed `lessons.ts` meta:

| id | title | unit |
| --- | --- | --- |
| 1 | Poker & the Deck | Unit 1 · Foundations |
| 2 | Hand Rankings | Unit 2 · Hand strength |
| 3 | Flow of a Hand | Unit 3 · The streets |
| 4 | Outs, Odds & Pot Odds | Unit 4 · Poker math |
| 5 | Betting | Unit 5 · Wagering |
| 6 | Play a Full Hand | Unit 6 · Capstone |

Proposed `course.ts`:

```ts
export const course = {
  title: "Texas Hold'em Poker",
  shortTitle: 'Poker',
  eyebrow: 'Interactive course',
  heroLine: "Learn Texas Hold'em by playing",
  heroDescription:
    'Six interactive lessons from the deck and hand rankings through odds, betting, and a full hand vs AI. Play-money only — no real wagering.',
  pathDescription:
    'Work through each circle in order. Complete a lesson to unlock the next one on the path.',
  courseSummary: '6 lessons · sequential unlock · hands-on practice',
} as const
```

### 7.5 Branding (probability-specific copy to change)

| File | What to change |
| --- | --- |
| `web/index.html` | `<title>` and `<meta name="description">` (both say "probability") → poker |
| `web/src/components/ui/Logo.tsx` | wordmark subtitle "Probability & Random Variables" → "Texas Hold'em Poker" |
| `web/src/components/ui/Footer.tsx` | "Probability you learn by rolling, flipping, and counting…" → poker copy |
| `web/src/components/ui/AuthLayout.tsx` | `valueProps` ("dice & coin labs"), "Learn probability by doing", "From sample spaces to the binomial theorem…", `DiceIcon`/`CoinIcon` decorations → poker (cards/chips) |
| `web/src/components/icons/*` | optionally add card/chip icons; `DiceIcon`/`CoinIcon` usages become card/chip |
| `web/src/components/ui/Logo.tsx` (`BrandMark`) | the die-face logo is cosmetic; optionally restyle to a card/chip (not required for function) |
| `web/src/components/ui/NightPanel.tsx`, `StatToken.tsx` | comments mention "probability table" — cosmetic only |

---

## 8. Migration & fallback

**Preserve the probability app:**
- Tag the current state **`probability-stable`** and keep the existing branch (e.g. `main` or a dedicated `probability` branch) intact and deployable.
- Build the poker course on a **`poker-revamp`** branch. Merge to `main` only when Lessons 1–6 pass review; the tag + branch remain as a permanent fallback.

**Replace (poker content/branding):**
- `data/lessons/lesson-1..6.ts`, `data/skillChecks/skill-check-1..6.ts` (contents).
- `data/lessons.ts` meta, `data/course.ts` branding.
- Branding copy in `index.html`, `Logo.tsx`, `Footer.tsx`, `AuthLayout.tsx`, icon usages.

**Keep unchanged (engine + platform):**
- Entire lesson/skill-check engine, `InteractionRenderer` mechanism, answer-input helpers, `MathContent`, `CheckPanel`.
- Gamification, progress, session, Firestore sync, auth, routing, course-path UI.
- Card primitives in `types/lesson.ts`; `CardDeck.tsx`; `CompareEvents.tsx`.

**Probability-only interactions** (`CoinFlipLab`, `DieSampleSpace`, `FairnessScale`, `TwoDiceGrid`, `CoinEventGrid`, `CountingProduct`, `SeatPermutation`, `SelectCombination`, `CoinFlipProbability`, `BirthdaySimulation`, `DerangementMatch`, `VennDiagram` + their `*Step` types):
- **Strategy:** leave them in place (dormant, lazy-loaded, unreferenced by poker content) during the build so nothing breaks, then **optionally prune** in a later cleanup commit once poker lessons are stable. Pruning order: remove from `ProblemStep` union → remove `InteractionRenderer` cases → delete components → delete now-unused config/answer types. This is reversible via the `probability-stable` tag.
- `CardDeck` and `CompareEvents` are **kept** (reused by poker).

**Persisted-progress note:** because lesson ids stay `'1'`–`'6'`, an existing user's stored "completed lesson 3" will carry into poker as "poker lesson 3 completed." If that's undesirable, the migration can bump a content-version key or reset progress on first poker load — **flag for the user (open question Q6)**. For a fresh/dev deployment this is moot.

---

## 9. Phased build plan & testing

### Phase 0 — Scaffolding
- Branch `poker-revamp` + tag `probability-stable`.
- Add `types/poker.ts`; swap branding + `course.ts` + `lessons.ts` meta.

### Phase 1 — Foundation (hand evaluator + L1–2)
- Build `lib/poker/handEvaluator.ts` (+ unit tests, see below).
- Build `hand-ranker`; (optional) extract shared `PlayingCard.tsx`.
- Author Lessons 1–2 + skill checks 1–2; wire `InteractionRenderer` + union.
- **Gate:** evaluator unit tests green; L1–2 playable end-to-end; skill checks pass/fail correctly.

### Phase 2 — Streets & math (L3–4)
- Build `board-dealer` and `outs-odds` (with `card-deck` draw-tally tie-in).
- Author Lessons 3–4 + skill checks.
- **Gate:** best-hand-by-street validates via `evaluateHoldem`; outs/equity/pot-odds answers validate with tolerances.

### Phase 3 — Betting & capstone (L5–6)
- Build `betting-round`, `opponentAI` (Tiers 1–2), then `full-hand` + Tier 3 multiway.
- Author Lessons 5–6 + skill checks; add responsible-play note.
- **Gate:** capstone completes with checkpoint scoring; AI is reproducible under a fixed seed; multiway showdown awards the correct pot.

### Testing

**Hand-evaluator unit tests** (pure functions → add Vitest; the repo currently has no test harness, so this introduces one — recommended, low-cost). Minimum case table:

| Input (5 or 7 cards) | Expected category | Notes |
| --- | --- | --- |
| `AS KS QS JS 10S` | royal-flush | top of the ladder |
| `9H 8H 7H 6H 5H` | straight-flush | 9-high |
| `AS 5S 4S 3S 2S` | straight-flush | wheel = 5-high (not Ace-high) |
| `7C 7D 7H 7S KD` | quads | kicker K |
| `KC KD KH 4S 4D` | full-house | trips over pair |
| `AH KH 9H 5H 2H` | flush | Ace-high flush |
| `9C 8D 7H 6S 5C` | straight | 9-high, mixed suits |
| `AH 2C 3D 4S 5H` | straight | wheel, 5-high |
| `QC AS 2D 3H 4S` | high-card | **not** a straight (no wrap) |
| `QQ Q 8 3` + kicker | trips | tiebreak rank Q |
| `KK 7 7 2` | two-pair | Kings & Sevens, kicker 2 |
| `AA 9 6 3` | pair | Aces, 3 kickers |
| 7-card `AS KS QS JS 9D 4H 2C` | high-card A-K-Q-J-9 | best-of-7 = no flush (4 spades), no straight (no 10) |
| 7-card `AS KS QS JS 10D 4H 2C` | straight | A-high straight from 7 |
| compare `KKQ..` vs `KKJ..` | A wins | kicker comparison |
| compare identical 5-card hands diff suits | tie (0) | suits don't break ties |

Plus: `evaluateBest` returns the true max across all 21 subsets; `compareHands` is a total order (antisymmetric, transitive on the score vector).

**Interaction tests (manual/live):** each widget fires `onCorrect` only on a valid submission and `onIncorrect` otherwise; `Try again` resets; `initialSolved` renders locked-correct; reduced-motion path works; mobile tap targets ≥ 44px (matches existing widgets).

**Lesson/flow tests (live):** play each lesson end-to-end; verify ≥ 75% problem ratio; verify skill-check 2/3 pass gate, free retries, XP award on first completion, streak credit, sequential unlock — all **engine behavior that is unchanged**, so this is regression confirmation, not new logic.

**Capstone tests:** fixed `seed` reproduces the same hand; AI decisions are deterministic under the seed; checkpoint threshold logic passes/fails as authored; responsible-play note shows on completion.

---

## 10. Open questions / risks

1. **Validation for exploratory widgets (Q1).** `board-dealer`/`full-hand` are inherently exploratory; the proposed gates are "reveal all streets" (experiential) and "decision checkpoints ≥ threshold" (capstone). Confirm this is acceptable vs. a stricter "every decision must be optimal" model (which could frustrate beginners).
2. **Equity tolerances (Q2).** Rule of 2 & 4 is an estimate; `outs-odds` accepts an equity band (e.g. ±2–3%). Confirm the band, and whether to accept *either* the rule estimate *or* the exact value.
3. **Ordering UX on mobile (Q3).** For `hand-ranker` ordering, prefer tap-to-sequence over drag-and-drop for touch reliability/accessibility — confirm.
4. **AI realism vs. teachability (Q4).** Tiers are intentionally simple/explainable. Confirm that's the goal (vs. a stronger but opaque bot). All RNG seeded for reproducibility.
5. **Capstone scope (Q5).** How much betting realism in `full-hand` (all-in only? full no-limit sizing? capped streets?) — proposal is full streets with fraction-of-pot sizing options and seeded AI. Confirm depth vs. lesson length.
6. **Existing-progress carryover (Q6).** Reusing ids `'1'`–`'6'` means prior probability completion carries into poker. Reset progress / bump a content version on first poker load, or leave as-is (fine for fresh deploy)? 
7. **Pruning probability code (Q7).** Keep dormant probability interactions in-tree (smaller diff, easy rollback) or delete in this revamp (cleaner, larger diff)? Proposal: keep during build, prune in a follow-up.
8. **Adding a test harness (Q8).** The repo has no tests today; the evaluator strongly warrants unit tests. OK to add Vitest (dev-only dependency) for `lib/poker`?
9. **Responsible-play resources (Q9).** Confirm the exact one-line wording/resource (e.g. a neutral helpline reference) for the Lesson 6 note, kept brief and non-preachy.

---

## Appendix A — quick correctness cheat-sheet for authors

- Flush draw = **9 outs**; OESD = **8**; gutshot = **4**; flush+OESD ≈ **15**.
- Rule of **4 on the flop**, **2 on the turn**; ×4 overestimates for ≥ 9 outs (correct with `−(outs−8)`); ×4 assumes you see both cards (all-in).
- Flush draw equity: **~19% one card**, **~35% two cards (flop→river)**.
- Required equity = `call / (pot + call)`. Pot-sized bet → 33%; half-pot → 25%; quarter-pot → 17%.
- EV(call) = `P(win)·(won) − P(lose)·(lost)`; call when EV > 0 ⇔ equity > required equity.
- Ranking (high→low): royal flush, straight flush, quads, full house, flush, straight, trips, two pair, pair, high card. Suits never break ties; identical hands chop.
- Hold'em hand = **best 5 of 7** (2 hole + 5 community).
