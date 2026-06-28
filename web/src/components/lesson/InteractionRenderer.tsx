import { lazy, Suspense } from 'react'
import type { ProblemStep } from '../../types/lesson'
import type { InteractionProps } from './interactions/types'

// Each PascalCase widget now has a lowercase pure-grader twin (e.g. `outsOdds.ts`
// beside `OutsOdds.tsx`), so the import needs the explicit `.tsx` extension to
// disambiguate the two on case-insensitive filesystems (allowImportingTsExtensions).
const CardDeck = lazy(() =>
  import('./interactions/CardDeck.tsx').then((m) => ({ default: m.CardDeck })),
)
const CompareEvents = lazy(() =>
  import('./interactions/CompareEvents.tsx').then((m) => ({ default: m.CompareEvents })),
)
// Poker (Texas Hold'em revamp)
const HandRanker = lazy(() =>
  import('./interactions/HandRanker.tsx').then((m) => ({ default: m.HandRanker })),
)
const BoardDealer = lazy(() =>
  import('./interactions/BoardDealer.tsx').then((m) => ({ default: m.BoardDealer })),
)
const OutsOdds = lazy(() =>
  import('./interactions/OutsOdds.tsx').then((m) => ({ default: m.OutsOdds })),
)
const BettingRound = lazy(() =>
  import('./interactions/BettingRound.tsx').then((m) => ({ default: m.BettingRound })),
)
const HandRankingLadder = lazy(() =>
  import('./interactions/HandRankingLadder').then((m) => ({ default: m.HandRankingLadder })),
)
const PreflopHand = lazy(() =>
  import('./interactions/PreflopHand.tsx').then((m) => ({ default: m.PreflopHand })),
)
const RangeGrid = lazy(() =>
  import('./interactions/RangeGrid.tsx').then((m) => ({ default: m.RangeGrid })),
)

type InteractionRendererProps = InteractionProps & {
  step: ProblemStep
}

function InteractionFallback() {
  return <div className="py-6 text-center text-sm text-night-500">Loading activity…</div>
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
    case 'preflop-hand':
      interaction = (
        <PreflopHand key={step.id} config={step.config} answer={step.answer} {...props} />
      )
      break
    case 'range-grid':
      interaction = <RangeGrid key={step.id} config={step.config} answer={step.answer} {...props} />
      break
    default:
      return null
  }

  return <Suspense fallback={<InteractionFallback />}>{interaction}</Suspense>
}
