import { describe, it, expect } from 'vitest'
import {
  compareHands,
  countOuts,
  evaluateBest,
  evaluateBoardOnly,
  evaluateFive,
  evaluateHoldem,
  holeCardsImproveBoard,
  isPlayingTheBoard,
  rankValue,
} from './handEvaluator'
import type { CardId } from '../../types/lesson'

describe('rankValue', () => {
  it('maps ranks with Ace high = 14', () => {
    expect(rankValue('AS')).toBe(14)
    expect(rankValue('KD')).toBe(13)
    expect(rankValue('10H')).toBe(10)
    expect(rankValue('2C')).toBe(2)
  })
})

describe('evaluateFive — categories (design doc §9 case table)', () => {
  const cases: { cards: CardId[]; category: string; note: string }[] = [
    { cards: ['AS', 'KS', 'QS', 'JS', '10S'], category: 'royal-flush', note: 'top of the ladder' },
    { cards: ['9H', '8H', '7H', '6H', '5H'], category: 'straight-flush', note: '9-high' },
    { cards: ['AS', '5S', '4S', '3S', '2S'], category: 'straight-flush', note: 'wheel = 5-high' },
    { cards: ['7C', '7D', '7H', '7S', 'KD'], category: 'quads', note: 'kicker K' },
    { cards: ['KC', 'KD', 'KH', '4S', '4D'], category: 'full-house', note: 'trips over pair' },
    { cards: ['AH', 'KH', '9H', '5H', '2H'], category: 'flush', note: 'Ace-high flush' },
    { cards: ['9C', '8D', '7H', '6S', '5C'], category: 'straight', note: '9-high mixed suits' },
    { cards: ['AH', '2C', '3D', '4S', '5H'], category: 'straight', note: 'wheel, 5-high' },
    { cards: ['QC', 'AS', '2D', '3H', '4S'], category: 'high-card', note: 'NOT a straight (no wrap)' },
    { cards: ['QC', 'QS', 'QD', '8H', '3C'], category: 'trips', note: 'trips, kicker Q' },
    { cards: ['KC', 'KD', '7H', '7S', '2D'], category: 'two-pair', note: 'Kings & Sevens, kicker 2' },
    { cards: ['AC', 'AD', '9H', '6S', '3C'], category: 'pair', note: 'Aces, 3 kickers' },
  ]

  for (const { cards, category, note } of cases) {
    it(`${cards.join(' ')} → ${category} (${note})`, () => {
      expect(evaluateFive(cards).category).toBe(category)
    })
  }
})

describe('evaluateFive — tiebreakers, kickers & wheel', () => {
  it('wheel straight tops out at 5, not Ace', () => {
    expect(evaluateFive(['AH', '2C', '3D', '4S', '5H']).tiebreak).toEqual([5])
  })

  it('wheel straight flush tops out at 5 (not royal)', () => {
    const hand = evaluateFive(['AS', '5S', '4S', '3S', '2S'])
    expect(hand.category).toBe('straight-flush')
    expect(hand.tiebreak).toEqual([5])
  })

  it('quads tiebreak = [quadRank, kicker]', () => {
    expect(evaluateFive(['7C', '7D', '7H', '7S', 'KD']).tiebreak).toEqual([7, 13])
  })

  it('full house tiebreak = [tripRank, pairRank]', () => {
    expect(evaluateFive(['KC', 'KD', 'KH', '4S', '4D']).tiebreak).toEqual([13, 4])
  })

  it('two pair tiebreak = [hiPair, loPair, kicker] even when the kicker outranks the low pair', () => {
    // Kings & Sevens with an Ace kicker — count dominates rank in the ordering.
    expect(evaluateFive(['KC', 'KD', '7H', '7S', 'AD']).tiebreak).toEqual([13, 7, 14])
  })

  it('flush tiebreak = 5 ranks descending', () => {
    expect(evaluateFive(['AH', 'KH', '9H', '5H', '2H']).tiebreak).toEqual([14, 13, 9, 5, 2])
  })

  it('produces human labels matching the design doc', () => {
    expect(evaluateFive(['AH', 'KH', '9H', '5H', '2H']).label).toBe('Flush, Ace-high')
    expect(evaluateFive(['KC', 'KD', '7H', '7S', '2D']).label).toBe('Two pair, Kings and Sevens')
    expect(evaluateFive(['AS', 'KS', 'QS', 'JS', '10S']).label).toBe('Royal flush')
  })
})

describe('evaluateBest — best 5 of 7', () => {
  it('AS KS QS JS 9D 4H 2C → high card A-K-Q-J-9 (4 spades, no 10 ⇒ no flush/straight)', () => {
    const hand = evaluateBest(['AS', 'KS', 'QS', 'JS', '9D', '4H', '2C'])
    expect(hand.category).toBe('high-card')
    expect(hand.tiebreak).toEqual([14, 13, 12, 11, 9])
  })

  it('AS KS QS JS 10D 4H 2C → Ace-high straight from 7 cards', () => {
    const hand = evaluateBest(['AS', 'KS', 'QS', 'JS', '10D', '4H', '2C'])
    expect(hand.category).toBe('straight')
    expect(hand.tiebreak).toEqual([14])
  })

  it('matches the design doc §3.3 worked example (best five = A-K-Q-J-9)', () => {
    const hand = evaluateHoldem(['AS', 'KS'], ['QS', 'JS', '9D', '4H', '2C'])
    expect(hand.category).toBe('high-card')
    expect(hand.tiebreak).toEqual([14, 13, 12, 11, 9])
  })

  it('finds the true max across all 21 subsets (flush beats the tempting straight)', () => {
    // 6 hearts present → flush; also contains 9-8-7-6-5 straight. Flush must win.
    const hand = evaluateBest(['9H', '8H', '7H', '6H', '2H', '5C', '5D'])
    expect(hand.category).toBe('flush')
  })

  it('throws when given fewer than 5 cards', () => {
    expect(() => evaluateBest(['AS', 'KS'])).toThrow()
  })
})

describe('compareHands', () => {
  it('ranks a kicker win: pair of Kings with Q kicker beats pair of Kings with J kicker', () => {
    const a = evaluateFive(['KC', 'KD', 'QH', '5S', '2C'])
    const b = evaluateFive(['KH', 'KS', 'JD', '5H', '2D'])
    expect(compareHands(a, b)).toBeGreaterThan(0)
    expect(compareHands(b, a)).toBeLessThan(0)
  })

  it('treats identical ranks in different suits as a tie (suits never break ties)', () => {
    const a = evaluateFive(['AS', 'KD', '9C', '5H', '2S'])
    const b = evaluateFive(['AH', 'KC', '9D', '5S', '2C'])
    expect(compareHands(a, b)).toBe(0)
  })

  it('orders categories (flush beats straight beats trips)', () => {
    const flush = evaluateFive(['AH', 'KH', '9H', '5H', '2H'])
    const straight = evaluateFive(['9C', '8D', '7H', '6S', '5C'])
    const trips = evaluateFive(['QC', 'QS', 'QD', '8H', '3C'])
    expect(compareHands(flush, straight)).toBeGreaterThan(0)
    expect(compareHands(straight, trips)).toBeGreaterThan(0)
  })

  it('is a transitive total order on a sampled ladder', () => {
    const ladder = [
      evaluateFive(['AS', 'KS', 'QS', 'JS', '10S']), // royal flush
      evaluateFive(['9H', '8H', '7H', '6H', '5H']), // straight flush
      evaluateFive(['7C', '7D', '7H', '7S', 'KD']), // quads
      evaluateFive(['KC', 'KD', 'KH', '4S', '4D']), // full house
      evaluateFive(['AH', 'KH', '9H', '5H', '2H']), // flush
      evaluateFive(['9C', '8D', '7H', '6S', '5C']), // straight
      evaluateFive(['QC', 'QS', 'QD', '8H', '3C']), // trips
      evaluateFive(['KC', 'KD', '7H', '7S', '2D']), // two pair
      evaluateFive(['AC', 'AD', '9H', '6S', '3C']), // pair
      evaluateFive(['QC', 'AS', '2D', '3H', '4S']), // high card
    ]
    for (let i = 0; i < ladder.length - 1; i++) {
      expect(compareHands(ladder[i], ladder[i + 1])).toBeGreaterThan(0)
    }
  })
})

describe('showdown winner (Lesson 3 board-dealer p7)', () => {
  // The exact scenario the showdown-winner question deals out: hero A♠9♦ vs
  // villain A♥K♣ on A♣9♠4♦J♥2♣. This is what BoardDealer grades the learner's
  // "Who won?" pick against, so it must resolve to the hero.
  const board: CardId[] = ['AC', '9S', '4D', 'JH', '2C']
  const hero = evaluateHoldem(['AS', '9D'], board)
  const villain = evaluateHoldem(['AH', 'KC'], board)

  it('hero makes two pair (Aces and Nines)', () => {
    expect(hero.category).toBe('two-pair')
    expect(hero.label).toBe('Two pair, Aces and Nines')
  })

  it('villain makes only one pair of Aces', () => {
    expect(villain.category).toBe('pair')
    expect(villain.label).toBe('Pair of Aces')
  })

  it('the hero wins the pot (two pair beats one pair)', () => {
    expect(compareHands(hero, villain)).toBeGreaterThan(0)
    expect(compareHands(villain, hero)).toBeLessThan(0)
  })
})

describe('countOuts (Lesson 4 draws)', () => {
  it('flush draw = 9 outs', () => {
    expect(countOuts(['AS', 'KS'], ['QS', '7S', '2D'], 'flush').count).toBe(9)
  })

  it('open-ended straight draw = 8 outs', () => {
    expect(countOuts(['9C', '8D'], ['7H', '6S', '2C'], 'straight').count).toBe(8)
  })

  it('gutshot straight draw = 4 outs', () => {
    expect(countOuts(['JC', '10D'], ['QH', '8S', '2C'], 'straight').count).toBe(4)
  })

  it('returns the actual out cards', () => {
    const { outs, count } = countOuts(['AS', 'KS'], ['QS', '7S', '2D'], 'flush')
    expect(outs).toHaveLength(count)
    expect(outs.every((c) => c.endsWith('S'))).toBe(true)
  })
})

describe('evaluateBoardOnly — the board\'s own hand', () => {
  it('reads a paired flop board as a pair (no five-card hand needed)', () => {
    const bo = evaluateBoardOnly(['3H', '3D', '9C'])
    expect(bo?.category).toBe('pair')
    expect(bo?.label).toBe('Pair of Threes')
  })

  it('reads a full five-card board with the real evaluator', () => {
    const bo = evaluateBoardOnly(['3H', '3D', 'KC', '9S', '5D'])
    expect(bo?.category).toBe('pair')
    expect(bo?.label).toBe('Pair of Threes')
  })

  it('reads an unpaired board as high-card', () => {
    expect(evaluateBoardOnly(['KS', '9D', '2C'])?.category).toBe('high-card')
    expect(evaluateBoardOnly([])).toBeNull()
  })
})

describe('holeCardsImproveBoard / isPlayingTheBoard', () => {
  it('a board pair the hole cards did not make does NOT count as improving (playing the board)', () => {
    // 3s are on the board; the hero holds unconnected blanks.
    expect(holeCardsImproveBoard(['7C', '2D'], ['3H', '3D', '9C'])).toBe(false)
    // Even an ace KICKER does not make the board pair the hero's own hand.
    expect(holeCardsImproveBoard(['AC', '4D'], ['3H', '3D', 'KC', '9S', '5D'])).toBe(false)
  })

  it('a hole card that makes a real pair (or better) DOES improve on the board', () => {
    // Hero pairs the 9 -> two pair (nines and threes) using a hole card.
    expect(holeCardsImproveBoard(['9D', '7H'], ['3H', '3D', '9C'])).toBe(true)
    // Hero pairs the top card -> a real pair of Kings.
    expect(holeCardsImproveBoard(['KD', '7C'], ['KS', '9D', '2C'])).toBe(true)
  })

  it('detects strict playing-the-board on a five-card straight board', () => {
    const straightBoard: CardId[] = ['9S', '8D', '7C', '6H', '5S']
    expect(isPlayingTheBoard(['2C', '3D'], straightBoard)).toBe(true) // hero adds nothing
    expect(isPlayingTheBoard(['10D', '4C'], straightBoard)).toBe(false) // hero makes the higher straight
    // Only meaningful with a full board.
    expect(isPlayingTheBoard(['7C', '2D'], ['3H', '3D', '9C'])).toBe(false)
  })
})
