/**
 * Production `ProgressBackend` over Firestore (`users/{uid}` + the `lessonProgress`
 * subcollection). The aggregate behind this seam includes the user's XP / level /
 * streak counters because a completion must write them atomically with the progress
 * doc. The exact transaction semantics are preserved:
 *   - completion is idempotent, anchored on the persisted `xpAwarded` / `completed`
 *     flags (not in-memory state), so re-completions, double-taps, and multiple
 *     devices never double-award XP;
 *   - the streak advances once per CAT day for any qualifying pass (incl. retakes);
 *   - a stale mid-lesson session is dropped via `deleteField()` under `merge: true`.
 */
import type { LessonXpBreakdown } from '../gamification'
import {
  XP_BASE_LESSON,
  computeReplayXp,
  computeStreakAfterCompletion,
  didStreakIncrease,
  getCalendarDayCAT,
  levelFromTotalXp,
  notifyGamificationUpdated,
} from '../gamification'
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { sanitizeProblemAttempts, sanitizeStringArray } from './sanitize'
import { sanitizeReviewState } from '../review/scheduler'
import type {
  LessonCompletionAward,
  LessonProgressPayload,
  LessonSession,
  LessonStats,
  ProgressBackend,
} from './types'
import type { ReviewState } from '../review/types'

/** Firestore: users/{uid}/lessonProgress/{lessonId} */
type FirestoreLessonProgressDoc = LessonStats & {
  session?: LessonSession
  xpAwarded?: boolean
  /** How many replays of this item have already been rewarded (drives diminishing replay XP). */
  replayCount?: number
  updatedAt?: Timestamp
}

function progressCollection(uid: string) {
  return collection(db, 'users', uid, 'lessonProgress')
}

function progressDoc(uid: string, lessonId: string) {
  return doc(db, 'users', uid, 'lessonProgress', lessonId)
}

function reviewCollection(uid: string) {
  return collection(db, 'users', uid, 'review')
}

function reviewDoc(uid: string, conceptId: string) {
  return doc(db, 'users', uid, 'review', conceptId)
}

export class FirestoreProgressBackend implements ProgressBackend {
  async loadAll(uid: string): Promise<Record<string, LessonProgressPayload>> {
    const snap = await getDocs(progressCollection(uid))
    const out: Record<string, LessonProgressPayload> = {}

    for (const docSnap of snap.docs) {
      const data = docSnap.data() as FirestoreLessonProgressDoc
      out[docSnap.id] = {
        stats: {
          attempted: Boolean(data.attempted),
          lessonFinished: Boolean(data.lessonFinished),
          completed: Boolean(data.completed),
          lessonAccuracy: data.lessonAccuracy ?? null,
          skillCheckCorrect: data.skillCheckCorrect ?? null,
          skillCheckTotal: data.skillCheckTotal ?? null,
          pendingProblemAttempts: sanitizeProblemAttempts(data.pendingProblemAttempts) ?? null,
          pendingProblemStepIds: Array.isArray(data.pendingProblemStepIds)
            ? sanitizeStringArray(data.pendingProblemStepIds)
            : null,
          lastLessonXpBreakdown:
            data.lastLessonXpBreakdown &&
            typeof data.lastLessonXpBreakdown.base === 'number' &&
            typeof data.lastLessonXpBreakdown.bonus === 'number'
              ? {
                  base: data.lastLessonXpBreakdown.base,
                  bonus: data.lastLessonXpBreakdown.bonus,
                }
              : null,
          testedOut: Boolean(data.testedOut),
        },
        session: data.session
          ? {
              stepIndex: data.session.stepIndex ?? 0,
              solvedStepIds: sanitizeStringArray(data.session.solvedStepIds),
              problemAttempts: sanitizeProblemAttempts(data.session.problemAttempts),
            }
          : undefined,
      }
    }

    return out
  }

  async writeLesson(
    uid: string,
    lessonId: string,
    payload: LessonProgressPayload,
  ): Promise<void> {
    const hasActiveSession = Boolean(
      payload.session &&
        (payload.session.stepIndex > 0 || payload.session.solvedStepIds.length > 0),
    )

    // Loose record so we can write deleteField() to actually remove a stale session
    // under merge:true — omitting the key would otherwise leave the old value behind,
    // resurrecting mid-lesson progress after a completed-lesson review restart,
    // skill-check reset, or lesson completion. (A normal mid-lesson leave keeps the
    // session so the learner resumes where they left off, so no clear happens then.)
    const body: Record<string, unknown> = {
      ...payload.stats,
      updatedAt: serverTimestamp(),
      session: hasActiveSession ? payload.session : deleteField(),
    }

    await setDoc(progressDoc(uid, lessonId), body, { merge: true })
  }

  async completeLesson(
    uid: string,
    lessonId: string,
    xpBreakdown: LessonXpBreakdown | null,
    stats: LessonStats,
  ): Promise<LessonCompletionAward | null> {
    // A non-null breakdown is a first-completion attempt; null is a replay (see ProgressBackend).
    const isFirstAttempt = xpBreakdown != null
    const firstXp = xpBreakdown?.total ?? 0
    const userRef = doc(db, 'users', uid)
    const progressRef = progressDoc(uid, lessonId)
    const today = getCalendarDayCAT()

    const result = await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef)
      const progressSnap = await transaction.get(progressRef)

      // Treat an explicit `xpAwarded` flag OR an already-`completed` progress doc
      // as "already awarded". The `completed` fallback protects lessons that were
      // completed BEFORE this flag existed from a double-award on a stale second
      // device (first-completion XP is only ever granted once).
      const progressData = progressSnap.exists() ? progressSnap.data() : null
      const priorReplays =
        progressData && typeof progressData.replayCount === 'number' ? progressData.replayCount : 0
      const alreadyAwarded =
        progressData != null &&
        (progressData.xpAwarded === true || progressData.completed === true)
      const userExists = userSnap.exists()

      // First completion awards the full breakdown exactly once; a replay (null
      // breakdown on an already-awarded doc) awards a small, decaying amount.
      const willAwardFirst = userExists && isFirstAttempt && !alreadyAwarded && firstXp > 0
      const willAwardReplay = userExists && !isFirstAttempt && alreadyAwarded
      const xpToAdd = willAwardFirst
        ? firstXp
        : willAwardReplay
          ? computeReplayXp(priorReplays)
          : 0

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
      if (alreadyAwarded || willAwardFirst) {
        progressUpdate.xpAwarded = true
      }
      if (willAwardReplay) {
        progressUpdate.replayCount = priorReplays + 1
      }
      transaction.set(progressRef, progressUpdate, { merge: true })

      if (!userExists) return null

      const data = userSnap.data()
      const previousLevel = typeof data.level === 'number' ? data.level : 1
      const totalXp = typeof data.totalXp === 'number' ? data.totalXp : 0
      const storedStreak = typeof data.streak === 'number' ? data.streak : 0
      const lastActivityDate =
        typeof data.lastActivityDate === 'string' ? data.lastActivityDate : null

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

  async touchStreak(uid: string): Promise<void> {
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

  async loadReview(uid: string): Promise<Record<string, ReviewState>> {
    const snap = await getDocs(reviewCollection(uid))
    const out: Record<string, ReviewState> = {}
    for (const docSnap of snap.docs) {
      const state = sanitizeReviewState(docSnap.data())
      if (state) out[docSnap.id] = state
    }
    return out
  }

  async writeReview(uid: string, conceptId: string, state: ReviewState): Promise<void> {
    // merge:true so a future schema addition never clobbers fields; the doc only ever
    // holds the ReviewState fields plus updatedAt.
    await setDoc(
      reviewDoc(uid, conceptId),
      { ...state, updatedAt: serverTimestamp() },
      { merge: true },
    )
  }

  async clear(uid: string): Promise<void> {
    // Production H1 reset wipes LOCAL state only (a shared device must not leak data),
    // so this remote clear is intentionally never called by the auth-sync seam; it
    // completes the backend contract (the in-memory adapter mirrors it in tests).
    const [progressSnap, reviewSnap] = await Promise.all([
      getDocs(progressCollection(uid)),
      getDocs(reviewCollection(uid)),
    ])
    await Promise.all([
      ...progressSnap.docs.map((docSnap) => deleteDoc(progressDoc(uid, docSnap.id))),
      ...reviewSnap.docs.map((docSnap) => deleteDoc(reviewDoc(uid, docSnap.id))),
    ])
  }
}
