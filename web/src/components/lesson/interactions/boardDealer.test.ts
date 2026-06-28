import { describe, expect, it } from 'vitest'
import { bestHandCategoryAt, gradeBoardDealer, showdownWinner } from './boardDealer'
import type { CardId } from '../../../types/lesson'
import type { HandCategory, PokerStreet } from '../../../types/poker'

describe('bestHandCategoryAt', () => {
  it('reads the evaluator category once five cards are known', () => {
    expect(bestHandCategoryAt(['AS', 'AD'], ['KS', '9D', '2C'])).toBe('pair')
    expect(bestHandCategoryAt(['AS', 'KS'], ['QS', 'JS', '2S'])).toBe('flush')
  })

  it('falls back to pair / high-card preflop', () => {
    expect(bestHandCategoryAt(['AS', 'AD'], [])).toBe('pair')
    expect(bestHandCategoryAt(['AS', 'KD'], [])).toBe('high-card')
  })
})

describe('showdownWinner', () => {
  const board: CardId[] = ['2C', '7D', '9S', 'JH', '4C']

  it('compares hero and villain on the full board', () => {
    expect(showdownWinner(['AS', 'AD'], ['KS', 'KD'], board)).toBe('hero')
    expect(showdownWinner(['KS', 'KD'], ['AS', 'AD'], board)).toBe('opponent')
  })

  it('reports a split when both play the same five-card board straight', () => {
    const straightBoard: CardId[] = ['5C', '6D', '7S', '8H', '9C']
    expect(showdownWinner(['2C', '3D'], ['2H', '3S'], straightBoard)).toBe('split')
  })
})

describe('gradeBoardDealer', () => {
  const expectedByStreet = { flop: 'pair', turn: 'two-pair' } as Record<PokerStreet, HandCategory>

  it('requires every asked street pick to match', () => {
    expect(
      gradeBoardDealer(
        { askedStreets: ['flop', 'turn'], picks: { flop: 'pair', turn: 'two-pair' }, isShowdown: false, winnerPick: null },
        expectedByStreet,
        null,
      ),
    ).toBe(true)
    expect(
      gradeBoardDealer(
        { askedStreets: ['flop', 'turn'], picks: { flop: 'pair', turn: 'pair' }, isShowdown: false, winnerPick: null },
        expectedByStreet,
        null,
      ),
    ).toBe(false)
  })

  it('checks the showdown winner when in showdown mode', () => {
    const empty = {} as Record<PokerStreet, HandCategory>
    expect(
      gradeBoardDealer({ askedStreets: [], picks: {}, isShowdown: true, winnerPick: 'hero' }, empty, 'hero'),
    ).toBe(true)
    expect(
      gradeBoardDealer({ askedStreets: [], picks: {}, isShowdown: true, winnerPick: 'opponent' }, empty, 'hero'),
    ).toBe(false)
  })
})
