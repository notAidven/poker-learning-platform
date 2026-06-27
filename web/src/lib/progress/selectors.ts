/**
 * Pure reads derived from the lesson-progress aggregate (the per-lesson stats map).
 * No store/cache/IO here — these are the shared rules used by the route guards, the
 * course path, and the home overview.
 */
import { lessons } from '../../data/lessons'
import { hasLessonContent } from '../../data/lessonContent'
import { hasSkillCheck } from '../../data/skillCheckContent'
import {
  GATED_SECTIONS,
  gateId,
  isGatePassed,
  priorGatedSection,
  sectionLessonIds,
} from '../sectionGates'
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
 * Unlock check shared by Home, the course path, and the route guards. WITHIN a section
 * the original sequential rule holds (lesson N needs lesson N-1 complete). At a section
 * BOUNDARY the new gate rule applies: the FIRST lesson of a section is locked until the
 * PRIOR section's gate is passed (its id appears in `completedIds`, since a passed gate
 * is a completed `gate-<sectionId>` doc — including a tested-out section). The very first
 * section (Foundations) is always open. AI tables keep their own casino-gate prerequisite,
 * and unknown ids return `true` so the page's own "not found" view can handle them.
 */
export function isLessonUnlocked(lessonId: string, completedIds: string[]): boolean {
  const index = lessons.findIndex((l) => l.id === lessonId)
  if (index < 0) return true
  if (index === 0) return true

  const lesson = lessons[index]

  // AI tables are gated by casinoProgress (isTableUnlocked), not the lesson sequence —
  // preserve the prior position-based behavior for them.
  if (lesson.kind === 'ai-table') {
    return completedIds.includes(lessons[index - 1].id)
  }

  const sectionLessons = sectionLessonIds(lesson.section)
  const posInSection = sectionLessons.indexOf(lesson.id)

  // First lesson of its section → gated behind the prior section's gate.
  if (posInSection <= 0) {
    const prior = priorGatedSection(lesson.section)
    if (!prior) return true
    return completedIds.includes(gateId(prior))
  }

  // Otherwise the previous lesson in the SAME section must be complete (sequential).
  return completedIds.includes(sectionLessons[posInSection - 1])
}

/**
 * Where "continue learning" should land. Walk the gated sections in order: route to the
 * first unfinished lesson (or its pending skill check); once a section's lessons are all
 * done, route to its gate if it is not yet passed; then on to the next section, finally
 * the course path once every section gate is cleared.
 */
export function getNextLessonPath(completedIds: string[], statsByLesson: StatsByLesson): string {
  for (const sectionId of GATED_SECTIONS) {
    for (const lessonId of sectionLessonIds(sectionId)) {
      if (completedIds.includes(lessonId) || !hasLessonContent(lessonId)) continue

      const stats = getLessonStats(statsByLesson, lessonId)
      if (stats.lessonFinished && !stats.completed && hasSkillCheck(lessonId)) {
        return `/lesson/${lessonId}/skill-check`
      }
      return `/lesson/${lessonId}`
    }

    // Every lesson in this section is complete — the gate is the next stop until passed.
    if (!isGatePassed(statsByLesson, sectionId)) {
      return `/gate/${sectionId}`
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
