import { useMemo, useState } from 'react'
import { coinPatterns, countHeads, type CoinFlipProbabilityAnswer, type CoinFlipProbabilityConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { NumericAnswerInput } from './NumericAnswerInput'
import { countMatches, hasValidCountInput } from './numericAnswer'

type CoinFlipProbabilityProps = InteractionProps & {
  config: CoinFlipProbabilityConfig
  answer: CoinFlipProbabilityAnswer
}

function randomPattern(n: number): string {
  let s = ''
  for (let i = 0; i < n; i++) s += Math.random() < 0.5 ? 'H' : 'T'
  return s
}

export function CoinFlipProbability({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
}: CoinFlipProbabilityProps) {
  const { coins, targetHeads } = config
  const minTrials = config.minTrials ?? 12
  const allPatterns = useMemo(() => coinPatterns(coins), [coins])

  const [trials, setTrials] = useState<{ pattern: string; heads: number }[]>([])
  const [flipping, setFlipping] = useState(false)
  const [countInput, setCountInput] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const countLabel =
    config.countLabel ??
    `After experimenting, enter $|A|$ — how many patterns have exactly ${targetHeads} head${targetHeads === 1 ? '' : 's'}?`

  const hits = trials.filter((t) => t.heads === targetHeads).length
  const empirical =
    trials.length > 0 ? Math.round((hits / trials.length) * 100) : null

  function runTrial() {
    if (locked || flipping) return
    setFlipping(true)
    window.setTimeout(() => {
      const pattern = randomPattern(coins)
      setTrials((prev) => [...prev, { pattern, heads: countHeads(pattern) }].slice(-24))
      setFlipping(false)
    }, 400)
  }

  function runBatch() {
    if (locked || flipping) return
    setFlipping(true)
    window.setTimeout(() => {
      const batch = Array.from({ length: 5 }, () => {
        const pattern = randomPattern(coins)
        return { pattern, heads: countHeads(pattern) }
      })
      setTrials((prev) => [...prev, ...batch].slice(-24))
      setFlipping(false)
    }, 500)
  }

  const trialsReady = trials.length >= minTrials
  const canSubmit = trialsReady && hasValidCountInput(countInput) && !locked && !flipping

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    if (countMatches(countInput, answer.eventCount)) {
      setSolved(true)
      onCorrect()
    } else {
      onIncorrect?.()
    }
  }

  function handleRetry() {
    onAttemptReset?.()
    setSubmitted(false)
    setSolved(false)
    setTrials([])
    setCountInput('')
  }

  return (
    <div className="scene-3d space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">
          Reference: all {coins} coin patterns ({allPatterns.length} outcomes in $\\Omega$)
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {allPatterns.map((p) => {
            const h = countHeads(p)
            const match = h === targetHeads
            return (
              <span
                key={p}
                className={`rounded-lg px-2 py-1 font-mono text-xs font-bold ${
                  match ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {p}
              </span>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={runTrial}
          disabled={locked || flipping}
          className="chip-3d rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          Flip {coins} coins
        </button>
        <button
          type="button"
          onClick={runBatch}
          disabled={locked || flipping}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Run 5 trials
        </button>
      </div>

      <p className="text-center text-sm text-slate-600">
        Trials: <span className="font-bold">{trials.length}</span>
        {trials.length < minTrials && (
          <span className="text-slate-400"> · run at least {minTrials} to check</span>
        )}
        {empirical !== null && (
          <span>
            {' '}
            · empirical rate with {targetHeads} H:{' '}
            <span className="font-bold text-brand-700">{empirical}%</span>
          </span>
        )}
      </p>

      {trials.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {trials.map((t, i) => (
            <span
              key={`${i}-${t.pattern}`}
              className={`chip-3d rounded-full px-3 py-1 font-mono text-xs font-bold ${
                t.heads === targetHeads
                  ? 'bg-emerald-100 text-emerald-800 chip-3d--active'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.pattern}
            </span>
          ))}
        </div>
      )}

      {trialsReady && (
        <NumericAnswerInput
          id={`coin-flip-prob-${coins}-${targetHeads}`}
          label={countLabel}
          value={countInput}
          onChange={setCountInput}
          disabled={locked}
        />
      )}

      <CheckPanel
        canSubmit={canSubmit}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
      />
    </div>
  )
}
