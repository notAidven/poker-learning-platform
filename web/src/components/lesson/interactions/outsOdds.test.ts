/**
 * The outs-odds grader reads the candidate-01 spot-strength module, so its tests
 * pin the SAME canonical equity: a 9-out flush draw on the flop is 35%.
 */
import { describe, expect, it } from 'vitest'
import { deriveOutsOdds, deriveTarget, gradeOutsOdds } from './outsOdds'
import type { OutsOddsConfig } from '../../../types/lesson'

const flushFlop: OutsOddsConfig = {
  hole: ['AD', 'QD'],
  board: ['10D', '6D', '3C'],
  drawLabel: 'a flush',
  street: 'flop',
  ask: ['outs', 'equity'],
}

describe('deriveTarget', () => {
  it('maps a draw label to the completing category (combo -> the lower one)', () => {
    expect(deriveTarget('a flush')).toBe('flush')
    expect(deriveTarget('an open-ended straight')).toBe('straight')
    expect(deriveTarget('a flush plus an open-ended straight')).toBe('straight')
  })
})

describe('deriveOutsOdds — reads the canonical equity (35% for a 9-out flush draw)', () => {
  it('derives 9 outs and the corrected 35% on the flop', () => {
    const e = deriveOutsOdds(flushFlop, {})
    expect(e.outs).toBe(9)
    expect(e.cardsToCome).toBe(2)
    expect(e.ruleEquity).toBe(35)
    expect(e.equityCenter).toBe(35)
  })

  it('prices a call and decides call/fold from the rule equity vs the price', () => {
    const cheap: OutsOddsConfig = { ...flushFlop, ask: ['decision'], pot: 100, betToCall: 20 }
    const e = deriveOutsOdds(cheap, {})
    expect(e.requiredEquityPct).toBeCloseTo((20 / 120) * 100, 5)
    expect(e.decision).toBe('call') // 35% beats ~17%
    const steep: OutsOddsConfig = { ...flushFlop, ask: ['decision'], pot: 20, betToCall: 100 }
    expect(deriveOutsOdds(steep, {}).decision).toBe('fold') // 35% < ~83%
  })

  it('honors an authored equityPercent as the graded center', () => {
    expect(deriveOutsOdds(flushFlop, { equityPercent: 34 }).equityCenter).toBe(34)
  })
})

describe('gradeOutsOdds', () => {
  it('accepts outs + an equity within tolerance + the right decision', () => {
    const cfg: OutsOddsConfig = { ...flushFlop, ask: ['outs', 'equity', 'decision'], pot: 100, betToCall: 20 }
    const g = gradeOutsOdds(cfg, {}, {
      outsInput: '9',
      equity: { kind: 'percent', value: '36' }, // within tol 3 of 35
      potOdds: { kind: 'percent', value: '' },
      decision: 'call',
    })
    expect(g.correct).toBe(true)
  })

  it('rejects a wrong out count', () => {
    const cfg: OutsOddsConfig = { ...flushFlop, ask: ['outs'] }
    const g = gradeOutsOdds(cfg, {}, {
      outsInput: '8',
      equity: { kind: 'percent', value: '' },
      potOdds: { kind: 'percent', value: '' },
      decision: null,
    })
    expect(g.correct).toBe(false)
  })

  it('accepts pot odds entered as a fraction', () => {
    const cfg: OutsOddsConfig = { ...flushFlop, ask: ['potOdds'], pot: 100, betToCall: 20 }
    const g = gradeOutsOdds(cfg, {}, {
      outsInput: '',
      equity: { kind: 'percent', value: '' },
      potOdds: { kind: 'fraction', num: '20', den: '120' },
      decision: null,
    })
    expect(g.correct).toBe(true)
  })
})
