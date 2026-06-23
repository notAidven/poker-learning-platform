import { useMemo, useState } from 'react'
import type { SeatPermutationAnswer, SeatPermutationConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { NumericAnswerInput } from './NumericAnswerInput'
import { countMatches, hasValidCountInput } from './numericAnswer'

type SeatPermutationProps = InteractionProps & {
  config: SeatPermutationConfig
  answer: SeatPermutationAnswer
}

export function SeatPermutation({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: SeatPermutationProps) {
  const { guests } = config
  const n = guests.length
  const [seats, setSeats] = useState<(string | null)[]>(() => Array(n).fill(null))
  const [countInput, setCountInput] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)
  const [activeGuest, setActiveGuest] = useState<string | null>(guests[0] ?? null)

  const locked = disabled || submitted
  const countLabel =
    config.countLabel ??
    `Now enter how many total arrangements (${n}! — multiply ${n} down to 1):`

  const remaining = useMemo(
    () => guests.filter((g) => !seats.includes(g)),
    [guests, seats],
  )

  function assignSeat(index: number) {
    if (locked || !activeGuest) return
    if (seats[index]) return
    setSeats((prev) => {
      const next = [...prev]
      next[index] = activeGuest
      return next
    })
    const nextGuest = remaining.find((g) => g !== activeGuest)
    setActiveGuest(nextGuest ?? null)
  }

  function clear() {
    if (locked) return
    setSeats(Array(n).fill(null))
    setActiveGuest(guests[0] ?? null)
  }

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    const allSeated = seats.every(Boolean)
    if (allSeated && countMatches(countInput, answer.totalArrangements)) {
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
    setSeats(Array(n).fill(null))
    setActiveGuest(guests[0] ?? null)
    setCountInput('')
  }

  const allSeated = seats.every(Boolean)
  const canSubmit = allSeated && hasValidCountInput(countInput) && !locked

  return (
    <div className="scene-3d space-y-5">
      <div className="flex flex-wrap justify-center gap-2">
        {guests.map((g) => {
          const seated = seats.includes(g)
          const active = activeGuest === g && !seated
          return (
            <button
              key={g}
              type="button"
              disabled={locked || seated}
              onClick={() => setActiveGuest(g)}
              className={`chip-3d rounded-full border px-4 py-2 text-sm font-bold ${
                seated
                  ? 'border-slate-200 bg-slate-100 text-slate-400'
                  : active
                    ? 'border-brand-600 bg-brand-100 text-brand-800 chip-3d--active'
                    : 'border-slate-200 bg-white hover:border-brand-300'
              }`}
            >
              Guest {g}
            </button>
          )
        })}
      </div>

      <p className="text-center text-xs text-slate-500">Tap a guest, then tap an empty chair</p>

      <div className="flex justify-center gap-3">
        {seats.map((guest, i) => (
          <button
            key={i}
            type="button"
            disabled={locked || Boolean(guest)}
            onClick={() => assignSeat(i)}
            className={`chip-3d flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 text-sm font-bold ${
              guest
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 chip-3d--active'
                : 'border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-brand-400 hover:bg-brand-50'
            }`}
          >
            {guest ? guest : `#${i + 1}`}
          </button>
        ))}
      </div>

      {allSeated && (
        <NumericAnswerInput
          id={`seat-permutation-count-${n}`}
          label={countLabel}
          value={countInput}
          onChange={setCountInput}
          disabled={locked}
        />
      )}

      {!locked && allSeated && (
        <button type="button" onClick={clear} className="mx-auto block text-sm text-slate-500 underline">
          Reset chairs
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
