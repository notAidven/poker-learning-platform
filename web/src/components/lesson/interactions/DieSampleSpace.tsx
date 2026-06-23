import { useState } from 'react'
import type { DieSampleSpaceAnswer, DieSampleSpaceConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { DieFace } from './DieFace'
import { FractionAnswerInput } from './FractionAnswerInput'
import { NumericAnswerInput } from './NumericAnswerInput'
import { fractionMatches, hasValidFractionInput } from './fractionAnswer'
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
  allowRetry = true,
}: DieSampleSpaceProps) {
  const { sides } = config
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [rolled, setRolled] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)
  const [countInput, setCountInput] = useState('')
  const [fractionNum, setFractionNum] = useState('')
  const [fractionDen, setFractionDen] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const faces = Array.from({ length: sides }, (_, i) => i + 1)
  const countLabel =
    config.countLabel ?? 'Now enter |Ω| — how many outcomes are in the sample space?'
  const probabilityLabel =
    config.probabilityLabel ?? 'What is P(ω) for one outcome? (fraction)'
  const requiresProbability = answer.probability !== undefined

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
    setRolled(null)
    setCountInput('')
    setFractionNum('')
    setFractionDen('')
  }

  const manipulableReady = selected.size > 0
  const countReady = hasValidCountInput(countInput)
  const fractionReady = !requiresProbability || hasValidFractionInput(fractionNum, fractionDen)
  const canSubmit = manipulableReady && countReady && fractionReady && !locked

  return (
    <div className="space-y-5">
      <div className="die-3d-wrap">
        <button
          type="button"
          onClick={roll}
          disabled={locked || rolling}
          className={`die-3d ${rolling ? 'die-3d--rolling' : ''}`}
          aria-label={rolled === null ? 'Roll the die' : `Die showing ${rolled}`}
        >
          <DieFace value={rolled ?? '?'} size="lg" muted={rolled === null} />
        </button>
      </div>
      <p className="text-center text-xs text-slate-500">Roll the die, then tap faces below</p>

      <div className="scene-3d flex flex-wrap justify-center gap-3">
        {faces.map((face) => {
          const active = selected.has(face)
          const showOk = submitted && answer.selected.includes(face)
          const showBad = submitted && active && !answer.selected.includes(face)

          let cls = 'die-face-chip'
          if (showOk) cls += ' die-face-chip--ok'
          else if (showBad) cls += ' die-face-chip--bad'
          else if (active) cls += ' die-face-chip--active'

          return (
            <button
              key={face}
              type="button"
              disabled={locked}
              onClick={() => toggle(face)}
              className={cls}
              aria-label={`Face ${face}`}
              aria-pressed={active}
            >
              <DieFace value={face} size="md" />
            </button>
          )
        })}
      </div>

      {manipulableReady && (
        <>
          <NumericAnswerInput
            id={`die-count-${sides}`}
            label={countLabel}
            value={countInput}
            onChange={setCountInput}
            disabled={locked}
          />
          {requiresProbability && countReady && (
            <FractionAnswerInput
              id={`die-probability-${sides}`}
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
