import { useState } from 'react'
import type { DieSampleSpaceAnswer, DieSampleSpaceConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { NumericAnswerInput } from './NumericAnswerInput'
import { countMatches, hasValidCountInput } from './numericAnswer'

type DieSampleSpaceProps = InteractionProps & {
  config: DieSampleSpaceConfig
  answer: DieSampleSpaceAnswer
}

export function DieSampleSpace({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
}: DieSampleSpaceProps) {
  const { sides } = config
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [rolled, setRolled] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)
  const [countInput, setCountInput] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const faces = Array.from({ length: sides }, (_, i) => i + 1)
  const countLabel =
    config.countLabel ?? 'Now enter |Ω| — how many outcomes are in the sample space?'

  function roll() {
    if (locked || rolling) return
    setRolling(true)
    let ticks = 0
    const interval = window.setInterval(() => {
      setRolled(Math.floor(Math.random() * sides) + 1)
      ticks++
      if (ticks > 10) {
        window.clearInterval(interval)
        setRolling(false)
      }
    }, 55)
  }

  function toggle(face: number) {
    if (locked) return
    if (config.targetFace && face !== config.targetFace) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(face)) next.delete(face)
      else next.add(face)
      return next
    })
  }

  function selectionValid() {
    const expected = new Set(answer.selected)
    if (selected.size !== expected.size) return false
    for (const n of expected) if (!selected.has(n)) return false
    return true
  }

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    if (selectionValid() && countMatches(countInput, answer.count)) {
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
    setRolled(null)
    setCountInput('')
  }

  const manipulableReady = selected.size > 0
  const canSubmit = manipulableReady && hasValidCountInput(countInput) && !locked

  return (
    <div className="space-y-5">
      <div className="die-3d-wrap">
        <button
          type="button"
          onClick={roll}
          disabled={locked || rolling}
          className={`die-3d ${rolling ? 'die-3d--rolling' : ''}`}
        >
          {rolled ?? '?'}
        </button>
      </div>
      <p className="text-center text-xs text-slate-500">Roll the die, then tap faces below</p>

      <div className="scene-3d flex flex-wrap justify-center gap-3">
        {faces.map((face) => {
          const active = selected.has(face)
          const showOk = submitted && answer.selected.includes(face)
          const showBad = submitted && active && !answer.selected.includes(face)

          let cls =
            'chip-3d flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-lg font-bold'
          if (showOk) cls += ' border-emerald-500 bg-emerald-100 chip-3d--active'
          else if (showBad) cls += ' border-red-400 bg-red-50'
          else if (active) cls += ' border-brand-600 bg-brand-100 chip-3d--active'
          else cls += ' border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50'

          return (
            <button
              key={face}
              type="button"
              disabled={locked}
              onClick={() => toggle(face)}
              className={cls}
            >
              {face}
            </button>
          )
        })}
      </div>

      {manipulableReady && (
        <NumericAnswerInput
          id={`die-count-${sides}`}
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
