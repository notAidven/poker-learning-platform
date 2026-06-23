import { useMemo, useRef, useState } from 'react'
import type { CoinFlipLabAnswer, CoinFlipLabConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'

type CoinFlipLabProps = InteractionProps & {
  config: CoinFlipLabConfig
  answer: CoinFlipLabAnswer
}

function historyHasBothFaces(history: ('H' | 'T')[]) {
  return history.includes('H') && history.includes('T')
}

export function CoinFlipLab({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
}: CoinFlipLabProps) {
  const [history, setHistory] = useState<('H' | 'T')[]>([])
  const historyRef = useRef<('H' | 'T')[]>([])
  const [showHeads, setShowHeads] = useState(true)
  const [flipping, setFlipping] = useState(false)
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const flips = history.length
  const sawH = history.includes('H')
  const sawT = history.includes('T')

  const readyToCheck = useMemo(
    () => historyHasBothFaces(history) && (!answer.minFlips || flips >= answer.minFlips),
    [history, answer.minFlips, flips],
  )

  function validate(flipHistory: ('H' | 'T')[]) {
    if (answer.requireBothFaces && !historyHasBothFaces(flipHistory)) return false
    if (answer.minFlips && flipHistory.length < answer.minFlips) return false
    return true
  }

  function flip() {
    if (locked || flipping) return

    const next: 'H' | 'T' = Math.random() < 0.5 ? 'H' : 'T'
    const nextHistory = [...historyRef.current, next].slice(-12)
    historyRef.current = nextHistory

    setHistory(nextHistory)
    setShowHeads(next === 'H')
    setFlipping(true)

    window.setTimeout(() => {
      setFlipping(false)
    }, 520)
  }

  function handleSubmit() {
    if (locked || flipping) return
    setSubmitted(true)
    const ok = validate(historyRef.current)
    if (ok) {
      setSolved(true)
      onCorrect()
    } else {
      onIncorrect?.()
    }
  }

  function handleRetry() {
    onAttemptReset?.()
    historyRef.current = []
    setHistory([])
    setSubmitted(false)
    setSolved(false)
    setShowHeads(true)
    setFlipping(false)
  }

  return (
    <div className="space-y-5">
      <div className="scene-3d coin-scene">
        <button
          type="button"
          onClick={flip}
          disabled={locked || flipping}
          className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-4 disabled:opacity-60"
          aria-label="Flip coin"
        >
          <div
            className={`coin-3d ${flipping ? 'coin-3d--flip' : ''}`}
            style={
              flipping
                ? undefined
                : { transform: showHeads ? 'rotateY(0deg)' : 'rotateY(180deg)' }
            }
          >
            <div className="coin-face coin-face--heads">H</div>
            <div className="coin-face coin-face--tails">T</div>
          </div>
        </button>
      </div>

      <p className="text-center text-sm font-medium text-slate-600">
        Showing: <span className="font-bold text-amber-800">{showHeads ? 'H' : 'T'}</span>
        {' · '}
        Flips: <span className="font-bold text-brand-700">{flips}</span>
        {config.requireBothFaces && (
          <span className="ml-1 text-slate-500">
            · H {sawH ? '✓' : '—'} · T {sawT ? '✓' : '—'}
          </span>
        )}
      </p>

      {history.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {history.map((h, i) => (
            <span
              key={`${i}-${h}`}
              className={`chip-3d flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                h === 'H' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {h}
            </span>
          ))}
        </div>
      )}

      <CheckPanel
        canSubmit={readyToCheck && !locked && !flipping}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
      />
    </div>
  )
}
