import { describe, expect, it } from 'vitest'
import {
  GRID_SIZE,
  RANKS,
  allHands,
  classify,
  gradeRangeSelection,
  handAt,
  isHandInRange,
} from './rangeGrid'

describe('rangeGrid — grid geometry (handAt)', () => {
  it('puts the pocket pairs on the diagonal, strongest first', () => {
    expect(handAt(0, 0)).toBe('AA')
    expect(handAt(1, 1)).toBe('KK')
    expect(handAt(4, 4)).toBe('TT')
    expect(handAt(12, 12)).toBe('22')
  })

  it('reads the upper triangle (col > row) as suited and the lower as offsuit', () => {
    // A is row/col 0, K is row/col 1.
    expect(handAt(0, 1)).toBe('AKs') // above the diagonal
    expect(handAt(1, 0)).toBe('AKo') // below the diagonal
    // Mixed example: J (row 3) and T (row 4).
    expect(handAt(3, 4)).toBe('JTs')
    expect(handAt(4, 3)).toBe('JTo')
    // The lowest off-diagonal pair of ranks.
    expect(handAt(0, 12)).toBe('A2s')
    expect(handAt(12, 0)).toBe('A2o')
  })

  it('always lists the higher rank first regardless of triangle', () => {
    expect(handAt(7, 2)).toBe('Q7o') // Q (col 2) is higher than 7 (row 7)
    expect(handAt(2, 7)).toBe('Q7s')
  })
})

describe('rangeGrid — allHands', () => {
  const hands = allHands()

  it('produces exactly the 169 starting-hand classes', () => {
    expect(hands).toHaveLength(GRID_SIZE * GRID_SIZE)
    expect(hands).toHaveLength(169)
  })

  it('contains 13 pairs, 78 suited, and 78 offsuit hands', () => {
    const counts = { pair: 0, suited: 0, offsuit: 0 }
    for (const hand of hands) counts[classify(hand)] += 1
    expect(counts).toEqual({ pair: 13, suited: 78, offsuit: 78 })
  })

  it('has no duplicate hand ids', () => {
    expect(new Set(hands).size).toBe(hands.length)
  })

  it('is in row-major order, starting at AA and ending at 22', () => {
    expect(hands[0]).toBe('AA')
    expect(hands[1]).toBe('AKs')
    expect(hands[GRID_SIZE]).toBe('AKo') // first cell of the second row
    expect(hands[hands.length - 1]).toBe('22')
  })

  it('exposes the ranks strongest-first with ten as T', () => {
    expect(RANKS[0]).toBe('A')
    expect(RANKS[4]).toBe('T')
    expect(RANKS[RANKS.length - 1]).toBe('2')
  })
})

describe('rangeGrid — classify', () => {
  it('labels pairs, suited, and offsuit hands', () => {
    expect(classify('AA')).toBe('pair')
    expect(classify('22')).toBe('pair')
    expect(classify('AKs')).toBe('suited')
    expect(classify('T9s')).toBe('suited')
    expect(classify('AKo')).toBe('offsuit')
    expect(classify('72o')).toBe('offsuit')
  })
})

describe('rangeGrid — isHandInRange', () => {
  const range = ['AA', 'KK', 'QQ', 'AKs', 'AKo']

  it('detects membership exactly', () => {
    expect(isHandInRange('AA', range)).toBe(true)
    expect(isHandInRange('AKs', range)).toBe(true)
    expect(isHandInRange('AKo', range)).toBe(true)
    expect(isHandInRange('AQs', range)).toBe(false)
    expect(isHandInRange('JJ', range)).toBe(false)
  })

  it('returns false for an empty range', () => {
    expect(isHandInRange('AA', [])).toBe(false)
  })
})

describe('rangeGrid — gradeRangeSelection (exact set match)', () => {
  const target = ['AA', 'KK', 'QQ', 'JJ']

  it('passes only when the selection equals the target set', () => {
    expect(gradeRangeSelection(['AA', 'KK', 'QQ', 'JJ'], target)).toBe(true)
    // Order does not matter.
    expect(gradeRangeSelection(['JJ', 'QQ', 'KK', 'AA'], target)).toBe(true)
    // Accepts a Set as well as an array.
    expect(gradeRangeSelection(new Set(['AA', 'KK', 'QQ', 'JJ']), target)).toBe(true)
  })

  it('fails on a missing hand, an extra hand, or an empty selection', () => {
    expect(gradeRangeSelection(['AA', 'KK', 'QQ'], target)).toBe(false) // missing JJ
    expect(gradeRangeSelection(['AA', 'KK', 'QQ', 'JJ', 'TT'], target)).toBe(false) // extra TT
    expect(gradeRangeSelection([], target)).toBe(false)
    expect(gradeRangeSelection(new Set<string>(), target)).toBe(false)
  })

  it('matches two empty sets as a degenerate exact match', () => {
    expect(gradeRangeSelection([], [])).toBe(true)
  })

  it('grades a full grid selection against the full 169-hand range', () => {
    expect(gradeRangeSelection(allHands(), allHands())).toBe(true)
    expect(gradeRangeSelection(allHands().slice(1), allHands())).toBe(false)
  })
})
