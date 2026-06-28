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
  isWetBoard,
  recordDrillResult,
  startingHandCode,
  type DrillSpot,
} from './decisionDrill'
import type { SpotAnalysis } from './hints'
import {
  XP_DRILL_AFTER_RETHINK,
  XP_DRILL_FIRST_TRY,
  XP_DRILL_SESSION_CAP,
  drillAccuracyPct,
} from '../gamification'
import type { CardId } from '../../types/lesson'
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

/** Build two hole cards from a hand code like 'AA' | 'AKs' | 'T6o' (for readable tests). */
function hand(code: string): [CardId, CardId] {
  const toRank = (c: string) => (c === 'T' ? '10' : c)
  const r1 = toRank(code[0])
  const r2 = toRank(code[1])
  if (code.length === 2) return [`${r1}S`, `${r2}H`] // a pair (offsuit by construction)
  return code[2] === 's' ? [`${r1}S`, `${r2}S`] : [`${r1}S`, `${r2}H`]
}

/** A preflop spot helper: defaults to a deep (50bb) all-in commitment. */
function preflopSpot(partial: Partial<DrillSpot> & { hole: [CardId, CardId] }): DrillSpot {
  return spot({
    analysis: analysis({ street: 'preflop' }),
    toCall: 10,
    pot: 15,
    currentBet: 10,
    bb: 10,
    effectiveStack: 500,
    commitFraction: 1,
    ...partial,
  })
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

// ===========================================================================
// Lesson-grounded coverage matrix — (action) x (street) x (concept).
// ===========================================================================

describe('startingHandCode + isWetBoard helpers', () => {
  it('encodes pairs, suited, and offsuit hands like the lessons', () => {
    expect(startingHandCode(hand('AA'))).toBe('AA')
    expect(startingHandCode(['AS', 'KS'])).toBe('AKs')
    expect(startingHandCode(['10S', '6D'])).toBe('T6o')
    expect(startingHandCode(['6D', '10S'])).toBe('T6o') // order independent
  })

  it('reads a connected / two-suit board as wet and a rainbow as dry', () => {
    expect(isWetBoard(['9H', '8H', '7S'])).toBe(true) // connected + flush draw
    expect(isWetBoard(['9C', '8C', '7D'])).toBe(true) // adv-texture wet example
    expect(isWetBoard(['KS', '7H', '2D'])).toBe(false) // adv-texture dry rainbow
    expect(isWetBoard(['QC', '8D', '3S'])).toBe(false) // dry, disconnected
    expect(isWetBoard(['AS', 'KD', '9C'])).toBe(false) // two high cards, still dry
    expect(isWetBoard(['9C', '8C', '2D'])).toBe(true) // connected top + flush draw
  })
})

describe('decision drill grader — PREFLOP (ranges, premiums, push/fold)', () => {
  it('flags folding a premium before the flop (fold AA -> mistake)', () => {
    for (const code of ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']) {
      const g = gradeDrillDecision(
        { action: 'fold' },
        preflopSpot({ hole: hand(code), toCall: 20, currentBet: 30, commitFraction: 0 }),
      )
      expect(g.verdict, code).toBe('mistake')
      expect(g.reason, code).toBe('fold-premium')
    }
  })

  it('accepts folding trash to a raise (the lesson-correct fold of 7-2o / T6o)', () => {
    for (const code of ['72o', 'T6o', 'J4o']) {
      const g = gradeDrillDecision(
        { action: 'fold' },
        preflopSpot({ hole: hand(code), toCall: 20, currentBet: 30, commitFraction: 0 }),
      )
      expect(g.verdict, code).toBe('sound')
    }
  })

  it('flags limping (flat-calling, no raise yet) a premium as too passive', () => {
    const g = gradeDrillDecision(
      { action: 'call' },
      preflopSpot({ hole: hand('AA'), toCall: 10, currentBet: 10, commitFraction: 0.02 }),
    )
    expect(g.verdict).toBe('mistake')
    expect(g.reason).toBe('limp-premium')
  })

  it('accepts calling a RAISE with a premium (not a limp; calling is lenient)', () => {
    const g = gradeDrillDecision(
      { action: 'call' },
      preflopSpot({ hole: hand('AA'), toCall: 20, currentBet: 30, commitFraction: 0.06 }),
    )
    expect(g.verdict).toBe('sound')
  })

  it('accepts a normal positional open (raise AKs to ~3bb) and a small open of any hand', () => {
    const ak = gradeDrillDecision(
      { action: 'raise', amount: 30 },
      preflopSpot({ hole: hand('AKs'), toCall: 10, currentBet: 10, commitFraction: 0.06 }),
    )
    expect(ak.verdict).toBe('sound')
    // A normal-sized open of a marginal hand is NOT punished (ranges are wide; lenient).
    const t6 = gradeDrillDecision(
      { action: 'raise', amount: 30 },
      preflopSpot({ hole: hand('T6o'), toCall: 10, currentBet: 10, commitFraction: 0.06 }),
    )
    expect(t6.verdict).toBe('sound')
  })

  it('flags a DEEP all-in with a weak hand (T6o / 72o / A7o jam 50bb -> mistake)', () => {
    for (const code of ['T6o', '72o', 'A7o', 'K5o', 'Q8o']) {
      const g = gradeDrillDecision(
        { action: 'raise', amount: 500 },
        preflopSpot({ hole: hand(code), effectiveStack: 500, bb: 10, commitFraction: 1 }),
      )
      expect(g.verdict, code).toBe('mistake')
      expect(g.reason, code).toBe('shove-weak')
    }
  })

  it('accepts a DEEP all-in with a premium (AA jam -> sound) and a real hand (99 -> sound)', () => {
    for (const code of ['AA', 'KK', 'AKs', '99']) {
      const g = gradeDrillDecision(
        { action: 'raise', amount: 500 },
        preflopSpot({ hole: hand(code), effectiveStack: 500, bb: 10, commitFraction: 1 }),
      )
      expect(g.verdict, code).toBe('sound')
    }
  })

  it('accepts a SHORT-stack jam across a wide range (adv-icm push/fold)', () => {
    // ~10bb on the button: any Ace (A7o), K9s, even a premium are all fine jams.
    for (const code of ['A7o', 'K9s', 'AA', 'KQo', '54s']) {
      const g = gradeDrillDecision(
        { action: 'raise', amount: 100 },
        preflopSpot({ hole: hand(code), effectiveStack: 100, bb: 10, commitFraction: 1 }),
      )
      expect(g.verdict, code).toBe('sound')
    }
  })

  it('still flags jamming pure trash even when short (outside the widest shove range)', () => {
    for (const code of ['T6o', '72o', '94o']) {
      const g = gradeDrillDecision(
        { action: 'raise', amount: 100 },
        preflopSpot({ hole: hand(code), effectiveStack: 100, bb: 10, commitFraction: 1 }),
      )
      expect(g.verdict, code).toBe('mistake')
      expect(g.reason, code).toBe('shove-weak')
    }
  })

  it('flags calling off a stack to a shove with trash, and accepts it with a premium', () => {
    const trash = gradeDrillDecision(
      { action: 'call' },
      preflopSpot({ hole: hand('72o'), toCall: 500, currentBet: 500, effectiveStack: 500, commitFraction: 1 }),
    )
    expect(trash.verdict).toBe('mistake')
    expect(trash.reason).toBe('shove-weak')

    const premium = gradeDrillDecision(
      { action: 'call' },
      preflopSpot({ hole: hand('AA'), toCall: 500, currentBet: 500, effectiveStack: 500, commitFraction: 1 }),
    )
    expect(premium.verdict).toBe('sound')
  })
})

describe('decision drill grader — POSTFLOP pot odds, implied odds, SPR (call grading)', () => {
  function drawCall(partial: Partial<SpotAnalysis>, spotPartial: Partial<DrillSpot> = {}) {
    return gradeDrillDecision(
      { action: 'call' },
      spot({
        analysis: analysis({ facingBet: true, ...partial }),
        toCall: 30,
        pot: 120,
        effectiveStack: 400,
        ...spotPartial,
      }),
    )
  }

  it('accepts calling a draw that is getting the right price (pot odds met)', () => {
    const g = drawCall({
      street: 'turn',
      drawName: 'flush draw',
      outs: 9,
      equityPct: 18,
      potOddsPct: 14,
      pricedIn: true,
    })
    expect(g.verdict).toBe('sound')
  })

  it('accepts an underpriced strong draw when DEEP (implied odds, high SPR)', () => {
    // 9-out flush draw, 18% vs a 33% price, but stacks are deep: implied odds keep it sound.
    const g = drawCall(
      { street: 'turn', drawName: 'flush draw', outs: 9, equityPct: 18, potOddsPct: 33, pricedIn: false },
      { toCall: 60, pot: 120, effectiveStack: 400 },
    )
    expect(g.verdict).toBe('sound')
  })

  it('flags an underpriced draw when SHORT (low SPR removes implied odds)', () => {
    // Same flush draw, but only 40 behind into an 80 pot (SPR 0.5): a clear fold.
    const g = drawCall(
      { street: 'turn', drawName: 'flush draw', outs: 9, equityPct: 18, potOddsPct: 33, pricedIn: false },
      { toCall: 40, pot: 80, effectiveStack: 40 },
    )
    expect(g.verdict).toBe('mistake')
    expect(g.reason).toBe('call-bad-odds')
  })

  it('flags calling an underpriced weak draw on the turn (gutshot ignoring pot odds)', () => {
    const g = drawCall(
      { street: 'turn', drawName: 'gutshot straight draw', outs: 4, equityPct: 8, potOddsPct: 23, pricedIn: false },
      { toCall: 30, pot: 100, effectiveStack: 400 },
    )
    expect(g.verdict).toBe('mistake')
    expect(g.reason).toBe('call-bad-odds')
  })

  it('flags calling a big bet drawing dead (no pair, no draw)', () => {
    const g = gradeDrillDecision(
      { action: 'call' },
      spot({
        analysis: analysis({ madeCategory: 'high-card', facingBet: true, bigBet: true }),
        toCall: 120,
        pot: 300,
        effectiveStack: 400,
      }),
    )
    expect(g.verdict).toBe('mistake')
    expect(g.reason).toBe('call-no-equity')
  })

  it('accepts a hero call with one pair facing a big bet (marginal, not punished)', () => {
    const g = gradeDrillDecision(
      { action: 'call' },
      spot({
        analysis: analysis({ madeCategory: 'pair', madeFromHole: true, facingBet: true, bigBet: true }),
        toCall: 80,
        pot: 200,
        effectiveStack: 400,
      }),
    )
    expect(g.verdict).toBe('sound')
  })
})

describe('decision drill grader — POSTFLOP board texture & value (bet/raise grading)', () => {
  it('flags betting pure air into a WET board (adv-texture: do not auto-c-bet air)', () => {
    const g = gradeDrillDecision(
      { action: 'bet', amount: 45 },
      spot({
        analysis: analysis({ street: 'flop', madeCategory: 'high-card' }),
        board: ['9C', '8C', '7D'],
        toCall: 0,
        currentBet: 0,
        pot: 60,
        sizingMin: 10,
        sizingMax: 400,
      }),
    )
    expect(g.verdict).toBe('mistake')
    expect(g.reason).toBe('bet-air-wet')
  })

  it('accepts c-betting air on a DRY board (a bluff keeps fold equity)', () => {
    const g = gradeDrillDecision(
      { action: 'bet', amount: 20 },
      spot({
        analysis: analysis({ street: 'flop', madeCategory: 'high-card' }),
        board: ['KS', '7H', '2D'],
        toCall: 0,
        currentBet: 0,
        pot: 60,
        sizingMin: 10,
        sizingMax: 400,
      }),
    )
    expect(g.verdict).toBe('sound')
  })

  it('accepts value betting / c-betting a strong hand on a wet board', () => {
    const g = gradeDrillDecision(
      { action: 'bet', amount: 45 },
      spot({
        analysis: analysis({ street: 'flop', madeCategory: 'trips', madeFromHole: true }),
        board: ['9C', '8C', '7D'],
        toCall: 0,
        currentBet: 0,
        pot: 60,
        sizingMin: 10,
        sizingMax: 400,
      }),
    )
    expect(g.verdict).toBe('sound')
  })

  it('accepts a semibluff bet of a draw on a wet board (a draw is not air)', () => {
    const g = gradeDrillDecision(
      { action: 'bet', amount: 45 },
      spot({
        analysis: analysis({ street: 'flop', drawName: 'flush draw', outs: 9, equityPct: 35 }),
        board: ['9C', '8C', '7D'],
        toCall: 0,
        currentBet: 0,
        pot: 60,
        sizingMin: 10,
        sizingMax: 400,
      }),
    )
    expect(g.verdict).toBe('sound')
  })
})

describe('decision drill grader — nudge copy stays in the coach voice', () => {
  it('every mistake returns a non-empty nudge with no em dashes', () => {
    // Collect one mistake of each reason and assert the nudge is clean.
    const grades = [
      gradeDrillDecision({ action: 'fold' }, preflopSpot({ hole: hand('AA'), commitFraction: 0, currentBet: 30, toCall: 20 })),
      gradeDrillDecision({ action: 'call' }, preflopSpot({ hole: hand('AA'), currentBet: 10, toCall: 10, commitFraction: 0.02 })),
      gradeDrillDecision({ action: 'raise', amount: 500 }, preflopSpot({ hole: hand('T6o') })),
      gradeDrillDecision(
        { action: 'call' },
        spot({ analysis: analysis({ madeCategory: 'high-card', facingBet: true, bigBet: true }), toCall: 120, pot: 300 }),
      ),
      gradeDrillDecision(
        { action: 'call' },
        spot({
          analysis: analysis({ street: 'turn', drawName: 'gutshot straight draw', outs: 4, equityPct: 8, potOddsPct: 23, pricedIn: false, facingBet: true }),
          toCall: 30,
          pot: 100,
          effectiveStack: 400,
        }),
      ),
      gradeDrillDecision(
        { action: 'raise', amount: 260 },
        spot({ analysis: analysis({ madeCategory: 'high-card', facingBet: true }), toCall: 80, currentBet: 80, pot: 260, sizingMin: 160, sizingMax: 500 }),
      ),
      gradeDrillDecision(
        { action: 'bet', amount: 45 },
        spot({ analysis: analysis({ street: 'flop', madeCategory: 'high-card' }), board: ['9C', '8C', '7D'], pot: 60, sizingMin: 10, sizingMax: 400 }),
      ),
      gradeDrillDecision(
        { action: 'fold' },
        spot({ analysis: analysis({ madeCategory: 'two-pair', madeFromHole: true, facingBet: true }), toCall: 60, pot: 180 }),
      ),
      gradeDrillDecision(
        { action: 'bet', amount: 10 },
        spot({ analysis: analysis({ madeCategory: 'two-pair', madeFromHole: true }), pot: 100, sizingMin: 5, sizingMax: 400 }),
      ),
    ]
    const seen = new Set<string>()
    for (const g of grades) {
      expect(g.verdict).toBe('mistake')
      expect(g.nudge.length).toBeGreaterThan(0)
      expect(g.nudge).not.toContain('\u2014') // no em dashes (coach voice)
      seen.add(g.reason)
    }
    // We exercised the full spread of mistake reasons.
    expect(seen).toEqual(
      new Set([
        'fold-premium',
        'limp-premium',
        'shove-weak',
        'call-no-equity',
        'call-bad-odds',
        'raise-trash',
        'bet-air-wet',
        'fold-strong',
        'bad-sizing',
      ]),
    )
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
