import { useMemo, useState } from 'react'
import type { RangeGridAnswer, RangeGridConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import {
  GRID_SIZE,
  type HandClass,
  allHands,
  classify,
  gradeRangeSelection,
  isHandInRange,
} from './rangeGrid'

/**
 * `range-grid` (Advanced Play) — the 13x13 matrix of the 169 starting-hand classes.
 * Three deterministic, AI-free modes (all graded by the pure helpers in `rangeGrid.ts`):
 *   - is-hand-in-range -> one hand is highlighted on the grid; the learner answers
 *     whether it sits inside the named range (graded vs `answer.inRange`, or computed).
 *   - select-range / build-range -> the learner taps the cells that make up the range;
 *     the tapped set is graded for an EXACT match against `config.range`.
 *
 * Pocket pairs run down the diagonal, suited hands sit above it, offsuit below it (the
 * usual chart layout), so the three classes are tinted distinctly and, after a submit,
 * each cell is recoloured correct (green) / incorrect (red) like the other widgets.
 */
type RangeGridProps = InteractionProps & {
  config: RangeGridConfig
  answer: RangeGridAnswer
}

const CLASS_LABEL: Record<HandClass, string> = {
  pair: 'pair',
  suited: 'suited',
  offsuit: 'offsuit',
}

/** Resting tint per hand class (the empty grid reads like a real range chart). */
const CLASS_TINT: Record<HandClass, string> = {
  pair: 'bg-gold-100 text-gold-800',
  suited: 'bg-success-50 text-success-700',
  offsuit: 'bg-slate-100 text-slate-600',
}

const HANDS = allHands()

/** Accessible "Ace King suited" style label for a hand id. */
const RANK_WORD: Record<string, string> = {
  A: 'Ace',
  K: 'King',
  Q: 'Queen',
  J: 'Jack',
  T: 'Ten',
  '9': 'Nine',
  '8': 'Eight',
  '7': 'Seven',
  '6': 'Six',
  '5': 'Five',
  '4': 'Four',
  '3': 'Three',
  '2': 'Two',
}

function handLabel(hand: string): string {
  const cls = classify(hand)
  if (cls === 'pair') return `Pocket ${RANK_WORD[hand[0]] ?? hand[0]}s`
  const hi = RANK_WORD[hand[0]] ?? hand[0]
  const lo = RANK_WORD[hand[1]] ?? hand[1]
  return `${hi} ${lo} ${cls}`
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.7rem] font-medium text-slate-500">
      {(['pair', 'suited', 'offsuit'] as HandClass[]).map((cls) => (
        <span key={cls} className="inline-flex items-center gap-1">
          <span className={`h-3 w-3 rounded-sm ${CLASS_TINT[cls]}`} aria-hidden="true" />
          <span className="capitalize">{CLASS_LABEL[cls]}</span>
        </span>
      ))}
    </div>
  )
}

export function RangeGrid({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: RangeGridProps) {
  const mode = config.mode
  const interactive = mode === 'select-range' || mode === 'build-range'

  const target = useMemo(() => config.range ?? answer.hands ?? [], [config.range, answer.hands])
  const targetSet = useMemo(() => new Set(target), [target])

  // is-hand-in-range: whether the highlighted hand is inside the range.
  const expectedInRange = answer.inRange ?? isHandInRange(config.hand ?? '', target)

  const [selected, setSelected] = useState<Set<string>>(() =>
    initialSolved && interactive ? new Set(target) : new Set(),
  )
  const [choice, setChoice] = useState<boolean | null>(
    initialSolved && mode === 'is-hand-in-range' ? expectedInRange : null,
  )
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted

  function isCorrect(): boolean {
    if (mode === 'is-hand-in-range') return choice !== null && choice === expectedInRange
    return gradeRangeSelection(selected, target)
  }

  function canSubmit(): boolean {
    if (locked) return false
    if (mode === 'is-hand-in-range') return choice !== null
    return selected.size > 0
  }

  const disabledReason =
    mode === 'is-hand-in-range'
      ? choice === null
        ? 'Choose in or out of the range'
        : undefined
      : selected.size === 0
        ? 'Tap the hands that belong in the range'
        : undefined

  function toggle(hand: string) {
    if (locked || !interactive) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(hand)) next.delete(hand)
      else next.add(hand)
      return next
    })
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
    // Keep the learner's taps / choice so a wrong attempt only re-enables editing.
    onAttemptReset?.()
    setSubmitted(false)
    setSolved(false)
  }

  /** Class string for one cell, factoring in mode, selection, and the post-submit grade. */
  function cellClass(hand: string): string {
    const cls = classify(hand)
    const base =
      'flex items-center justify-center rounded-[3px] border text-[0.5rem] font-bold leading-none tabular-nums transition sm:text-[0.6rem]'

    if (mode === 'is-hand-in-range') {
      const isTargetHand = hand === config.hand
      const inRange = targetSet.has(hand)
      if (isTargetHand) {
        // The single hand under the spotlight, ringed so it stands out on the chart.
        return `${base} border-night-900 bg-night-900 text-white ring-2 ring-brand-400`
      }
      if (inRange) return `${base} border-brand-200 bg-brand-100 text-brand-700`
      return `${base} border-transparent ${CLASS_TINT[cls]} opacity-60`
    }

    // select-range / build-range
    const inTarget = targetSet.has(hand)
    const isSelected = selected.has(hand)
    if (submitted) {
      if (isSelected && inTarget) return `${base} border-success-500 bg-success-500 text-white`
      if (isSelected && !inTarget) return `${base} border-danger-500 bg-danger-500 text-white`
      if (!isSelected && inTarget) return `${base} border-danger-400 bg-danger-100 text-danger-700`
      return `${base} border-transparent ${CLASS_TINT[cls]} opacity-50`
    }
    if (isSelected) return `${base} border-brand-600 bg-brand-600 text-white shadow-sm`
    return `${base} border-transparent ${CLASS_TINT[cls]} hover:border-brand-300`
  }

  const gridStyle = { gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }

  return (
    <div className="space-y-4">
      {config.rangeName && (
        <p className="text-center text-sm font-semibold text-slate-700">
          {mode === 'is-hand-in-range' ? 'Range: ' : 'Target: '}
          <span className="text-brand-700">{config.rangeName}</span>
        </p>
      )}

      {config.helperText && <p className="text-center text-sm text-slate-600">{config.helperText}</p>}

      <div className="mx-auto max-w-md rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-2 shadow-inner sm:p-3">
        <div className="grid select-none gap-[2px]" style={gridStyle} role="grid" aria-label="Starting-hand grid">
          {HANDS.map((hand) => {
            if (interactive) {
              const isSelected = selected.has(hand)
              return (
                <button
                  key={hand}
                  type="button"
                  disabled={locked}
                  aria-pressed={isSelected}
                  aria-label={handLabel(hand)}
                  onClick={() => toggle(hand)}
                  className={`aspect-square ${cellClass(hand)} disabled:cursor-not-allowed`}
                >
                  {hand}
                </button>
              )
            }
            return (
              <span
                key={hand}
                role="gridcell"
                aria-label={handLabel(hand)}
                className={`aspect-square ${cellClass(hand)}`}
              >
                {hand}
              </span>
            )
          })}
        </div>
      </div>

      <Legend />

      {mode === 'is-hand-in-range' && config.hand && (
        <div>
          <p className="mb-2 text-center text-sm font-semibold text-slate-800">
            Is {config.hand} {config.rangeName ? `in ${config.rangeName}` : 'in the range'}?
          </p>
          <div className="flex gap-3">
            {([true, false] as const).map((value) => {
              const isPicked = choice === value
              let cls =
                'border-slate-200 bg-white text-slate-700 hover:border-brand-300'
              if (submitted) {
                if (expectedInRange === value) cls = 'border-success-500 bg-success-50 text-success-800'
                else if (isPicked) cls = 'border-danger-400 bg-danger-50 text-danger-700'
                else cls = 'border-slate-200 bg-white text-slate-500 opacity-70'
              } else if (isPicked) {
                cls = 'border-brand-500 bg-brand-50 text-brand-800 shadow-sm'
              }
              return (
                <button
                  key={String(value)}
                  type="button"
                  disabled={locked}
                  aria-pressed={isPicked}
                  onClick={() => setChoice(value)}
                  className={`min-h-11 flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed ${cls}`}
                >
                  {value ? 'In range' : 'Out of range'}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {interactive && (
        <p className="text-center text-xs font-medium text-slate-500" role="status" aria-live="polite">
          {selected.size} selected
        </p>
      )}

      <CheckPanel
        canSubmit={canSubmit()}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        allowRetry={allowRetry}
        disabledReason={disabledReason}
      />
    </div>
  )
}
