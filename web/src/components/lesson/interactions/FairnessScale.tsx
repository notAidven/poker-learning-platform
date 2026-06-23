import { useMemo, useState } from 'react'
import type { FairnessScaleAnswer, FairnessScaleConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'

type FairnessScaleProps = InteractionProps & {
  config: FairnessScaleConfig
  answer: FairnessScaleAnswer
}

const PERCENT_STEP = 0.01
const TOTAL_TOLERANCE = 0.02
const EACH_TOLERANCE = 0.005
const SNAP_PERCENT = 0.35

function clampPercent(percent: number) {
  return Math.max(0, Math.min(100, percent))
}

function percentToFraction(percent: number) {
  return Math.round(clampPercent(percent) * 100) / 10000
}

function formatPercent(fraction: number, digits = 1) {
  return `${(fraction * 100).toFixed(digits)}%`
}

export function FairnessScale({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
}: FairnessScaleProps) {
  const n = config.outcomes
  const target = answer.each
  const maxEqualPercent = 100 / n

  const [weights, setWeights] = useState<number[]>(() => Array(n).fill(0))
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const total = useMemo(() => weights.reduce((a, b) => a + b, 0), [weights])
  const averagePercent = (total * 100) / n

  function setWeight(i: number, percent: number) {
    if (locked) return
    setWeights((w) => {
      const next = [...w]
      const nearTarget = Math.abs(percent - target * 100) < SNAP_PERCENT
      next[i] = nearTarget ? target : percentToFraction(percent)
      return next
    })
  }

  function setAllEqual(percent: number) {
    if (locked) return
    const nearTarget = Math.abs(percent - target * 100) < SNAP_PERCENT
    setWeights(Array(n).fill(nearTarget ? target : percentToFraction(percent)))
  }

  function validate() {
    if (Math.abs(total - 1) > TOTAL_TOLERANCE) return false
    return weights.every((w) => Math.abs(w - target) < EACH_TOLERANCE)
  }

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    if (validate()) {
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
    setWeights(Array(n).fill(0))
  }

  const totalOk = Math.abs(total - 1) <= TOTAL_TOLERANCE

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm shadow-inner">
        Total probability:{' '}
        <span className={`font-bold ${totalOk ? 'text-emerald-600' : 'text-brand-700'}`}>
          {formatPercent(total, 1)}
        </span>
        <span className="text-slate-400"> / 100%</span>
        <span className="mt-1 block text-xs text-slate-500">
          Target per outcome: {formatPercent(target, 1)}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <p className="mb-3 text-sm font-medium text-slate-700">
          Set every outcome equally
        </p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={maxEqualPercent}
            step={PERCENT_STEP}
            value={averagePercent}
            disabled={locked}
            onChange={(e) => setAllEqual(parseFloat(e.target.value))}
            className="prob-slider flex-1"
            aria-label="Equal probability for each outcome"
          />
          <span className="w-16 text-right text-sm font-bold tabular-nums text-brand-700">
            {formatPercent(averagePercent / 100, 1)}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Drag until each outcome is about {formatPercent(target, 1)} and the total hits 100%.
        </p>
      </div>

      <div className="space-y-4">
        {weights.map((w, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="w-8 text-sm font-semibold text-slate-600">ω{i + 1}</span>
              <span className="text-sm font-bold tabular-nums text-slate-800">
                {formatPercent(w, 1)}
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-slate-200 shadow-inner">
              <div className="prob-bar-3d absolute inset-y-0 left-0" style={{ width: `${w * 100}%` }} />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={PERCENT_STEP}
              value={+(w * 100).toFixed(2)}
              disabled={locked}
              onChange={(e) => setWeight(i, parseFloat(e.target.value))}
              className="prob-slider w-full"
              aria-label={`Probability for outcome ${i + 1}`}
            />
          </div>
        ))}
      </div>

      <CheckPanel
        canSubmit={total > 0 && !locked}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
      />
    </div>
  )
}
