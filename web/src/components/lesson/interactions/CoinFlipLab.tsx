import { useMemo, useRef, useState } from 'react'
import type { CoinFlipLabAnswer, CoinFlipLabConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { CoinFlipAnimation } from './CoinFlipAnimation'
import { NumericAnswerInput } from './NumericAnswerInput'
import { countMatches, hasValidCountInput } from './numericAnswer'

type CoinFlipLabProps = InteractionProps & {
  config: CoinFlipLabConfig
  answer: CoinFlipLabAnswer
}

function historyHasBothFaces(history: ('H' | 'T')[]) {
  return history.includes('H') && history.includes('T')
}

export function CoinFlipLab({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: CoinFlipLabProps) {
  const pickerMode = Boolean(config.options?.length && answer.selected)

  const [history, setHistory] = useState<('H' | 'T')[]>([])
  const historyRef = useRef<('H' | 'T')[]>([])
  const [showHeads, setShowHeads] = useState(true)
  const [flipping, setFlipping] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [countInput, setCountInput] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const flips = history.length

  const selectedList = useMemo(() => {
    if (!config.options) return []
    return [...selected].sort((a, b) => config.options!.indexOf(a) - config.options!.indexOf(b))
  }, [selected, config.options])

  const readyToCheckFlipOnly = useMemo(
    () =>
      historyHasBothFaces(history) && (!answer.minFlips || flips >= answer.minFlips),
    [history, answer.minFlips, flips],
  )

  function validateFlipOnly(flipHistory: ('H' | 'T')[]) {
    if (answer.requireBothFaces && !historyHasBothFaces(flipHistory)) return false
    if (answer.minFlips && flipHistory.length < answer.minFlips) return false
    return true
  }

  function selectionValid() {
    const expected = new Set(answer.selected ?? [])
    if (selected.size !== expected.size) return false
    for (const item of expected) if (!selected.has(item)) return false
    return true
  }

  function validatePickerMode() {
    if (!selectionValid()) return false
    if (answer.count !== undefined && !countMatches(countInput, answer.count)) return false
    return true
  }

  function flip() {
    if (flipping) return
    if (!pickerMode && locked) return

    const next: 'H' | 'T' = Math.random() < 0.5 ? 'H' : 'T'
    const nextHistory = [...historyRef.current, next].slice(-12)
    historyRef.current = nextHistory

    setHistory(nextHistory)
    setShowHeads(next === 'H')
    setFlipping(true)

    window.setTimeout(() => {
      setFlipping(false)
    }, 520)
  }

  function toggle(option: string) {
    if (locked) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(option)) next.delete(option)
      else next.add(option)
      return next
    })
  }

  function handleSubmit() {
    if (locked || flipping) return
    setSubmitted(true)
    const ok = pickerMode ? validatePickerMode() : validateFlipOnly(historyRef.current)
    if (ok) {
      setSolved(true)
      onCorrect()
    } else {
      onIncorrect?.()
    }
  }

  function handleRetry() {
    onAttemptReset?.()
    historyRef.current = []
    setHistory([])
    setSelected(new Set())
    setCountInput('')
    setSubmitted(false)
    setSolved(false)
    setShowHeads(true)
    setFlipping(false)
  }

  const canSubmit = pickerMode
    ? selected.size > 0 &&
      !locked &&
      !flipping &&
      (answer.count === undefined || hasValidCountInput(countInput))
    : readyToCheckFlipOnly && !locked && !flipping

  const pickerHelperText =
    config.pickerHelperText ??
    'Tap options to add or remove outcomes. Only results that can happen belong in Ω.'
  const listLabel = config.listLabel ?? 'Your list (Ω)'
  const countLabel =
    config.countLabel ?? 'Now enter |Ω| — how many outcomes are in the sample space?'

  if (pickerMode) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-center text-sm font-semibold text-slate-700">
            Flip to explore
          </p>
          <CoinFlipAnimation
            history={history}
            showHeads={showHeads}
            flipping={flipping}
            locked={false}
            onFlip={flip}
          />
        </div>

        <div className="border-t border-slate-200 pt-6 space-y-5">
          <p className="text-center text-sm font-semibold text-slate-700">
            Build the sample space Ω
          </p>
          <p className="text-center text-sm text-slate-600">{pickerHelperText}</p>

          <div className="scene-3d flex flex-wrap justify-center gap-3">
            {config.options!.map((option) => {
              const active = selected.has(option)
              const showOk = submitted && answer.selected!.includes(option)
              const showBad = submitted && active && !answer.selected!.includes(option)

              let cls =
                'chip-3d flex h-14 min-w-14 items-center justify-center rounded-2xl border-2 px-4 text-lg font-bold'
              if (showOk) cls += ' border-emerald-500 bg-emerald-100 chip-3d--active'
              else if (showBad) cls += ' border-red-400 bg-red-50'
              else if (active) cls += ' border-brand-600 bg-brand-100 chip-3d--active'
              else cls += ' border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50'

              return (
                <button
                  key={option}
                  type="button"
                  disabled={locked}
                  onClick={() => toggle(option)}
                  className={cls}
                  aria-pressed={active}
                >
                  {option}
                </button>
              )
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {listLabel}
            </p>
            {selectedList.length === 0 ? (
              <p className="text-sm text-slate-400">No outcomes selected yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedList.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg border border-brand-200 bg-white px-3 py-1 text-sm font-semibold text-brand-800"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>

          {answer.count !== undefined && (
            <NumericAnswerInput
              label={countLabel}
              value={countInput}
              onChange={setCountInput}
              disabled={locked}
            />
          )}
        </div>

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

  return (
    <div className="space-y-5">
      <CoinFlipAnimation
        history={history}
        showHeads={showHeads}
        flipping={flipping}
        locked={locked}
        onFlip={flip}
        requireBothFaces={config.requireBothFaces}
      />

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
