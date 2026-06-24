import { lazy, Suspense } from 'react'
import type { ProblemStep } from '../../types/lesson'
import type { InteractionProps } from './interactions/types'

const BirthdaySimulation = lazy(() =>
  import('./interactions/BirthdaySimulation').then((m) => ({ default: m.BirthdaySimulation })),
)
const CardDeck = lazy(() =>
  import('./interactions/CardDeck').then((m) => ({ default: m.CardDeck })),
)
const CoinEventGrid = lazy(() =>
  import('./interactions/CoinEventGrid').then((m) => ({ default: m.CoinEventGrid })),
)
const CoinFlipLab = lazy(() =>
  import('./interactions/CoinFlipLab').then((m) => ({ default: m.CoinFlipLab })),
)
const CoinFlipProbability = lazy(() =>
  import('./interactions/CoinFlipProbability').then((m) => ({ default: m.CoinFlipProbability })),
)
const CompareEvents = lazy(() =>
  import('./interactions/CompareEvents').then((m) => ({ default: m.CompareEvents })),
)
const CountingProduct = lazy(() =>
  import('./interactions/CountingProduct').then((m) => ({ default: m.CountingProduct })),
)
const DerangementMatch = lazy(() =>
  import('./interactions/DerangementMatch').then((m) => ({ default: m.DerangementMatch })),
)
const DieSampleSpace = lazy(() =>
  import('./interactions/DieSampleSpace').then((m) => ({ default: m.DieSampleSpace })),
)
const FairnessScale = lazy(() =>
  import('./interactions/FairnessScale').then((m) => ({ default: m.FairnessScale })),
)
const SampleSpacePicker = lazy(() =>
  import('./interactions/SampleSpacePicker').then((m) => ({ default: m.SampleSpacePicker })),
)
const SeatPermutation = lazy(() =>
  import('./interactions/SeatPermutation').then((m) => ({ default: m.SeatPermutation })),
)
const SelectCombination = lazy(() =>
  import('./interactions/SelectCombination').then((m) => ({ default: m.SelectCombination })),
)
const TwoDiceGrid = lazy(() =>
  import('./interactions/TwoDiceGrid').then((m) => ({ default: m.TwoDiceGrid })),
)
const VennDiagram = lazy(() =>
  import('./interactions/VennDiagram').then((m) => ({ default: m.VennDiagram })),
)
// Poker (Texas Hold'em revamp)
const HandRanker = lazy(() =>
  import('./interactions/HandRanker').then((m) => ({ default: m.HandRanker })),
)
const BoardDealer = lazy(() =>
  import('./interactions/BoardDealer').then((m) => ({ default: m.BoardDealer })),
)
const OutsOdds = lazy(() =>
  import('./interactions/OutsOdds').then((m) => ({ default: m.OutsOdds })),
)
const BettingRound = lazy(() =>
  import('./interactions/BettingRound').then((m) => ({ default: m.BettingRound })),
)
const FullHand = lazy(() =>
  import('./interactions/FullHand').then((m) => ({ default: m.FullHand })),
)

type InteractionRendererProps = InteractionProps & {
  step: ProblemStep
}

function InteractionFallback() {
  return <div className="py-6 text-center text-sm text-slate-400">Loading activity…</div>
}

export function InteractionRenderer({
  step,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled,
  initialSolved,
  allowRetry,
}: InteractionRendererProps) {
  const props = {
    onCorrect,
    onIncorrect,
    onAttemptReset,
    disabled,
    initialSolved,
    allowRetry,
  }

  let interaction: React.ReactNode

  switch (step.interaction) {
    case 'coin-flip-lab':
      interaction = <CoinFlipLab key={step.id} config={step.config} answer={step.answer} {...props} />
      break
    case 'sample-space-picker':
      interaction = (
        <SampleSpacePicker key={step.id} config={step.config} answer={step.answer} {...props} />
      )
      break
    case 'die-sample-space':
      interaction = <DieSampleSpace key={step.id} config={step.config} answer={step.answer} {...props} />
      break
    case 'fairness-scale':
      interaction = <FairnessScale key={step.id} config={step.config} answer={step.answer} {...props} />
      break
    case 'two-dice-grid':
      interaction = <TwoDiceGrid key={step.id} config={step.config} answer={step.answer} {...props} />
      break
    case 'coin-event-grid':
      interaction = <CoinEventGrid key={step.id} config={step.config} answer={step.answer} {...props} />
      break
    case 'counting-product':
      interaction = (
        <CountingProduct key={step.id} config={step.config} answer={step.answer} {...props} />
      )
      break
    case 'seat-permutation':
      interaction = (
        <SeatPermutation key={step.id} config={step.config} answer={step.answer} {...props} />
      )
      break
    case 'select-combination':
      interaction = (
        <SelectCombination key={step.id} config={step.config} answer={step.answer} {...props} />
      )
      break
    case 'coin-flip-probability':
      interaction = (
        <CoinFlipProbability key={step.id} config={step.config} answer={step.answer} {...props} />
      )
      break
    case 'birthday-simulation':
      interaction = (
        <BirthdaySimulation key={step.id} config={step.config} answer={step.answer} {...props} />
      )
      break
    case 'derangement-match':
      interaction = (
        <DerangementMatch key={step.id} config={step.config} answer={step.answer} {...props} />
      )
      break
    case 'venn-diagram':
      interaction = <VennDiagram key={step.id} config={step.config} answer={step.answer} {...props} />
      break
    case 'card-deck':
      interaction = <CardDeck key={step.id} config={step.config} answer={step.answer} {...props} />
      break
    case 'compare-events':
      interaction = (
        <CompareEvents key={step.id} config={step.config} answer={step.answer} {...props} />
      )
      break
    case 'hand-ranker':
      interaction = <HandRanker key={step.id} config={step.config} answer={step.answer} {...props} />
      break
    case 'board-dealer':
      interaction = <BoardDealer key={step.id} config={step.config} answer={step.answer} {...props} />
      break
    case 'outs-odds':
      interaction = <OutsOdds key={step.id} config={step.config} answer={step.answer} {...props} />
      break
    case 'betting-round':
      interaction = (
        <BettingRound key={step.id} config={step.config} answer={step.answer} {...props} />
      )
      break
    case 'full-hand':
      interaction = <FullHand key={step.id} config={step.config} answer={step.answer} {...props} />
      break
    default:
      return null
  }

  return <Suspense fallback={<InteractionFallback />}>{interaction}</Suspense>
}
