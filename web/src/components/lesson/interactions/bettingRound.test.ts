import { describe, expect, it } from 'vitest'
import { buildEvBreakdown, evMatches, gradeBettingRound, parseSignedNumber } from './bettingRound'
import type { BettingRoundConfig } from '../../../types/lesson'

const base: BettingRoundConfig = {
  hole: ['AS', 'KS'],
  board: ['QS', '7S', '2D'],
  street: 'flop',
  pot: 100,
  heroStack: 200,
  villainStack: 200,
  task: 'choose-action',
}

describe('parseSignedNumber / evMatches', () => {
  it('parses signed decimals and rejects junk', () => {
    expect(parseSignedNumber('16')).toBe(16)
    expect(parseSignedNumber('-8')).toBe(-8)
    expect(parseSignedNumber('abc')).toBeNull()
  })

  it('matches an EV within tolerance', () => {
    expect(evMatches('16', 16, 1)).toBe(true)
    expect(evMatches('18', 16, 1)).toBe(false)
  })
})

describe('gradeBettingRound', () => {
  it('choose-action: matches the authored action', () => {
    const cfg: BettingRoundConfig = { ...base, task: 'choose-action' }
    expect(gradeBettingRound(cfg, { action: 'bet' }, { action: 'bet', sizeFraction: null, evInput: '' })).toBe(true)
    expect(gradeBettingRound(cfg, { action: 'bet' }, { action: 'check', sizeFraction: null, evInput: '' })).toBe(false)
  })

  it('choose-size: accepts a fraction within tolerance', () => {
    const cfg: BettingRoundConfig = { ...base, task: 'choose-size' }
    expect(
      gradeBettingRound(cfg, { sizeFraction: 0.75, sizeTolerance: 0.05 }, { action: null, sizeFraction: 0.75, evInput: '' }),
    ).toBe(true)
    expect(
      gradeBettingRound(cfg, { sizeFraction: 0.75, sizeTolerance: 0.05 }, { action: null, sizeFraction: 0.5, evInput: '' }),
    ).toBe(false)
  })

  it('ev-of-call: matches the entered EV within tolerance', () => {
    const cfg: BettingRoundConfig = { ...base, task: 'ev-of-call', facing: { action: 'bet', amount: 40 } }
    expect(gradeBettingRound(cfg, { evChips: 16, evTolerance: 1 }, { action: null, sizeFraction: null, evInput: '16' })).toBe(true)
    expect(gradeBettingRound(cfg, { evChips: 16, evTolerance: 1 }, { action: null, sizeFraction: null, evInput: '-8' })).toBe(false)
  })
})

describe('buildEvBreakdown', () => {
  it('recovers the implied equity and required price from the authored EV', () => {
    const cfg: BettingRoundConfig = { ...base, pot: 100, facing: { action: 'bet', amount: 40 } }
    const b = buildEvBreakdown(cfg, { evChips: 16 })
    // EV = p*100 - (1-p)*40 = 16  ->  p = 56/140 = 0.4; required = 40/140.
    expect(b.equity).toBeCloseTo(0.4, 5)
    expect(b.required).toBeCloseTo(40 / 140, 5)
    expect(b.decision).toBe('call')
  })
})
