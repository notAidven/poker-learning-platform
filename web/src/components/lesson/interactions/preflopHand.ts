/**
 * Pure grader for the `preflop-hand` interaction. Both modes compare the learner's
 * pick to the authored answer (preflop strength has no board/engine read), so the
 * verdict is a tiny pure return value the widget and its tests share.
 */
import type { PreflopHandAnswer, PreflopHandConfig } from '../../../types/lesson'

export type PreflopHandSubmission = {
  /** classify mode: the chosen strength option id. */
  optionId: string | null
  /** pick-stronger mode: the chosen side (or a tie). */
  side: 'a' | 'b' | 'tie' | null
}

/** Grade a preflop-hand attempt against the authored answer. */
export function gradePreflopHand(
  config: PreflopHandConfig,
  answer: PreflopHandAnswer,
  submission: PreflopHandSubmission,
): boolean {
  if (config.mode === 'classify') {
    return submission.optionId !== null && submission.optionId === answer.optionId
  }
  return submission.side !== null && submission.side === answer.stronger
}
