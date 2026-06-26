import { lessons, type SectionId } from '../data/lessons'
import { isTableId, tables, type TableConfig } from '../data/tables'
import { hasLessonContent } from '../data/lessonContent'
import { hasSkillCheck } from '../data/skillCheckContent'
import { auth } from './firebase'
import { awardLessonCompletion, touchStreakForActivity } from './gamificationFirestore'
import { computeLessonXp, type LessonXpBreakdown } from './gamification'
import { loadLessonSession, clearLessonSession } from './lessonSession'
import {
  defaultLessonStats,
  ensureStatsCache,
  getCompletedLessonIdsFromStorage,
  notifyProgressUpdated,
  readClearedTableIdsFromStorage,
  syncCompletedIds,
  writeClearedTableIdsToStorage,
  writeStatsMap,
  type LessonStats,
} from './lessonProgressStore'
import {
  queueClearedTablesFirestoreWrite,
  queueCompletionFallbackWrite,
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
      pendingProblemStepIds: null,
      lastLessonXpBreakdown: null,
    }
  }

  return defaultLessonStats()
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
  problemStepIds: string[],
) {
  const map = ensureStatsCache()
  const current = map[lessonId] ?? defaultLessonStats()
  map[lessonId] = {
    ...current,
    attempted: true,
    lessonFinished: true,
    lessonAccuracy,
    pendingProblemAttempts: { ...problemAttempts },
    pendingProblemStepIds: [...problemStepIds],
  }
  writeStatsMap(map)
  queueStatsFirestoreWrite(lessonId, map[lessonId])
  notifyProgressUpdated()
}

export type SkillCheckSaveResult = {
  isFirstCompletion: boolean
  xpBreakdown: LessonXpBreakdown | null
}

/**
 * Shared completion path used by both a passed skill check and a lesson that
 * has no skill check. Updates local stats and, for signed-in users, hands off
 * to the atomic Firestore transaction (`awardLessonCompletion`) which:
 *   - awards XP exactly once (idempotent via the persisted `xpAwarded` flag), and
 *   - advances the streak once per day for any qualifying pass (incl. retakes).
 */
function applyLessonCompletion(
  lessonId: string,
  skillCheckCorrect: number | null,
  skillCheckTotal: number | null,
): SkillCheckSaveResult {
  const map = ensureStatsCache()
  const current = map[lessonId] ?? defaultLessonStats()
  const isFirstCompletion = !current.completed

  const problemStepIds = current.pendingProblemStepIds ?? Object.keys(current.pendingProblemAttempts ?? {})
  const xpBreakdown = isFirstCompletion
    ? computeLessonXp(current.pendingProblemAttempts ?? {}, problemStepIds)
    : null

  const nextStats: LessonStats = {
    ...current,
    attempted: true,
    lessonFinished: true,
    completed: true,
    skillCheckCorrect,
    skillCheckTotal,
    pendingProblemAttempts: null,
    lastLessonXpBreakdown: xpBreakdown
      ? { base: xpBreakdown.base, bonus: xpBreakdown.bonus }
      : current.lastLessonXpBreakdown,
  }
  map[lessonId] = nextStats
  writeStatsMap(map)
  syncCompletedIds(map)
  notifyProgressUpdated(true)

  const uid = auth.currentUser?.uid
  if (uid) {
    // The transaction persists the progress doc (completion + xpAwarded), so on
    // SUCCESS we intentionally do NOT also queue a separate stats write — that
    // would race with the atomic award. XP is added only on the first completion;
    // a retake just refreshes stats and advances the streak.
    void awardLessonCompletion(uid, lessonId, xpBreakdown?.total ?? 0, nextStats).catch(
      (err) => {
        // Durability: the atomic award didn't land, so the completion currently
        // lives only in local storage and the next applyRemoteProgress sync would
        // silently revert it. Best-effort persist completed:true to the remote
        // progress doc. awardLessonCompletion's completed/xpAwarded guard keeps a
        // later reconcile idempotent, so this never double-awards XP.
        console.warn('Failed to award lesson completion; persisting completion as a fallback:', err)
        queueCompletionFallbackWrite(lessonId, nextStats)
      },
    )
  }

  return { isFirstCompletion, xpBreakdown }
}

export function saveSkillCheckResult(
  lessonId: string,
  correct: number,
  total: number,
): SkillCheckSaveResult {
  return applyLessonCompletion(lessonId, correct, total)
}

/**
 * Complete a lesson that has no skill check (latent-safety, QA P2-3 / item #12).
 * Finishing the lesson body IS the full completion: mark completed and award XP
 * directly. All 6 current lessons have skill checks, so this is a guard for
 * future content rather than a path exercised today.
 */
export function completeLessonWithoutSkillCheck(lessonId: string): SkillCheckSaveResult {
  return applyLessonCompletion(lessonId, null, null)
}

/**
 * Credit a qualifying daily activity that should keep a streak alive without
 * awarding XP — e.g. finishing a review of an already-completed lesson (P1 #4).
 */
export function recordReviewActivity(): void {
  const uid = auth.currentUser?.uid
  if (!uid) return
  void touchStreakForActivity(uid).catch((err) => {
    console.warn('Failed to record review activity for streak:', err)
  })
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
    if (completedIds.includes(lesson.id) || !hasLessonContent(lesson.id)) continue

    // If the lesson body is already finished but its skill check is still
    // pending, send the learner straight to the skill check rather than
    // restarting the lesson body (QA deferred / item #9).
    const stats = getLessonStats(lesson.id)
    if (stats.lessonFinished && !stats.completed && hasSkillCheck(lesson.id)) {
      return `/lesson/${lesson.id}/skill-check`
    }
    return `/lesson/${lesson.id}`
  }
  return '/course'
}

/**
 * Sequential-unlock check shared by Home, the course path, and the route guards
 * (PM P1 #5). Lesson 1 is always open; lesson N requires lesson N-1 completed.
 * Unknown lesson ids return `true` so the page's own "not found" view can handle
 * them instead of redirecting.
 */
export function isLessonUnlocked(lessonId: string, completedIds: string[]): boolean {
  const index = lessons.findIndex((l) => l.id === lessonId)
  if (index <= 0) return true
  return completedIds.includes(lessons[index - 1].id)
}

export function skillCheckScorePercent(stats: LessonStats): number | null {
  if (stats.skillCheckCorrect == null || stats.skillCheckTotal == null || stats.skillCheckTotal === 0) {
    return null
  }
  return Math.round((stats.skillCheckCorrect / stats.skillCheckTotal) * 100)
}

// ---------------------------------------------------------------------------
// Casino Floor (Phase 2) — a lightweight "cleared" store kept entirely OUT of
// the lesson XP economy. A room is "cleared" the first time a hand reaches
// showdown (or the hero wins one); there is no XP and no skill check.
//
// Unlock gating (two-room model):
//  - Room 1 (coached) opens once the first two sections (Foundations + Playing a
//    Hand) are complete, so learners reach guided play before grinding The Math.
//  - Room 2 (AI) opens only after Room 1 has been cleared (its prereq is Room 1).
//
// Cleared-room state persists to Firestore (via progressSync) and is reconciled
// on sign-in, so clearing Room 1 on one device unlocks Room 2 on another.
// ---------------------------------------------------------------------------

/** The sections a learner must finish to reach guided casino play (Room 1). */
const GUIDED_PLAY_SECTIONS: ReadonlySet<SectionId> = new Set<SectionId>(['foundations', 'playing'])

/** True when every interactive lesson (kind !== 'ai-table') is in the completed set. */
export function areAllLessonsComplete(completedLessonIds: string[]): boolean {
  return lessons
    .filter((l) => l.kind !== 'ai-table')
    .every((l) => completedLessonIds.includes(l.id))
}

/**
 * True once every interactive lesson in the first two sections (Foundations +
 * Playing a Hand) is complete — the gate that opens the coached Room 1. It is a
 * strict subset of `areAllLessonsComplete`, so a fully-finished course always
 * keeps the casino open and the two gates stay coherent.
 */
export function areGuidedPlayLessonsComplete(completedLessonIds: string[]): boolean {
  return lessons
    .filter((l) => l.kind !== 'ai-table' && GUIDED_PLAY_SECTIONS.has(l.section))
    .every((l) => completedLessonIds.includes(l.id))
}

/** True once the learner has cleared the coached room (Room 1). */
export function hasClearedAnyCoachedTable(): boolean {
  const cleared = getClearedTableIds()
  return tables.some((t) => t.feature === 'coached' && cleared.includes(t.id))
}

export function getClearedTableIds(): string[] {
  return readClearedTableIdsFromStorage()
}

export function isTableCleared(tableId: string): boolean {
  return getClearedTableIds().includes(tableId)
}

/**
 * Mark a table cleared (idempotent): update the local mirror, persist to Firestore
 * for cross-device unlock, and notify the path/home so they re-render.
 */
export function markTableCleared(tableId: string): void {
  const current = getClearedTableIds()
  if (current.includes(tableId)) return
  const next = [...current, tableId]
  writeClearedTableIdsToStorage(next)
  queueClearedTablesFirestoreWrite(next)
  notifyProgressUpdated()
}

/**
 * Whether a casino room is unlocked (two-room model).
 *
 *  - Room 1's prereq is a lesson id, so the guided-play gate (Foundations +
 *    Playing a Hand complete) alone opens it.
 *  - Room 2's prereq is Room 1 (a table id), so it opens once Room 1 is cleared.
 */
export function isTableUnlocked(table: TableConfig, completedLessonIds: string[]): boolean {
  if (!areGuidedPlayLessonsComplete(completedLessonIds)) return false
  if (!isTableId(table.prereqId)) return true
  return isTableCleared(table.prereqId)
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
    pendingProblemStepIds: null,
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
