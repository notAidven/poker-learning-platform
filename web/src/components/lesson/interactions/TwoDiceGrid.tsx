import { useMemo, useState } from 'react'
import {
  cellKey,
  parseCellKey,
  type TwoDiceGridAnswer,
  type TwoDiceGridConfig,
} from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { NumericAnswerInput } from './NumericAnswerInput'
import { countMatches, hasValidCountInput } from './numericAnswer'

type TwoDiceGridProps = InteractionProps & {
  config: TwoDiceGridConfig
  answer: TwoDiceGridAnswer
}

export function TwoDiceGrid({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
}: TwoDiceGridProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [countInput, setCountInput] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const countLabel =
    config.countLabel ?? 'Now enter |A| — how many outcomes are in this event?'

  const rows = useMemo(() => {
    return [1, 2, 3, 4, 5, 6].map((d1) =>
      [1, 2, 3, 4, 5, 6].map((d2) => ({
        key: cellKey(d1, d2),
        d1,
        d2,
        sum: d1 + d2,
      })),
    )
  }, [])

  function toggle(key: string) {
    if (locked) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function selectionValid() {
    const expected = new Set(answer.cells)
    if (selected.size !== expected.size) return false
    for (const k of expected) if (!selected.has(k)) return false
    if (config.matchSum !== undefined) {
      for (const k of selected) {
        const [a, b] = parseCellKey(k)
        if (a + b !== config.matchSum) return false
      }
    }
    return true
  }

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    if (selectionValid() && countMatches(countInput, answer.eventCount)) {
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

  const manipulableReady = selected.size > 0
  const canSubmit = manipulableReady && hasValidCountInput(countInput) && !locked

  return (
    <div className="grid-3d-scene space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-2 shadow-inner">
        <table className="w-full min-w-[20rem] border-collapse text-center text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="p-1" />
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <th key={d} className="p-1 font-semibold">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                <td className="p-1 font-semibold text-slate-500">{ri + 1}</td>
                {row.map(({ key, d1, d2, sum }) => {
                  const active = selected.has(key)
                  const ok = submitted && answer.cells.includes(key)
                  const bad = submitted && active && !answer.cells.includes(key)

                  let cls =
                    'grid-cell-3d mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-lg border font-bold'
                  if (ok) cls += ' border-emerald-500 bg-emerald-100 grid-cell-3d--selected'
                  else if (bad) cls += ' border-red-400 bg-red-50'
                  else if (active) cls += ' border-brand-600 bg-brand-100 grid-cell-3d--selected'
                  else cls += ' border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50'

                  return (
                    <td key={key} className="p-0.5">
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => toggle(key)}
                        className={cls}
                      >
                        <span className="text-[10px] leading-none">
                          {d1},{d2}
                        </span>
                        <span className="text-[9px] font-normal text-slate-400">={sum}</span>
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {manipulableReady && (
        <NumericAnswerInput
          id="two-dice-event-count"
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
