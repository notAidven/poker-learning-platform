import { doc, runTransaction } from 'firebase/firestore'
import { db } from './firebase'
import {
  XP_BASE_LESSON,
  computeStreakAfterCompletion,
  getCalendarDayCAT,
  levelFromTotalXp,
  notifyGamificationUpdated,
} from './gamification'

export type LessonCompletionAward = {
  xpAwarded: number
  baseXp: number
  bonusXp: number
  totalXp: number
  level: number
  streak: number
  leveledUp: boolean
}

export async function awardLessonCompletion(
  uid: string,
  xpAmount = XP_BASE_LESSON,
): Promise<LessonCompletionAward | null> {
  const userRef = doc(db, 'users', uid)
  const today = getCalendarDayCAT()

  const result = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef)
    if (!snap.exists()) return null

    const data = snap.data()
    const previousLevel = typeof data.level === 'number' ? data.level : 1
    const totalXp = typeof data.totalXp === 'number' ? data.totalXp : 0
    const storedStreak = typeof data.streak === 'number' ? data.streak : 0
    const lastActivityDate =
      typeof data.lastActivityDate === 'string' ? data.lastActivityDate : null

    const newTotalXp = totalXp + xpAmount
    const newLevel = levelFromTotalXp(newTotalXp)
    const streakUpdate = computeStreakAfterCompletion(storedStreak, lastActivityDate, today)

    transaction.update(userRef, {
      totalXp: newTotalXp,
      level: newLevel,
      streak: streakUpdate.streak,
      lastActivityDate: streakUpdate.lastActivityDate,
    })

    return {
      xpAwarded: xpAmount,
      baseXp: Math.min(xpAmount, XP_BASE_LESSON),
      bonusXp: Math.max(0, xpAmount - XP_BASE_LESSON),
      totalXp: newTotalXp,
      level: newLevel,
      streak: streakUpdate.streak,
      leveledUp: newLevel > previousLevel,
    }
  })

  if (result) {
    notifyGamificationUpdated()
  }

  return result
}
