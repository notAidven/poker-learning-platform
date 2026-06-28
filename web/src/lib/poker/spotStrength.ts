/**
 * Spot strength — the one deep home for "what do I hold and how likely am I to win
 * this spot": a draw's outs -> equity, the pot-odds price, and the EV of calling.
 *
 * This is the single source of truth for the equity/odds layer that sits ON TOP of
 * the hand evaluator. It never re-implements hand ranking (see `handEvaluator`); it
 * only answers the probability question the casino bots, the coach, the always-on
 * hints, the drill grader, and the Lesson 5/6 math widgets all need. They read these
 * functions instead of each deriving their own, so a 9-out flush draw can never read
 * 35% in one place and 36% in another.
 *
 * THE EQUITY CONVENTION (documented once, here): a draw's rough equity is the
 * Rule of 2 & 4 WITH the big-draw correction — subtract one point per out above 8
 * when two cards are still to come. A 9-out flush draw on the flop is therefore 35%
 * (9 x 4 = 36, minus 1), matching both what Lesson 5 teaches and the exact
 * hypergeometric value (1 - 38/47 x 37/46 ~= 35%). Pot odds is an exact price;
 * equity is an intentionally rough teaching estimate.
 *
 * Everything here is a pure function over `CardId`s, so the interface is the test
 * surface (see `spotStrength.test.ts`). No randomness, no I/O, no React.
 */
import { fullDeck, type CardId } from '../../types/lesson'
import { HAND_CATEGORY_RANK, type HandCategory } from '../../types/poker'
import { countOuts, evaluateBest } from './handEvaluator'

const FLUSH_RANK = HAND_CATEGORY_RANK['flush']
const STRAIGHT_RANK = HAND_CATEGORY_RANK['straight']

/** Board cards still to come: 2 on the flop, 1 on the turn, 0 by the river. */
export function cardsToCome(board: CardId[]): 0 | 1 | 2 {
  if (board.length >= 5) return 0
  if (board.length === 4) return 1
  return 2
}

/**
 * Canonical outs -> equity estimate (whole percent): the Rule of 2 & 4 with the
 * big-draw correction. Two cards to come -> outs x 4, minus (outs - 8) once outs
 * exceed 8; one card to come -> outs x 2; none -> 0. Left uncapped (a real draw
 * never has enough outs for this to exceed ~70); callers that want a hard display
 * ceiling apply their own.
 */
export function ruleEquityPct(outs: number, toCome: number): number {
  if (outs <= 0 || toCome <= 0) return 0
  if (toCome === 1) return outs * 2
  const raw = outs * 4
  return outs > 8 ? raw - (outs - 8) : raw
}

/**
 * Exact hypergeometric chance (percent) that at least one of `outs` lands across
 * `toCome` draws from `unseen` unseen cards — the precise figure the Rule of 2 & 4
 * approximates.
 */
export function exactEquityPct(outs: number, unseen: number, toCome: number): number {
  if (unseen <= 0 || outs <= 0 || toCome <= 0) return 0
  let miss = 1
  for (let i = 0; i < toCome; i++) miss *= Math.max(0, unseen - outs - i) / (unseen - i)
  return (1 - miss) * 100
}

/** Required equity to call, as a whole percent: toCall / (pot + toCall). Null with no bet. */
export function potOddsPct(pot: number, toCall: number): number | null {
  if (toCall <= 0) return null
  return Math.round((toCall / (pot + toCall)) * 100)
}

/**
 * Required equity to call, as an EXACT 0..100 percent (unrounded) — for callers that
 * grade an entered pot-odds answer against a tolerance and need the precise price.
 */
export function potOddsExactPct(pot: number, toCall: number): number | null {
  if (toCall <= 0) return null
  return (toCall / (pot + toCall)) * 100
}

/** Whether a draw is priced in: its equity meets or beats the pot-odds price. */
export function isPricedIn(equityPct: number, potOddsRequiredPct: number): boolean {
  return equityPct >= potOddsRequiredPct
}

/**
 * Rough EV (chips) of calling `toCall` to win `pot` with a `winPct` (0..100) chance:
 * win the pot that often, lose the call the rest of the time.
 */
export function callEvChips(winPct: number, pot: number, toCall: number): number {
  const p = winPct / 100
  return Math.round(p * pot - (1 - p) * toCall)
}

/** A clean draw read for the hero's spot. */
export type DrawName =
  | 'flush draw'
  | 'open-ended straight draw'
  | 'gutshot straight draw'
  | 'straight draw'
  | 'flush draw + straight draw'

export type SpotDraw = {
  /** The primary draw name, or null when there is no clean flush/straight draw. */
  drawName: DrawName | null
  /** Clean outs for the primary draw (a combo is the union of the disjoint sets). */
  outs: number | null
  /** Flush-completing outs (0 when none, or the hero already holds a flush+). */
  flushOuts: number
  /** PURE straight outs that are not also flush cards (0 when none / already there). */
  straightOuts: number
}

const NO_DRAW: SpotDraw = { drawName: null, outs: null, flushOuts: 0, straightOuts: 0 }

/**
 * Find the hero's primary draw (flush / straight / combo) and its clean out count,
 * reading outs from the evaluator (`countOuts`) so a draw is never hard-coded.
 *
 * The flush and straight out sets are made DISJOINT: flush-completing cards are
 * removed from the straight set (a flush outranks a straight), so a combo draw's
 * out count is the true union, never an inflated straight number. Outs toward a
 * category the hero ALREADY holds are not counted. Returns no draw with < 5 known
 * cards (preflop) or when the evaluator cannot run.
 */
export function findDraw(hole: [CardId, CardId], board: CardId[]): SpotDraw {
  const known = [...hole, ...board]
  if (known.length < 5) return NO_DRAW

  let madeRank: number
  try {
    madeRank = HAND_CATEGORY_RANK[evaluateBest(known).category]
  } catch {
    return NO_DRAW
  }

  const flushOutCards = madeRank < FLUSH_RANK ? safeOutCards(hole, board, 'flush') : []
  const straightOutCards = madeRank < STRAIGHT_RANK ? safeOutCards(hole, board, 'straight') : []
  const flushSet = new Set(flushOutCards)
  const pureStraight = straightOutCards.filter((c) => !flushSet.has(c))

  const flushOuts = flushOutCards.length
  const straightOuts = pureStraight.length
  const hasFlush = flushOuts > 0
  const hasStraight = straightOuts > 0

  if (hasFlush && hasStraight) {
    return {
      drawName: 'flush draw + straight draw',
      outs: flushOuts + straightOuts,
      flushOuts,
      straightOuts,
    }
  }
  if (hasFlush) return { drawName: 'flush draw', outs: flushOuts, flushOuts, straightOuts: 0 }
  if (hasStraight) {
    const drawName: DrawName =
      straightOuts >= 8
        ? 'open-ended straight draw'
        : straightOuts === 4
          ? 'gutshot straight draw'
          : 'straight draw'
    return { drawName, outs: straightOuts, flushOuts: 0, straightOuts }
  }
  return NO_DRAW
}

/** The actual out cards toward `target`, or [] if the evaluator cannot run. */
function safeOutCards(hole: [CardId, CardId], board: CardId[], target: HandCategory): CardId[] {
  try {
    return countOuts(hole, board, target).outs
  } catch {
    return []
  }
}

/** Unseen cards remaining given the hero's hole cards and the current board. */
export function unseenCount(hole: readonly CardId[], board: readonly CardId[]): number {
  return fullDeck().length - hole.length - board.length
}
