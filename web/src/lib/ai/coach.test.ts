/**
 * Rule-based deep read ("Ask the coach for more"), tested with AI OFF: it must
 * compute and explain the table, pot odds, outs -> equity, the EV of calling, and
 * a recommendation, and it must respect "playing the board".
 */
import { describe, expect, it } from 'vitest'
import {
  buildDeepCoachPrompt,
  composeDeepRead,
  computeDeepReadNumbers,
  roughWinPct,
  type DeepCoachContext,
} from './coach'
import { analyzeSpot } from '../poker/hints'

function deepContext(partial: Partial<DeepCoachContext>): DeepCoachContext {
  return {
    hole: ['AS', 'KS'],
    board: ['KD', '7C', '2D'],
    street: 'flop',
    pot: 120,
    toCall: 40,
    heroStack: 460,
    opponentsInHand: 1,
    legalActions: [{ action: 'fold' }, { action: 'call' }, { action: 'raise', min: 80, max: 460 }],
    position: 'ip',
    bigBlind: 10,
    seats: [
      { name: 'You', isHero: true, stack: 460, committed: 40, inHand: true },
      { name: 'Sticky Pete', isHero: false, persona: 'a calling station', stack: 380, committed: 40, inHand: true },
    ],
    ...partial,
  }
}

function read(ctx: DeepCoachContext): string {
  return composeDeepRead(ctx, analyzeSpot({
    hole: ctx.hole,
    board: ctx.board,
    street: ctx.street,
    pot: ctx.pot,
    toCall: ctx.toCall,
  }))
}

describe('composeDeepRead — rule-based table + math breakdown', () => {
  it('explains the table, pot odds, EV, and a recommendation for a top-pair call', () => {
    const text = read(deepContext({}))
    // Whole-table awareness.
    expect(text).toContain('Sticky Pete')
    expect(text.toLowerCase()).toContain('in position')
    // The math is shown, not just a one-liner.
    expect(text).toContain('pot odds 25%')
    expect(text.toLowerCase()).toContain('ev of calling')
    expect(text.toLowerCase()).toContain('pair of kings')
    // 50% to win the 120 pot, risking 40 -> +40 EV, so a call is justified.
    expect(text.toLowerCase()).toContain('a call is justified')
  })

  it('counts outs and equity for a flush draw and prices the call', () => {
    const text = read(
      deepContext({ hole: ['AS', 'KS'], board: ['QS', '7S', '2D'], pot: 100, toCall: 40 }),
    )
    expect(text.toLowerCase()).toContain('flush draw')
    expect(text).toMatch(/about 9/i) // 9 outs
    expect(text.toLowerCase()).toContain('a call is justified')
  })

  it('reads a combined flush + straight draw as a combo with the union out count', () => {
    // 9H 8H on 7H 6S 2H is a flush draw + open-ender — 15 union outs, not a 15-out
    // "straight draw". The deep read must surface the combo label and the right count.
    const text = read(
      deepContext({ hole: ['9H', '8H'], board: ['7H', '6S', '2H'], pot: 100, toCall: 40 }),
    )
    expect(text.toLowerCase()).toContain('flush draw + straight draw')
    expect(text).toMatch(/about 15/i)
    expect(text.toLowerCase()).toContain('a call is justified')
  })

  it('does not sell a shared board pair and recommends folding to a big bet', () => {
    const text = read(
      deepContext({
        hole: ['7C', '2D'],
        board: ['3H', '3D', '9C', 'KS', '5D'],
        street: 'river',
        pot: 100,
        toCall: 60,
      }),
    )
    expect(text.toLowerCase()).toContain('shared by everyone')
    expect(text.toLowerCase()).toContain('folding is likely best')
  })

  it('with no bet to call, recommends value betting a strong made hand', () => {
    const text = read(
      deepContext({
        hole: ['KD', 'KC'],
        board: ['KS', '9D', '2C'],
        street: 'flop',
        pot: 60,
        toCall: 0,
        legalActions: [{ action: 'check' }, { action: 'bet', min: 10, max: 460 }],
      }),
    )
    expect(text.toLowerCase()).toContain('no bet to call')
    expect(text.toLowerCase()).toContain('bet for value')
  })
})

describe('roughWinPct — pairs are tiered, not a flat 50%', () => {
  function analysisFor(ctx: DeepCoachContext) {
    return analyzeSpot({
      hole: ctx.hole,
      board: ctx.board,
      street: ctx.street,
      pot: ctx.pot,
      toCall: ctx.toCall,
    })
  }

  it('rates a weak bottom pair well below a coin flip', () => {
    const ctx = deepContext({ hole: ['4S', '7D'], board: ['KH', '9D', '4C'], pot: 100, toCall: 50 })
    const a = analysisFor(ctx)
    expect(a.madeCategory).toBe('pair')
    expect(roughWinPct(ctx, a)).toBeLessThan(45)
  })

  it('still rates top pair with a strong kicker as a favorite', () => {
    const ctx = deepContext({ hole: ['AS', 'KD'], board: ['KH', '9D', '4C'], pot: 100, toCall: 50 })
    const a = analysisFor(ctx)
    expect(a.madeCategory).toBe('pair')
    expect(roughWinPct(ctx, a)).toBeGreaterThanOrEqual(55)
  })

  it('no longer endorses a loose bottom-pair call the old flat 50% would have', () => {
    // 50 into 100 lays a 33% price. A flat-50% pair "calls"; a tiered bottom pair (~32%)
    // correctly folds.
    const ctx = deepContext({ hole: ['4S', '7D'], board: ['KH', '9D', '4C'], pot: 100, toCall: 50 })
    const text = composeDeepRead(ctx, analysisFor(ctx))
    expect(text.toLowerCase()).toContain('folding is likely best')
  })
})

describe('buildDeepCoachPrompt — the LLM only PHRASES pre-computed numbers', () => {
  function analysisFor(ctx: DeepCoachContext) {
    return analyzeSpot({
      hole: ctx.hole,
      board: ctx.board,
      street: ctx.street,
      pot: ctx.pot,
      toCall: ctx.toCall,
    })
  }

  it('embeds the deterministic numbers and forbids the model from recomputing them', () => {
    const ctx = deepContext({}) // AS KS on KD 7C 2D, pot 120, to call 40
    const nums = computeDeepReadNumbers(ctx, analysisFor(ctx))
    const prompt = buildDeepCoachPrompt(ctx, analysisFor(ctx))

    // Pot odds is the EXACT price (it is real arithmetic, not a guess).
    expect(nums.potOddsPct).toBe(25)
    expect(prompt).toContain('Pot odds (exact price to call): 25%')

    // Equity is given as a rough BAND, never a single false-precision figure.
    expect(prompt).toContain(`about ${nums.equityLowPct}-${nums.equityHighPct}%`)

    // EV is pre-computed and clearly labelled rough, with a range.
    expect(prompt.toLowerCase()).toContain('ev of calling (rough estimate, not exact)')
    expect(prompt).toContain(`around +${nums.evChips} chips per call`)

    // The model must phrase, not recompute.
    expect(prompt.toLowerCase()).toContain('do not recalculate or change them')
    expect(prompt.toLowerCase()).toContain('do not recompute or change them')
    expect(prompt.toLowerCase()).toContain('do not invent more precise figures')

    // The deterministic recommendation is handed in so AI-on agrees with AI-off.
    expect(prompt.toLowerCase()).toContain('a call is justified')
  })

  it('marks pot odds and EV not applicable when there is no bet to call', () => {
    const ctx = deepContext({
      hole: ['KD', 'KC'],
      board: ['KS', '9D', '2C'],
      street: 'flop',
      pot: 60,
      toCall: 0,
      legalActions: [{ action: 'check' }, { action: 'bet', min: 10, max: 460 }],
    })
    const prompt = buildDeepCoachPrompt(ctx, analysisFor(ctx))
    expect(prompt).toContain('Pot odds: not applicable (no bet to call)')
    expect(prompt).toContain('EV of calling: not applicable (no bet to call)')
    expect(prompt.toLowerCase()).toContain('bet for value')
  })
})
