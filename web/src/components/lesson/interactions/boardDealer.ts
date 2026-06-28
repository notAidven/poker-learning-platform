/**
 * Pure graders for the `board-dealer` interaction (per-street best-hand picks and the
 * showdown winner). The hand reads come straight from the evaluator (`handEvaluator`)
 * so the dealt cards — not the authored answer — are the source of truth; the widget
 * keeps only the deal/animation and lifecycle.
 */
import { parseCardId, type CardId, type ShowdownWinner } from '../../../types/lesson'
import type { HandCategory, PokerStreet } from '../../../types/poker'
import { compareHands, evaluateHoldem } from '../../../lib/poker/handEvaluator'

/**
 * The hero's true best-hand category on a given board. With < 3 community cards the
 * five-card evaluator cannot run, so it falls back to the only preflop reads possible:
 * a pocket pair, else high card.
 */
export function bestHandCategoryAt(hole: [CardId, CardId], board: CardId[]): HandCategory {
  if (board.length + hole.length >= 5) return evaluateHoldem(hole, board).category
  return parseCardId(hole[0]).rank === parseCardId(hole[1]).rank ? 'pair' : 'high-card'
}

/** The showdown winner by comparing hero and villain's best five on the full board. */
export function showdownWinner(
  hole: [CardId, CardId],
  villain: [CardId, CardId],
  community: CardId[],
): ShowdownWinner {
  const cmp = compareHands(evaluateHoldem(hole, community), evaluateHoldem(villain, community))
  return cmp > 0 ? 'hero' : cmp < 0 ? 'opponent' : 'split'
}

export type BoardDealerSubmission = {
  askedStreets: PokerStreet[]
  picks: Partial<Record<PokerStreet, HandCategory>>
  isShowdown: boolean
  winnerPick: ShowdownWinner | null
}

/**
 * Grade a board-dealer attempt: every asked street's pick must match the evaluator's
 * category, and (in showdown mode) the chosen winner must match the real winner.
 */
export function gradeBoardDealer(
  submission: BoardDealerSubmission,
  expectedByStreet: Record<PokerStreet, HandCategory>,
  expectedWinner: ShowdownWinner | null,
): boolean {
  const streetsCorrect = submission.askedStreets.every((s) => submission.picks[s] === expectedByStreet[s])
  const showdownCorrect = !submission.isShowdown || submission.winnerPick === expectedWinner
  return streetsCorrect && showdownCorrect
}
