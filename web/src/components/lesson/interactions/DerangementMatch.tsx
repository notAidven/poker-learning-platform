import { useMemo, useState } from 'react'
import type { DerangementMatchAnswer, DerangementMatchConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { NumericAnswerInput } from './NumericAnswerInput'
import { countMatches, hasValidCountInput } from './numericAnswer'

type DerangementMatchProps = InteractionProps & {
  config: DerangementMatchConfig
  answer: DerangementMatchAnswer
}

function isDerangement(assignment: (string | null)[], labels: string[]): boolean {
  return assignment.every((label, i) => label !== null && label !== labels[i])
}

export function DerangementMatch({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: DerangementMatchProps) {
  const { labels } = config
  const n = labels.length
  const [slots, setSlots] = useState<(string | null)[]>(() => Array(n).fill(null))
  const [activeLabel, setActiveLabel] = useState<string | null>(labels[0] ?? null)
  const [countInput, setCountInput] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const subscriptN = String(n).replace(/[0-9]/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])
  const countLabel =
    config.countLabel ??
    `Enter D${subscriptN} — how many derangements (no letter in its matching envelope)?`

  const remaining = useMemo(
    () => labels.filter((l) => !slots.includes(l)),
    [labels, slots],
  )

  const allPlaced = slots.every(Boolean)
  const validDerangement = allPlaced && isDerangement(slots, labels)

  function assignSlot(index: number) {
    if (locked || !activeLabel) return
    if (slots[index]) return
    setSlots((prev) => {
      const next = [...prev]
      next[index] = activeLabel
      return next
    })
    const nextLabel = remaining.find((l) => l !== activeLabel)
    setActiveLabel(nextLabel ?? null)
  }

  function clear() {
    if (locked) return
    setSlots(Array(n).fill(null))
    setActiveLabel(labels[0] ?? null)
  }

  const canSubmit = allPlaced && hasValidCountInput(countInput) && !locked

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    if (validDerangement && countMatches(countInput, answer.derangementCount)) {
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
    setSlots(Array(n).fill(null))
    setActiveLabel(labels[0] ?? null)
    setCountInput('')
  }

  return (
    <div className="scene-3d space-y-5">
      <p className="text-center text-xs text-slate-500">
        A **derangement** puts every letter in the **wrong** envelope (A not in envelope A, etc.)
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {labels.map((label) => {
          const placed = slots.includes(label)
          const active = activeLabel === label && !placed
          return (
            <button
              key={label}
              type="button"
              disabled={locked || placed}
              onClick={() => setActiveLabel(label)}
              className={`chip-3d rounded-full border px-4 py-2 text-sm font-bold ${
                placed
                  ? 'border-slate-200 bg-slate-100 text-slate-400'
                  : active
                    ? 'border-brand-600 bg-brand-100 text-brand-800 chip-3d--active'
                    : 'border-slate-200 bg-white hover:border-brand-300'
              }`}
            >
              Letter {label}
            </button>
          )
        })}
      </div>

      <p className="text-center text-xs text-slate-500">Tap a letter, then tap an envelope</p>

      <div className="flex flex-wrap justify-center gap-3">
        {labels.map((label, i) => {
          const assigned = slots[i]
          const wrong = assigned && assigned !== label
          const right = assigned === label
          return (
            <button
              key={label}
              type="button"
              disabled={locked || Boolean(assigned)}
              onClick={() => assignSlot(i)}
              className={`chip-3d flex h-20 w-24 flex-col items-center justify-center rounded-2xl border-2 text-sm font-bold ${
                right
                  ? 'border-rose-400 bg-rose-50 text-rose-800'
                  : wrong
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 chip-3d--active'
                    : assigned
                      ? 'border-slate-300 bg-slate-50'
                      : 'border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-brand-400'
              }`}
            >
              <span className="text-[10px] font-normal text-slate-500">Env. {label}</span>
              {assigned ?? '—'}
            </button>
          )
        })}
      </div>

      {allPlaced && !validDerangement && submitted && (
        <p className="text-center text-sm text-rose-700">
          At least one letter is in its matching envelope — try a derangement
        </p>
      )}

      {allPlaced && (
        <NumericAnswerInput
          id={`derangement-${n}`}
          label={countLabel}
          value={countInput}
          onChange={setCountInput}
          disabled={locked}
        />
      )}

      {!locked && allPlaced && (
        <button type="button" onClick={clear} className="mx-auto block text-sm text-slate-500 underline">
          Reset envelopes
        </button>
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
