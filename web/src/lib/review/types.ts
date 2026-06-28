/**
 * Shared shapes for the spaced-repetition Review system.
 *
 * Kept dependency-light (type-only imports) so the scheduler, the queue builder,
 * and the persistence seam can all reference them without any runtime coupling or
 * import cycle.
 */
import type { ConceptId } from '../../types/concept'
import type { SkillCheckQuestion } from '../../types/skillCheck'

/**
 * Per-concept Leitner state, the unit the scheduler advances and the store persists
 * (one doc per concept). `box` indexes `INTERVALS` (see `scheduler.ts`); `dueDay` and
 * `lastReviewedDay` are CAT calendar-day strings (`YYYY-MM-DD`) or null when unseen.
 * `seen`/`correct` accumulate lifetime counts for the Strengths & Leaks accuracy view.
 */
export type ReviewState = {
  /** Leitner box index into `INTERVALS` (0 = brand new / just lapsed). */
  box: number
  /** CAT day this concept next becomes due, or null when it has never been reviewed. */
  dueDay: string | null
  /** How many times a review of this concept has been answered incorrectly. */
  lapses: number
  /** CAT day of the most recent review, or null when it has never been reviewed. */
  lastReviewedDay: string | null
  /** Lifetime number of times this concept has been reviewed. */
  seen: number
  /** Lifetime number of correct reviews (always ≤ `seen`). */
  correct: number
}

/**
 * One reviewable question in the interleaved Review queue. `concepts` is the
 * problem/skill-check's explicit `concepts` when present, else the lesson's default
 * concepts (see `conceptsForLesson`). `question` reuses the existing skill-check
 * question shape so the Review view can render it with the same widgets.
 */
export type ReviewItem = {
  /** Stable, queue-unique id (e.g. `"6:q2"` for a lesson step, `"6:sc:q1"` for a check). */
  questionId: string
  /** The lesson the question came from (for routing / context). */
  lessonId: string
  /** Concept(s) this question trains — drives due-filtering and interleaving. */
  concepts: ConceptId[]
  /** The renderable question (same shape skill checks already use). */
  question: SkillCheckQuestion
}
