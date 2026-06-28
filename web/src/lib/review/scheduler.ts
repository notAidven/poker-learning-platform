/**
 * Pure, deterministic Leitner-style spaced-repetition scheduler.
 *
 * Time is measured in CAT calendar days (America/Guatemala, UTC−6, no DST) so the
 * Review system shares the exact day boundary the streak logic uses. Day math reuses
 * gamification's `getCalendarDayCAT`; `addDaysCAT` mirrors gamification's own
 * noon-anchored UTC arithmetic so adding/subtracting days can never be shifted by a
 * DST/offset edge. Every function here is a pure transform of its inputs — no clock,
 * storage, or randomness — so the whole engine is unit-testable and AI-free.
 */
import type { ConceptId } from '../../types/concept'
import { getCalendarDayCAT } from '../gamification'
import type { ReviewState } from './types'

/**
 * Days until a concept is due again, indexed by Leitner box. A correct answer
 * promotes a box (longer gap); a miss demotes it. Index 0 is only the resting value
 * for a brand-new/just-lapsed concept — a miss always resurfaces it tomorrow
 * explicitly (see `scheduleAfterResult`), so `INTERVALS[0] = 0` is never read.
 */
export const INTERVALS = [0, 1, 3, 7, 16, 35] as const

/** Highest Leitner box (a correct answer here keeps the longest interval). */
export const MAX_BOX = INTERVALS.length - 1

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Today's CAT calendar day (`YYYY-MM-DD`). */
export function todayCAT(): string {
  return getCalendarDayCAT()
}

/**
 * Add (or subtract) whole days to a CAT day string, returning a CAT day string.
 * Anchored at noon UTC like gamification's day math, so the result is never nudged
 * across a boundary by an offset.
 */
export function addDaysCAT(day: string, days: number): string {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + Math.round(days))
  return d.toISOString().slice(0, 10)
}

/** A fresh, never-reviewed concept state. */
export function initialReviewState(): ReviewState {
  return { box: 0, dueDay: null, lapses: 0, lastReviewedDay: null, seen: 0, correct: 0 }
}

function clampBox(box: number): number {
  if (box < 0) return 0
  if (box > MAX_BOX) return MAX_BOX
  return box
}

/**
 * Advance a concept's review state after a graded answer:
 *  - correct → promote one box (clamped at `MAX_BOX`); next due in `INTERVALS[newBox]` days;
 *  - miss → demote one box (clamped at 0); resurface tomorrow; `lapses` + 1.
 * Either way `seen` (+ `correct` when right) and `lastReviewedDay` are updated.
 * `prev` undefined means a first-ever review (starts from `initialReviewState`).
 */
export function scheduleAfterResult(
  prev: ReviewState | undefined,
  correct: boolean,
  today: string,
): ReviewState {
  const base = prev ?? initialReviewState()
  const seen = base.seen + 1
  const correctCount = base.correct + (correct ? 1 : 0)

  if (correct) {
    const box = clampBox(base.box + 1)
    return {
      box,
      dueDay: addDaysCAT(today, INTERVALS[box]),
      lapses: base.lapses,
      lastReviewedDay: today,
      seen,
      correct: correctCount,
    }
  }

  const box = clampBox(base.box - 1)
  return {
    box,
    dueDay: addDaysCAT(today, 1),
    lapses: base.lapses + 1,
    lastReviewedDay: today,
    seen,
    correct: correctCount,
  }
}

/**
 * Whether a concept is due for review today. A concept that has never been scheduled
 * (no state, or no `dueDay`) is always due; otherwise it is due once `dueDay` is on or
 * before today. Day strings are zero-padded `YYYY-MM-DD`, so a lexical `<=` is a valid
 * chronological comparison.
 */
export function isDue(state: ReviewState | undefined, today: string): boolean {
  if (!state || !state.dueDay) return true
  return state.dueDay <= today
}

/** The subset of `conceptIds` that are due today, preserving the input order. */
export function dueConcepts(
  states: Record<ConceptId, ReviewState>,
  conceptIds: ConceptId[],
  today: string,
): ConceptId[] {
  return conceptIds.filter((id) => isDue(states[id], today))
}

/** Lifetime correct-rate (0..1) for the Strengths & Leaks view; 0 when never seen. */
export function accuracy(state: ReviewState | undefined): number {
  if (!state || state.seen <= 0) return 0
  return state.correct / state.seen
}

/**
 * Coerce an untrusted persisted value (localStorage or Firestore) into a valid
 * `ReviewState`, or null when it is not an object. Out-of-range / wrong-typed fields
 * fall back to safe defaults so a corrupt doc can never crash the scheduler.
 */
export function sanitizeReviewState(value: unknown): ReviewState | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  const box = typeof v.box === 'number' && Number.isFinite(v.box) ? clampBox(Math.floor(v.box)) : 0
  const dueDay = typeof v.dueDay === 'string' && DAY_PATTERN.test(v.dueDay) ? v.dueDay : null
  const lastReviewedDay =
    typeof v.lastReviewedDay === 'string' && DAY_PATTERN.test(v.lastReviewedDay)
      ? v.lastReviewedDay
      : null
  const lapses = typeof v.lapses === 'number' && v.lapses >= 0 ? Math.floor(v.lapses) : 0
  const seen = typeof v.seen === 'number' && v.seen >= 0 ? Math.floor(v.seen) : 0
  const correctRaw = typeof v.correct === 'number' && v.correct >= 0 ? Math.floor(v.correct) : 0
  return { box, dueDay, lapses, lastReviewedDay, seen, correct: Math.min(correctRaw, seen) }
}
