import { useState } from 'react'
import type { BirthdaySimulationAnswer, BirthdaySimulationConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { NumericAnswerInput } from './NumericAnswerInput'
import { countMatches, hasValidCountInput } from './numericAnswer'

type BirthdaySimulationProps = InteractionProps & {
  config: BirthdaySimulationConfig
  answer: BirthdaySimulationAnswer
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function randomBirthday(): { month: number; day: number } {
  const month = Math.floor(Math.random() * 12)
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
  const day = Math.floor(Math.random() * daysInMonth) + 1
  return { month, day }
}

function birthdayKey(b: { month: number; day: number }) {
  return `${b.month}-${b.day}`
}

function formatBirthday(b: { month: number; day: number }) {
  return `${MONTHS[b.month]} ${b.day}`
}

export function BirthdaySimulation({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: BirthdaySimulationProps) {
  const { people } = config
  const minTrials = config.minTrials ?? 15

  const [trials, setTrials] = useState<
    { birthdays: { month: number; day: number }[]; hasMatch: boolean }[]
  >([])
  const [current, setCurrent] = useState<{ month: number; day: number }[] | null>(null)
  const [animating, setAnimating] = useState(false)
  const [countInput, setCountInput] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const countLabel =
    config.countLabel ?? 'Enter your answer (whole number):'

  const matchRate =
    trials.length > 0
      ? Math.round((trials.filter((t) => t.hasMatch).length / trials.length) * 100)
      : null

  function runTrial() {
    if (locked || animating) return
    setAnimating(true)
    window.setTimeout(() => {
      const birthdays: { month: number; day: number }[] = []
      for (let i = 0; i < people; i++) birthdays.push(randomBirthday())
      const keys = birthdays.map(birthdayKey)
      const hasMatch = keys.length !== new Set(keys).size
      setCurrent(birthdays)
      setTrials((prev) => [...prev, { birthdays, hasMatch }].slice(-20))
      setAnimating(false)
    }, 450)
  }

  const trialsReady = trials.length >= minTrials
  const canSubmit = trialsReady && hasValidCountInput(countInput) && !locked && !animating

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    if (countMatches(countInput, answer.count)) {
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
    setTrials([])
    setCurrent(null)
    setCountInput('')
  }

  const duplicateKeys = current
    ? current.map(birthdayKey).filter((k, i, arr) => arr.indexOf(k) !== i)
    : []

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={runTrial}
        disabled={locked || animating}
        className="chip-3d mx-auto block rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        Simulate {people} random birthdays
      </button>

      {current && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-slate-800">Latest group</p>
          <div className="flex flex-wrap gap-2">
            {current.map((b, i) => {
              const key = birthdayKey(b)
              const dup = duplicateKeys.includes(key)
              return (
                <span
                  key={`${i}-${key}`}
                  className={`chip-3d rounded-xl px-3 py-2 text-xs font-semibold ${
                    dup
                      ? 'border-2 border-rose-500 bg-rose-50 text-rose-800 chip-3d--active'
                      : 'border border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  Person {i + 1}: {formatBirthday(b)}
                </span>
              )
            })}
          </div>
          <p
            className={`mt-3 text-sm font-semibold ${
              duplicateKeys.length > 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {duplicateKeys.length > 0 ? 'Match found — shared birthday!' : 'No shared birthday this trial'}
          </p>
        </div>
      )}

      <p className="text-center text-sm text-slate-600">
        Trials run: <span className="font-bold">{trials.length}</span>
        {trials.length < minTrials && (
          <span className="text-slate-400"> · need {minTrials} before checking</span>
        )}
        {matchRate !== null && (
          <span>
            {' '}
            · match rate: <span className="font-bold text-brand-700">{matchRate}%</span>
          </span>
        )}
      </p>

      {trialsReady && (
        <NumericAnswerInput
          id={`birthday-sim-${people}`}
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
