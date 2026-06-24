import { useMemo, useState } from 'react'
import {
  coinPatterns,
  countHeads,
  type CoinEventGridAnswer,
  type CoinEventGridConfig,
} from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { FractionAnswerInput } from './FractionAnswerInput'
import { NumericAnswerInput } from './NumericAnswerInput'
import { fractionMatches, hasValidFractionInput } from './fractionAnswer'
import { countMatches, hasValidCountInput } from './numericAnswer'

type CoinEventGridProps = InteractionProps & {
  config: CoinEventGridConfig
  answer: CoinEventGridAnswer
}

export function CoinEventGrid({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: CoinEventGridProps) {
  const patterns = useMemo(() => coinPatterns(config.coins), [config.coins])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [countInput, setCountInput] = useState('')
  const [fractionNum, setFractionNum] = useState('')
  const [fractionDen, setFractionDen] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const countLabel =
    config.countLabel ?? 'Now enter |A| — how many outcomes are in this event?'
  const probabilityLabel =
    config.probabilityLabel ?? 'What is P(ω) for one outcome? (fraction)'
  const requiresProbability = answer.probability !== undefined

  function toggle(pattern: string) {
    if (locked) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(pattern)) next.delete(pattern)
      else next.add(pattern)
      return next
    })
  }

  function selectionValid() {
    const expected = new Set(answer.patterns)
    if (selected.size !== expected.size) return false
    for (const p of expected) if (!selected.has(p)) return false
    return true
  }

  function probabilityValid() {
    if (!requiresProbability || !answer.probability) return true
    return fractionMatches(fractionNum, fractionDen, answer.probability)
  }

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    if (selectionValid() && countMatches(countInput, answer.count) && probabilityValid()) {
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
    setSelected(new Set())
    setCountInput('')
    setFractionNum('')
    setFractionDen('')
  }

  const manipulableReady = selected.size > 0
  const countReady = hasValidCountInput(countInput)
  const fractionReady = !requiresProbability || hasValidFractionInput(fractionNum, fractionDen)
  const canSubmit = manipulableReady && countReady && fractionReady && !locked

  return (
    <div className="scene-3d space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {patterns.map((pattern) => {
          const active = selected.has(pattern)
          const heads = countHeads(pattern)
          const ok = submitted && answer.patterns.includes(pattern)
          const bad = submitted && active && !answer.patterns.includes(pattern)

          let cls =
            'chip-3d rounded-xl border px-3 py-3 text-center font-mono text-sm font-bold tracking-widest'
          if (ok) cls += ' border-emerald-500 bg-emerald-100 chip-3d--active'
          else if (bad) cls += ' border-red-400 bg-red-50'
          else if (active) cls += ' border-brand-600 bg-brand-100 chip-3d--active'
          else cls += ' border-slate-200 bg-white hover:border-brand-300'

          return (
            <button
              key={pattern}
              type="button"
              disabled={locked}
              onClick={() => toggle(pattern)}
              className={cls}
            >
              {pattern.split('').join(' ')}
              <span className="mt-1 block text-[10px] font-normal text-slate-400">
                {heads} head{heads === 1 ? '' : 's'}
              </span>
            </button>
          )
        })}
      </div>

      {manipulableReady && (
        <>
          <NumericAnswerInput
            id={`coin-event-count-${config.coins}`}
            label={countLabel}
            value={countInput}
            onChange={setCountInput}
            disabled={locked}
          />
          {/* Always render the required fraction field (do not gate behind a valid
              count) so Check can never be enabled while a validated field is hidden. */}
          {requiresProbability && (
            <FractionAnswerInput
              id={`coin-event-probability-${config.coins}`}
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
