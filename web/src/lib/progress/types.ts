import type { LessonXpBreakdown } from '../gamification'

export type LessonXpBreakdownStored = {
  base: number
  bonus: number
}

export type LessonStats = {
  attempted: boolean
  lessonFinished: boolean
  completed: boolean
  lessonAccuracy: number | null
  skillCheckCorrect: number | null
  skillCheckTotal: number | null
  /** Problem submit counts saved when the lesson body is finished (before skill check). */
  pendingProblemAttempts: Record<string, number> | null
  /** Problem step ids captured at lesson finish (for XP without loading lesson content). */
  pendingProblemStepIds: string[] | null
  /** XP breakdown from the most recent first-time completion. */
  lastLessonXpBreakdown: LessonXpBreakdownStored | null
}

export const defaultLessonStats = (): LessonStats => ({
  attempted: false,
  lessonFinished: false,
  completed: false,
  lessonAccuracy: null,
  skillCheckCorrect: null,
  skillCheckTotal: null,
  pendingProblemAttempts: null,
  pendingProblemStepIds: null,
  lastLessonXpBreakdown: null,
})

export type LessonSession = {
  stepIndex: number
  solvedStepIds: string[]
  /** Submit count per problem step id (every "Check answer" click). */
  problemAttempts?: Record<string, number>
}

/** The remote shape behind the seam: a lesson's stats plus its (optional) in-progress session. */
export type LessonProgressPayload = {
  stats: LessonStats
  session?: LessonSession | null
}

/** Outcome of an atomic lesson completion (the XP/level/streak the user ended on). */
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

/** Result returned synchronously to the UI when a lesson is completed. */
export type SkillCheckSaveResult = {
  isFirstCompletion: boolean
  xpBreakdown: LessonXpBreakdown | null
  /**
   * The authoritative backend award (XP / level / streak), or null for guests and for
   * failed writes. Resolved asynchronously so the "win the pot" celebration can prefer
   * the Firestore values without blocking on them; it never rejects.
   */
  award: Promise<LessonCompletionAward | null>
}

/**
 * The seam in front of remote persistence. Local storage is NOT an adapter — it is
 * the ProgressStore's intrinsic offline-first cache. Two adapters justify the seam:
 * `FirestoreProgressBackend` in production and `InMemoryProgressBackend` in tests.
 */
export interface ProgressBackend {
  /** Read every persisted lesson payload for a user (stats + session). */
  loadAll(uid: string): Promise<Record<string, LessonProgressPayload>>
  /** Persist one lesson's stats + session (a stale/empty session is dropped under merge). */
  writeLesson(uid: string, lessonId: string, payload: LessonProgressPayload): Promise<void>
  /**
   * Atomically record a completion and award XP exactly once. Idempotency is anchored
   * on the persisted `xpAwarded`/`completed` flags, not in-memory state; the streak
   * advances once per CAT day for any qualifying pass (incl. retakes), without re-awarding.
   */
  completeLesson(
    uid: string,
    lessonId: string,
    xpBreakdown: LessonXpBreakdown | null,
    stats: LessonStats,
  ): Promise<LessonCompletionAward | null>
  /** Advance the streak once per CAT day for an activity that awards no XP (e.g. a review). */
  touchStreak(uid: string): Promise<void>
  /** Drop all of a user's remote lesson progress. */
  clear(uid: string): Promise<void>
}
