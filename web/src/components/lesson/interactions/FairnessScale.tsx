import { useMemo, useState } from 'react'
import type { FairnessScaleAnswer, FairnessScaleConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { DieFace } from './DieFace'
import { FractionAnswerInput } from './FractionAnswerInput'
import { NumericAnswerInput } from './NumericAnswerInput'
import { fractionMatches, hasValidFractionInput } from './fractionAnswer'
import { hasValidCountInput, percentMatches } from './numericAnswer'

type FairnessScaleProps = InteractionProps & {
  config: FairnessScaleConfig
  answer: FairnessScaleAnswer
}

const TOTAL_TOLERANCE = 0.02
const EACH_TOLERANCE = 0.005
const STEP_DEFAULT = 0.005
const EPS = 1e-4

const FAIR_BAR_STYLE = {
  background: 'linear-gradient(180deg, #34d399 0%, #10b981 50%, #059669 100%)',
  boxShadow:
    'inset 0 2px 4px rgba(255, 255, 255, 0.35), 0 4px 0 #047857, 0 6px 12px rgba(5, 150, 105, 0.25)',
} as const

function formatPercent(fraction: number, digits = 1) {
  return `${(fraction * 100).toFixed(digits)}%`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step
}

function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0)
}

function faceIsBalanced(weight: number, target: number) {
  return Math.abs(weight - target) < EACH_TOLERANCE
}

function weightsAreFair(weights: number[], target: number) {
  if (Math.abs(sum(weights) - 1) > TOTAL_TOLERANCE) return false
  return weights.every((w) => faceIsBalanced(w, target))
}

function argMax(values: number[]) {
  let best = 0
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > values[best]) best = i
  }
  return best
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M5 10l3 3 7-7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * "Make the die fair" interaction.
 *
 * Three mechanics share one config/answer shape:
 *  - `rebalance` (default): the learner drags each face's probability weight until
 *    all six are equal and the total reaches 100% — real allocation, no magic button.
 *  - `identify`: a fixed loaded die; the learner reasons about it (taps the most
 *    likely face, optionally enters its probability as a reduced fraction).
 *  - `equalize-button`: the legacy one-tap "split evenly" mechanic, kept so existing
 *    content keeps working until it migrates to a richer mode.
 */
export function FairnessScale(props: FairnessScaleProps) {
  const mode = props.config.mode ?? 'rebalance'
  if (mode === 'equalize-button') return <EqualizeButtonMode {...props} />
  if (mode === 'identify') return <IdentifyMode {...props} />
  return <RebalanceMode {...props} />
}

function useFaceLabels(config: FairnessScaleConfig) {
  const n = config.outcomes
  return useMemo(
    () => config.faceLabels ?? Array.from({ length: n }, (_, i) => String(i + 1)),
    [config.faceLabels, n],
  )
}

function useInitialWeights(config: FairnessScaleConfig, fallback: number) {
  const n = config.outcomes
  return useMemo(() => {
    if (config.initialWeights && config.initialWeights.length === n) {
      return config.initialWeights
    }
    return Array(n).fill(fallback)
  }, [config.initialWeights, n, fallback])
}

// --- rebalance mode: the primary, genuinely-interactive mechanic ---------------

function RebalanceMode({
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
  const step = config.step ?? STEP_DEFAULT
  const requireCount = config.requireCount ?? answer.countAnswer !== undefined

  const faceLabels = useFaceLabels(config)
  const initialWeights = useInitialWeights(config, 0)

  // Slider range with a little headroom above the heaviest face / fair share so
  // every reachable value (including the fair target) is comfortably draggable.
  const sliderMax = useMemo(
    () => clamp(Math.max(0.5, target * 1.5, ...initialWeights), step, 1),
    [initialWeights, target, step],
  )

  const [weights, setWeights] = useState<number[]>(() =>
    initialSolved ? Array(n).fill(target) : [...initialWeights],
  )
  const [countInput, setCountInput] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const total = sum(weights)
  const totalOk = Math.abs(total - 1) <= TOTAL_TOLERANCE
  const fair = weightsAreFair(weights, target)
  const balancedCount = weights.filter((w) => faceIsBalanced(w, target)).length
  const loadedStart = useMemo(
    () => initialWeights.some((w) => !faceIsBalanced(w, target)),
    [initialWeights, target],
  )

  const helperText =
    config.rebalanceLabel ??
    `Drag each face’s weight until all ${n} are equal and the total reaches 100%.`
  const countLabel =
    config.countLabel ??
    'The die is fair. What percent does one face get? (Round to a whole number.)'

  function setFace(index: number, raw: number) {
    if (locked) return
    const value = clamp(roundToStep(raw, step), 0, sliderMax)
    setWeights((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function nudge(index: number, direction: 1 | -1) {
    setFace(index, (weights[index] ?? 0) + direction * step)
  }

  function validate() {
    if (!weightsAreFair(weights, target)) return false
    if (requireCount && answer.countAnswer !== undefined) {
      return percentMatches(countInput, answer.countAnswer)
    }
    return true
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
    setWeights([...initialWeights])
    setCountInput('')
  }

  const canSubmit =
    fair &&
    (!requireCount || (hasValidCountInput(countInput) && answer.countAnswer !== undefined)) &&
    !locked

  return (
    <div className="space-y-5">
      {loadedStart && !fair && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          This die is <strong>loaded</strong> — the weights aren’t equal. Rebalance every
          face so each outcome in Ω is equally likely.
        </p>
      )}

      {fair && (
        <p
          className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-900"
          style={{ animation: 'fadeIn 0.3s ease' }}
        >
          Balanced! Every face carries the same weight:{' '}
          <strong>
            P(ω) = 1/{n} ≈ {formatPercent(target, 1)}
          </strong>
          .
        </p>
      )}

      <p className="text-center text-sm text-slate-600">{helperText}</p>

      <div
        className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm shadow-inner"
        role="status"
        aria-live="polite"
      >
        Total probability:{' '}
        <span className={`font-bold tabular-nums ${totalOk ? 'text-emerald-600' : 'text-brand-700'}`}>
          {formatPercent(total, 1)}
        </span>
        <span className="text-slate-400"> / 100%</span>
        <span className="mt-1 block text-xs text-slate-500">
          {balancedCount} of {n} faces balanced
        </span>
      </div>

      <ul className="space-y-2.5">
        {weights.map((w, i) => {
          const balanced = faceIsBalanced(w, target)
          const fillScale = sliderMax > 0 ? clamp(w / sliderMax, 0, 1) : 0
          return (
            <li
              key={i}
              className="rounded-2xl bg-white/70 p-3 shadow-sm ring-1 ring-slate-100 focus-within:ring-2 focus-within:ring-brand-300"
            >
              <div className="flex items-center gap-3">
                <DieFace value={i + 1} size="sm" />
                <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-slate-200 shadow-inner">
                  <div
                    className="prob-bar-3d absolute inset-y-0 left-0"
                    style={{
                      transform: `scaleX(${fillScale})`,
                      ...(balanced ? FAIR_BAR_STYLE : null),
                    }}
                  />
                </div>
                <span
                  className={`flex w-[4.5rem] items-center justify-end gap-1 text-sm font-bold tabular-nums ${
                    balanced ? 'text-emerald-600' : 'text-slate-800'
                  }`}
                >
                  {formatPercent(w, 1)}
                  {balanced && <CheckGlyph />}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Decrease weight on face ${faceLabels[i]}`}
                  disabled={locked || w <= EPS}
                  onClick={() => nudge(i, -1)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold leading-none text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                >
                  −
                </button>
                <input
                  type="range"
                  min={0}
                  max={sliderMax}
                  step={step}
                  value={w}
                  disabled={locked}
                  onChange={(e) => setFace(i, Number(e.target.value))}
                  className="prob-slider min-w-0 flex-1"
                  aria-label={`Probability weight for face ${faceLabels[i]}`}
                  aria-valuetext={`${formatPercent(w, 1)}${balanced ? ', balanced' : ''}`}
                />
                <button
                  type="button"
                  aria-label={`Increase weight on face ${faceLabels[i]}`}
                  disabled={locked || w >= sliderMax - EPS}
                  onClick={() => nudge(i, 1)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold leading-none text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </li>
          )
        })}
      </ul>

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

// --- identify mode: reason about a fixed loaded die ----------------------------

function IdentifyMode({
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
  const faceLabels = useFaceLabels(config)
  const initialWeights = useInitialWeights(config, 1 / n)

  const expectedFace = answer.mostLikelyFace ?? argMax(initialWeights) + 1
  const requireProbability = answer.identifyProbability !== undefined
  const displayMax = useMemo(() => Math.max(EPS, ...initialWeights), [initialWeights])

  const [selected, setSelected] = useState<number | null>(initialSolved ? expectedFace : null)
  const [num, setNum] = useState('')
  const [den, setDen] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted

  const identifyLabel = config.identifyLabel ?? 'Which face is most likely? Tap it.'
  const probabilityLabel =
    config.probabilityLabel ?? 'What is P of that face? Enter it as a reduced fraction.'

  function validate() {
    if (selected !== expectedFace) return false
    if (requireProbability && answer.identifyProbability) {
      return fractionMatches(num, den, answer.identifyProbability)
    }
    return true
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
    setSelected(null)
    setNum('')
    setDen('')
  }

  const canSubmit =
    selected !== null &&
    (!requireProbability || hasValidFractionInput(num, den)) &&
    !locked

  return (
    <div className="space-y-5">
      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
        This die is <strong>loaded</strong> — the faces aren’t equally likely. Study the
        weights, then answer.
      </p>

      <ul className="space-y-2.5">
        {initialWeights.map((w, i) => {
          const fillScale = displayMax > 0 ? clamp(w / displayMax, 0, 1) : 0
          return (
            <li key={i} className="flex items-center gap-3">
              <DieFace value={i + 1} size="sm" />
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-slate-200 shadow-inner">
                <div
                  className="prob-bar-3d absolute inset-y-0 left-0"
                  style={{ transform: `scaleX(${fillScale})` }}
                />
              </div>
              <span className="w-[4.5rem] text-right text-sm font-bold tabular-nums text-slate-800">
                {formatPercent(w, 1)}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="text-center text-sm font-semibold text-slate-700">{identifyLabel}</p>

      <div className="scene-3d flex flex-wrap justify-center gap-3">
        {faceLabels.map((_, i) => {
          const face = i + 1
          const active = selected === face
          const showOk = submitted && face === expectedFace
          const showBad = submitted && active && face !== expectedFace

          let cls = 'die-face-chip'
          if (showOk) cls += ' die-face-chip--ok'
          else if (showBad) cls += ' die-face-chip--bad'
          else if (active) cls += ' die-face-chip--active'

          return (
            <button
              key={face}
              type="button"
              disabled={locked}
              onClick={() => setSelected(face)}
              className={cls}
              aria-label={`Face ${faceLabels[i]}`}
              aria-pressed={active}
            >
              <DieFace value={face} size="md" />
            </button>
          )
        })}
      </div>

      {requireProbability && selected !== null && (
        <FractionAnswerInput
          id="fairness-identify-probability"
          label={probabilityLabel}
          numerator={num}
          denominator={den}
          onNumeratorChange={setNum}
          onDenominatorChange={setDen}
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

// --- legacy equalize-button mode (kept backward compatible) --------------------

function EqualizeButtonMode({
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

  const faceLabels = useFaceLabels(config)
  const initialWeights = useInitialWeights(config, 0)
  const fairWeights = useMemo(() => Array(n).fill(target), [n, target])

  const [equalized, setEqualized] = useState(initialSolved)
  const [countInput, setCountInput] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const weights = equalized ? fairWeights : initialWeights
  const total = sum(weights)
  const fair = weightsAreFair(weights, target)
  const totalOk = Math.abs(total - 1) <= TOTAL_TOLERANCE
  const loadedDie = initialWeights.some((w) => !faceIsBalanced(w, target))

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

      <ul className="space-y-3">
        {weights.map((w, i) => (
          <li key={i} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <DieFace value={i + 1} size="sm" />
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
          </li>
        ))}
      </ul>

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
