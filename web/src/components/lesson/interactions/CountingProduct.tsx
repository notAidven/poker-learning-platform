import { useState } from 'react'
import type { CountingProductAnswer, CountingProductConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { FractionAnswerInput } from './FractionAnswerInput'
import { NumericAnswerInput } from './NumericAnswerInput'
import { fractionMatches, hasValidFractionInput } from './fractionAnswer'
import { countMatches, hasValidCountInput } from './numericAnswer'

type CountingProductProps = InteractionProps & {
  config: CountingProductConfig
  answer: CountingProductAnswer
}

export function CountingProduct({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: CountingProductProps) {
  const [picks, setPicks] = useState<(string | null)[]>(() => config.stages.map(() => null))
  const [countInput, setCountInput] = useState('')
  const [fractionNum, setFractionNum] = useState('')
  const [fractionDen, setFractionDen] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const countLabel =
    config.countLabel ??
    'Now enter |Ω| — how many total combinations (multiply the options at each stage)?'
  const probabilityLabel =
    config.probabilityLabel ?? 'What is P(ω) for one outcome? (fraction)'
  const requiresProbability = answer.probability !== undefined

  function pick(stageIndex: number, option: string) {
    if (locked) return
    setPicks((prev) => {
      const next = [...prev]
      next[stageIndex] = option
      return next
    })
  }

  function probabilityValid() {
    if (!requiresProbability || !answer.probability) return true
    return fractionMatches(fractionNum, fractionDen, answer.probability)
  }

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    const allPicked = picks.every((p) => p !== null)
    if (allPicked && countMatches(countInput, answer.product) && probabilityValid()) {
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
    setPicks(config.stages.map(() => null))
    setCountInput('')
    setFractionNum('')
    setFractionDen('')
  }

  const allPicked = picks.every((p) => p !== null)
  const countReady = hasValidCountInput(countInput)
  const fractionReady = !requiresProbability || hasValidFractionInput(fractionNum, fractionDen)
  const canSubmit = allPicked && countReady && fractionReady && !locked

  return (
    <div className="space-y-5">
      {config.stages.map((stage, si) => (
        <div
          key={stage.label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-800">{stage.label}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {stage.options.map((opt) => {
              const active = picks[si] === opt
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={locked}
                  onClick={() => pick(si, opt)}
                  className={`chip-3d min-h-11 rounded-xl border px-4 py-2 text-sm font-medium ${
                    active
                      ? 'border-brand-600 bg-brand-100 chip-3d--active'
                      : 'border-slate-200 bg-white hover:border-brand-300'
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {allPicked && (
        <>
          <NumericAnswerInput
            id="counting-product-total"
            label={countLabel}
            value={countInput}
            onChange={setCountInput}
            disabled={locked}
          />
          {requiresProbability && countReady && (
            <FractionAnswerInput
              id="counting-product-probability"
              label={probabilityLabel}
              numerator={fractionNum}
              denominator={fractionDen}
              onNumeratorChange={setFractionNum}
              onDenominatorChange={setFractionDen}
              disabled={locked}
            />
          )}
        </>
      )}

      {!allPicked && (
        <p className="text-center text-xs text-slate-500">Pick one option in each row, then enter the total count</p>
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
