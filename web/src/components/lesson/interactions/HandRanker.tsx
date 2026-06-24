import { useState } from 'react'
import type { HandRankerAnswer, HandRankerConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'

type HandRankerProps = InteractionProps & {
  config: HandRankerConfig
  answer: HandRankerAnswer
}

/**
 * STUB — `hand-ranker` (design doc §5.2). Lesson 2 fleshes this out.
 * Modes: identify-category, order-categories, order-hands, build-hand, pick-best-five.
 * Validate against the pure evaluator (`lib/poker/handEvaluator.ts`):
 *   identify-category → pick === answer.category (cross-check evaluateBest(config.cards))
 *   order-*          → submitted order matches (use compareHands for tied hands)
 *   build-hand       → evaluateBest(selected).category === targetCategory
 *   pick-best-five   → compareHands(evaluateFive(selected), evaluateBest(config.cards)) === 0
 * Call onCorrect() only on a valid submission.
 */
export function HandRanker({
  config,
  onCorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: HandRankerProps) {
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
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">hand-ranker</p>
        <p className="mt-1 text-sm font-semibold text-slate-700">Hand ranker — coming soon</p>
        <p className="mt-1 text-xs text-slate-500">
          mode: <span className="font-mono">{config.mode}</span>
          {config.cards ? ` · ${config.cards.length} cards` : ''}
          {config.categories ? ` · ${config.categories.length} categories` : ''}
          {config.hands ? ` · ${config.hands.length} hands` : ''}
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
