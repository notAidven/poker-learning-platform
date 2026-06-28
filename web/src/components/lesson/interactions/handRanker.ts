/**
 * Pure, framework-free graders for the five `hand-ranker` modes (design doc §5.2).
 *
 * The verdict is a RETURN VALUE here, not a side effect buried in the widget, so the
 * interface is the test surface: the rules are exercised directly (see
 * `handRanker.test.ts`) without mounting a React tree. Every mode validates against
 * the pure evaluator (`handEvaluator`) — never a hard-coded answer — so the widget
 * and its tests share the exact same grading. The component keeps only pixels and
 * the attempt lifecycle.
 */
import type { CardId, HandRankerHand } from '../../../types/lesson'
import { HAND_CATEGORY_RANK, type EvaluatedHand, type HandCategory } from '../../../types/poker'
import { compareHands, evaluateBest, evaluateFive } from '../../../lib/poker/handEvaluator'

function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

// --- identify-category ------------------------------------------------------

/** The true best-hand category for a shown hand (evaluator first, authored fallback). */
export function expectedCategory(
  cards: CardId[],
  answerCategory?: HandCategory | null,
): HandCategory | null {
  if (cards.length >= 5) return evaluateBest(cards).category
  return answerCategory ?? null
}

/** identify-category: the picked category equals the evaluator's category. */
export function gradeIdentifyCategory(
  cards: CardId[],
  answerCategory: HandCategory | null | undefined,
  choice: HandCategory | null,
): boolean {
  if (choice === null) return false
  return choice === expectedCategory(cards, answerCategory)
}

// --- order-categories -------------------------------------------------------

/** The canonical strongest-first ordering of a set of categories, by rank. */
export function expectedCategoryOrder(categories: HandCategory[]): HandCategory[] {
  return [...categories].sort((a, b) => HAND_CATEGORY_RANK[b] - HAND_CATEGORY_RANK[a])
}

/** order-categories: the arrangement matches the rank order exactly. */
export function gradeOrderCategories(
  categories: HandCategory[],
  order: readonly string[],
): boolean {
  return arraysEqual(order, expectedCategoryOrder(categories))
}

// --- order-hands ------------------------------------------------------------

function evaluatedById(hands: HandRankerHand[]): Map<string, EvaluatedHand> {
  const map = new Map<string, EvaluatedHand>()
  for (const h of hands) {
    if (h.cards.length === 5) map.set(h.id, evaluateFive(h.cards))
  }
  return map
}

/**
 * order-hands: each adjacent pair must be non-increasing in strength (`compareHands`),
 * so ANY arrangement of tied hands also passes — the order need not be unique.
 */
export function gradeOrderHands(hands: HandRankerHand[], orderIds: string[]): boolean {
  const evalById = evaluatedById(hands)
  for (let i = 1; i < orderIds.length; i++) {
    const prev = evalById.get(orderIds[i - 1])
    const cur = evalById.get(orderIds[i])
    if (prev && cur && compareHands(prev, cur) < 0) return false
  }
  return true
}

// --- selection modes: build-hand & pick-best-five ---------------------------

/** build-hand: the five tapped cards make exactly the target category. */
export function gradeBuildHand(selected: CardId[], target: HandCategory): boolean {
  if (selected.length !== 5) return false
  return evaluateFive(selected).category === target
}

/** pick-best-five: the five tapped cards tie the evaluator's best five of the pool. */
export function gradePickBestFive(cards: CardId[], selected: CardId[]): boolean {
  if (selected.length !== 5 || cards.length < 5) return false
  return compareHands(evaluateFive(selected), evaluateBest(cards)) === 0
}
