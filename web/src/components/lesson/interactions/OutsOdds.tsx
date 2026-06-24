import { useState } from 'react'
import type { OutsOddsAnswer, OutsOddsConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'

/**
 * STUB — `outs-odds` (design doc §5.4). Lesson 4 fleshes this out.
 * Sub-questions (config.ask, in order): outs → equity → potOdds → decision.
 * Reuse NumericAnswerInput + countMatches/percentMatches:
 *   outs           → countMatches(answer.outs)   (cross-check countOuts)
 *   equityPercent  → percentMatches with answer.equityTolerance (rule of 2 & 4 estimate)
 *   potOddsPercent → percentMatches on betToCall/(pot+betToCall)×100
 *   decision       → correct when sign(equity − requiredEquity) matches
 * Optional `empiricalTieIn` renders a CardDeck draw-tally for empirical feel.
 */
type OutsOddsProps = InteractionProps & {
  config: OutsOddsConfig
  answer: OutsOddsAnswer
}

export function OutsOdds({
  config,
  onCorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: OutsOddsProps) {
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
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">outs-odds</p>
        <p className="mt-1 text-sm font-semibold text-slate-700">Outs &amp; odds — coming soon</p>
        <p className="mt-1 text-xs text-slate-500">
          draw: {config.drawLabel} · street: <span className="font-mono">{config.street}</span> · ask:{' '}
          <span className="font-mono">{config.ask.join(', ')}</span>
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
