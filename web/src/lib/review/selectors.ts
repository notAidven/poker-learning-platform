/**
 * Review selectors that bridge course progress and the scheduler.
 *
 * A concept becomes eligible for review once it has been *introduced* — i.e. a lesson
 * that teaches it has been completed. This keeps the Daily Review from ever surfacing a
 * concept the learner has not met yet (e.g. advanced concepts for a beginner), even
 * though the scheduler treats an unseen concept as "due".
 */
import { CONCEPT_IDS, conceptsForLesson } from '../../data/concepts'
import type { ConceptId } from '../../types/concept'
import { dueConcepts } from './scheduler'
import type { ReviewState } from './types'

/**
 * The concepts the learner has been introduced to: every concept taught by a completed
 * lesson, returned in the canonical `CONCEPT_IDS` order (deduped).
 */
export function introducedConcepts(completedIds: string[]): ConceptId[] {
  const seen = new Set<ConceptId>()
  for (const lessonId of completedIds) {
    for (const conceptId of conceptsForLesson(lessonId)) seen.add(conceptId)
  }
  return CONCEPT_IDS.filter((id) => seen.has(id))
}

/** Introduced concepts that are due for review today (CAT day string). */
export function dueReviewConcepts(
  states: Record<string, ReviewState>,
  completedIds: string[],
  today: string,
): ConceptId[] {
  return dueConcepts(states as Record<ConceptId, ReviewState>, introducedConcepts(completedIds), today)
}
