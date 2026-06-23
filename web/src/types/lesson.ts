export type ConceptStep = {
  type: 'concept'
  id: string
  title?: string
  content: string
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

// --- coin flip lab ---
export type CoinFlipLabConfig = {
  minFlips?: number
  requireBothFaces?: boolean
}

export type CoinFlipLabAnswer = {
  minFlips?: number
  requireBothFaces?: boolean
}

export type CoinFlipLabStep = ProblemStepBase & {
  interaction: 'coin-flip-lab'
  config: CoinFlipLabConfig
  answer: CoinFlipLabAnswer
}

// --- die sample space ---
export type DieSampleSpaceConfig = {
  sides: number
  selectAll?: boolean
  targetFace?: number
  /** Label for the numeric count field (defaults in widget) */
  countLabel?: string
}

export type DieSampleSpaceAnswer = {
  selected: number[]
  /** |Ω| — learner must enter this count */
  count: number
}

export type DieSampleSpaceStep = ProblemStepBase & {
  interaction: 'die-sample-space'
  config: DieSampleSpaceConfig
  answer: DieSampleSpaceAnswer
}

// --- fairness scale ---
export type FairnessScaleConfig = {
  outcomes: number
}

export type FairnessScaleAnswer = {
  /** Each outcome should equal this probability (0–1) */
  each: number
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
}

export type CoinEventGridAnswer = {
  patterns: string[]
  /** |A| — learner must enter this count */
  count: number
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
}

export type CountingProductAnswer = {
  product: number
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

export type ProblemStep =
  | CoinFlipLabStep
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
