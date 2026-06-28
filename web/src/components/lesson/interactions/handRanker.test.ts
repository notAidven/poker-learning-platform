/**
 * The interface IS the test surface: the five hand-ranker verdicts are exercised
 * directly as pure functions (no React tree), each validating against the evaluator.
 */
import { describe, expect, it } from 'vitest'
import {
  expectedCategory,
  expectedCategoryOrder,
  gradeBuildHand,
  gradeIdentifyCategory,
  gradeOrderCategories,
  gradeOrderHands,
  gradePickBestFive,
} from './handRanker'
import type { CardId } from '../../../types/lesson'

const FLUSH: CardId[] = ['AS', 'KS', 'QS', '7S', '2S']
const STRAIGHT: CardId[] = ['9H', '8C', '7D', '6S', '5C']
const PAIR: CardId[] = ['AH', 'AD', 'KC', '9S', '2D']

describe('identify-category', () => {
  it('uses the evaluator category, ignoring the authored fallback when cards exist', () => {
    expect(expectedCategory(FLUSH, 'pair')).toBe('flush')
    expect(gradeIdentifyCategory(FLUSH, null, 'flush')).toBe(true)
    expect(gradeIdentifyCategory(FLUSH, null, 'straight')).toBe(false)
    expect(gradeIdentifyCategory(FLUSH, null, null)).toBe(false)
  })

  it('falls back to the authored category when fewer than five cards are shown', () => {
    expect(expectedCategory(['AS', 'KS'], 'pair')).toBe('pair')
  })
})

describe('order-categories', () => {
  it('orders strongest-first by rank', () => {
    expect(expectedCategoryOrder(['pair', 'flush', 'straight'])).toEqual(['flush', 'straight', 'pair'])
  })

  it('grades the exact rank order', () => {
    expect(gradeOrderCategories(['pair', 'flush', 'straight'], ['flush', 'straight', 'pair'])).toBe(true)
    expect(gradeOrderCategories(['pair', 'flush', 'straight'], ['pair', 'flush', 'straight'])).toBe(false)
  })
})

describe('order-hands', () => {
  const hands = [
    { id: 'flush', cards: FLUSH },
    { id: 'straight', cards: STRAIGHT },
    { id: 'pair', cards: PAIR },
  ]

  it('passes a strongest-first arrangement and rejects an out-of-order one', () => {
    expect(gradeOrderHands(hands, ['flush', 'straight', 'pair'])).toBe(true)
    expect(gradeOrderHands(hands, ['pair', 'straight', 'flush'])).toBe(false)
  })
})

describe('build-hand', () => {
  it('accepts five cards that make the target category, rejects otherwise', () => {
    expect(gradeBuildHand(FLUSH, 'flush')).toBe(true)
    expect(gradeBuildHand(FLUSH, 'straight')).toBe(false)
    expect(gradeBuildHand(['AS', 'KS', 'QS', '7S'], 'flush')).toBe(false)
  })
})

describe('pick-best-five', () => {
  // AS KS QS JS 9S is a spade flush; the two off-suit cards cannot improve on it.
  const seven: CardId[] = ['AS', 'KS', 'QS', 'JS', '9S', '2D', '3C']

  it('accepts a five tying the evaluator best, rejects a weaker five', () => {
    expect(gradePickBestFive(seven, ['AS', 'KS', 'QS', 'JS', '9S'])).toBe(true)
    expect(gradePickBestFive(seven, ['AS', 'KS', 'QS', 'JS', '2D'])).toBe(false)
    expect(gradePickBestFive(seven, ['AS', 'KS', 'QS'])).toBe(false)
  })
})
