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

/** Cap on the visible roll-history "library" so the row stays tidy on small screens. */
const MAX_ROLL_HISTORY = 24

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
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
  const [rollHistory, setRollHistory] = useState<number[]>([])
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

  function recordRoll(value: number) {
    setRolled(value)
    setRollHistory((prev) => [...prev, value].slice(-MAX_ROLL_HISTORY))
  }

  function roll() {
    if (locked || rolling) return

    const draw = () => Math.floor(Math.random() * sides) + 1

    // Reduced motion: skip the tumble (rapid face flashing) and settle immediately,
    // but still record the outcome into the roll-history library.
    if (prefersReducedMotion()) {
      recordRoll(draw())
      return
    }

    setRolling(true)
    let ticks = 0
    const interval = window.setInterval(() => {
      ticks++
      if (ticks > 10) {
        window.clearInterval(interval)
        recordRoll(draw())
        setRolling(false)
      } else {
        setRolled(draw())
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
    setRollHistory([])
    setCountInput('')
    setFractionNum('')
    setFractionDen('')
  }

  const manipulableReady = selected.size > 0
  const countReady = hasValidCountInput(countInput)
  const fractionReady = !requiresProbability || hasValidFractionInput(fractionNum, fractionDen)
  const canSubmit = manipulableReady && countReady && fractionReady && !locked

  const rollCount = rollHistory.length
  const distinctFaces = new Set(rollHistory).size
  const lastRoll = rollCount > 0 ? rollHistory[rollCount - 1] : null

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

      <p className="sr-only" aria-live="polite">
        {lastRoll !== null
          ? `Rolled ${lastRoll}. ${rollCount} ${rollCount === 1 ? 'roll' : 'rolls'} so far; ${distinctFaces} of ${sides} ${distinctFaces === 1 ? 'face' : 'faces'} seen.`
          : ''}
      </p>

      {rollCount > 0 && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Rolls so far (building Ω)</span>
            <span className="tabular-nums normal-case tracking-normal text-slate-400">
              {rollCount} {rollCount === 1 ? 'roll' : 'rolls'} · {distinctFaces}/{sides} faces seen
            </span>
          </div>
          <div
            className="flex flex-wrap justify-center gap-2"
            role="list"
            aria-label="Roll history — outcomes rolled so far"
          >
            {rollHistory.map((value, i) => (
              <span
                key={`${i}-${value}`}
                role="listitem"
                aria-label={`Roll ${i + 1}: ${value}`}
                className="anim-pop"
              >
                <DieFace value={value} size="sm" />
              </span>
            ))}
          </div>
        </div>
      )}

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
          {/* Render the fraction field whenever the answer requires it — never gate it
              behind the count being valid. This guarantees the invariant "if Check is
              enabled, every field handleSubmit validates is on screen", so a
              prompt/answer mismatch can never leave the learner stuck. */}
          {requiresProbability && (
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
