/**
 * The interface IS the test surface for the spot-strength module: outs -> equity
 * (the one canonical Rule-of-2-&-4 convention), pot odds, EV, and the draw model.
 *
 * The headline correctness invariant: a 9-out flush draw on the flop is 35% (the
 * big-draw-corrected rule), matching Lesson 5 and the exact hypergeometric value —
 * never the old uncorrected 36% that used to disagree across modules.
 */
import { describe, expect, it } from 'vitest'
import {
  callEvChips,
  cardsToCome,
  exactEquityPct,
  findDraw,
  isPricedIn,
  potOddsExactPct,
  potOddsPct,
  ruleEquityPct,
  unseenCount,
} from './spotStrength'

describe('cardsToCome', () => {
  it('is 2 on the flop, 1 on the turn, 0 by the river', () => {
    expect(cardsToCome(['7H', '6S', '2C'])).toBe(2)
    expect(cardsToCome(['7H', '6S', '2C', '9D'])).toBe(1)
    expect(cardsToCome(['7H', '6S', '2C', '9D', 'KS'])).toBe(0)
  })
})

describe('ruleEquityPct — the one canonical outs -> equity convention', () => {
  it('applies the big-draw correction so a 9-out flush draw reads 35%, not 36%', () => {
    expect(ruleEquityPct(9, 2)).toBe(35) // 9 x 4 = 36, minus (9 - 8) = 35
  })

  it('leaves <= 8 outs uncorrected on the flop', () => {
    expect(ruleEquityPct(8, 2)).toBe(32) // open-ended
    expect(ruleEquityPct(4, 2)).toBe(16) // gutshot
  })

  it('corrects big combo draws downward', () => {
    expect(ruleEquityPct(12, 2)).toBe(44) // 48 - 4
    expect(ruleEquityPct(15, 2)).toBe(53) // 60 - 7
  })

  it('uses x2 on the turn and 0 with no cards to come or no outs', () => {
    expect(ruleEquityPct(9, 1)).toBe(18)
    expect(ruleEquityPct(9, 0)).toBe(0)
    expect(ruleEquityPct(0, 2)).toBe(0)
  })
})

describe('exactEquityPct — the precise value the rule approximates', () => {
  it('matches the corrected rule for a 9-out flush draw on the flop (~35%)', () => {
    expect(Math.round(exactEquityPct(9, 47, 2))).toBe(35)
  })

  it('is ~19.6% for the same draw with one card to come', () => {
    expect(exactEquityPct(9, 46, 1)).toBeCloseTo(19.57, 1)
  })

  it('is 0 in degenerate cases', () => {
    expect(exactEquityPct(0, 47, 2)).toBe(0)
    expect(exactEquityPct(9, 0, 2)).toBe(0)
  })
})

describe('potOdds + isPricedIn + EV', () => {
  it('prices a bet as required equity = toCall / (pot + toCall)', () => {
    expect(potOddsPct(120, 40)).toBe(25)
    expect(potOddsPct(100, 0)).toBeNull()
    expect(potOddsExactPct(120, 40)).toBeCloseTo(25, 5)
    expect(potOddsExactPct(100, 0)).toBeNull()
  })

  it('says a draw is priced in only when equity meets the price', () => {
    expect(isPricedIn(35, 25)).toBe(true)
    expect(isPricedIn(35, 35)).toBe(true)
    expect(isPricedIn(30, 35)).toBe(false)
  })

  it('computes the rough EV of a call in chips', () => {
    // 58% to win the 120 pot, risking 40: 0.58*120 - 0.42*40 ~= +53.
    expect(callEvChips(58, 120, 40)).toBe(53)
    // A coin flip into a pot-sized bet is break-even-ish.
    expect(callEvChips(50, 100, 100)).toBe(0)
  })
})

describe('findDraw — clean, disjoint flush/straight outs from the evaluator', () => {
  it('reads a pure flush draw as 9 outs', () => {
    const d = findDraw(['AS', 'KS'], ['QS', '7S', '2D'])
    expect(d.drawName).toBe('flush draw')
    expect(d.outs).toBe(9)
  })

  it('reads a pure open-ended straight draw as 8 outs', () => {
    const d = findDraw(['9C', '8D'], ['7H', '6S', '2C'])
    expect(d.drawName).toBe('open-ended straight draw')
    expect(d.outs).toBe(8)
  })

  it('reads a pure gutshot as 4 outs', () => {
    const d = findDraw(['JC', '10D'], ['QH', '8S', '2C'])
    expect(d.drawName).toBe('gutshot straight draw')
    expect(d.outs).toBe(4)
  })

  it('reads a flush + OESD combo as the 15-out union (not an inflated straight)', () => {
    const d = findDraw(['9H', '8H'], ['7H', '6S', '2H'])
    expect(d.drawName).toBe('flush draw + straight draw')
    expect(d.outs).toBe(15)
    expect(d.flushOuts).toBe(9)
    expect(d.straightOuts).toBe(6) // the non-heart 5s and Ts
  })

  it('reads a flush + gutshot combo as the 12-out union', () => {
    const d = findDraw(['AH', '10H'], ['KH', 'QH', '3S'])
    expect(d.drawName).toBe('flush draw + straight draw')
    expect(d.outs).toBe(12)
  })

  it('reports no draw for a made hand with nothing to chase', () => {
    const d = findDraw(['KD', '7C'], ['KS', '9D', '2C'])
    expect(d.drawName).toBeNull()
    expect(d.outs).toBeNull()
  })

  it('reports no draw preflop (fewer than five known cards)', () => {
    expect(findDraw(['AS', 'KS'], []).drawName).toBeNull()
  })
})

describe('unseenCount', () => {
  it('is 47 on the flop and 46 on the turn', () => {
    expect(unseenCount(['AS', 'KS'], ['QS', '7S', '2D'])).toBe(47)
    expect(unseenCount(['AS', 'KS'], ['QS', '7S', '2D', '8C'])).toBe(46)
  })
})
