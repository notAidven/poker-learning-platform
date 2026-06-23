import { useMemo, useState } from 'react'
import {
  cellKey,
  parseCellKey,
  type TwoDiceGridAnswer,
  type TwoDiceGridConfig,
} from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { DieFace } from './DieFace'
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
  allowRetry = true,
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
                  <span className="two-dice-header-face">
                    <DieFace value={d} size="xs" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                <td className="p-1 font-semibold text-slate-500">
                  <span className="two-dice-header-face">
                    <DieFace value={ri + 1} size="xs" />
                  </span>
                </td>
                {row.map(({ key, d1, d2, sum }) => {
                  const active = selected.has(key)
                  const ok = submitted && answer.cells.includes(key)
                  const bad = submitted && active && !answer.cells.includes(key)

                  let cls = 'grid-cell-3d mx-auto flex items-center justify-center'
                  if (ok) cls += ' grid-cell-3d--ok'
                  else if (bad) cls += ' grid-cell-3d--bad'
                  else if (active) cls += ' grid-cell-3d--selected'

                  return (
                    <td key={key} className="p-0.5">
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => toggle(key)}
                        className={cls}
                        aria-label={`Outcome (${d1}, ${d2}), sum ${sum}`}
                        aria-pressed={active}
                      >
                        <span className="grid-cell-3d__sum">{sum}</span>
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
        allowRetry={allowRetry}
      />
    </div>
  )
}
