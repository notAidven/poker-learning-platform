import { useMemo, useState } from 'react'
import type { SelectCombinationAnswer, SelectCombinationConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { NumericAnswerInput } from './NumericAnswerInput'
import { countMatches, hasValidCountInput } from './numericAnswer'

type SelectCombinationProps = InteractionProps & {
  config: SelectCombinationConfig
  answer: SelectCombinationAnswer
}

export function SelectCombination({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
}: SelectCombinationProps) {
  const { items, selectCount } = config
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [countInput, setCountInput] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const countLabel =
    config.countLabel ??
    `Order does not matter — enter $\\binom{${items.length}}{${selectCount}}$ (how many ways to choose ${selectCount}):`

  const atCapacity = selected.size >= selectCount

  function toggle(item: string) {
    if (locked) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(item)) next.delete(item)
      else if (next.size < selectCount) next.add(item)
      return next
    })
  }

  const selectionReady = selected.size === selectCount

  const canSubmit = useMemo(
    () => selectionReady && hasValidCountInput(countInput) && !locked,
    [selectionReady, countInput, locked],
  )

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    if (selectionReady && countMatches(countInput, answer.combinationCount)) {
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
  }

  return (
    <div className="space-y-5">
      <p className="text-center text-xs text-slate-500">
        Tap to select exactly {selectCount} — any {selectCount} will do; we are counting combinations
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {items.map((item) => {
          const active = selected.has(item)
          const full = atCapacity && !active
          return (
            <button
              key={item}
              type="button"
              disabled={locked || full}
              onClick={() => toggle(item)}
              className={`chip-3d rounded-xl border px-4 py-3 text-sm font-bold transition ${
                active
                  ? 'border-brand-600 bg-brand-100 text-brand-800 chip-3d--active'
                  : full
                    ? 'border-slate-100 bg-slate-50 text-slate-300'
                    : 'border-slate-200 bg-white hover:border-brand-300'
              }`}
            >
              {item}
            </button>
          )
        })}
      </div>

      <p className="text-center text-sm text-slate-600">
        Selected: <span className="font-bold text-brand-700">{selected.size}</span> / {selectCount}
      </p>

      {selectionReady && (
        <NumericAnswerInput
          id={`select-combination-${items.length}-${selectCount}`}
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
