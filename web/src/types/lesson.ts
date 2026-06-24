export type ConceptStep = {
  type: 'concept'
  id: string
  title?: string
  content: string
  /** Optional inline diagram shown beneath the concept text (reuses VennDiagram) */
  visual?: VennDiagramConfig
}

export type VennDiagramConfig = {
  type: 'sample-space' | 'event-subset' | 'two-events'
  labelOmega?: string
  labelA?: string
  labelB?: string
  /** For sample-space: list outcome labels inside Ω */
  outcomes?: string[]
  /** For event-subset: which outcomes are in event A (highlighted) */
  eventOutcomes?: string[]
  /** For two-events: labels/counts shown inside the A ∩ B overlap region */
  intersectionOutcomes?: string[]
  /** Optional caption below the diagram (e.g. "|Ω| = 36") */
  caption?: string
}

export type ProblemFeedback = {
  correct: string
  incorrect: string
  hints: string[]
  /** Markdown/KaTeX explanation shown in the Why popup */
  why?: string
  /** Optional structured Venn diagram for sample-space / event problems */
  venn?: VennDiagramConfig
}

export type ProblemStepBase = {
  type: 'problem'
  id: string
  prompt: string
  feedback: ProblemFeedback
}

/** Reduced fraction for P(ω) = num/den */
export type FractionProbability = {
  num: number
  den: number
}

// --- coin flip lab ---
export type CoinFlipLabConfig = {
  /** Legacy flip-only mode: minimum flips before check */
  minFlips?: number
  /** Legacy flip-only mode: require seeing H and T */
  requireBothFaces?: boolean
  /** Combined mode: tap targets for building Ω (includes distractors) */
  options?: string[]
  /** Instruction above the option grid (combined mode) */
  pickerHelperText?: string
  /** Label for the learner-built list area (combined mode) */
  listLabel?: string
  /** Prompt for optional |Ω| numeric field (combined mode) */
  countLabel?: string
}

export type CoinFlipLabAnswer = {
  /** Legacy flip-only mode */
  minFlips?: number
  requireBothFaces?: boolean
  /** Combined mode: exact set of outcomes in Ω */
  selected?: string[]
  /** Combined mode: expected |Ω| when countLabel is set */
  count?: number
  /** When set with count, learner must also enter P(ω) as a fraction */
  probability?: FractionProbability
}

export type CoinFlipLabStep = ProblemStepBase & {
  interaction: 'coin-flip-lab'
  config: CoinFlipLabConfig
  answer: CoinFlipLabAnswer
}

// --- sample space picker ---
export type SampleSpacePickerConfig = {
  /** All tap targets — includes correct outcomes and distractors */
  options: string[]
  /** Short instruction above the option grid */
  helperText?: string
  /** Label for the learner-built list area */
  listLabel?: string
  /** Show interactive coin flip above the picker (exploration only) */
  showCoinFlip?: boolean
  /**
   * Discovery mode: no preset chips. The learner flips the coin and each
   * distinct outcome auto-populates Ω (duplicates collapse). `options` is
   * ignored in this mode; Ω is validated against `answer.selected`.
   */
  discoverMode?: boolean
  /** Instruction shown above the discovery sample-space area */
  discoverHelperText?: string
  /** Also require entering |Ω|; validated against answer.selected.length */
  confirmCount?: boolean
  /** Prompt for the optional |Ω| numeric field (discovery mode) */
  countLabel?: string
  /** Submit button label used in discovery mode */
  lockInLabel?: string
}

export type SampleSpacePickerAnswer = {
  /** Exact set of outcomes that belong in Ω */
  selected: string[]
}

export type SampleSpacePickerStep = ProblemStepBase & {
  interaction: 'sample-space-picker'
  config: SampleSpacePickerConfig
  answer: SampleSpacePickerAnswer
}

// --- die sample space ---
export type DieSampleSpaceConfig = {
  sides: number
  selectAll?: boolean
  targetFace?: number
  /** Label for the numeric count field (defaults in widget) */
  countLabel?: string
  /** Label for optional P(ω) fraction field */
  probabilityLabel?: string
}

export type DieSampleSpaceAnswer = {
  selected: number[]
  /** |Ω| — learner must enter this count */
  count: number
  /** When set, learner must also enter P(ω) as a reduced fraction */
  probability?: FractionProbability
}

export type DieSampleSpaceStep = ProblemStepBase & {
  interaction: 'die-sample-space'
  config: DieSampleSpaceConfig
  answer: DieSampleSpaceAnswer
}

// --- fairness scale ---
export type FairnessScaleConfig = {
  outcomes: number
  /** Display labels per outcome (defaults to 1…n) */
  faceLabels?: string[]
  /** Starting probability weights (0–1 each); sums to 1 for loaded-die narrative */
  initialWeights?: number[]
  /** Prompt for numeric percent answer after balancing */
  countLabel?: string
  /** Require a whole-number percent for one face after bars are fair */
  requireCount?: boolean
  /**
   * Interaction style (defaults to 'rebalance'):
   * - 'rebalance': learner drags each face's weight until the die is fair
   * - 'equalize-button': legacy one-tap "split evenly" (kept backward compatible)
   * - 'identify': learner reasons about a fixed loaded die (no rebalancing)
   */
  mode?: 'rebalance' | 'equalize-button' | 'identify'
  /** Granularity (0–1) of the rebalance sliders / nudge buttons (default 0.005 = 0.5%) */
  step?: number
  /** Helper text above the bars in 'rebalance' mode */
  rebalanceLabel?: string
  /** Prompt for the "which face is most likely" sub-task in 'identify' mode */
  identifyLabel?: string
  /** Prompt for the P(face) fraction field in 'identify' mode */
  probabilityLabel?: string
}

export type FairnessScaleAnswer = {
  /** Each outcome should equal this probability (0–1) */
  each: number
  /** Expected whole-number percent for one face (e.g. 17 for 1/6) */
  countAnswer?: number
  /** 'identify' mode: 1-based index of the most-likely face (defaults to argmax of initialWeights) */
  mostLikelyFace?: number
  /** 'identify' mode: expected P(most-likely face) as a reduced fraction */
  identifyProbability?: FractionProbability
}

export type FairnessScaleStep = ProblemStepBase & {
  interaction: 'fairness-scale'
  config: FairnessScaleConfig
  answer: FairnessScaleAnswer
}

// --- two dice grid ---
export type TwoDiceGridConfig = {
  matchSum?: number
  /** Select exactly this many cells (optional) */
  exactCount?: number
  countLabel?: string
}

export type TwoDiceGridAnswer = {
  cells: string[]
  /** |A| — learner must enter this count */
  eventCount: number
}

export type TwoDiceGridStep = ProblemStepBase & {
  interaction: 'two-dice-grid'
  config: TwoDiceGridConfig
  answer: TwoDiceGridAnswer
}

// --- coin event grid ---
export type CoinEventGridConfig = {
  coins: number
  maxHeads: number
  countLabel?: string
  probabilityLabel?: string
}

export type CoinEventGridAnswer = {
  patterns: string[]
  /** |A| or |Ω| — learner must enter this count */
  count: number
  /** When set, learner must also enter P(ω) as a reduced fraction */
  probability?: FractionProbability
}

export type CoinEventGridStep = ProblemStepBase & {
  interaction: 'coin-event-grid'
  config: CoinEventGridConfig
  answer: CoinEventGridAnswer
}

// --- counting product ---
export type CountingStage = {
  label: string
  options: string[]
}

export type CountingProductConfig = {
  stages: CountingStage[]
  countLabel?: string
  probabilityLabel?: string
}

export type CountingProductAnswer = {
  product: number
  /** When set, learner must also enter P(ω) as a reduced fraction */
  probability?: FractionProbability
}

export type CountingProductStep = ProblemStepBase & {
  interaction: 'counting-product'
  config: CountingProductConfig
  answer: CountingProductAnswer
}

// --- seat permutation ---
export type SeatPermutationConfig = {
  guests: string[]
  countLabel?: string
}

export type SeatPermutationAnswer = {
  /** n! for n guests */
  totalArrangements: number
}

export type SeatPermutationStep = ProblemStepBase & {
  interaction: 'seat-permutation'
  config: SeatPermutationConfig
  answer: SeatPermutationAnswer
}

// --- select combination ---
export type SelectCombinationConfig = {
  items: string[]
  selectCount: number
  countLabel?: string
}

export type SelectCombinationAnswer = {
  /** C(n, k) */
  combinationCount: number
}

export type SelectCombinationStep = ProblemStepBase & {
  interaction: 'select-combination'
  config: SelectCombinationConfig
  answer: SelectCombinationAnswer
}

// --- coin flip probability lab ---
export type CoinFlipProbabilityConfig = {
  coins: number
  targetHeads: number
  minTrials?: number
  countLabel?: string
}

export type CoinFlipProbabilityAnswer = {
  /** |A| = C(n, k) */
  eventCount: number
}

export type CoinFlipProbabilityStep = ProblemStepBase & {
  interaction: 'coin-flip-probability'
  config: CoinFlipProbabilityConfig
  answer: CoinFlipProbabilityAnswer
}

// --- birthday simulation ---
export type BirthdaySimulationConfig = {
  people: number
  minTrials?: number
  countLabel?: string
}

export type BirthdaySimulationAnswer = {
  /** Learner-entered count (e.g. group size or |Ω| for days) */
  count: number
}

export type BirthdaySimulationStep = ProblemStepBase & {
  interaction: 'birthday-simulation'
  config: BirthdaySimulationConfig
  answer: BirthdaySimulationAnswer
}

// --- derangement match (secretary problem) ---
export type DerangementMatchConfig = {
  labels: string[]
  countLabel?: string
}

export type DerangementMatchAnswer = {
  /** D_n — number of derangements */
  derangementCount: number
}

export type DerangementMatchStep = ProblemStepBase & {
  interaction: 'derangement-match'
  config: DerangementMatchConfig
  answer: DerangementMatchAnswer
}

// --- venn diagram ---
export type VennDiagramTask =
  | 'select-intersection'
  | 'select-union'
  | 'enter-union'
  | 'enter-complement'

export type VennDiagramInteractionConfig = {
  setALabel?: string
  setBLabel?: string
  sizeA: number
  sizeB: number
  intersection: number
  universeSize?: number
  task: VennDiagramTask
  countLabel?: string
}

export type VennDiagramAnswer = {
  /** For select-* tasks */
  selectedRegions?: ('aOnly' | 'bOnly' | 'ab' | 'outside')[]
  /** For enter-* tasks */
  count?: number
}

export type VennDiagramStep = ProblemStepBase & {
  interaction: 'venn-diagram'
  config: VennDiagramInteractionConfig
  answer: VennDiagramAnswer
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

export type ProblemStep =
  | CoinFlipLabStep
  | SampleSpacePickerStep
  | DieSampleSpaceStep
  | FairnessScaleStep
  | TwoDiceGridStep
  | CoinEventGridStep
  | CountingProductStep
  | SeatPermutationStep
  | SelectCombinationStep
  | CoinFlipProbabilityStep
  | BirthdaySimulationStep
  | DerangementMatchStep
  | VennDiagramStep
  | CardDeckStep
  | CompareEventsStep

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

export function cellKey(d1: number, d2: number) {
  return `${d1}-${d2}`
}

export function parseCellKey(key: string): [number, number] {
  const [a, b] = key.split('-').map(Number)
  return [a, b]
}

/** All H/T patterns for n coin flips */
export function coinPatterns(n: number): string[] {
  const out: string[] = []
  for (let i = 0; i < 2 ** n; i++) {
    const bits = i.toString(2).padStart(n, '0')
    out.push(bits.replace(/0/g, 'T').replace(/1/g, 'H'))
  }
  return out
}

export function countHeads(pattern: string) {
  return [...pattern].filter((c) => c === 'H').length
}

/** Binomial coefficient C(n, k) */
export function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  let result = 1
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1)
  }
  return Math.round(result)
}
