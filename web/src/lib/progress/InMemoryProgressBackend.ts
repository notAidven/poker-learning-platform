/**
 * Plain-object `ProgressBackend` that reproduces the Firestore adapter's contract
 * — including idempotent completion (XP once, anchored on a persisted `xpAwarded`
 * flag) and streak-once-per-CAT-day — so the completion / streak / H1 paths are
 * unit-testable with no Firebase. The CAT "today" is injectable for deterministic
 * streak tests.
 */
import type { LessonXpBreakdown } from '../gamification'
import {
  XP_BASE_LESSON,
  computeStreakAfterCompletion,
  didStreakIncrease,
  getCalendarDayCAT,
  levelFromTotalXp,
} from '../gamification'
import type {
  LessonCompletionAward,
  LessonProgressPayload,
  LessonStats,
  ProgressBackend,
} from './types'

export type InMemoryUser = {
  totalXp: number
  level: number
  streak: number
  lastActivityDate: string | null
}

/** The persisted progress doc: the lesson stats plus the completion/award flags + session. */
type ProgressDoc = LessonStats & {
  xpAwarded?: boolean
  session?: LessonProgressPayload['session']
}

function hasActiveSession(session: LessonProgressPayload['session']): boolean {
  return Boolean(session && (session.stepIndex > 0 || session.solvedStepIds.length > 0))
}

function extractStats(doc: ProgressDoc): LessonStats {
  return {
    attempted: Boolean(doc.attempted),
    lessonFinished: Boolean(doc.lessonFinished),
    completed: Boolean(doc.completed),
    lessonAccuracy: doc.lessonAccuracy ?? null,
    skillCheckCorrect: doc.skillCheckCorrect ?? null,
    skillCheckTotal: doc.skillCheckTotal ?? null,
    pendingProblemAttempts: doc.pendingProblemAttempts ?? null,
    pendingProblemStepIds: doc.pendingProblemStepIds ?? null,
    lastLessonXpBreakdown: doc.lastLessonXpBreakdown ?? null,
  }
}

export type InMemoryProgressBackendOptions = {
  /** The current CAT calendar day; injectable so streak tests can advance time. */
  today?: () => string
}

export class InMemoryProgressBackend implements ProgressBackend {
  private readonly users = new Map<string, InMemoryUser>()
  private readonly docs = new Map<string, Map<string, ProgressDoc>>()
  private readonly today: () => string

  constructor(options: InMemoryProgressBackendOptions = {}) {
    this.today = options.today ?? (() => getCalendarDayCAT())
  }

  /** Seed (or replace) a user record — mirrors the Firestore `users/{uid}` doc. */
  seedUser(uid: string, user: Partial<InMemoryUser> = {}): void {
    this.users.set(uid, {
      totalXp: user.totalXp ?? 0,
      level: user.level ?? 1,
      streak: user.streak ?? 0,
      lastActivityDate: user.lastActivityDate ?? null,
    })
  }

  /** Read a user record (for assertions). Returns a copy. */
  getUser(uid: string): InMemoryUser | null {
    const user = this.users.get(uid)
    return user ? { ...user } : null
  }

  private docsFor(uid: string): Map<string, ProgressDoc> {
    let docs = this.docs.get(uid)
    if (!docs) {
      docs = new Map()
      this.docs.set(uid, docs)
    }
    return docs
  }

  async loadAll(uid: string): Promise<Record<string, LessonProgressPayload>> {
    const out: Record<string, LessonProgressPayload> = {}
    for (const [lessonId, doc] of this.docsFor(uid)) {
      out[lessonId] = {
        stats: extractStats(doc),
        session: doc.session
          ? {
              stepIndex: doc.session.stepIndex ?? 0,
              solvedStepIds: [...doc.session.solvedStepIds],
              problemAttempts: doc.session.problemAttempts
                ? { ...doc.session.problemAttempts }
                : undefined,
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
    const docs = this.docsFor(uid)
    const existing = docs.get(lessonId) ?? ({} as ProgressDoc)
    const next: ProgressDoc = { ...existing, ...payload.stats }
    if (hasActiveSession(payload.session)) {
      next.session = payload.session ?? undefined
    } else {
      delete next.session
    }
    docs.set(lessonId, next)
  }

  async completeLesson(
    uid: string,
    lessonId: string,
    xpBreakdown: LessonXpBreakdown | null,
    stats: LessonStats,
  ): Promise<LessonCompletionAward | null> {
    const xpAmount = xpBreakdown?.total ?? 0
    const today = this.today()
    const docs = this.docsFor(uid)

    const progressData = docs.get(lessonId) ?? null
    const alreadyAwarded =
      progressData != null && (progressData.xpAwarded === true || progressData.completed === true)
    const user = this.users.get(uid)
    const userExists = user != null
    const willAward = userExists && !alreadyAwarded && xpAmount > 0

    const existing = docs.get(lessonId) ?? ({} as ProgressDoc)
    const next: ProgressDoc = { ...existing, ...stats, completed: true }
    delete next.session
    if (alreadyAwarded || willAward) next.xpAwarded = true
    docs.set(lessonId, next)

    if (!user) return null

    const previousLevel = user.level
    const xpToAdd = willAward ? xpAmount : 0
    const newTotalXp = user.totalXp + xpToAdd
    const newLevel = levelFromTotalXp(newTotalXp)
    const streakIncreased = didStreakIncrease(user.streak, user.lastActivityDate, today)
    const streakUpdate = computeStreakAfterCompletion(user.streak, user.lastActivityDate, today)

    user.totalXp = newTotalXp
    user.level = newLevel
    user.streak = streakUpdate.streak
    user.lastActivityDate = streakUpdate.lastActivityDate

    return {
      xpAwarded: xpToAdd,
      baseXp: xpToAdd > 0 ? Math.min(xpToAdd, XP_BASE_LESSON) : 0,
      bonusXp: xpToAdd > 0 ? Math.max(0, xpToAdd - XP_BASE_LESSON) : 0,
      totalXp: newTotalXp,
      level: newLevel,
      streak: streakUpdate.streak,
      leveledUp: newLevel > previousLevel,
      streakIncreased,
    }
  }

  async touchStreak(uid: string): Promise<void> {
    const user = this.users.get(uid)
    if (!user) return
    const today = this.today()
    if (user.lastActivityDate === today) return
    const streakUpdate = computeStreakAfterCompletion(user.streak, user.lastActivityDate, today)
    user.streak = streakUpdate.streak
    user.lastActivityDate = streakUpdate.lastActivityDate
  }

  async clear(uid: string): Promise<void> {
    this.docs.delete(uid)
  }
}
