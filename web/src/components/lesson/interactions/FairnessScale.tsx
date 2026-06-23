import { useMemo, useState } from 'react'
import type { FairnessScaleAnswer, FairnessScaleConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { NumericAnswerInput } from './NumericAnswerInput'
import { hasValidCountInput, percentMatches } from './numericAnswer'

type FairnessScaleProps = InteractionProps & {
  config: FairnessScaleConfig
  answer: FairnessScaleAnswer
}

const TOTAL_TOLERANCE = 0.02
const EACH_TOLERANCE = 0.005

function formatPercent(fraction: number, digits = 1) {
  return `${(fraction * 100).toFixed(digits)}%`
}

function weightsAreFair(weights: number[], target: number) {
  const total = weights.reduce((a, b) => a + b, 0)
  if (Math.abs(total - 1) > TOTAL_TOLERANCE) return false
  return weights.every((w) => Math.abs(w - target) < EACH_TOLERANCE)
}

export function FairnessScale({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: FairnessScaleProps) {
  const n = config.outcomes
  const target = answer.each
  const requireCount = config.requireCount ?? answer.countAnswer !== undefined

  const faceLabels = useMemo(
    () => config.faceLabels ?? Array.from({ length: n }, (_, i) => String(i + 1)),
    [config.faceLabels, n],
  )

  const initialWeights = useMemo(() => {
    if (config.initialWeights && config.initialWeights.length === n) {
      return config.initialWeights
    }
    return Array(n).fill(0)
  }, [config.initialWeights, n])

  const fairWeights = useMemo(() => Array(n).fill(target), [n, target])

  const [equalized, setEqualized] = useState(initialSolved)
  const [countInput, setCountInput] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const weights = equalized ? fairWeights : initialWeights
  const total = useMemo(() => weights.reduce((a, b) => a + b, 0), [weights])
  const fair = weightsAreFair(weights, target)
  const totalOk = Math.abs(total - 1) <= TOTAL_TOLERANCE
  const loadedDie = initialWeights.some((w) => Math.abs(w - target) > EACH_TOLERANCE)

  const countLabel =
    config.countLabel ??
    'The die is fair. What percent does one face get? (Round to a whole number.)'

  function validate() {
    if (!weightsAreFair(weights, target)) return false
    if (requireCount && answer.countAnswer !== undefined) {
      return percentMatches(countInput, answer.countAnswer)
    }
    return true
  }

  function handleEqualize() {
    if (locked || equalized) return
    setEqualized(true)
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
    setEqualized(false)
    setCountInput('')
  }

  const canSubmit =
    fair &&
    (!requireCount || (hasValidCountInput(countInput) && answer.countAnswer !== undefined)) &&
    !locked

  return (
    <div className="space-y-5">
      {loadedDie && !equalized && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          This die is <strong>loaded</strong> — face {faceLabels[n - 1]} carries extra weight.
        </p>
      )}

      {equalized && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-900">
          Probability is split <strong>evenly</strong> across all {n} faces in Ω.
        </p>
      )}

      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm shadow-inner">
        Total probability:{' '}
        <span className={`font-bold ${totalOk ? 'text-emerald-600' : 'text-brand-700'}`}>
          {formatPercent(total, 1)}
        </span>
        <span className="text-slate-400"> / 100%</span>
      </div>

      <div className="space-y-3">
        {weights.map((w, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
                {faceLabels[i]}
              </span>
              <span className="text-sm font-bold tabular-nums text-slate-800">
                {formatPercent(w, 1)}
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-slate-200 shadow-inner">
              <div
                className="prob-bar-3d absolute inset-y-0 left-0"
                style={{ transform: `scaleX(${w})` }}
              />
            </div>
          </div>
        ))}
      </div>

      {!equalized && (
        <button
          type="button"
          disabled={locked}
          onClick={handleEqualize}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-40"
        >
          Split evenly across all {n} faces
        </button>
      )}

      {fair && requireCount && (
        <NumericAnswerInput
          id="fairness-scale-percent"
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
        allowRetry={allowRetry}
      />
    </div>
  )
}
