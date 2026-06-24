import { useState } from 'react'
import type { BettingRoundAnswer, BettingRoundConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'

/**
 * STUB — `betting-round` (design doc §5.5). Lesson 5 fleshes this out.
 * One street of betting vs. one AI villain (`lib/poker/opponentAI.ts` → decideAI).
 * Tasks: choose-action | choose-size | ev-of-call.
 *   choose-action → matches answer.action (highest-EV action for the spot)
 *   choose-size   → chosen fraction within answer.sizeTolerance of answer.sizeFraction
 *   ev-of-call    → entered EV within answer.evTolerance of answer.evChips (sign → call/fold)
 * Call onCorrect() only on a valid submission.
 */
type BettingRoundProps = InteractionProps & {
  config: BettingRoundConfig
  answer: BettingRoundAnswer
}

export function BettingRound({
  config,
  onCorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: BettingRoundProps) {
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  function handleSubmit() {
    if (disabled || submitted) return
    setSubmitted(true)
    setSolved(true)
    onCorrect()
  }

  function handleRetry() {
    onAttemptReset?.()
    setSubmitted(false)
    setSolved(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">betting-round</p>
        <p className="mt-1 text-sm font-semibold text-slate-700">Betting round — coming soon</p>
        <p className="mt-1 text-xs text-slate-500">
          task: <span className="font-mono">{config.task}</span> · street:{' '}
          <span className="font-mono">{config.street}</span> · pot: {config.pot}
        </p>
      </div>
      <CheckPanel
        canSubmit={!disabled && !submitted}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        allowRetry={allowRetry}
      />
    </div>
  )
}
