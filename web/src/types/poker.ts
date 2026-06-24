/**
 * Shared poker domain types — reused by the hand evaluator (`lib/poker/*`) and the
 * poker interaction widgets. Card identity itself lives in `types/lesson.ts`
 * (`CardId`, `parseCardId`, `fullDeck`, …); this module adds the poker-specific
 * vocabulary (categories, evaluated hands, betting actions) on top of it.
 *
 * Type-only imports keep this module runtime-free apart from `HAND_CATEGORY_RANK`,
 * so importing it from `types/lesson.ts` cannot create a runtime import cycle.
 */
import type { CardId } from './lesson'

/**
 * Numeric rank value for comparisons:
 * 2–10 face value, J=11, Q=12, K=13, A=14 (the Ace also acts as 1 in the wheel
 * straight A-2-3-4-5, where the straight's top card is the 5).
 */
export type RankValue = number

/** The ten hand categories, weakest → strongest by name. */
export type HandCategory =
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'trips'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'quads'
  | 'straight-flush'
  | 'royal-flush'

/** 1 = high-card … 10 = royal-flush. Higher beats lower. */
export const HAND_CATEGORY_RANK: Record<HandCategory, number> = {
  'high-card': 1,
  pair: 2,
  'two-pair': 3,
  trips: 4,
  straight: 5,
  flush: 6,
  'full-house': 7,
  quads: 8,
  'straight-flush': 9,
  'royal-flush': 10,
}

/** All ten categories ordered strongest → weakest (handy for `order-categories`). */
export const HAND_CATEGORIES_STRONGEST_FIRST: HandCategory[] = [
  'royal-flush',
  'straight-flush',
  'quads',
  'full-house',
  'flush',
  'straight',
  'trips',
  'two-pair',
  'pair',
  'high-card',
]

export type EvaluatedHand = {
  category: HandCategory
  /** The exact 5 cards that make the hand. */
  cards: CardId[]
  /**
   * Lexicographic tiebreak vector, high→low, already category-aware:
   * e.g. full house [tripRank, pairRank]; two pair [hiPair, loPair, kicker];
   * flush/high-card = 5 ranks desc; straight = [topRank] (wheel topRank = 5).
   */
  tiebreak: RankValue[]
  /** Precomputed comparable score = [categoryRank, ...tiebreak]; compare arrays elementwise. */
  score: number[]
  /** Human label, e.g. "Flush, Ace-high" or "Two pair, Kings and Sevens". */
  label: string
}

/** The four streets of a Hold'em hand, in order. */
export type PokerStreet = 'preflop' | 'flop' | 'turn' | 'river'

/** The five legal betting actions (see design doc §3.7). */
export type BettingAction = 'check' | 'bet' | 'call' | 'raise' | 'fold'

/** A single AI opponent decision (see `lib/poker/opponentAI.ts`). */
export type AIDecision = {
  action: BettingAction
  /** Chip amount for a bet/raise/call; omitted for check/fold. */
  amount?: number
}
