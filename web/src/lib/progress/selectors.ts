/**
 * Pure reads derived from the lesson-progress aggregate (the per-lesson stats map).
 * No store/cache/IO here — these are the shared rules used by the route guards, the
 * course path, and the home overview.
 */
import { lessons } from '../../data/lessons'
import { hasLessonContent } from '../../data/lessonContent'
import { hasSkillCheck } from '../../data/skillCheckContent'
import { defaultLessonStats, type LessonStats } from './types'

export type StatsByLesson = Record<string, LessonStats>

export function getLessonStats(statsByLesson: StatsByLesson, lessonId: string): LessonStats {
  return statsByLesson[lessonId] ?? defaultLessonStats()
}

/** The single source of truth for "which lessons are completed": derived from the aggregate. */
export function getCompletedIds(statsByLesson: StatsByLesson): string[] {
  return Object.entries(statsByLesson)
    .filter(([, stats]) => stats.completed)
    .map(([id]) => id)
}

/**
 * Sequential-unlock check shared by Home, the course path, and the route guards.
 * Lesson 1 is always open; lesson N requires lesson N-1 completed. Unknown lesson
 * ids return `true` so the page's own "not found" view can handle them.
 */
export function isLessonUnlocked(lessonId: string, completedIds: string[]): boolean {
  const index = lessons.findIndex((l) => l.id === lessonId)
  if (index <= 0) return true
  return completedIds.includes(lessons[index - 1].id)
}

/**
 * Where "continue learning" should land: skip completed lessons; if a lesson body is
 * finished but its skill check is still pending, route to the skill check, else the
 * lesson, else the course path once everything is done.
 */
export function getNextLessonPath(completedIds: string[], statsByLesson: StatsByLesson): string {
  for (const lesson of lessons) {
    if (completedIds.includes(lesson.id) || !hasLessonContent(lesson.id)) continue

    const stats = getLessonStats(statsByLesson, lesson.id)
    if (stats.lessonFinished && !stats.completed && hasSkillCheck(lesson.id)) {
      return `/lesson/${lesson.id}/skill-check`
    }
    return `/lesson/${lesson.id}`
  }
  return '/course'
}

export function skillCheckScorePercent(stats: LessonStats): number | null {
  if (stats.skillCheckCorrect == null || stats.skillCheckTotal == null || stats.skillCheckTotal === 0) {
    return null
  }
  return Math.round((stats.skillCheckCorrect / stats.skillCheckTotal) * 100)
}
