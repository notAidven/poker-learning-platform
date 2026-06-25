import { lazy, Suspense } from 'react'
import type { ProblemStep } from '../../types/lesson'
import type { InteractionProps } from './interactions/types'

const CardDeck = lazy(() =>
  import('./interactions/CardDeck').then((m) => ({ default: m.CardDeck })),
)
const CompareEvents = lazy(() =>
  import('./interactions/CompareEvents').then((m) => ({ default: m.CompareEvents })),
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
const HandRankingLadder = lazy(() =>
  import('./interactions/HandRankingLadder').then((m) => ({ default: m.HandRankingLadder })),
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
    case 'hand-ranking-ladder':
      interaction = (
        <HandRankingLadder key={step.id} config={step.config} answer={step.answer} {...props} />
      )
      break
    default:
      return null
  }

  return <Suspense fallback={<InteractionFallback />}>{interaction}</Suspense>
}
