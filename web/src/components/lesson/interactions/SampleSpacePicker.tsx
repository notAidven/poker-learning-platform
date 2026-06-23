import { useMemo, useRef, useState } from 'react'
import type { SampleSpacePickerAnswer, SampleSpacePickerConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { CoinFlipAnimation } from './CoinFlipAnimation'

type SampleSpacePickerProps = InteractionProps & {
  config: SampleSpacePickerConfig
  answer: SampleSpacePickerAnswer
}

export function SampleSpacePicker({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: SampleSpacePickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const [history, setHistory] = useState<('H' | 'T')[]>([])
  const historyRef = useRef<('H' | 'T')[]>([])
  const [showHeads, setShowHeads] = useState(true)
  const [flipping, setFlipping] = useState(false)

  const locked = disabled || submitted
  const listLabel = config.listLabel ?? 'Your list (Ω)'
  const helperText =
    config.helperText ??
    'Tap options to add or remove outcomes. Only results that can happen belong in Ω.'
  const showCoinFlip = config.showCoinFlip ?? false

  const selectedList = useMemo(
    () => [...selected].sort((a, b) => config.options.indexOf(a) - config.options.indexOf(b)),
    [selected, config.options],
  )

  function flip() {
    if (flipping) return

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

  function selectionValid() {
    const expected = new Set(answer.selected)
    if (selected.size !== expected.size) return false
    for (const item of expected) if (!selected.has(item)) return false
    return true
  }

  function handleSubmit() {
    if (locked || flipping) return
    setSubmitted(true)
    if (selectionValid()) {
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
    setShowHeads(true)
    setFlipping(false)
    setSubmitted(false)
    setSolved(false)
    setSelected(new Set())
  }

  const canSubmit = selected.size > 0 && !locked && !flipping

  const chipPicker = (
    <>
      <div className="scene-3d flex flex-wrap justify-center gap-3">
        {config.options.map((option) => {
          const active = selected.has(option)
          const showOk = submitted && answer.selected.includes(option)
          const showBad = submitted && active && !answer.selected.includes(option)

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
    </>
  )

  if (showCoinFlip) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-center text-sm font-semibold text-slate-700">Flip to explore</p>
          <CoinFlipAnimation
            history={history}
            showHeads={showHeads}
            flipping={flipping}
            locked={false}
            onFlip={flip}
          />
        </div>

        <div className="space-y-5 border-t border-slate-200 pt-6">
          <p className="text-center text-sm font-semibold text-slate-700">
            Build the sample space Ω
          </p>
          <p className="text-center text-sm text-slate-600">{helperText}</p>
          {chipPicker}
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
      <p className="text-center text-sm text-slate-600">{helperText}</p>
      {chipPicker}
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
