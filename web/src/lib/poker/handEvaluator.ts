/**
 * Texas Hold'em hand evaluator — the pure, React-free backbone reused by Lessons
 * 2–6 and several interaction widgets. See design doc §5.1.
 *
 * Everything here is a pure function over `CardId`s (e.g. "AS", "10H", "KD"), so it
 * is trivially unit-testable (see `handEvaluator.test.ts`). No randomness, no I/O.
 */
import { fullDeck, parseCardId, type CardId, type CardRank } from '../../types/lesson'
import {
  HAND_CATEGORY_RANK,
  type EvaluatedHand,
  type HandCategory,
  type RankValue,
} from '../../types/poker'

/** Map a card rank to its high value (Ace high = 14). */
const RANK_VALUE: Record<CardRank, RankValue> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
}

const RANK_SINGULAR: Record<number, string> = {
  14: 'Ace',
  13: 'King',
  12: 'Queen',
  11: 'Jack',
  10: 'Ten',
  9: 'Nine',
  8: 'Eight',
  7: 'Seven',
  6: 'Six',
  5: 'Five',
  4: 'Four',
  3: 'Three',
  2: 'Two',
}

const RANK_PLURAL: Record<number, string> = {
  14: 'Aces',
  13: 'Kings',
  12: 'Queens',
  11: 'Jacks',
  10: 'Tens',
  9: 'Nines',
  8: 'Eights',
  7: 'Sevens',
  6: 'Sixes',
  5: 'Fives',
  4: 'Fours',
  3: 'Threes',
  2: 'Twos',
}

function rankName(value: RankValue, plural = false): string {
  return (plural ? RANK_PLURAL : RANK_SINGULAR)[value] ?? String(value)
}

/** Numeric rank value of a single card (A=14, K=13, …, 2=2). */
export function rankValue(card: CardId): RankValue {
  return RANK_VALUE[parseCardId(card).rank]
}

type ParsedCard = {
  id: CardId
  value: RankValue
  suit: string
}

/** All k-card combinations of `items` (used for best-of-N). */
function combinations<T>(items: T[], k: number): T[][] {
  const out: T[][] = []
  const combo: T[] = []
  const recurse = (start: number) => {
    if (combo.length === k) {
      out.push([...combo])
      return
    }
    for (let i = start; i < items.length; i++) {
      combo.push(items[i])
      recurse(i + 1)
      combo.pop()
    }
  }
  recurse(0)
  return out
}

function buildLabel(category: HandCategory, tiebreak: RankValue[]): string {
  switch (category) {
    case 'royal-flush':
      return 'Royal flush'
    case 'straight-flush':
      return `Straight flush, ${rankName(tiebreak[0])}-high`
    case 'quads':
      return `Four of a kind, ${rankName(tiebreak[0], true)}`
    case 'full-house':
      return `Full house, ${rankName(tiebreak[0], true)} full of ${rankName(tiebreak[1], true)}`
    case 'flush':
      return `Flush, ${rankName(tiebreak[0])}-high`
    case 'straight':
      return `Straight, ${rankName(tiebreak[0])}-high`
    case 'trips':
      return `Three of a kind, ${rankName(tiebreak[0], true)}`
    case 'two-pair':
      return `Two pair, ${rankName(tiebreak[0], true)} and ${rankName(tiebreak[1], true)}`
    case 'pair':
      return `Pair of ${rankName(tiebreak[0], true)}`
    case 'high-card':
      return `${rankName(tiebreak[0])}-high`
  }
}

/**
 * Evaluate exactly 5 cards into a category + tiebreak + score + label.
 * Throws if not given exactly 5 distinct cards.
 */
export function evaluateFive(cards: CardId[]): EvaluatedHand {
  if (cards.length !== 5) {
    throw new Error(`evaluateFive expects exactly 5 cards, received ${cards.length}`)
  }

  const parsed: ParsedCard[] = cards.map((id) => {
    const { suit } = parseCardId(id)
    return { id, value: rankValue(id), suit }
  })

  // Rank-count histogram: value -> count.
  const countByValue = new Map<RankValue, number>()
  for (const card of parsed) countByValue.set(card.value, (countByValue.get(card.value) ?? 0) + 1)

  // Suit histogram.
  const countBySuit = new Map<string, number>()
  for (const card of parsed) countBySuit.set(card.suit, (countBySuit.get(card.suit) ?? 0) + 1)

  const isFlush = [...countBySuit.values()].some((n) => n === 5)

  // Straight detection (requires 5 distinct values).
  const distinctValues = [...countByValue.keys()].sort((a, b) => b - a)
  let isStraight = false
  let straightTop = 0
  if (distinctValues.length === 5) {
    if (distinctValues[0] - distinctValues[4] === 4) {
      isStraight = true
      straightTop = distinctValues[0]
    } else if (
      // Wheel: A-2-3-4-5 → Ace plays low, top card is the 5.
      distinctValues[0] === 14 &&
      distinctValues[1] === 5 &&
      distinctValues[2] === 4 &&
      distinctValues[3] === 3 &&
      distinctValues[4] === 2
    ) {
      isStraight = true
      straightTop = 5
    }
  }

  // Groups of (value, count) sorted by count desc, then value desc — the basis for
  // pairs/trips/quads tiebreaks.
  const groups = [...countByValue.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => (b.count - a.count) || (b.value - a.value))
  const countPattern = groups.map((g) => g.count) // e.g. [4,1], [3,2], [3,1,1], [2,2,1], [2,1,1,1]

  let category: HandCategory
  let tiebreak: RankValue[]

  if (isStraight && isFlush) {
    category = straightTop === 14 ? 'royal-flush' : 'straight-flush'
    tiebreak = [straightTop]
  } else if (countPattern[0] === 4) {
    category = 'quads'
    tiebreak = [groups[0].value, groups[1].value]
  } else if (countPattern[0] === 3 && countPattern[1] === 2) {
    category = 'full-house'
    tiebreak = [groups[0].value, groups[1].value]
  } else if (isFlush) {
    category = 'flush'
    tiebreak = distinctValues
  } else if (isStraight) {
    category = 'straight'
    tiebreak = [straightTop]
  } else if (countPattern[0] === 3) {
    category = 'trips'
    tiebreak = [groups[0].value, ...groups.slice(1).map((g) => g.value)]
  } else if (countPattern[0] === 2 && countPattern[1] === 2) {
    category = 'two-pair'
    // groups already sorted: two pairs (count 2) first by value desc, then kicker.
    tiebreak = [groups[0].value, groups[1].value, groups[2].value]
  } else if (countPattern[0] === 2) {
    category = 'pair'
    tiebreak = [groups[0].value, ...groups.slice(1).map((g) => g.value)]
  } else {
    category = 'high-card'
    tiebreak = distinctValues
  }

  const score = [HAND_CATEGORY_RANK[category], ...tiebreak]
  const orderedCards = orderCardsForDisplay(parsed, category, straightTop)

  return { category, cards: orderedCards, tiebreak, score, label: buildLabel(category, tiebreak) }
}

/**
 * Order the 5 cards for display: by group size (quads/trips/pairs first), then by
 * rank — with the wheel straight showing the Ace last (it plays low). Cosmetic only;
 * `score`/`compareHands` never depend on card order.
 */
function orderCardsForDisplay(
  parsed: ParsedCard[],
  category: HandCategory,
  straightTop: number,
): CardId[] {
  const isWheel =
    (category === 'straight' || category === 'straight-flush') && straightTop === 5

  const counts = new Map<RankValue, number>()
  for (const c of parsed) counts.set(c.value, (counts.get(c.value) ?? 0) + 1)

  return [...parsed]
    .sort((a, b) => {
      // Wheel: Ace (14) sorts to the end as a low card.
      const av = isWheel && a.value === 14 ? 1 : a.value
      const bv = isWheel && b.value === 14 ? 1 : b.value
      const ac = counts.get(a.value) ?? 0
      const bc = counts.get(b.value) ?? 0
      return bc - ac || bv - av
    })
    .map((c) => c.id)
}

/**
 * Compare two evaluated hands by their score vectors, element by element.
 * Returns >0 when `a` wins, <0 when `b` wins, 0 on an exact tie (split pot).
 * Suits are never compared.
 */
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  const len = Math.max(a.score.length, b.score.length)
  for (let i = 0; i < len; i++) {
    const av = a.score[i] ?? 0
    const bv = b.score[i] ?? 0
    if (av !== bv) return av - bv
  }
  return 0
}

/** Best 5-card hand among 5, 6, or 7 cards (tries all C(n,5) subsets). */
export function evaluateBest(cards: CardId[]): EvaluatedHand {
  if (cards.length < 5) {
    throw new Error(`evaluateBest needs at least 5 cards, received ${cards.length}`)
  }
  if (cards.length === 5) return evaluateFive(cards)

  let best: EvaluatedHand | null = null
  for (const subset of combinations(cards, 5)) {
    const hand = evaluateFive(subset)
    if (!best || compareHands(hand, best) > 0) best = hand
  }
  // Non-null: there is always at least one 5-card subset when cards.length >= 5.
  return best as EvaluatedHand
}

/** Convenience: best hand from 2 hole cards + up to 5 board cards. */
export function evaluateHoldem(hole: [CardId, CardId], board: CardId[]): EvaluatedHand {
  return evaluateBest([...hole, ...board])
}

/**
 * Outs helper for Lesson 4. Returns the unseen cards that improve the hero's hand,
 * and their count.
 *
 * - With `madeTarget` (recommended for teaching specific draws): an out is any unseen
 *   card that lifts the best hand to **at least** that category — e.g. `'flush'` for a
 *   flush draw yields the 9 remaining suit cards; `'straight'` for an open-ended draw
 *   yields 8; a gutshot yields 4.
 * - Without `madeTarget`: an out is any unseen card that raises the hero's hand to a
 *   strictly higher category than it currently holds.
 *
 * Requires hole + board to total at least 5 cards (i.e. flop or later).
 */
export function countOuts(
  hole: [CardId, CardId],
  board: CardId[],
  madeTarget?: HandCategory,
): { outs: CardId[]; count: number } {
  const known = [...hole, ...board]
  if (known.length < 5) {
    throw new Error(`countOuts needs at least 5 known cards (flop or later), received ${known.length}`)
  }

  const seen = new Set(known)
  const unseen = fullDeck().filter((card) => !seen.has(card))

  const current = evaluateBest(known)
  const targetRank = madeTarget ? HAND_CATEGORY_RANK[madeTarget] : null

  const outs = unseen.filter((card) => {
    const improved = evaluateBest([...known, card])
    if (targetRank !== null) {
      return HAND_CATEGORY_RANK[improved.category] >= targetRank
    }
    return HAND_CATEGORY_RANK[improved.category] > HAND_CATEGORY_RANK[current.category]
  })

  return { outs, count: outs.length }
}

// ---------------------------------------------------------------------------
// "Playing the board" — does the hero's made hand belong to them, or the board?
//
// A board pair (or any made hand that sits entirely on the community cards) is
// shared by every player, so it is NOT the hero's asset. These helpers compare
// the hero's best hand to the board's OWN best hand so the coach never presents a
// shared board hand as if the hole cards made it.
// ---------------------------------------------------------------------------

/** The board's own best made hand, considering only the community cards. */
export type BoardOwnHand = { category: HandCategory; tiebreak: RankValue[]; label: string }

/**
 * Evaluate the board ALONE. With five community cards this is the real best hand
 * (`evaluateBest(board)`); with three or four cards only rank-multiplicity hands
 * are possible (a five-card straight or flush needs five cards), so we read the
 * pair/two-pair/trips/quads structure off the rank counts. Returns null for an
 * empty board.
 */
export function evaluateBoardOnly(board: CardId[]): BoardOwnHand | null {
  if (board.length >= 5) {
    const e = evaluateBest(board)
    return { category: e.category, tiebreak: e.tiebreak, label: e.label }
  }
  if (board.length === 0) return null

  const countByValue = new Map<RankValue, number>()
  for (const card of board) {
    const v = rankValue(card)
    countByValue.set(v, (countByValue.get(v) ?? 0) + 1)
  }
  const groups = [...countByValue.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || b.value - a.value)
  const top = groups[0]
  if (!top) return null

  let category: HandCategory
  let tiebreak: RankValue[]
  if (top.count >= 4) {
    category = 'quads'
    tiebreak = [top.value]
  } else if (top.count === 3) {
    category = 'trips'
    tiebreak = [top.value]
  } else if (top.count === 2 && groups[1]?.count === 2) {
    category = 'two-pair'
    tiebreak = [top.value, groups[1].value]
  } else if (top.count === 2) {
    category = 'pair'
    tiebreak = [top.value]
  } else {
    category = 'high-card'
    tiebreak = [top.value]
  }
  return { category, tiebreak, label: buildLabel(category, tiebreak) }
}

/** How many leading tiebreak ranks actually DEFINE a category (the rest are kickers). */
function definingRankCount(category: HandCategory): number {
  switch (category) {
    case 'full-house':
    case 'two-pair':
      return 2
    case 'flush':
      return 5
    default:
      return 1
  }
}

/**
 * Whether the hero's hole cards improve on the board's own hand. With a full board
 * a `false` result is the classic "playing the board". Crucially, a kicker alone
 * does NOT count: if the hero's made hand is the same category and same DEFINING
 * ranks as the board (e.g. a board pair of threes that the hole cards did not make,
 * even with an ace kicker), this returns false because the made hand is the board's.
 */
export function holeCardsImproveBoard(hole: [CardId, CardId], board: CardId[]): boolean {
  const known = [...hole, ...board]
  if (known.length < 5) return true
  const heroBest = evaluateBest(known)
  const boardHand = evaluateBoardOnly(board)
  if (!boardHand) return true

  const heroRank = HAND_CATEGORY_RANK[heroBest.category]
  const boardRank = HAND_CATEGORY_RANK[boardHand.category]
  if (heroRank !== boardRank) return heroRank > boardRank

  const heroDefining = heroBest.tiebreak.slice(0, definingRankCount(heroBest.category))
  const boardDefining = boardHand.tiebreak.slice(0, definingRankCount(boardHand.category))
  const n = Math.max(heroDefining.length, boardDefining.length)
  for (let i = 0; i < n; i++) {
    const a = heroDefining[i] ?? 0
    const b = boardDefining[i] ?? 0
    if (a !== b) return a > b
  }
  return false
}

/**
 * Strict "playing the board": there are five community cards and the hero's hole
 * cards do not improve on the board's own five-card hand.
 */
export function isPlayingTheBoard(hole: [CardId, CardId], board: CardId[]): boolean {
  return board.length >= 5 && !holeCardsImproveBoard(hole, board)
}
