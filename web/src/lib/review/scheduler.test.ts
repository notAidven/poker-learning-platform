import { describe, expect, it } from 'vitest'
import type { ConceptId } from '../../types/concept'
import {
  INTERVALS,
  MAX_BOX,
  accuracy,
  addDaysCAT,
  dueConcepts,
  initialReviewState,
  isDue,
  sanitizeReviewState,
  scheduleAfterResult,
  todayCAT,
} from './scheduler'
import type { ReviewState } from './types'

const TODAY = '2026-01-10'

describe('CAT day helpers', () => {
  it('todayCAT returns a YYYY-MM-DD string', () => {
    expect(todayCAT()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('addDaysCAT adds and subtracts whole days', () => {
    expect(addDaysCAT(TODAY, 1)).toBe('2026-01-11')
    expect(addDaysCAT(TODAY, 3)).toBe('2026-01-13')
    expect(addDaysCAT(TODAY, 0)).toBe('2026-01-10')
    expect(addDaysCAT(TODAY, -1)).toBe('2026-01-09')
  })

  it('addDaysCAT rolls across month and year boundaries', () => {
    expect(addDaysCAT('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDaysCAT('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysCAT('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('scheduleAfterResult — promotion lengthens the interval', () => {
  it('a correct answer promotes the box and uses the new box interval', () => {
    const s1 = scheduleAfterResult(undefined, true, TODAY)
    expect(s1.box).toBe(1)
    expect(s1.dueDay).toBe(addDaysCAT(TODAY, INTERVALS[1]))

    const s2 = scheduleAfterResult(s1, true, s1.dueDay!)
    expect(s2.box).toBe(2)
    expect(s2.dueDay).toBe(addDaysCAT(s1.dueDay!, INTERVALS[2]))
  })

  it('each successive promotion schedules a strictly longer gap', () => {
    const gaps: number[] = []
    let state = initialReviewState()
    let day = TODAY
    for (let i = 0; i < MAX_BOX; i += 1) {
      const next = scheduleAfterResult(state, true, day)
      gaps.push(INTERVALS[next.box])
      state = next
      day = next.dueDay!
    }
    // Gaps follow INTERVALS[1..MAX_BOX] and are strictly increasing.
    expect(gaps).toEqual([1, 3, 7, 16, 35])
    for (let i = 1; i < gaps.length; i += 1) expect(gaps[i]).toBeGreaterThan(gaps[i - 1])
  })

  it('clamps the box at MAX_BOX and keeps the longest interval', () => {
    let state = initialReviewState()
    let day = TODAY
    for (let i = 0; i < 10; i += 1) {
      state = scheduleAfterResult(state, true, day)
      day = state.dueDay!
    }
    expect(state.box).toBe(MAX_BOX)
    const after = scheduleAfterResult(state, true, day)
    expect(after.box).toBe(MAX_BOX)
    expect(after.dueDay).toBe(addDaysCAT(day, INTERVALS[MAX_BOX]))
  })

  it('tracks seen/correct and lastReviewedDay on every result', () => {
    const s1 = scheduleAfterResult(undefined, true, TODAY)
    expect(s1).toMatchObject({ seen: 1, correct: 1, lastReviewedDay: TODAY, lapses: 0 })
    const s2 = scheduleAfterResult(s1, true, '2026-01-11')
    expect(s2).toMatchObject({ seen: 2, correct: 2, lastReviewedDay: '2026-01-11' })
  })
})

describe('scheduleAfterResult — a miss resurfaces tomorrow and lapses', () => {
  it('demotes the box, due tomorrow, lapses + 1, correct unchanged', () => {
    const promoted = scheduleAfterResult(scheduleAfterResult(undefined, true, TODAY), true, TODAY)
    expect(promoted.box).toBe(2)

    const missed = scheduleAfterResult(promoted, false, TODAY)
    expect(missed.box).toBe(1)
    expect(missed.dueDay).toBe(addDaysCAT(TODAY, 1))
    expect(missed.lapses).toBe(1)
    expect(missed.seen).toBe(promoted.seen + 1)
    expect(missed.correct).toBe(promoted.correct) // a miss never increments correct
  })

  it('clamps the box at 0 on a miss from a fresh concept', () => {
    const missed = scheduleAfterResult(undefined, false, TODAY)
    expect(missed.box).toBe(0)
    expect(missed.dueDay).toBe(addDaysCAT(TODAY, 1))
    expect(missed.lapses).toBe(1)
    expect(missed.seen).toBe(1)
    expect(missed.correct).toBe(0)
  })
})

describe('isDue — boundaries', () => {
  it('a fresh / unscheduled concept is always due', () => {
    expect(isDue(undefined, TODAY)).toBe(true)
    expect(isDue(initialReviewState(), TODAY)).toBe(true)
  })

  it('is due on or before the due day, not after', () => {
    const yesterday: ReviewState = { ...initialReviewState(), dueDay: '2026-01-09' }
    const exactly: ReviewState = { ...initialReviewState(), dueDay: TODAY }
    const tomorrow: ReviewState = { ...initialReviewState(), dueDay: '2026-01-11' }
    expect(isDue(yesterday, TODAY)).toBe(true)
    expect(isDue(exactly, TODAY)).toBe(true) // boundary: due today counts as due
    expect(isDue(tomorrow, TODAY)).toBe(false)
  })
})

describe('dueConcepts — filtering', () => {
  it('returns only due concepts, in the input order', () => {
    const a = 'deck-basics' as ConceptId
    const b = 'hand-rankings' as ConceptId
    const c = 'showdown' as ConceptId
    const states = {
      [a]: { ...initialReviewState(), dueDay: '2026-01-11' }, // not due yet
      [b]: { ...initialReviewState(), dueDay: '2026-01-10' }, // due today
      // c absent → treated as due
    } as Record<ConceptId, ReviewState>

    expect(dueConcepts(states, [a, b, c], TODAY)).toEqual([b, c])
  })
})

describe('accuracy', () => {
  it('is 0 when never seen and the correct rate otherwise', () => {
    expect(accuracy(undefined)).toBe(0)
    expect(accuracy(initialReviewState())).toBe(0)
    expect(accuracy({ ...initialReviewState(), seen: 4, correct: 3 })).toBe(0.75)
  })
})

describe('sanitizeReviewState', () => {
  it('passes a valid state through', () => {
    const valid: ReviewState = {
      box: 3,
      dueDay: '2026-02-01',
      lapses: 2,
      lastReviewedDay: '2026-01-25',
      seen: 5,
      correct: 4,
    }
    expect(sanitizeReviewState(valid)).toEqual(valid)
  })

  it('repairs out-of-range / wrong-typed fields and rejects non-objects', () => {
    expect(sanitizeReviewState(null)).toBeNull()
    expect(sanitizeReviewState('nope')).toBeNull()
    expect(
      sanitizeReviewState({
        box: 99,
        dueDay: 'not-a-day',
        lapses: -3,
        lastReviewedDay: 5,
        seen: 2,
        correct: 9,
      }),
    ).toEqual({
      box: MAX_BOX, // clamped
      dueDay: null, // invalid pattern dropped
      lapses: 0, // negative dropped
      lastReviewedDay: null, // wrong type dropped
      seen: 2,
      correct: 2, // capped at seen
    })
  })
})
