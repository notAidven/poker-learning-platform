/**
 * Board-reading correctness for `analyzeSpot`: a made hand that sits on the
 * community cards (a shared board pair / "playing the board") must NOT be reported
 * as the hero's own asset. The structured read carries `madeFromHole`, and the tip
 * coaches the true (weak) strength instead of a phantom "playable pair".
 */
import { describe, expect, it } from 'vitest'
import { analyzeSpot } from './hints'
import type { CardId } from '../../types/lesson'

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

describe('analyzeSpot — draw detection (combo draws are not mislabeled straights)', () => {
  function flopDraw(hole: [CardId, CardId], board: CardId[]) {
    return analyzeSpot({ hole, board, street: 'flop', pot: 100, toCall: 30 })
  }

  it('labels a flush draw + OESD combo with the UNION out count, not a 15-out straight', () => {
    // 9H 8H on 7H 6S 2H: flush draw (9 hearts) AND 9-8-7-6 open-ender (5/T).
    // Pure straight outs exclude 5H/TH (those are flush cards): 6 + 9 flush = 15 union.
    const a = flopDraw(['9H', '8H'], ['7H', '6S', '2H'])
    expect(a.drawName).toBe('flush draw + straight draw')
    expect(a.outs).toBe(15)
    // CORRECTNESS FIX (candidate 01): equity is now the big-draw-corrected Rule of
    // 2 & 4 (the single canonical convention in `poker/spotStrength`), shared with
    // the lessons. 15 outs -> 15x4 - (15-8) = 53, not the old uncorrected 60.
    expect(a.equityPct).toBe(53)
  })

  it('labels a gutshot + flush combo as a combo with the union out count', () => {
    // AH TH on KH QH 3S: flush draw (9 hearts) AND a Broadway gutshot (needs a J).
    // Pure straight outs = JS/JD/JC (JH is a flush card) = 3; union = 3 + 9 = 12.
    const a = flopDraw(['AH', '10H'], ['KH', 'QH', '3S'])
    expect(a.drawName).toBe('flush draw + straight draw')
    expect(a.outs).toBe(12)
    // CORRECTNESS FIX (candidate 01): 12 outs -> 12x4 - (12-8) = 44, not 48.
    expect(a.equityPct).toBe(44)
  })

  it('labels a pure flush draw as a flush draw with 9 outs', () => {
    const a = flopDraw(['AS', 'KS'], ['QS', '7S', '2D'])
    expect(a.drawName).toBe('flush draw')
    expect(a.outs).toBe(9)
    // CORRECTNESS FIX (candidate 01): this is the headline unification. The coach
    // used to read 36% here while Lesson 5 read 35%; both now read the corrected
    // 35% (9x4 - (9-8)), which also matches the exact hypergeometric value.
    expect(a.equityPct).toBe(35)
  })

  it('labels a pure open-ended straight draw as OESD with 8 outs', () => {
    const a = flopDraw(['9C', '8D'], ['7H', '6S', '2C'])
    expect(a.drawName).toBe('open-ended straight draw')
    expect(a.outs).toBe(8)
    expect(a.equityPct).toBe(32)
  })

  it('labels a pure gutshot straight draw as a gutshot with 4 outs', () => {
    // JC 10D on QH 8S 2C: only a 9 completes Q-J-10-9-8 → inside (gutshot) draw.
    const a = flopDraw(['JC', '10D'], ['QH', '8S', '2C'])
    expect(a.drawName).toBe('gutshot straight draw')
    expect(a.outs).toBe(4)
    expect(a.equityPct).toBe(16)
  })
})

describe('analyzeSpot — big-bet (sunk-cost) threshold sizes against the pre-bet pot', () => {
  // 8H 3S on KS 8D 2C: a weak second pair, no draw — the kind of hand the sunk-cost
  // reminder is meant for. pot is bet-INCLUSIVE, so a 2/3-pot bet of 66 sits in a 166
  // pot (pre-bet 100).
  it('flags a ~2/3-pot bet as a big bet (the old raw-pot check would miss it)', () => {
    const a = analyzeSpot({
      hole: ['8H', '3S'],
      board: ['KS', '8D', '2C'],
      street: 'flop',
      pot: 166, // 100 pre-bet pot + a 66 bet
      toCall: 66,
    })
    expect(a.bigBet).toBe(true)
    // The sunk-cost reminder rides along on the tip when facing a big bet.
    expect(a.tip.toLowerCase()).toContain('already in the pot')
  })

  it('does not flag a small (~1/5-pot) bet as a big bet', () => {
    const a = analyzeSpot({
      hole: ['8H', '3S'],
      board: ['KS', '8D', '2C'],
      street: 'flop',
      pot: 120, // 100 pre-bet pot + a 20 bet
      toCall: 20,
    })
    expect(a.bigBet).toBe(false)
    expect(a.tip.toLowerCase()).not.toContain('already in the pot')
  })
})
