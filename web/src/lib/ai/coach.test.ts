/**
 * Rule-based deep read ("Ask the coach for more"), tested with AI OFF: it must
 * compute and explain the table, pot odds, outs -> equity, the EV of calling, and
 * a recommendation, and it must respect "playing the board".
 */
import { describe, expect, it } from 'vitest'
import { composeDeepRead, type DeepCoachContext } from './coach'
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
