import { deleteField, doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import {
  XP_BASE_LESSON,
  computeStreakAfterCompletion,
  didStreakIncrease,
  getCalendarDayCAT,
  levelFromTotalXp,
  notifyGamificationUpdated,
} from './gamification'
import type { LessonStats } from './lessonProgressStore'

export type LessonCompletionAward = {
  xpAwarded: number
  baseXp: number
  bonusXp: number
  totalXp: number
  level: number
  streak: number
  leveledUp: boolean
  /** True when this completion advanced the displayed streak (first activity today). */
  streakIncreased: boolean
}

/**
 * Atomically record a passed skill check and award XP exactly once.
 *
 * Everything happens in ONE Firestore transaction:
 *  - `users/{uid}/lessonProgress/{lessonId}` is set to `completed: true` with an
 *    `xpAwarded: true` flag and its stale `session` dropped.
 *  - `users/{uid}` XP/level are bumped — but ONLY if `xpAwarded` was not already
 *    set on the progress doc. This makes XP idempotent across re-completions,
 *    rapid double-taps, and multiple devices (PM P1 #6): the persisted flag is
 *    the single source of truth, not the in-memory/local `completed` state.
 *  - The streak advances once per CAT day for any qualifying pass (first
 *    completion OR a later skill-check retake), without re-awarding XP (P1 #4).
 *
 * `xpAmount` is the base+bonus total computed by the caller for a first-time
 * completion; it is ignored when the lesson was already awarded.
 */
export async function awardLessonCompletion(
  uid: string,
  lessonId: string,
  xpAmount: number,
  stats: LessonStats,
): Promise<LessonCompletionAward | null> {
  const userRef = doc(db, 'users', uid)
  const progressRef = doc(db, 'users', uid, 'lessonProgress', lessonId)
  const today = getCalendarDayCAT()

  const result = await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef)
    const progressSnap = await transaction.get(progressRef)

    // Treat an explicit `xpAwarded` flag OR an already-`completed` progress doc
    // as "already awarded". The `completed` fallback protects lessons that were
    // completed BEFORE this flag existed from a double-award on a stale second
    // device (XP is only ever granted on the first completion).
    const progressData = progressSnap.exists() ? progressSnap.data() : null
    const alreadyAwarded =
      progressData != null &&
      (progressData.xpAwarded === true || progressData.completed === true)
    const userExists = userSnap.exists()
    const willAward = userExists && !alreadyAwarded && xpAmount > 0

    // Persist the latest stats + completion, and drop any stale mid-lesson
    // session (deleteField actually removes it under merge:true). Only stamp
    // `xpAwarded` once we know XP is (or was already) accounted for, so a
    // missing user doc can't permanently lock out a future award.
    const progressUpdate: Record<string, unknown> = {
      ...stats,
      completed: true,
      updatedAt: serverTimestamp(),
      session: deleteField(),
    }
    if (alreadyAwarded || willAward) {
      progressUpdate.xpAwarded = true
    }
    transaction.set(progressRef, progressUpdate, { merge: true })

    if (!userExists) return null

    const data = userSnap.data()
    const previousLevel = typeof data.level === 'number' ? data.level : 1
    const totalXp = typeof data.totalXp === 'number' ? data.totalXp : 0
    const storedStreak = typeof data.streak === 'number' ? data.streak : 0
    const lastActivityDate =
      typeof data.lastActivityDate === 'string' ? data.lastActivityDate : null

    const xpToAdd = willAward ? xpAmount : 0
    const newTotalXp = totalXp + xpToAdd
    const newLevel = levelFromTotalXp(newTotalXp)
    const streakUpdate = computeStreakAfterCompletion(storedStreak, lastActivityDate, today)

    transaction.update(userRef, {
      totalXp: newTotalXp,
      level: newLevel,
      streak: streakUpdate.streak,
      lastActivityDate: streakUpdate.lastActivityDate,
    })

    return {
      xpAwarded: xpToAdd,
      baseXp: xpToAdd > 0 ? Math.min(xpToAdd, XP_BASE_LESSON) : 0,
      bonusXp: xpToAdd > 0 ? Math.max(0, xpToAdd - XP_BASE_LESSON) : 0,
      totalXp: newTotalXp,
      level: newLevel,
      streak: streakUpdate.streak,
      leveledUp: newLevel > previousLevel,
      streakIncreased: didStreakIncrease(storedStreak, lastActivityDate, today),
    }
  })

  if (result) {
    notifyGamificationUpdated({ streakIncreased: result.streakIncreased })
  }

  return result
}

/**
 * Advance the streak once per CAT day for a qualifying activity that does NOT
 * award XP — e.g. finishing a review of an already-completed lesson (P1 #4).
 * No-op if the streak was already credited today.
 */
export async function touchStreakForActivity(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid)
  const today = getCalendarDayCAT()

  const result = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef)
    if (!snap.exists()) return { changed: false, streakIncreased: false }

    const data = snap.data()
    const lastActivityDate =
      typeof data.lastActivityDate === 'string' ? data.lastActivityDate : null
    if (lastActivityDate === today) return { changed: false, streakIncreased: false }

    const storedStreak = typeof data.streak === 'number' ? data.streak : 0
    const streakIncreased = didStreakIncrease(storedStreak, lastActivityDate, today)
    const streakUpdate = computeStreakAfterCompletion(storedStreak, lastActivityDate, today)

    transaction.update(userRef, {
      streak: streakUpdate.streak,
      lastActivityDate: streakUpdate.lastActivityDate,
    })
    return { changed: true, streakIncreased }
  })

  if (result.changed) {
    notifyGamificationUpdated({ streakIncreased: result.streakIncreased })
  }
}
