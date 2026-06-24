import { useState } from 'react'
import type { BoardDealerAnswer, BoardDealerConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'

/**
 * STUB — `board-dealer` (design doc §5.3). Lessons 1 & 3 (and L6) flesh this out.
 * Deal hole + community cards street by street (reuse CardDeck's deal/flip CSS).
 * Experiential gate: require revealing `answer.minStreetsRevealed` streets.
 * When `config.askBestHandAt` is set, show a category picker per street and validate
 * against evaluateHoldem(hole, boardSoFar) === answer.bestHandByStreet[street].
 * Call onCorrect() only when the gate / best-hand answers are satisfied.
 */
type BoardDealerProps = InteractionProps & {
  config: BoardDealerConfig
  answer: BoardDealerAnswer
}

export function BoardDealer({
  config,
  onCorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: BoardDealerProps) {
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

  const streets = config.streets ?? ['preflop', 'flop', 'turn', 'river']

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">board-dealer</p>
        <p className="mt-1 text-sm font-semibold text-slate-700">Board dealer — coming soon</p>
        <p className="mt-1 text-xs text-slate-500">
          streets: <span className="font-mono">{streets.join(' → ')}</span>
          {config.opponents ? ` · ${config.opponents} opponent(s)` : ''}
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
