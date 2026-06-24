import { useState } from 'react'
import type { FullHandAnswer, FullHandConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'

/**
 * STUB — `full-hand` capstone (design doc §5.6). Lesson 6 fleshes this out.
 * Play a complete hand vs. multiple AI opponents (`lib/poker/opponentAI.ts`):
 * post blinds → deal → bet each street → showdown → award pot. Correctness uses
 * authored decision checkpoints: onCorrect() fires when the hand completes AND the
 * learner met ≥ answer.passThreshold checkpoints (acceptableActions per checkpoint).
 * Set config.showResponsiblePlayNote on the L6 capstone to show the closing note.
 */
type FullHandProps = InteractionProps & {
  config: FullHandConfig
  answer: FullHandAnswer
}

export function FullHand({
  config,
  answer,
  onCorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: FullHandProps) {
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
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">full-hand</p>
        <p className="mt-1 text-sm font-semibold text-slate-700">Full hand capstone — coming soon</p>
        <p className="mt-1 text-xs text-slate-500">
          {config.opponents} opponent(s) · AI tier {config.aiTier} · {config.checkpoints.length}{' '}
          checkpoints · pass ≥ {answer.passThreshold}
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
