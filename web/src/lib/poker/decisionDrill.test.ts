/**
 * Unit tests for the Coached Decision Drill grader + session tracking (Room 1).
 *
 * The grader is pure and lenient: it accepts any clearly-reasonable play and only
 * flags the handful of clear, beginner-level mistakes. The session reducer models
 * the full mistake → rethink → sound flow so best-on-first-try accuracy and the
 * modest, capped XP are exercised end to end — all without React or the engine.
 */
import { describe, expect, it } from 'vitest'
import {
  gradeDrillDecision,
  initialDrillSession,
  recordDrillResult,
  type DrillSpot,
} from './decisionDrill'
import type { SpotAnalysis } from './hints'
import {
  XP_DRILL_AFTER_RETHINK,
  XP_DRILL_FIRST_TRY,
  XP_DRILL_SESSION_CAP,
  drillAccuracyPct,
} from '../gamification'
import type { PokerStreet } from '../../types/poker'

function analysis(partial: Partial<SpotAnalysis>): SpotAnalysis {
  return {
    street: 'flop' as PokerStreet,
    madeLabel: null,
    madeCategory: null,
    madeFromHole: null,
    boardMadeLabel: null,
    boardMadeCategory: null,
    drawName: null,
    outs: null,
    equityPct: null,
    potOddsPct: null,
    pricedIn: null,
    facingBet: false,
    bigBet: false,
    facts: [],
    tip: '',
    ...partial,
  }
}

function spot(partial: Partial<DrillSpot> & { analysis: SpotAnalysis }): DrillSpot {
  return {
    recommended: 'check',
    toCall: 0,
    pot: 100,
    currentBet: 0,
    ...partial,
  }
}

describe('decision drill grader — lenient acceptance of reasonable plays', () => {
  it('accepts a check in any spot (free card is never a mistake)', () => {
    const g = gradeDrillDecision({ action: 'check' }, spot({ analysis: analysis({}) }))
    expect(g.verdict).toBe('sound')
    expect(g.nudge).toBe('')
  })

  it('accepts standard preflop play (no made-hand read with two cards)', () => {
    for (const action of ['fold', 'call', 'bet', 'raise'] as const) {
      const g = gradeDrillDecision(
        { action, amount: 60 },
        spot({ analysis: analysis({ street: 'preflop' }), toCall: 20, currentBet: 20, pot: 60 }),
      )
      expect(g.verdict).toBe('sound')
    }
  })

  it('accepts folding a weak hand facing a big bet (folding weak is fine)', () => {
    const g = gradeDrillDecision(
      { action: 'fold' },
      spot({
        analysis: analysis({ madeCategory: 'pair', madeFromHole: true, facingBet: true, bigBet: true }),
        toCall: 80,
        pot: 120,
      }),
    )
    expect(g.verdict).toBe('sound')
  })

  it('accepts calling a big bet WITH a priced-in draw (right price to chase)', () => {
    const g = gradeDrillDecision(
      { action: 'call' },
      spot({
        analysis: analysis({
          drawName: 'flush draw',
          outs: 9,
          equityPct: 36,
          potOddsPct: 30,
          pricedIn: true,
          facingBet: true,
          bigBet: true,
        }),
        toCall: 80,
        pot: 260,
      }),
    )
    expect(g.verdict).toBe('sound')
  })

  it('accepts calling a SMALL bet with a weak hand (not a big bet)', () => {
    const g = gradeDrillDecision(
      { action: 'call' },
      spot({
        analysis: analysis({ madeCategory: 'high-card', facingBet: true, bigBet: false }),
        toCall: 10,
        pot: 110,
      }),
    )
    expect(g.verdict).toBe('sound')
  })

  it('accepts an opening bet as a bluff (open bets keep fold equity)', () => {
    const g = gradeDrillDecision(
      { action: 'bet', amount: 70 },
      spot({ analysis: analysis({ madeCategory: 'high-card' }), toCall: 0, currentBet: 0, pot: 100 }),
    )
    expect(g.verdict).toBe('sound')
  })

  it('accepts a value bet with a strong hand at a normal size', () => {
    const g = gradeDrillDecision(
      { action: 'bet', amount: 75 },
      spot({
        analysis: analysis({ madeCategory: 'two-pair', madeFromHole: true }),
        toCall: 0,
        currentBet: 0,
        pot: 100,
      }),
    )
    expect(g.verdict).toBe('sound')
  })

  it('accepts a semi-bluff raise with a real draw (a draw is not trash)', () => {
    const g = gradeDrillDecision(
      { action: 'raise', amount: 240 },
      spot({
        analysis: analysis({ drawName: 'open-ended straight draw', outs: 8, equityPct: 32, facingBet: true }),
        toCall: 80,
        currentBet: 80,
        pot: 260,
        sizingMin: 160,
        sizingMax: 500,
      }),
    )
    expect(g.verdict).toBe('sound')
  })

  it('treats a shared board hand as NOT the hero\u2019s — folding it is fine', () => {
    // Two pair sits entirely on the board (madeFromHole false): not the hero's asset.
    const g = gradeDrillDecision(
      { action: 'fold' },
      spot({
        analysis: analysis({ madeCategory: 'two-pair', madeFromHole: false, facingBet: true, bigBet: true }),
        toCall: 90,
        pot: 200,
      }),
    )
    expect(g.verdict).toBe('sound')
  })
})

describe('decision drill grader — flags the clear mistakes (with a hint, not the answer)', () => {
  it('flags folding a very strong made hand', () => {
    const g = gradeDrillDecision(
      { action: 'fold' },
      spot({
        analysis: analysis({
          madeCategory: 'two-pair',
          madeLabel: 'Two pair, Aces and Kings',
          madeFromHole: true,
          facingBet: true,
        }),
        toCall: 60,
        pot: 180,
      }),
    )
    expect(g.verdict).toBe('mistake')
    expect(g.reason).toBe('fold-strong')
    expect(g.nudge.length).toBeGreaterThan(0)
    // A hint, not the answer: it must not prescribe an action to take.
    expect(g.nudge.toLowerCase()).not.toMatch(/\b(raise|call|bet|check)\b/)
  })

  it('flags calling a big bet with no pair and no draw (no equity)', () => {
    const g = gradeDrillDecision(
      { action: 'call' },
      spot({
        analysis: analysis({ madeCategory: 'high-card', facingBet: true, bigBet: true }),
        toCall: 120,
        pot: 300,
      }),
    )
    expect(g.verdict).toBe('mistake')
    expect(g.reason).toBe('call-no-equity')
  })

  it('flags raising trash into a bet (a pure bluff into shown strength)', () => {
    const g = gradeDrillDecision(
      { action: 'raise', amount: 260 },
      spot({
        analysis: analysis({ madeCategory: 'high-card', facingBet: true }),
        toCall: 80,
        currentBet: 80,
        pot: 260,
        sizingMin: 160,
        sizingMax: 500,
      }),
    )
    expect(g.verdict).toBe('mistake')
    expect(g.reason).toBe('raise-trash')
  })

  it('flags a dribble bet with a strong hand (wildly small sizing)', () => {
    const g = gradeDrillDecision(
      { action: 'bet', amount: 10 }, // ~10% of a 100 pot, with two pair, could size up
      spot({
        analysis: analysis({ madeCategory: 'two-pair', madeFromHole: true }),
        toCall: 0,
        currentBet: 0,
        pot: 100,
        sizingMin: 5,
        sizingMax: 400,
      }),
    )
    expect(g.verdict).toBe('mistake')
    expect(g.reason).toBe('bad-sizing')
  })

  it('flags a massive overbet without a strong hand (wildly large sizing)', () => {
    const g = gradeDrillDecision(
      { action: 'bet', amount: 260 }, // >2x a 100 pot with one pair
      spot({
        analysis: analysis({ madeCategory: 'pair', madeFromHole: true }),
        toCall: 0,
        currentBet: 0,
        pot: 100,
        sizingMin: 10,
        sizingMax: 400,
      }),
    )
    expect(g.verdict).toBe('mistake')
    expect(g.reason).toBe('bad-sizing')
  })

  it('never flags an all-in as a sizing mistake (a shove is a valid size)', () => {
    const g = gradeDrillDecision(
      { action: 'bet', amount: 400 }, // == sizingMax (all-in), weak hand
      spot({
        analysis: analysis({ madeCategory: 'high-card' }),
        toCall: 0,
        currentBet: 0,
        pot: 100,
        sizingMin: 10,
        sizingMax: 400,
      }),
    )
    expect(g.verdict).toBe('sound')
  })
})

describe('decision drill — session accuracy + XP tracking', () => {
  const SIG_A = 'h0:flop:0:0:100:3:0'
  const SIG_B = 'h0:turn:0:0:140:4:0'

  it('starts empty', () => {
    const s = initialDrillSession()
    expect(s).toMatchObject({ decisions: 0, firstTryCorrect: 0, xp: 0 })
    expect(drillAccuracyPct(s.firstTryCorrect, s.decisions)).toBe(0)
  })

  it('a first-try sound decision counts as correct and earns the larger XP', () => {
    const s = recordDrillResult(initialDrillSession(), SIG_A, 'sound')
    expect(s.decisions).toBe(1)
    expect(s.firstTryCorrect).toBe(1)
    expect(s.xp).toBe(XP_DRILL_FIRST_TRY)
    expect(drillAccuracyPct(s.firstTryCorrect, s.decisions)).toBe(100)
  })

  it('a mistake then a sound retry on the SAME spot is one decision, not first-try', () => {
    let s = initialDrillSession()
    s = recordDrillResult(s, SIG_A, 'mistake') // nudge: held on the spot
    expect(s.decisions).toBe(0)
    expect(s.spotHadMistake).toBe(true)
    s = recordDrillResult(s, SIG_A, 'sound') // rethink → sound
    expect(s.decisions).toBe(1)
    expect(s.firstTryCorrect).toBe(0)
    expect(s.xp).toBe(XP_DRILL_AFTER_RETHINK)
    expect(drillAccuracyPct(s.firstTryCorrect, s.decisions)).toBe(0)
  })

  it('tracks best-on-first-try % across multiple spots', () => {
    let s = initialDrillSession()
    s = recordDrillResult(s, SIG_A, 'sound') // first try ✓
    s = recordDrillResult(s, SIG_B, 'mistake') // new spot, slips
    s = recordDrillResult(s, SIG_B, 'sound') // rethinks → sound
    expect(s.decisions).toBe(2)
    expect(s.firstTryCorrect).toBe(1)
    expect(drillAccuracyPct(s.firstTryCorrect, s.decisions)).toBe(50)
    expect(s.xp).toBe(XP_DRILL_FIRST_TRY + XP_DRILL_AFTER_RETHINK)
  })

  it('caps session XP so it cannot be farmed', () => {
    let s = initialDrillSession()
    for (let i = 0; i < 50; i += 1) {
      s = recordDrillResult(s, `spot-${i}`, 'sound') // each a fresh first-try spot
    }
    expect(s.xp).toBe(XP_DRILL_SESSION_CAP)
    expect(s.xp).toBeLessThan(50 * XP_DRILL_FIRST_TRY)
  })
})
