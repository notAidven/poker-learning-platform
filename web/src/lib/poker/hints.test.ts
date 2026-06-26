/**
 * Board-reading correctness for `analyzeSpot`: a made hand that sits on the
 * community cards (a shared board pair / "playing the board") must NOT be reported
 * as the hero's own asset. The structured read carries `madeFromHole`, and the tip
 * coaches the true (weak) strength instead of a phantom "playable pair".
 */
import { describe, expect, it } from 'vitest'
import { analyzeSpot } from './hints'

describe('analyzeSpot — playing the board', () => {
  it('flags a board pair the hole cards did not make and coaches the true strength', () => {
    const a = analyzeSpot({
      hole: ['7C', '2D'],
      board: ['3H', '3D', '9C', 'KS', '5D'],
      street: 'river',
      pot: 100,
      toCall: 50,
    })
    // The best 5 cards are a pair of threes, but they are entirely on the board.
    expect(a.madeCategory).toBe('pair')
    expect(a.madeFromHole).toBe(false)
    expect(a.boardMadeLabel).toBe('Pair of Threes')
    const tip = a.tip.toLowerCase()
    expect(tip).toContain('board')
    expect(tip).toContain('shared')
    // It must NOT be sold as the hero's value/playable pair.
    expect(tip).not.toContain('value')
    // The grounding fact must say it is on the board, not "Best hand now".
    expect(a.facts.some((f) => /on the board/i.test(f))).toBe(true)
    expect(a.facts.some((f) => /^Best hand now/.test(f))).toBe(false)
  })

  it('treats a pair the hole cards actually made as a real pair', () => {
    const a = analyzeSpot({
      hole: ['KD', '7C'],
      board: ['KS', '9D', '2C'],
      street: 'flop',
      pot: 40,
      toCall: 0,
    })
    expect(a.madeCategory).toBe('pair')
    expect(a.madeFromHole).toBe(true)
    expect(a.facts.some((f) => /Best hand now/.test(f))).toBe(true)
  })

  it('calls out playing a board straight (shared by everyone)', () => {
    const a = analyzeSpot({
      hole: ['2C', '3D'],
      board: ['9S', '8D', '7C', '6H', '5S'],
      street: 'river',
      pot: 60,
      toCall: 0,
    })
    expect(a.madeCategory).toBe('straight')
    expect(a.madeFromHole).toBe(false)
    expect(a.tip.toLowerCase()).toContain('shared')
  })
})
