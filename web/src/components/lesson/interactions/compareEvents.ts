/**
 * Pure grader for the `compare-events` interaction. The learner picks which event is
 * more likely (or that they are equal); the verdict is a comparison against the
 * authored answer, lifted out of the widget so it is a tested return value.
 */
import type { CompareEventsAnswer, CompareEventsChoice } from '../../../types/lesson'

/** Grade a compare-events pick against the authored "more likely" answer. */
export function gradeCompareEvents(
  answer: CompareEventsAnswer,
  choice: CompareEventsChoice | null,
): boolean {
  return choice !== null && choice === answer.more
}
