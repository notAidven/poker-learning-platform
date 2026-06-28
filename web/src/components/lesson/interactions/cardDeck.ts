/**
 * Pure grader for the `card-deck` (select-all) interaction: the learner taps every
 * card in an event, optionally entering the count and the probability as a reduced
 * fraction. The verdict is lifted out of the widget so it is a tested return value,
 * reusing the same count/fraction matchers the widget uses for input validation.
 */
import type { CardDeckAnswer, CardId } from '../../../types/lesson'
import { countMatches } from './numericAnswer'
import { fractionMatches } from './fractionAnswer'

export type CardDeckSubmission = {
  selected: Set<CardId> | readonly CardId[]
  /** Raw count input (only graded when the answer requires a count). */
  countInput: string
  /** Raw fraction fields (only graded when the answer requires a probability). */
  fractionNum: string
  fractionDen: string
}

/** True when the tapped selection is EXACTLY the event's cards (no extras/omissions). */
export function gradeCardSelection(
  selected: Set<CardId> | readonly CardId[],
  cards: readonly CardId[] | undefined,
): boolean {
  const answerSet = new Set(cards ?? [])
  const sel = selected instanceof Set ? selected : new Set(selected)
  if (sel.size !== answerSet.size) return false
  for (const card of answerSet) if (!sel.has(card)) return false
  return true
}

/** Grade a full card-deck attempt: selection + (optional) count + (optional) probability. */
export function gradeCardDeck(answer: CardDeckAnswer, submission: CardDeckSubmission): boolean {
  if (!gradeCardSelection(submission.selected, answer.cards)) return false
  if (answer.count !== undefined && !countMatches(submission.countInput, answer.count)) return false
  if (
    answer.probability !== undefined &&
    !fractionMatches(submission.fractionNum, submission.fractionDen, answer.probability)
  ) {
    return false
  }
  return true
}
