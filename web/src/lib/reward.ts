import {
  computeStreakAfterCompletion,
  didStreakIncrease,
  getLevelProgress,
  type LessonXpBreakdown,
} from './gamification'
import type { LessonCompletionAward } from './progress/types'

/**
 * Everything the "win the pot" celebration needs, derived once at pass time. XP and
 * the level-meter beats are computed locally (from the pre-completion profile + the
 * XP earned this run) so the visible +XP always matches the meter and the guest path
 * works with no Firestore. The streak fields prefer the authoritative Firestore award
 * when present, falling back to the same local streak math.
 */
export type RewardModel = {
  xpGained: number
  base: number
  bonus: number
  /** XP into the starting level (meter start). */
  fromXp: number
  /** XP into the final level (meter end). */
  toXp: number
  fromLevel: number
  level: number
  leveledUp: boolean
  streak: number
  streakIncreased: boolean
}

export function buildRewardModel(args: {
  xpBreakdown: LessonXpBreakdown
  prevTotalXp: number
  prevStreakStored: number
  prevLastActivityDate: string | null
  award: LessonCompletionAward | null
  today?: string
}): RewardModel {
  const { xpBreakdown, prevTotalXp, prevStreakStored, prevLastActivityDate, award, today } = args
  const xpGained = xpBreakdown.total
  const before = getLevelProgress(prevTotalXp)
  const after = getLevelProgress(prevTotalXp + xpGained)

  const localStreak = computeStreakAfterCompletion(prevStreakStored, prevLastActivityDate, today).streak
  const localStreakIncreased = didStreakIncrease(prevStreakStored, prevLastActivityDate, today)

  return {
    xpGained,
    base: xpBreakdown.base,
    bonus: xpBreakdown.bonus,
    fromXp: before.xpInLevel,
    toXp: after.xpInLevel,
    fromLevel: before.level,
    level: after.level,
    leveledUp: after.level > before.level,
    streak: award ? award.streak : localStreak,
    streakIncreased: award ? award.streakIncreased : localStreakIncreased,
  }
}
