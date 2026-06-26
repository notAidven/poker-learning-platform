/**
 * Integration smoke tests for the casino-table runtime glue, run entirely with AI
 * DISABLED (Firebase AI Logic is not provisioned in the test env, so
 * `isAIConfigured()` is false). These prove a full hand plays start to finish using
 * only the rule-based strategy:
 *
 *  - Feature 1 (coached): opponents decide via the synchronous `decideRuleAction`.
 *  - Feature 2 (ai): opponents decide via the INJECTED Tier-3 fallback
 *    (`makeTier3Fallback` + `buildLLMContext`) — exactly what `decideWithLLM`
 *    returns when AI is off.
 *
 * Each hand is driven by a passive hero (check/call) so it reaches showdown, and
 * we assert chip conservation, a correctly dealt board/burns, and a real side pot.
 */
import { describe, expect, it } from 'vitest'
import {
  applyAction,
  createHand,
  legalActions,
  runShowdown,
  settle,
  type AppliedAction,
  type HandState,
} from '../../lib/poker/handEngine'
import { getTable } from '../../data/tables'
import {
  buildLLMContext,
  composeCoachReaction,
  createInitialHand,
  createNextHand,
  decideRuleAction,
  finalizeHand,
  groupHandLog,
  liveOpponents,
  makeTier3Fallback,
  positionFor,
  roleFor,
  summarizeHand,
  toRuntimeConfig,
  type TableRuntimeConfig,
} from './tableRuntime'
import type { SpotAnalysis } from '../../lib/poker/hints'

const COACHED_CFG: TableRuntimeConfig = {
  tableId: 't',
  title: 'Test',
  feature: 'coached',
  opponentSource: 'rule',
  tier: 3,
  support: 'coach',
  opponents: [{ name: 'A' }, { name: 'B' }],
  smallBlind: 5,
  bigBlind: 10,
  startingStack: 500,
}

/** Real chips in play = chips behind + the live pot. */
function chipsInPlay(state: HandState): number {
  return state.seats.reduce((n, s) => n + s.stack, 0) + state.pot
}

/** Passive hero: check when free, call when cheap, otherwise fold. */
function passiveHero(state: HandState): AppliedAction {
  const legal = legalActions(state)
  if (legal.some((a) => a.action === 'check')) return { action: 'check' }
  if (legal.some((a) => a.action === 'call')) return { action: 'call' }
  return { action: 'fold' }
}

type Decider = (state: HandState, seatIndex: number) => AppliedAction

/** Drive a hand to the point where no one is left to act (showdown or all-but-one folded). */
function playToEnd(start: HandState, opponentDecide: Decider): HandState {
  let state = start
  let guard = 0
  while (state.toActIndex != null && guard++ < 1000) {
    const idx = state.toActIndex
    const seat = state.seats[idx]
    const applied = seat.isHero ? passiveHero(state) : opponentDecide(state, idx)
    state = applyAction(state, applied)
  }
  return state
}

const COACHED_OPPONENT: Decider = (state, idx) => decideRuleAction(state, idx, 3).applied

/** The exact AI-off Feature-2 path: validate-and-clamp falls back to Tier-3 rule AI. */
const AI_FALLBACK_OPPONENT: Decider = (state, idx) => {
  const fallback = makeTier3Fallback(state, idx)
  const decision = fallback(buildLLMContext(state, idx, 'a tough regular'))
  return { action: decision.action, amount: decision.amount }
}

describe('casino table runtime — AI disabled', () => {
  it('plays a full coached hand to completion and conserves chips', () => {
    const start = createHand({
      seats: [
        { id: 'hero', name: 'You', isHero: true, stack: 500 },
        { id: 'opp-0', name: 'Sticky Pete', isHero: false, stack: 500 },
        { id: 'opp-1', name: 'Lucky Lou', isHero: false, stack: 500 },
      ],
      buttonIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      seed: 4242,
    })

    // Blinds posted + hole cards dealt at the start.
    expect(start.pot).toBe(15)
    expect(start.seats.every((s) => s.holeCards !== null)).toBe(true)
    const startingChips = chipsInPlay(start)

    const ended = playToEnd(start, COACHED_OPPONENT)
    expect(ended.toActIndex).toBeNull()
    expect(['showdown', 'complete']).toContain(ended.phase)

    const settled = settle(ended)
    const finalChips = settled.seats.reduce((n, s) => n + s.stack, 0)
    expect(finalChips).toBe(startingChips)
    // Someone ends with more than zero; nobody goes negative.
    expect(settled.seats.every((s) => s.stack >= 0)).toBe(true)
  })

  it('plays a full Feature-2 hand via the injected Tier-3 fallback (no AI)', () => {
    const start = createHand({
      seats: [
        { id: 'hero', name: 'You', isHero: true, stack: 1000 },
        { id: 'opp-0', name: 'Ace', isHero: false, stack: 1000 },
      ],
      buttonIndex: 0,
      smallBlind: 10,
      bigBlind: 20,
      seed: 99,
    })
    const startingChips = chipsInPlay(start)

    const ended = playToEnd(start, AI_FALLBACK_OPPONENT)
    expect(ended.toActIndex).toBeNull()

    const settled = settle(ended)
    const finalChips = settled.seats.reduce((n, s) => n + s.stack, 0)
    expect(finalChips).toBe(startingChips)
  })

  it('builds a real side pot when a short stack is all-in (hero excluded from it)', () => {
    let state = createHand({
      seats: [
        { id: 'hero', name: 'You', isHero: true, stack: 50 },
        { id: 'opp-0', name: 'A', isHero: false, stack: 120 },
        { id: 'opp-1', name: 'B', isHero: false, stack: 200 },
      ],
      buttonIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      seed: 7,
    })
    const startingChips = chipsInPlay(state) // 50 + 120 + 200 = 370
    expect(startingChips).toBe(370)

    // Hero (first to act 3-handed) jams all-in for 50; A re-jams all-in for 120; B calls.
    expect(state.toActIndex).toBe(0)
    state = applyAction(state, { action: 'raise', amount: 50 })
    expect(state.seats[0].allIn).toBe(true)

    expect(state.toActIndex).toBe(1)
    state = applyAction(state, { action: 'raise', amount: 120 })
    expect(state.seats[1].allIn).toBe(true)

    expect(state.toActIndex).toBe(2)
    state = applyAction(state, { action: 'call' })

    // With everyone matched/all-in, the engine runs out the board to showdown.
    expect(state.toActIndex).toBeNull()
    expect(state.board).toHaveLength(5)
    expect(state.burns).toHaveLength(3)

    const { pots } = runShowdown(state)
    expect(pots).toHaveLength(2)
    // Main pot: everyone eligible. Side pot: only the two deeper stacks.
    expect(pots[0].eligibleSeatIds.sort()).toEqual(['hero', 'opp-0', 'opp-1'])
    expect(pots[1].eligibleSeatIds.sort()).toEqual(['opp-0', 'opp-1'])
    expect(pots[1].eligibleSeatIds).not.toContain('hero')
    expect(pots[0].amount).toBe(150) // 3 × 50
    expect(pots[1].amount).toBe(140) // 2 × 70

    const settled = settle(state)
    const finalChips = settled.seats.reduce((n, s) => n + s.stack, 0)
    expect(finalChips).toBe(startingChips)
  })

  it('exposes consistent position + opponent-count heuristics', () => {
    const state = createHand({
      seats: [
        { id: 'hero', name: 'You', isHero: true, stack: 200 },
        { id: 'opp-0', name: 'A', isHero: false, stack: 200 },
        { id: 'opp-1', name: 'B', isHero: false, stack: 200 },
      ],
      buttonIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      seed: 1,
    })
    // Button (index 0) is the last to act postflop → in position.
    expect(positionFor(state, 0)).toBe('ip')
    expect(positionFor(state, 1)).toBe('oop')
    // Two other players are still live for each seat preflop.
    expect(liveOpponents(state, 0)).toBe(2)
  })
})

describe('casino table runtime — hand lifecycle helpers', () => {
  it('maps each room to the right decision source + support mode', () => {
    const room1 = toRuntimeConfig(getTable('room-1')!)
    expect(room1.feature).toBe('coached')
    expect(room1.opponentSource).toBe('rule')
    expect(room1.support).toBe('coach')

    const room2 = toRuntimeConfig(getTable('room-2')!)
    expect(room2.feature).toBe('ai')
    expect(room2.opponentSource).toBe('llm')
    expect(room2.support).toBe('hints')
  })

  it('seats the hero first and posts blinds on the initial hand', () => {
    const hand = createInitialHand(COACHED_CFG, 123, 'Me')
    expect(hand.seats.map((s) => s.id)).toEqual(['hero', 'opp-0', 'opp-1'])
    expect(hand.seats[0].name).toBe('Me')
    expect(hand.seats[0].isHero).toBe(true)
    expect(hand.pot).toBe(15) // SB 5 + BB 10
    expect(hand.seats.every((s) => s.holeCards !== null)).toBe(true)
  })

  it('createNextHand drops busted seats and rotates the button to the next survivor', () => {
    const base = createInitialHand(COACHED_CFG, 5, 'You')
    // Carry stacks: hero + opp-0 survive, opp-1 is busted.
    const afterHand = {
      ...base,
      seats: base.seats.map((s) =>
        s.id === 'opp-1' ? { ...s, stack: 0 } : { ...s, stack: 300 },
      ),
    }
    const next = createNextHand(afterHand, COACHED_CFG)
    expect(next).not.toBeNull()
    expect(next!.seats.map((s) => s.id)).toEqual(['hero', 'opp-0'])
    expect(next!.seats.every((s) => s.stack > 0)).toBe(true)
    // Button was on the hero (index 0); it advances to the next survivor.
    expect(next!.buttonIndex).toBe(1)
    expect(next!.seed).not.toBe(afterHand.seed)
  })

  it('createNextHand returns null when fewer than two players remain', () => {
    const base = createInitialHand(COACHED_CFG, 9, 'You')
    const onlyHero = {
      ...base,
      seats: base.seats.map((s) => (s.isHero ? { ...s, stack: 400 } : { ...s, stack: 0 })),
    }
    expect(createNextHand(onlyHero, COACHED_CFG)).toBeNull()
  })

  it('finalizeHand settles a showdown but leaves a betting street untouched', () => {
    const preflop = createInitialHand(COACHED_CFG, 11, 'You')
    expect(finalizeHand(preflop)).toBe(preflop) // mid-hand: unchanged reference

    // Build a showdown via two heads-up all-ins.
    let hu = createHand({
      seats: [
        { id: 'hero', name: 'You', isHero: true, stack: 100 },
        { id: 'opp-0', name: 'A', isHero: false, stack: 100 },
      ],
      buttonIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      seed: 3,
    })
    const startingChips = hu.seats.reduce((n, s) => n + s.stack, 0) + hu.pot
    // Heads-up: button (hero) acts first preflop.
    hu = applyAction(hu, { action: 'raise', amount: 100 }) // hero all-in
    hu = applyAction(hu, { action: 'call' }) // opp calls all-in → run to showdown
    expect(hu.phase).toBe('showdown')

    const settled = finalizeHand(hu)
    expect(settled.phase).toBe('complete')
    expect(settled.seats.reduce((n, s) => n + s.stack, 0)).toBe(startingChips)
  })

  it('summarizeHand reads an uncontested pot and a showdown pot', () => {
    const base = createInitialHand(COACHED_CFG, 21, 'You')
    const uncontested = {
      ...base,
      pot: 30,
      seats: base.seats.map((s, i) => (i === 0 ? s : { ...s, folded: true })),
    }
    const sum = summarizeHand(uncontested)
    expect(sum.reachedShowdown).toBe(false)
    expect(sum.winnerIds).toEqual(['hero'])
    expect(sum.pots[0].amount).toBe(30)
  })

  it('labels seat roles for 3-handed and heads-up tables', () => {
    const threeHanded = createInitialHand(COACHED_CFG, 1, 'You')
    expect(roleFor(threeHanded, 0)).toBe('BTN')
    expect(roleFor(threeHanded, 1)).toBe('SB')
    expect(roleFor(threeHanded, 2)).toBe('BB')

    const headsUp = createHand({
      seats: [
        { id: 'hero', name: 'You', isHero: true, stack: 100 },
        { id: 'opp-0', name: 'A', isHero: false, stack: 100 },
      ],
      buttonIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      seed: 2,
    })
    expect(roleFor(headsUp, 0)).toBe('BTN') // button is the small blind heads-up
    expect(roleFor(headsUp, 1)).toBe('BB')
  })
})

describe('coach reaction (Room 1, rule-based, AI off)', () => {
  function analysis(partial: Partial<SpotAnalysis>): SpotAnalysis {
    return {
      street: 'flop',
      madeLabel: null,
      madeCategory: null,
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

  it('affirms a value raise with a strong made hand', () => {
    const text = composeCoachReaction(
      'raise',
      'raise',
      analysis({ madeCategory: 'two-pair', madeLabel: 'Two pair, Kings and Sevens' }),
    )
    expect(text.toLowerCase()).toContain('value')
    expect(text).toContain('two pair')
  })

  it('supports a disciplined fold the rules also like', () => {
    const text = composeCoachReaction('fold', 'fold', analysis({ facingBet: true }))
    expect(text.toLowerCase()).toContain('good fold')
  })

  it('gently flags a call the rules would fold (with the price)', () => {
    const text = composeCoachReaction(
      'call',
      'fold',
      analysis({ facingBet: true, potOddsPct: 40 }),
    )
    expect(text.toLowerCase()).toContain('loose')
    expect(text).toContain('40%')
  })

  it('always returns a non-empty, em-dash-free sentence', () => {
    for (const a of ['fold', 'check', 'call', 'bet', 'raise'] as const) {
      for (const r of ['fold', 'check', 'call', 'bet', 'raise'] as const) {
        const text = composeCoachReaction(a, r, analysis({}))
        expect(text.length).toBeGreaterThan(0)
        expect(text).not.toContain('\u2014')
      }
    }
  })
})

describe('hand log grouping', () => {
  it('groups a hand by street, drops dealing noise, and carries the board cards', () => {
    const log = [
      'You posts SB 5',
      'Villain posts BB 10',
      'Dealt You AS KS',
      'Dealt Villain two cards',
      'You raises to 30',
      'Villain calls 20',
      'Flop: 2H 7D KC',
      'Villain checks',
      'You bets 40',
      'Villain calls 40',
      'Turn: 9S',
      'Villain checks',
      'You checks',
      'River: 3C',
      'Villain checks',
      'You bets 80',
      'Villain folds',
      'You wins 200 (uncontested)',
    ]
    const groups = groupHandLog(log)
    expect(groups.map((g) => g.label)).toEqual(['Preflop', 'Flop', 'Turn', 'River', 'Result'])
    expect(groups[0].entries.every((e) => !e.startsWith('Dealt '))).toBe(true)
    expect(groups[1].cards).toBe('2H 7D KC')
    const result = groups.find((g) => g.label === 'Result')!
    expect(result.entries.some((e) => e.includes('wins 200'))).toBe(true)
  })
})
