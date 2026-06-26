/**
 * Tests for the pure "win the pot" reward plumbing: the streak-increase predicate and
 * the celebration model builder. No Firestore — the award is passed in as a plain value.
 */
import { describe, expect, it } from 'vitest'
import { didStreakIncrease } from './gamification'
import { buildRewardModel } from './reward'
import type { LessonCompletionAward } from './gamificationFirestore'

const TODAY = '2026-06-26'
const YESTERDAY = '2026-06-25'
const LAST_WEEK = '2026-06-20'

function award(partial: Partial<LessonCompletionAward>): LessonCompletionAward {
  return {
    xpAwarded: 0,
    baseXp: 0,
    bonusXp: 0,
    totalXp: 0,
    level: 1,
    streak: 0,
    leveledUp: false,
    streakIncreased: false,
    ...partial,
  }
}

describe('didStreakIncrease', () => {
  it('is false when the streak was already credited today', () => {
    expect(didStreakIncrease(5, TODAY, TODAY)).toBe(false)
  })

  it('is true when continuing a streak from yesterday', () => {
    expect(didStreakIncrease(5, YESTERDAY, TODAY)).toBe(true)
  })

  it('is true when starting fresh after a missed day (0 → 1)', () => {
    expect(didStreakIncrease(5, LAST_WEEK, TODAY)).toBe(true)
  })

  it('is true for the very first activity', () => {
    expect(didStreakIncrease(0, null, TODAY)).toBe(true)
  })
})

describe('buildRewardModel', () => {
  it('models a normal gain within a level (guest / no award)', () => {
    const model = buildRewardModel({
      xpBreakdown: { base: 50, bonus: 0, total: 50 },
      prevTotalXp: 10,
      prevStreakStored: 3,
      prevLastActivityDate: YESTERDAY,
      award: null,
      today: TODAY,
    })

    expect(model).toMatchObject({
      xpGained: 50,
      base: 50,
      bonus: 0,
      fromLevel: 1,
      level: 1,
      leveledUp: false,
      fromXp: 10,
      toXp: 60,
      streak: 4,
      streakIncreased: true,
    })
  })

  it('models a level-up (and can span multiple levels)', () => {
    // 80 XP (level 1) + 150 → 230: level 1 (100) + level 2 (125) leaves 5 into level 3.
    const model = buildRewardModel({
      xpBreakdown: { base: 100, bonus: 50, total: 150 },
      prevTotalXp: 80,
      prevStreakStored: 0,
      prevLastActivityDate: null,
      award: null,
      today: TODAY,
    })

    expect(model).toMatchObject({
      xpGained: 150,
      fromLevel: 1,
      level: 3,
      leveledUp: true,
      fromXp: 80,
      toXp: 5,
      streak: 1,
      streakIncreased: true,
    })
  })

  it('prefers the authoritative award for the streak fields', () => {
    // Local math (already active today) would give streak 2 / no increase…
    const model = buildRewardModel({
      xpBreakdown: { base: 100, bonus: 0, total: 100 },
      prevTotalXp: 0,
      prevStreakStored: 2,
      prevLastActivityDate: TODAY,
      award: award({ streak: 9, streakIncreased: true }),
      today: TODAY,
    })

    // …but the Firestore award wins.
    expect(model.streak).toBe(9)
    expect(model.streakIncreased).toBe(true)
    // XP / meter stay local so they always match the displayed +XP.
    expect(model).toMatchObject({ xpGained: 100, fromLevel: 1, level: 2, leveledUp: true })
  })

  it('keeps XP/meter local even if the award reports no XP (idempotent re-award)', () => {
    const model = buildRewardModel({
      xpBreakdown: { base: 100, bonus: 50, total: 150 },
      prevTotalXp: 50,
      prevStreakStored: 3,
      prevLastActivityDate: YESTERDAY,
      award: award({ xpAwarded: 0, totalXp: 50, level: 1, streak: 4, streakIncreased: false }),
      today: TODAY,
    })

    expect(model).toMatchObject({
      xpGained: 150,
      fromLevel: 1,
      level: 2,
      leveledUp: true,
      fromXp: 50,
      toXp: 100,
      streak: 4,
      streakIncreased: false,
    })
  })
})
