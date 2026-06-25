import type { BettingAction, HandCategory, PokerStreet } from './poker'

export type ConceptStep = {
  type: 'concept'
  id: string
  title?: string
  content: string
}

export type ProblemFeedback = {
  correct: string
  incorrect: string
  hints: string[]
  /** Markdown/KaTeX explanation shown in the Why popup */
  why?: string
}

export type ProblemStepBase = {
  type: 'problem'
  id: string
  prompt: string
  feedback: ProblemFeedback
  /**
   * Show the collapsible scratchpad Calculator alongside this problem (set on the
   * math lessons, 5-8). It is a helper TOOL only: it never reads or writes the
   * answer and has no effect on grading. Defaults to off, so non-math lessons stay
   * uncluttered.
   */
  showCalculator?: boolean
}

/** Reduced fraction for P(ω) = num/den */
export type FractionProbability = {
  num: number
  den: number
}

// --- card deck ---
export type CardSuit = 'S' | 'H' | 'D' | 'C'
export type CardRank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'

/** A card id is `${rank}${suit}`, e.g. "AS", "10H", "KD", "7C". */
export type CardId = string

export const DECK_SIZE = 52
export const CARD_SUITS: CardSuit[] = ['S', 'H', 'D', 'C']
export const CARD_RANKS: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const RED_SUITS: CardSuit[] = ['H', 'D']
export const FACE_RANKS: CardRank[] = ['J', 'Q', 'K']

export function isRedSuit(suit: CardSuit): boolean {
  return suit === 'H' || suit === 'D'
}

export function cardId(rank: CardRank, suit: CardSuit): CardId {
  return `${rank}${suit}`
}

export function parseCardId(id: CardId): { rank: CardRank; suit: CardSuit } {
  const suit = id.slice(-1) as CardSuit
  const rank = id.slice(0, -1) as CardRank
  return { rank, suit }
}

/** Full 52-card sample space, ordered by suit (♠♥♦♣) then rank (A→K). */
export function fullDeck(): CardId[] {
  const out: CardId[] = []
  for (const suit of CARD_SUITS) for (const rank of CARD_RANKS) out.push(cardId(rank, suit))
  return out
}

/** The 13 cards of one suit (A→K). */
export function cardsBySuit(suit: CardSuit): CardId[] {
  return CARD_RANKS.map((rank) => cardId(rank, suit))
}

/** The 4 cards of one rank (♠♥♦♣). */
export function cardsByRank(rank: CardRank): CardId[] {
  return CARD_SUITS.map((suit) => cardId(rank, suit))
}

/** All 26 red cards (hearts + diamonds). */
export function redCards(): CardId[] {
  return RED_SUITS.flatMap((suit) => cardsBySuit(suit))
}

/** All 26 black cards (spades + clubs). */
export function blackCards(): CardId[] {
  return CARD_SUITS.filter((suit) => !isRedSuit(suit)).flatMap((suit) => cardsBySuit(suit))
}

/** All 12 face cards (J, Q, K of every suit). */
export function faceCards(): CardId[] {
  return FACE_RANKS.flatMap((rank) => cardsByRank(rank))
}

/**
 * Every card NOT in the given event — the complement within the 52-card Ω.
 * Handy for "select all cards NOT in X" / P(not X) problems:
 *   answer.cards = complementOf(redCards())  // the 26 black cards
 */
export function complementOf(cards: CardId[]): CardId[] {
  const exclude = new Set(cards)
  return fullDeck().filter((card) => !exclude.has(card))
}

const CARD_RANK_NAMES: Record<CardRank, string> = {
  A: 'Ace',
  '2': 'Two',
  '3': 'Three',
  '4': 'Four',
  '5': 'Five',
  '6': 'Six',
  '7': 'Seven',
  '8': 'Eight',
  '9': 'Nine',
  '10': 'Ten',
  J: 'Jack',
  Q: 'Queen',
  K: 'King',
}

const CARD_SUIT_NAMES: Record<CardSuit, string> = {
  S: 'spades',
  H: 'hearts',
  D: 'diamonds',
  C: 'clubs',
}

/** Human-readable label, e.g. "Ten of hearts" — used for accessibility. */
export function cardLabel(id: CardId): string {
  const { rank, suit } = parseCardId(id)
  return `${CARD_RANK_NAMES[rank]} of ${CARD_SUIT_NAMES[suit]}`
}

/**
 * Card-deck mechanic:
 *  - 'select-all' (default): tap every card in event A, optionally enter |A| and P(A).
 *  - 'draw-tally': repeatedly draw a random card and tally how many land in a target
 *    event vs not, watching the empirical frequency approach the theoretical P(event).
 */
export type CardDeckMode = 'select-all' | 'draw-tally'

export type CardDeckConfig = {
  /** Which mechanic to render (default 'select-all'). */
  mode?: CardDeckMode
  /** Instruction shown above the deck (defaults in widget). */
  helperText?: string
  /** Heading for the learner-built "your selection" area (select-all). */
  selectionLabel?: string
  /** Prompt for the |A| numeric count field. */
  countLabel?: string
  /** Prompt for the optional P(event) fraction field. */
  probabilityLabel?: string
  /** Play a staggered deal-in animation on mount (default true; auto-disabled for reduced motion). */
  deal?: boolean

  // --- draw-tally mode -------------------------------------------------------
  /** Cards that count as a "hit" for the tallied event, e.g. redCards() (draw-tally). */
  targetEvent?: CardId[]
  /** Human name of the tallied event, e.g. "a heart" / "a red card" (draw-tally). */
  targetLabel?: string
  /** Draws required before the learner may check (default 12) (draw-tally). */
  minDraws?: number
  /** Draw with replacement so every draw is independent (default true) (draw-tally). */
  withReplacement?: boolean
  /** Show a "predict the probability first" step before drawing (draw-tally). */
  predictFirst?: boolean
  /** Prompt for the predict-first fraction field (draw-tally). */
  predictLabel?: string
  /** Label for the draw button (draw-tally). */
  drawLabel?: string
}

export type CardDeckAnswer = {
  /**
   * Exact set of card ids that belong to event A (select-all). Ω is always the
   * 52-card deck. Optional so draw-tally (whose target lives in config.targetEvent)
   * can omit it.
   */
  cards?: CardId[]
  /** |A| — when set, the learner must also enter this count. */
  count?: number
  /**
   * Reduced theoretical probability the learner must confirm.
   *  - select-all: P(A) = |A|/52 for the selected event.
   *  - draw-tally: P(hit) = |targetEvent|/52, compared against the live empirical frequency.
   * When omitted in draw-tally the check is experiential (just reach minDraws).
   */
  probability?: FractionProbability
}

export type CardDeckStep = ProblemStepBase & {
  interaction: 'card-deck'
  config: CardDeckConfig
  answer: CardDeckAnswer
}

// --- compare two events (generic; reusable for cards, dice, coins, …) ----------
export type CompareEventsChoice = 'a' | 'b' | 'equal'

export type CompareEventsSide = {
  /** Short event name, e.g. "A face card". */
  label: string
  /** Optional supporting detail, e.g. "Jacks, Queens, Kings — 12 of 52 cards". */
  detail?: string
  /** Optional favorable / total counts; shown as "12 / 52" and drive the reveal bar. */
  favorable?: number
  total?: number
  /**
   * Theoretical probability of this event. Drives the reveal bar when favorable/total
   * are absent, and is the expected value when config.requireProbabilities is set.
   */
  probability?: FractionProbability
}

export type CompareEventsConfig = {
  /** Instruction above the two events (defaults in widget). */
  helperText?: string
  /** The two events being compared. */
  eventA: CompareEventsSide
  eventB: CompareEventsSide
  /** Offer an explicit "equally likely" choice (default: true only when the answer is 'equal'). */
  allowEqual?: boolean
  /** Also require the learner to enter each event's probability as a reduced fraction. */
  requireProbabilities?: boolean
  /** Prompt above the choice buttons. */
  chooseLabel?: string
  /** Labels for the two probability fraction fields (when requireProbabilities). */
  probabilityALabel?: string
  probabilityBLabel?: string
}

export type CompareEventsAnswer = {
  /** Which event is more likely, or 'equal' when the two probabilities tie. */
  more: CompareEventsChoice
  /** Expected P(event A) — required when config.requireProbabilities is set. */
  probabilityA?: FractionProbability
  /** Expected P(event B) — required when config.requireProbabilities is set. */
  probabilityB?: FractionProbability
}

export type CompareEventsStep = ProblemStepBase & {
  interaction: 'compare-events'
  config: CompareEventsConfig
  answer: CompareEventsAnswer
}

// ===========================================================================
// Poker interaction step variants (Texas Hold'em revamp). Domain types live in
// `types/poker.ts`; card primitives (`CardId`, `fullDeck`, …) are above. Each
// variant pairs a `config` + `answer` on top of `ProblemStepBase`, keyed by its
// `interaction` id, exactly like the probability variants. See design doc §5 & §7.
// ===========================================================================

// --- hand-ranker (§5.2) -------------------------------------------------------
export type HandRankerMode =
  | 'identify-category' // show 5–7 cards → pick the category
  | 'order-categories' // arrange category chips strongest→weakest
  | 'order-hands' // arrange N concrete hands strongest→weakest
  | 'build-hand' // pick 5 cards from a deck to make a target category
  | 'pick-best-five' // from 7 cards, tap the 5 that form the best hand

export type HandRankerHand = { id: string; cards: CardId[] }

export type HandRankerConfig = {
  mode: HandRankerMode
  /** identify-category / pick-best-five: the cards shown. */
  cards?: CardId[]
  /** order-categories: the category chips to arrange (subset of the 10). */
  categories?: HandCategory[]
  /** order-hands: each "hand" is a labeled set of 5 cards. */
  hands?: HandRankerHand[]
  /** build-hand: which category to build. */
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
  /** order-hands: correct order of hand ids strongest→weakest. */
  handOrder?: string[]
  /** build-hand / pick-best-five: the exact 5 cards (build-hand validates by category). */
  cards?: CardId[]
}

export type HandRankerStep = ProblemStepBase & {
  interaction: 'hand-ranker'
  config: HandRankerConfig
  answer: HandRankerAnswer
}

// --- board-dealer (§5.3) ------------------------------------------------------
/** Who took down the pot at showdown: the learner ('hero'/You), the 'opponent', or a 'split'. */
export type ShowdownWinner = 'hero' | 'opponent' | 'split'

export type BoardDealerConfig = {
  /** Fixed hole cards, or 'random' to deal from a shuffled deck (seedable). */
  hole?: [CardId, CardId] | 'random'
  /** Fixed full board (up to 5), or 'deal' to deal street-by-street. */
  board?: CardId[] | 'deal'
  seed?: number
  /** Number of opponents to deal (face-down unless revealed at showdown). */
  opponents?: number
  /**
   * A specific opponent's hole cards. When paired with `answer.winner`, the board
   * deals all the way to showdown, flips these cards face-up after the river, and
   * asks the learner who won — graded with `evaluateHoldem` + `compareHands`.
   */
  villain?: [CardId, CardId]
  /** Which streets to step through. */
  streets?: PokerStreet[]
  /** Ask the learner to name their best hand at each listed street. */
  askBestHandAt?: PokerStreet[]
  /** Label each street with its name as it's revealed (default true). */
  annotateStreets?: boolean
  /** Show the stacked deck / stock pile (with a remaining-card count) (default true). */
  showDeck?: boolean
  /** Show the burn card dealt before the flop, turn, and river (default true). */
  showBurns?: boolean
  helperText?: string
}

export type BoardDealerAnswer = {
  /** Expected best-hand category at each asked street (validated via evaluateHoldem). */
  bestHandByStreet?: Partial<Record<PokerStreet, HandCategory>>
  /** Minimum streets the learner must reveal before Check unlocks (experiential gate). */
  minStreetsRevealed?: number
  /**
   * Showdown-winner question (requires `config.villain`): the learner picks who won
   * after the river. The widget grades against the live evaluator
   * (`compareHands(evaluateHoldem(hero,…), evaluateHoldem(villain,…))`); this authored
   * value is only a cross-check, never the source of truth.
   */
  winner?: ShowdownWinner
}

export type BoardDealerStep = ProblemStepBase & {
  interaction: 'board-dealer'
  config: BoardDealerConfig
  answer: BoardDealerAnswer
}

// --- outs-odds (§5.4) ---------------------------------------------------------
export type OutsOddsAsk = 'outs' | 'equity' | 'potOdds' | 'decision'

export type OutsOddsConfig = {
  hole: [CardId, CardId]
  board: CardId[] // 3 (flop) or 4 (turn) cards
  /** The draw the learner is chasing, for hinting + out highlighting (e.g. "a flush"). */
  drawLabel: string
  /** Selects ×4 (flop) vs ×2 (turn) for the Rule of 2 & 4. */
  street: 'flop' | 'turn'
  /** Which sub-questions to ask, in order. */
  ask: OutsOddsAsk[]
  /** Pot situation for potOdds / decision. */
  pot?: number
  betToCall?: number
  /** Render a CardDeck draw-tally below to build empirical feel for the equity. */
  empiricalTieIn?: boolean
  /**
   * Let the learner answer the ratio sub-questions as a fraction instead of a whole
   * percent. Applies to `potOdds` (call / (pot + call)) and, on the turn, `equity`
   * (outs / cards left). The fraction is graded by converting it to a percent and
   * comparing against the same expected value + tolerance as the percent input, so it
   * is purely an additional accepted input form, never a change to the correct value.
   */
  allowFractionAnswer?: boolean
  helperText?: string
}

export type OutsOddsAnswer = {
  /** Exact integer (validated via countMatches; cross-check with countOuts). */
  outs?: number
  /** Rule-of-2/4 estimate; validated with percentMatches tolerance. */
  equityPercent?: number
  equityTolerance?: number
  /** required equity = betToCall/(pot+betToCall), as a percent. */
  potOddsPercent?: number
  /** correct = (equity ≥ requiredEquity). */
  decision?: 'call' | 'fold'
}

export type OutsOddsStep = ProblemStepBase & {
  interaction: 'outs-odds'
  config: OutsOddsConfig
  answer: OutsOddsAnswer
}

// --- betting-round (§5.5) -----------------------------------------------------
export type BettingRoundConfig = {
  hole: [CardId, CardId]
  board: CardId[]
  street: PokerStreet
  pot: number
  heroStack: number
  villainStack: number
  /** Bet/raise sizes offered as fractions of the pot (e.g. [0.5, 0.75, 1]). */
  sizingOptions?: number[]
  /** What the learner faces: nothing (check/bet) or an existing bet (call/raise/fold). */
  facing?: { action: 'bet' | 'raise'; amount: number }
  /**
   * Scripted, deterministic opponent response shown in the reveal: after the
   * hero acts, the opponent plays this fixed action. Optional — when omitted the reveal
   * falls back to a simple rule (call when faced with a bet; check behind when checked to).
   */
  villainAction?: BettingAction
  /** Chip amount for a scripted villain bet/raise (defaults to a pot-fraction). */
  villainAmount?: number
  seed?: number
  /** Sub-question to validate completion. */
  task: 'choose-action' | 'choose-size' | 'ev-of-call'
  helperText?: string
}

export type BettingRoundAnswer = {
  /** choose-action: the +EV / correct action. */
  action?: BettingAction
  /** choose-size: target fraction of pot (tolerance on resulting $). */
  sizeFraction?: number
  sizeTolerance?: number
  /** ev-of-call: expected EV in chips (with tolerance); its sign decides call/fold. */
  evChips?: number
  evTolerance?: number
}

export type BettingRoundStep = ProblemStepBase & {
  interaction: 'betting-round'
  config: BettingRoundConfig
  answer: BettingRoundAnswer
}

// --- hand-ranking ladder (concept-style reveal) -------------------------------
// A non-graded "explore the ladder" display: the 10 hand categories listed
// strongest → weakest, where tapping a row reveals an example 5-card hand drawn
// as real card visuals. There is nothing to grade, so it auto-completes once the
// learner has opened at least one example (mirrors `board-dealer`'s reveal-gate
// `minStreetsRevealed`) — never a misleading "Check answer". The ten categories
// and their verified example hands are owned by the widget; config only tweaks
// copy, keeping authoring in `lesson-2.ts` trivial.
export type HandRankingLadderConfig = {
  /** Instruction shown above the ladder (defaults in widget). */
  helperText?: string
}

export type HandRankingLadderAnswer = {
  /**
   * Distinct example hands the learner must open before the step auto-completes
   * (default 1). This is the no-input completion gate — there is no answer to
   * check, exactly like `board-dealer`'s observational reveal-gate.
   */
  minExamplesRevealed?: number
}

export type HandRankingLadderStep = ProblemStepBase & {
  interaction: 'hand-ranking-ladder'
  config: HandRankingLadderConfig
  answer: HandRankingLadderAnswer
}

export type ProblemStep =
  | CardDeckStep
  | CompareEventsStep
  // Poker (Texas Hold'em revamp):
  | HandRankerStep
  | BoardDealerStep
  | OutsOddsStep
  | BettingRoundStep
  | HandRankingLadderStep

export type LessonStep = ConceptStep | ProblemStep

export type LessonDefinition = {
  id: string
  title: string
  steps: LessonStep[]
}

export function isConceptStep(step: LessonStep): step is ConceptStep {
  return step.type === 'concept'
}

export function isProblemStep(step: LessonStep): step is ProblemStep {
  return step.type === 'problem'
}
