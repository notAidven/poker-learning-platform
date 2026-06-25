import { useState } from 'react'
import {
  parseCardId,
  type CardId,
  type PreflopHandAnswer,
  type PreflopHandConfig,
} from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { CardFace, CardKitStyles } from './cards/PlayingCardKit'

/**
 * `preflop-hand` — read PREFLOP starting-hand strength. Two modes:
 *   - classify      → pick the strength tier of the single hand shown.
 *   - pick-stronger → pick which of two starting hands is stronger (or 'tie').
 *
 * Both render real card visuals plus an auto-derived suited/offsuit tag so the
 * learner sees the same-suit idea directly. Grading is a pure compare against the
 * authored answer (no board, no engine), so it is fully deterministic and AI-free.
 */
type PreflopHandProps = InteractionProps & {
  config: PreflopHandConfig
  answer: PreflopHandAnswer
}

/** True when both hole cards share a suit. */
function isSuited(hand: [CardId, CardId]): boolean {
  return parseCardId(hand[0]).suit === parseCardId(hand[1]).suit
}

/** The "suited" / "offsuit" tag for a two-card holding. */
function suitTag(hand: [CardId, CardId]): string {
  return isSuited(hand) ? 'Suited' : 'Offsuit'
}

function HandCards({ hand, animate }: { hand: [CardId, CardId]; animate: boolean }) {
  const suited = isSuited(hand)
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end gap-1.5">
        <CardFace id={hand[0]} size="lg" animate={animate} />
        <CardFace id={hand[1]} size="lg" animate={animate} delay={80} />
      </div>
      <span
        className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide ${
          suited ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {suitTag(hand)}
      </span>
    </div>
  )
}

function optionClass(submitted: boolean, isSelected: boolean, isCorrect: boolean): string {
  const base =
    'relative flex min-h-11 flex-col items-center justify-center rounded-xl border-2 px-3 py-2.5 text-center transition disabled:cursor-not-allowed'
  if (submitted) {
    if (isCorrect) return `${base} border-emerald-500 bg-emerald-50 text-emerald-800`
    if (isSelected) return `${base} border-rose-400 bg-rose-50 text-rose-700`
    return `${base} border-slate-200 bg-white text-slate-500 opacity-70`
  }
  if (isSelected) return `${base} border-brand-500 bg-brand-50 text-brand-800 shadow-sm`
  return `${base} border-slate-200 bg-white text-slate-700 hover:border-brand-300`
}

export function PreflopHand({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: PreflopHandProps) {
  const mode = config.mode

  const [optionId, setOptionId] = useState<string | null>(
    initialSolved && mode === 'classify' ? answer.optionId ?? null : null,
  )
  const [side, setSide] = useState<'a' | 'b' | 'tie' | null>(
    initialSolved && mode === 'pick-stronger' ? answer.stronger ?? null : null,
  )
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const animate = !initialSolved

  function isCorrect(): boolean {
    if (mode === 'classify') return optionId !== null && optionId === answer.optionId
    return side !== null && side === answer.stronger
  }

  function canSubmit(): boolean {
    if (locked) return false
    return mode === 'classify' ? optionId !== null : side !== null
  }

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    if (isCorrect()) {
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
  }

  const labelA = config.labelA ?? 'Hand A'
  const labelB = config.labelB ?? 'Hand B'

  return (
    <div className="space-y-5">
      <CardKitStyles />

      {config.context && (
        <p className="rounded-xl bg-night-900/[0.03] px-3 py-2 text-center text-sm font-medium text-slate-700">
          {config.context}
        </p>
      )}

      {/* The hand(s) on a felt panel */}
      <div className="pck-felt flex items-stretch justify-center gap-4 rounded-3xl border border-emerald-900/40 p-5 shadow-inner">
        {mode === 'classify' && config.hand && (
          <HandCards hand={config.hand} animate={animate} />
        )}
        {mode === 'pick-stronger' && config.handA && config.handB && (
          <>
            <PickPanel
              label={labelA}
              hand={config.handA}
              side="a"
              selected={side === 'a'}
              submitted={submitted}
              correctSide={answer.stronger}
              animate={animate}
              disabled={locked}
              onSelect={() => setSide('a')}
            />
            <span className="flex items-center text-xs font-bold uppercase tracking-wide text-white/70">
              vs
            </span>
            <PickPanel
              label={labelB}
              hand={config.handB}
              side="b"
              selected={side === 'b'}
              submitted={submitted}
              correctSide={answer.stronger}
              animate={animate}
              disabled={locked}
              onSelect={() => setSide('b')}
            />
          </>
        )}
      </div>

      {config.helperText && <p className="text-sm text-slate-600">{config.helperText}</p>}

      {/* Classify: tier buttons */}
      {mode === 'classify' && config.options && (
        <div
          className={`grid gap-2 ${config.options.length >= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}
          role="group"
          aria-label="Pick the hand's strength"
        >
          {config.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={locked}
              aria-pressed={optionId === opt.id}
              onClick={() => setOptionId(opt.id)}
              className={optionClass(submitted, optionId === opt.id, answer.optionId === opt.id)}
            >
              <span className="text-sm font-bold">{opt.label}</span>
              {opt.sub && <span className="mt-0.5 text-[0.7rem] font-medium opacity-80">{opt.sub}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Pick-stronger: optional tie button */}
      {mode === 'pick-stronger' && config.allowTie && (
        <button
          type="button"
          disabled={locked}
          aria-pressed={side === 'tie'}
          onClick={() => setSide('tie')}
          className={`min-h-11 w-full rounded-xl border-2 px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${
            submitted && answer.stronger === 'tie'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
              : submitted && side === 'tie'
                ? 'border-rose-400 bg-rose-50 text-rose-700'
                : side === 'tie'
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'
          }`}
        >
          They are about equal
        </button>
      )}

      <CheckPanel
        canSubmit={canSubmit()}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        allowRetry={allowRetry}
      />
    </div>
  )
}

function PickPanel({
  label,
  hand,
  side,
  selected,
  submitted,
  correctSide,
  animate,
  disabled,
  onSelect,
}: {
  label: string
  hand: [CardId, CardId]
  side: 'a' | 'b'
  selected: boolean
  submitted: boolean
  correctSide: PreflopHandAnswer['stronger']
  animate: boolean
  disabled: boolean
  onSelect: () => void
}) {
  const isCorrectSide = correctSide === side || correctSide === 'tie'
  const base =
    'flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-3 transition disabled:cursor-not-allowed'
  let cls: string
  if (submitted) {
    cls = isCorrectSide
      ? `${base} border-emerald-400 bg-emerald-50/95`
      : selected
        ? `${base} border-rose-400 bg-rose-50/95`
        : `${base} border-white/30 bg-white/85 opacity-80`
  } else {
    cls = selected ? `${base} border-brand-400 bg-white shadow-sm` : `${base} border-white/40 bg-white/90 hover:border-brand-300`
  }
  return (
    <button type="button" disabled={disabled} aria-pressed={selected} onClick={onSelect} className={cls}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <HandCards hand={hand} animate={animate} />
    </button>
  )
}
