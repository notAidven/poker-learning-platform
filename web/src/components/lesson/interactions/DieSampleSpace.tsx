import { useState } from 'react'
import type { DieSampleSpaceAnswer, DieSampleSpaceConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { DieFace } from './DieFace'
import { FractionAnswerInput } from './FractionAnswerInput'
import { NumericAnswerInput } from './NumericAnswerInput'
import { fractionMatches, hasValidFractionInput } from './fractionAnswer'
import { countMatches, hasValidCountInput } from './numericAnswer'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

type DieSampleSpaceProps = InteractionProps & {
  config: DieSampleSpaceConfig
  answer: DieSampleSpaceAnswer
}

/** Cap on the visible roll-history "library" so the row stays tidy on small screens. */
const MAX_ROLL_HISTORY = 24

function sameNumberSet(list: number[], expected: number[]) {
  const set = new Set(list)
  if (set.size !== expected.length) return false
  for (const n of expected) if (!set.has(n)) return false
  return true
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
  const discoverMode = config.discoverMode ?? false

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [rolled, setRolled] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)
  const [rollHistory, setRollHistory] = useState<number[]>([])
  const [countInput, setCountInput] = useState('')
  const [fractionNum, setFractionNum] = useState('')
  const [fractionDen, setFractionDen] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  // Discovery mode: Ω grows monotonically as distinct faces appear; the per-face
  // tally counts every roll so learners see that repeats don't grow the set.
  const [discovered, setDiscovered] = useState<number[]>([])
  const [faceCounts, setFaceCounts] = useState<Record<number, number>>({})
  const [lastEvent, setLastEvent] = useState<{ face: number; isNew: boolean; key: number } | null>(
    null,
  )

  const reducedMotion = usePrefersReducedMotion()

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
    if (discoverMode) {
      const isNew = !discovered.includes(value)
      setDiscovered((prev) => (prev.includes(value) ? prev : [...prev, value]))
      setFaceCounts((prev) => ({ ...prev, [value]: (prev[value] ?? 0) + 1 }))
      setLastEvent({ face: value, isNew, key: Date.now() })
    }
  }

  function roll() {
    if (locked || rolling) return

    const draw = () => Math.floor(Math.random() * sides) + 1

    // Reduced motion: skip the tumble (rapid face flashing) and settle immediately,
    // but still record the outcome into the roll-history library.
    if (reducedMotion) {
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
    return sameNumberSet([...selected], answer.selected)
  }

  function probabilityValid() {
    if (!requiresProbability || !answer.probability) return true
    return fractionMatches(fractionNum, fractionDen, answer.probability)
  }

  function discoverValid() {
    if (!sameNumberSet(discovered, answer.selected)) return false
    if (config.confirmCount && !countMatches(countInput, answer.count)) return false
    return true
  }

  function handleSubmit() {
    if (locked || rolling) return
    setSubmitted(true)
    const ok = discoverMode
      ? discoverValid()
      : selectionValid() && countMatches(countInput, answer.count) && probabilityValid()
    if (ok) {
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
    setRolling(false)
    setRollHistory([])
    setCountInput('')
    setFractionNum('')
    setFractionDen('')
    setDiscovered([])
    setFaceCounts({})
    setLastEvent(null)
  }

  const rollCount = rollHistory.length
  const lastRoll = rollCount > 0 ? rollHistory[rollCount - 1] : null
  const totalRolls = faces.reduce((sum, face) => sum + (faceCounts[face] ?? 0), 0)

  const dieButton = (
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
  )

  // ----- discovery mode: rolling auto-populates Ω; no manual face selection -----
  if (discoverMode) {
    const discoverHelperText =
      config.discoverHelperText ??
      'Roll the die again and again. The first time a face lands it joins Ω; rolling a face you have already seen only grows its tally. Once every face has appeared, you have found all of Ω.'
    const lockInLabel = config.lockInLabel ?? "I've rolled every face — lock in Ω"
    const discoverCountLabel =
      config.countLabel ?? 'How many distinct outcomes are in Ω? Enter |Ω|.'

    const omegaSize = discovered.length
    const allFacesSeen = omegaSize === sides
    const canLockIn =
      allFacesSeen &&
      !locked &&
      !rolling &&
      (!config.confirmCount || hasValidCountInput(countInput))

    const discoveredSorted = [...discovered].sort((a, b) => a - b)

    let omegaBoxCls = 'rounded-2xl border-2 px-4 py-4 transition-colors'
    if (submitted && solved) omegaBoxCls += ' border-emerald-400 bg-emerald-50'
    else if (submitted && !solved) omegaBoxCls += ' border-amber-300 bg-amber-50'
    else omegaBoxCls += ' border-slate-200 bg-slate-50'

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-center text-sm font-semibold text-slate-700">Roll to discover</p>
          {dieButton}
        </div>

        <p className="sr-only" aria-live="polite">
          {lastRoll !== null
            ? `Rolled ${lastRoll}. ${omegaSize} of ${sides} ${omegaSize === 1 ? 'face' : 'faces'} discovered.`
            : ''}
        </p>

        <div className="flex min-h-7 items-center justify-center" aria-live="polite">
          {lastEvent && (
            <span
              key={lastEvent.key}
              style={reducedMotion ? undefined : { animation: 'fadeIn 0.25s ease' }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                lastEvent.isNew ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {lastEvent.isNew
                ? `New outcome! ${lastEvent.face} joins Ω`
                : `${lastEvent.face} again — already in Ω, so Ω is unchanged`}
            </span>
          )}
        </div>

        <div className="space-y-4 border-t border-slate-200 pt-6">
          <p className="text-center text-sm font-semibold text-slate-700">
            Build the sample space Ω
          </p>
          <p className="text-center text-sm text-slate-600">{discoverHelperText}</p>

          <div className={omegaBoxCls}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sample space Ω
              </p>
              <p className="text-xs font-semibold text-slate-500">
                |Ω| = <span className="tabular-nums text-slate-800">{omegaSize}</span> /{' '}
                <span className="tabular-nums">{sides}</span>
              </p>
            </div>
            {discoveredSorted.length === 0 ? (
              <p className="text-sm text-slate-400">
                Roll the die — each distinct face you observe will appear here.
              </p>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {discoveredSorted.map((face) => {
                  const emphasize =
                    !submitted && lastEvent?.isNew === true && lastEvent.face === face
                  return (
                    <span
                      key={face}
                      className={emphasize ? 'anim-pop' : undefined}
                      aria-label={`Face ${face} is in Ω`}
                    >
                      <DieFace value={face} size="sm" />
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          {rollCount > 0 && (
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Rolls so far</span>
                <span className="tabular-nums normal-case tracking-normal text-slate-400">
                  {totalRolls} {totalRolls === 1 ? 'roll' : 'rolls'} · {omegaSize}/{sides} faces seen
                </span>
              </div>
              <div
                className="flex flex-wrap justify-center gap-2"
                role="list"
                aria-label="Roll history — outcomes rolled so far"
              >
                {rollHistory.map((value, i) => (
                  <span key={`${i}-${value}`} role="listitem" aria-label={`Roll ${i + 1}: ${value}`}>
                    <DieFace value={value} size="xs" />
                  </span>
                ))}
              </div>
            </div>
          )}

          {totalRolls > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tally of {totalRolls} roll{totalRolls === 1 ? '' : 's'}
              </p>
              <div className="space-y-1.5">
                {faces.map((face) => {
                  const n = faceCounts[face] ?? 0
                  const pct = totalRolls > 0 ? (n / totalRolls) * 100 : 0
                  const seen = n > 0
                  return (
                    <div key={face} className="flex items-center gap-3">
                      <span className="w-5 text-sm font-bold tabular-nums text-slate-700">{face}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${seen ? 'bg-brand-500' : 'bg-slate-200'}`}
                          style={{
                            width: `${pct}%`,
                            transition: reducedMotion ? undefined : 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm font-semibold tabular-nums text-slate-600">
                        ×{n}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!allFacesSeen && totalRolls > 0 && (
            <p className="text-center text-xs text-slate-500" role="status" aria-live="polite">
              {sides - omegaSize} more {sides - omegaSize === 1 ? 'face' : 'faces'} still to appear —
              keep rolling.
            </p>
          )}

          {config.confirmCount && allFacesSeen && (
            <NumericAnswerInput
              id={`die-discover-count-${sides}`}
              label={discoverCountLabel}
              value={countInput}
              onChange={setCountInput}
              disabled={locked}
            />
          )}
        </div>

        <CheckPanel
          canSubmit={canLockIn}
          submitted={submitted}
          solved={solved}
          onSubmit={handleSubmit}
          onRetry={handleRetry}
          submitLabel={lockInLabel}
          allowRetry={allowRetry}
        />
      </div>
    )
  }

  // ----- classic mode: roll for flavor, then tap every face that belongs to Ω/A -----
  const manipulableReady = selected.size > 0
  const countReady = hasValidCountInput(countInput)
  const fractionReady = !requiresProbability || hasValidFractionInput(fractionNum, fractionDen)
  const canSubmit = manipulableReady && countReady && fractionReady && !locked

  const distinctFaces = new Set(rollHistory).size

  return (
    <div className="space-y-5">
      {dieButton}
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
