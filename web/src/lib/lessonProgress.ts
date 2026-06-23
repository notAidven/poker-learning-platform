import { lessons } from '../data/lessons'
import { getLesson, hasLessonContent } from '../data/lessonContent'
import { auth } from './firebase'
import { awardLessonCompletion } from './gamificationFirestore'
import { computeLessonXp, type LessonXpBreakdown } from './gamification'
import { loadLessonSession, clearLessonSession } from './lessonSession'
import { isProblemStep } from '../types/lesson'
import {
  defaultLessonStats,
  ensureStatsCache,
  getCompletedLessonIdsFromStorage,
  notifyProgressUpdated,
  syncCompletedIds,
  writeStatsMap,
  type LessonStats,
} from './lessonProgressStore'
import {
  queueSessionClearFirestoreWrite,
  queueStatsFirestoreWrite,
} from './progressSync'

export type { LessonStats } from './lessonProgressStore'

export function getLessonStats(lessonId: string): LessonStats {
  const map = ensureStatsCache()
  if (map[lessonId]) return map[lessonId]

  if (getCompletedLessonIds().includes(lessonId)) {
    return {
      attempted: true,
      lessonFinished: true,
      completed: true,
      lessonAccuracy: null,
      skillCheckCorrect: null,
      skillCheckTotal: null,
      pendingProblemAttempts: null,
      lastLessonXpBreakdown: null,
    }
  }

  return defaultLessonStats()
}

export function getAllLessonStats(): Record<string, LessonStats> {
  return { ...ensureStatsCache() }
}

export function markLessonAttempted(lessonId: string) {
  const map = ensureStatsCache()
  const current = map[lessonId] ?? defaultLessonStats()
  if (current.attempted) return
  map[lessonId] = { ...current, attempted: true }
  writeStatsMap(map)
  queueStatsFirestoreWrite(lessonId, map[lessonId])
  notifyProgressUpdated()
}

export function saveLessonFinished(
  lessonId: string,
  lessonAccuracy: number,
  problemAttempts: Record<string, number>,
) {
  const map = ensureStatsCache()
  const current = map[lessonId] ?? defaultLessonStats()
  map[lessonId] = {
    ...current,
    attempted: true,
    lessonFinished: true,
    lessonAccuracy,
    pendingProblemAttempts: { ...problemAttempts },
  }
  writeStatsMap(map)
  queueStatsFirestoreWrite(lessonId, map[lessonId])
  notifyProgressUpdated()
}

export type SkillCheckSaveResult = {
  isFirstCompletion: boolean
  xpBreakdown: LessonXpBreakdown | null
}

export function saveSkillCheckResult(
  lessonId: string,
  correct: number,
  total: number,
): SkillCheckSaveResult {
  const map = ensureStatsCache()
  const current = map[lessonId] ?? defaultLessonStats()
  const isFirstCompletion = !current.completed

  const lesson = getLesson(lessonId)
  const problemStepIds =
    lesson?.steps.filter(isProblemStep).map((step) => step.id) ?? []
  const xpBreakdown = isFirstCompletion
    ? computeLessonXp(current.pendingProblemAttempts ?? {}, problemStepIds)
    : null

  map[lessonId] = {
    ...current,
    attempted: true,
    lessonFinished: true,
    completed: true,
    skillCheckCorrect: correct,
    skillCheckTotal: total,
    pendingProblemAttempts: null,
    lastLessonXpBreakdown: xpBreakdown
      ? { base: xpBreakdown.base, bonus: xpBreakdown.bonus }
      : current.lastLessonXpBreakdown,
  }
  writeStatsMap(map)
  syncCompletedIds(map)
  queueStatsFirestoreWrite(lessonId, map[lessonId])
  notifyProgressUpdated(true)

  if (isFirstCompletion && xpBreakdown) {
    const uid = auth.currentUser?.uid
    if (uid) {
      void awardLessonCompletion(uid, xpBreakdown.total).catch((err) => {
        console.warn('Failed to award lesson completion XP:', err)
      })
    }
  }

  return { isFirstCompletion, xpBreakdown }
}

/** @deprecated Use saveSkillCheckResult after the skill check */
export function markLessonComplete(_lessonId: string) {
  // Legacy no-op — completion now requires the skill check
}

export function getCompletedLessonIds(): string[] {
  return getCompletedLessonIdsFromStorage()
}

export function isLessonInProgress(lessonId: string, stepCount: number): boolean {
  const stats = getLessonStats(lessonId)
  if (stats.completed) return false
  if (stats.lessonFinished) return true
  const session = loadLessonSession(lessonId, stepCount)
  return session.stepIndex > 0 || session.solvedStepIds.length > 0
}

export function getNextLessonPath(completedIds: string[]): string {
  for (const lesson of lessons) {
    if (!completedIds.includes(lesson.id) && hasLessonContent(lesson.id)) {
      return `/lesson/${lesson.id}`
    }
  }
  return '/course'
}

export function skillCheckScorePercent(stats: LessonStats): number | null {
  if (stats.skillCheckCorrect == null || stats.skillCheckTotal == null || stats.skillCheckTotal === 0) {
    return null
  }
  return Math.round((stats.skillCheckCorrect / stats.skillCheckTotal) * 100)
}

export function onLessonSessionCleared(lessonId: string) {
  const stats = getLessonStats(lessonId)
  queueSessionClearFirestoreWrite(lessonId, stats)
}

/** Clears partial lesson progress so the student must redo lesson steps from step 1. */
export function resetLessonForRestart(lessonId: string) {
  const map = ensureStatsCache()
  const current = map[lessonId] ?? defaultLessonStats()
  if (current.completed) return

  map[lessonId] = {
    ...current,
    attempted: true,
    lessonFinished: false,
    lessonAccuracy: null,
    pendingProblemAttempts: null,
  }
  writeStatsMap(map)
  queueStatsFirestoreWrite(lessonId, map[lessonId])
  notifyProgressUpdated()
}

export function abandonLessonAttempt(lessonId: string, options?: { resetLessonFinished?: boolean }) {
  clearLessonSession(lessonId)
  onLessonSessionCleared(lessonId)
  if (options?.resetLessonFinished) {
    resetLessonForRestart(lessonId)
  }
}

export { notifyProgressUpdated } from './lessonProgressStore'
