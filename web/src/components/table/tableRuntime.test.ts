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
  buildDeepCoachContext,
  buildLLMContext,
  createInitialHand,
  createNextHand,
  decideRuleAction,
  finalizeHand,
  liveOpponents,
  makeTier3Fallback,
  opponentActionDelayMs,
  OPPONENT_PACING,
  positionFor,
  roleFor,
  summarizeHand,
  toCasinoRuntimeConfig,
  toRuntimeConfig,
  type TableRuntimeConfig,
} from './tableRuntime'
import {
  boardThreatOf,
  coachResultReaction,
  composeCoachReaction,
  composeCoachResultReaction,
  drillSpotSignature,
  gradeHeroDecision,
  groupHandLog,
  readPassiveThenAggressive,
  type HandResultRead,
} from './coachFeedback'
import type { SpotAnalysis } from '../../lib/poker/hints'
import { casinoTables } from '../../data/casinoTables'

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

  it('createNextHand advances the button off a busted button to the next survivor', () => {
    const base = createInitialHand(COACHED_CFG, 5, 'You') // hero(0), opp-0(1), opp-1(2)
    // Button was on opp-1, who then busts; hero + opp-0 survive.
    const afterHand: HandState = {
      ...base,
      buttonIndex: 2,
      seats: base.seats.map((s) => (s.id === 'opp-1' ? { ...s, stack: 0 } : { ...s, stack: 300 })),
    }
    const next = createNextHand(afterHand, COACHED_CFG)
    expect(next).not.toBeNull()
    expect(next!.seats.map((s) => s.id)).toEqual(['hero', 'opp-0'])
    // Advancing clockwise from the busted button (opp-1) lands on the hero — NOT the
    // seat-0 fallback the old findIndex(-1) bug produced (which gave opp-0).
    expect(next!.buttonIndex).toBe(0)
  })

  it('createNextHand skips multiple busted seats when rotating the button', () => {
    const four = createHand({
      seats: [
        { id: 'hero', name: 'You', isHero: true, stack: 300 },
        { id: 'opp-0', name: 'A', isHero: false, stack: 300 },
        { id: 'opp-1', name: 'B', isHero: false, stack: 300 },
        { id: 'opp-2', name: 'C', isHero: false, stack: 300 },
      ],
      buttonIndex: 1, // button on opp-0
      smallBlind: 5,
      bigBlind: 10,
      seed: 1,
    })
    // Button (opp-0) and the next seat (opp-1) both bust; hero + opp-2 survive.
    const afterHand: HandState = {
      ...four,
      buttonIndex: 1,
      seats: four.seats.map((s) =>
        s.id === 'opp-0' || s.id === 'opp-1' ? { ...s, stack: 0 } : { ...s, stack: 300 },
      ),
    }
    const next = createNextHand(afterHand, COACHED_CFG)
    expect(next).not.toBeNull()
    expect(next!.seats.map((s) => s.id)).toEqual(['hero', 'opp-2'])
    // From opp-0 → opp-1 (busted) → opp-2 (the next survivor) becomes the button.
    expect(next!.buttonIndex).toBe(1)
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

describe('decision drill — gated to Room 1 (coached) only', () => {
  it('toRuntimeConfig enables the drill on the coached room, not the AI room', () => {
    const room1 = getTable('room-1')
    const room2 = getTable('room-2')
    expect(room1).toBeDefined()
    expect(room2).toBeDefined()
    const r1 = toRuntimeConfig(room1!)
    const r2 = toRuntimeConfig(room2!)
    expect(r1.drill).toBe(true)
    expect(r1.support).toBe('coach')
    expect(r2.drill).toBeFalsy()
    expect(r2.support).toBe('hints')
  })

  it('toCasinoRuntimeConfig never enables the drill (Casino Floor stays free play)', () => {
    expect(casinoTables.length).toBeGreaterThan(0)
    for (const t of casinoTables) {
      const cfg = toCasinoRuntimeConfig(t)
      expect(cfg.drill).toBeFalsy()
      expect(cfg.support).toBe('hints')
    }
  })
})

describe('decision drill — gradeHeroDecision (Room 1, rule-based, AI off)', () => {
  // A river spot where the hero holds two pair (Aces and Kings) made with their own
  // hole cards, facing a bet from the opponent. Built off a real dealt hand, then
  // overridden so the spot is deterministic.
  function strongRiverFacingBet(): HandState {
    const base = createHand({
      seats: [
        { id: 'hero', name: 'You', isHero: true, stack: 500 },
        { id: 'opp-0', name: 'Sticky Pete', isHero: false, stack: 500 },
      ],
      buttonIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      seed: 7,
    })
    return {
      ...base,
      phase: 'river',
      board: ['AS', 'KD', '7C', '2H', '9S'],
      pot: 240,
      currentBet: 80,
      minRaise: 80,
      streetRaiseCount: 1,
      toActIndex: 0,
      seats: base.seats.map((s, i) =>
        i === 0
          ? { ...s, holeCards: ['AH', 'KH'], committed: 0, stack: 500, folded: false, allIn: false, hasActed: false }
          : { ...s, holeCards: ['QS', 'QD'], committed: 80, folded: false, allIn: false },
      ),
    }
  }

  it('flags folding a very strong made hand as a mistake (with a hint)', () => {
    const grade = gradeHeroDecision(strongRiverFacingBet(), 0, { action: 'fold' })
    expect(grade.verdict).toBe('mistake')
    expect(grade.reason).toBe('fold-strong')
    expect(grade.message.length).toBeGreaterThan(0)
  })

  it('supports continuing with the strong hand (a call is accepted, leniently)', () => {
    const grade = gradeHeroDecision(strongRiverFacingBet(), 0, { action: 'call' })
    expect(grade.verdict).toBe('sound')
    expect(grade.message.length).toBeGreaterThan(0)
  })

  it('treats a non-gradeable spot (not the hero\u2019s turn) as sound', () => {
    const state = strongRiverFacingBet()
    const grade = gradeHeroDecision({ ...state, toActIndex: 1 }, 0, { action: 'fold' })
    expect(grade.verdict).toBe('sound')
  })
})

describe('drillSpotSignature', () => {
  it('is stable across a rethink and changes once the spot moves on', () => {
    const base = createHand({
      seats: [
        { id: 'hero', name: 'You', isHero: true, stack: 500 },
        { id: 'opp-0', name: 'A', isHero: false, stack: 500 },
      ],
      buttonIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      seed: 11,
    })
    const sig = drillSpotSignature(0, base, 0)
    // Same hand + index ⇒ identical signature (a rethink does not change the state).
    expect(drillSpotSignature(0, base, 0)).toBe(sig)
    // A different pot (the spot moved on) ⇒ a different signature.
    expect(drillSpotSignature(0, { ...base, pot: base.pot + 50 }, 0)).not.toBe(sig)
    // A new hand index ⇒ a different signature (namespaced per hand).
    expect(drillSpotSignature(1, base, 0)).not.toBe(sig)
  })
})

describe('result-aware end-of-hand reflection (Room 1, rule-based, AI off)', () => {
  function read(partial: Partial<HandResultRead>): HandResultRead {
    return {
      reachedShowdown: true,
      heroWon: false,
      bigPot: false,
      heroCategory: null,
      heroLabel: null,
      heroStrong: false,
      heroPlayedBoard: false,
      villainCategory: null,
      villainLabel: null,
      boardThreat: null,
      pricedIn: false,
      heroHadDraw: false,
      passiveThenAggressive: false,
      ...partial,
    }
  }

  // (a) The user's exact spot: a loose call into a completed flush holding one
  // pair, lost. Must be corrective + fold-suggesting, and must NOT say "good call".
  it('corrects a loose call into a completed flush (the reported bug)', () => {
    const text = composeCoachResultReaction(
      read({
        heroWon: false,
        bigPot: true,
        heroCategory: 'pair',
        heroLabel: 'Pair of Kings',
        heroStrong: false,
        villainCategory: 'flush',
        villainLabel: 'Flush, Ace-high',
        boardThreat: 'flush',
        pricedIn: false,
        heroHadDraw: false,
        passiveThenAggressive: true,
      }),
    )
    const lower = text.toLowerCase()
    expect(lower).toContain('consider folding')
    expect(lower).toContain('passive')
    expect(lower).toContain('flush')
    expect(lower).not.toContain('good call')
  })

  // (b) A well-priced draw that bricked is variance, not a leak — frame it positively
  // and never suggest folding it.
  it('frames a well-priced draw that bricked as variance, not a leak', () => {
    const text = composeCoachResultReaction(
      read({
        heroWon: false,
        heroCategory: 'high-card',
        heroLabel: 'Ace-high',
        pricedIn: true,
        heroHadDraw: true,
        boardThreat: null,
      }),
    )
    const lower = text.toLowerCase()
    expect(lower).toContain('variance')
    expect(lower).toContain('right price')
    expect(lower).not.toContain('consider folding')
    expect(lower).not.toContain('good call')
  })

  // (c) Winning with a strong made hand earns positive, value-oriented reinforcement.
  it('reinforces a win with a strong made hand', () => {
    const text = composeCoachResultReaction(
      read({
        heroWon: true,
        bigPot: true,
        heroCategory: 'two-pair',
        heroLabel: 'Two pair, Kings and Sevens',
        heroStrong: true,
      }),
    )
    const lower = text.toLowerCase()
    expect(lower).toContain('value')
    expect(text).toContain('two pair')
    expect(lower).not.toContain('consider folding')
  })

  // (d) A winning loose call gets a light "that one got there" nudge toward
  // selectivity — winning is not treated as proof the call was good.
  it('gives a winning loose call a light "got there" nudge', () => {
    const text = composeCoachResultReaction(
      read({
        heroWon: true,
        heroCategory: 'pair',
        heroLabel: 'Pair of Sixes',
        heroStrong: false,
        pricedIn: false,
        heroHadDraw: false,
      }),
    )
    const lower = text.toLowerCase()
    expect(lower).toContain('got there')
    expect(lower).toContain('selective')
    expect(lower).not.toContain('consider folding')
  })

  // Pedagogy guard: a well-priced call is never condemned just because a scary card
  // landed and it lost.
  it('does not condemn a well-priced call even when a scary draw completed', () => {
    const text = composeCoachResultReaction(
      read({
        heroWon: false,
        heroCategory: 'pair',
        heroLabel: 'Pair of Tens',
        villainCategory: 'flush',
        villainLabel: 'Flush, King-high',
        boardThreat: 'flush',
        pricedIn: true,
        heroHadDraw: true,
      }),
    )
    expect(text.toLowerCase()).toContain('variance')
    expect(text.toLowerCase()).not.toContain('consider folding')
  })

  // Losing with a genuinely strong hand reads as a cooler, not a leak.
  it('treats a strong hand that lost as a cooler, not a leak', () => {
    const text = composeCoachResultReaction(
      read({
        heroWon: false,
        heroCategory: 'trips',
        heroLabel: 'Three of a kind, Nines',
        heroStrong: true,
        villainCategory: 'flush',
        villainLabel: 'Flush, Queen-high',
        boardThreat: 'flush',
      }),
    )
    const lower = text.toLowerCase()
    expect(lower).toContain('cooler')
    expect(lower).not.toContain('consider folding')
  })

  it('congratulates taking a pot down without a showdown', () => {
    const text = composeCoachResultReaction(read({ reachedShowdown: false, heroWon: true }))
    expect(text.toLowerCase()).toContain('without a showdown')
    expect(text).not.toContain('\u2014')
  })

  it('never emits an empty or em-dash-laden recap across the result space', () => {
    const bool = [false, true]
    const threats = [null, 'flush', 'straight', 'board-pair'] as const
    for (const reachedShowdown of bool)
      for (const heroWon of bool)
        for (const heroStrong of bool)
          for (const pricedIn of bool)
            for (const heroHadDraw of bool)
              for (const passiveThenAggressive of bool)
                for (const boardThreat of threats) {
                  const text = composeCoachResultReaction(
                    read({
                      reachedShowdown,
                      heroWon,
                      heroStrong,
                      pricedIn,
                      heroHadDraw,
                      passiveThenAggressive,
                      boardThreat,
                      heroCategory: heroStrong ? 'two-pair' : 'pair',
                      heroLabel: heroStrong ? 'Two pair, Aces and Kings' : 'Pair of Kings',
                      villainCategory: 'flush',
                      villainLabel: 'Flush, Ace-high',
                    }),
                  )
                  expect(text.length).toBeGreaterThan(0)
                  expect(text).not.toContain('\u2014')
                }
  })

  it('reads completed-draw threats off the final board', () => {
    expect(boardThreatOf(['KS', '7H', '2H', '9H', '3C'])).toBe('flush') // 3 hearts
    expect(boardThreatOf(['9S', '8D', '7C', '6H', '2S'])).toBe('straight') // 4 to a straight
    expect(boardThreatOf(['KS', 'KD', '7C', '2H', '3S'])).toBe('board-pair') // paired board
    expect(boardThreatOf(['KS', 'QD', '7C', '2H'])).toBeNull() // dry, uncoordinated
  })

  it('detects a passive-then-aggressive opponent line from the hand log', () => {
    const passiveThenBet = [
      'You posts SB 5',
      'Villain posts BB 10',
      'Flop: KS 7H 2H',
      'Villain checks',
      'You bets 40',
      'Villain calls 40',
      'Turn: 9H',
      'Villain checks',
      'You checks',
      'River: 3C',
      'Villain bets 200',
      'You calls 200',
    ]
    expect(readPassiveThenAggressive(passiveThenBet, 'Villain')).toBe(true)

    const aggressorFromTheStart = [
      'Flop: KS 7H 2H',
      'Villain bets 40',
      'You calls 40',
      'Turn: 9H',
      'Villain bets 90',
    ]
    expect(readPassiveThenAggressive(aggressorFromTheStart, 'Villain')).toBe(false)
  })

  // End-to-end on a hand-engine state: hero calls a passive-then-big river bet with
  // one pair into a 3-flush board and loses → corrective recap (NOT "good call").
  it('produces a corrective recap from a finished hand state (heads-up, one pair vs a flush)', () => {
    const finalState: HandState = {
      seats: [
        {
          id: 'hero',
          name: 'You',
          isHero: true,
          stack: 230,
          committed: 0,
          totalCommitted: 270,
          holeCards: ['KC', 'QS'],
          folded: false,
          allIn: false,
          hasActed: true,
        },
        {
          id: 'opp-0',
          name: 'Villain',
          isHero: false,
          stack: 770,
          committed: 0,
          totalCommitted: 270,
          holeCards: ['AH', '5H'],
          folded: false,
          allIn: false,
          hasActed: true,
        },
      ],
      buttonIndex: 0,
      sb: 5,
      bb: 10,
      phase: 'complete',
      board: ['KS', '7H', '2H', '9H', '3C'],
      deck: [],
      burns: [],
      pot: 540,
      currentBet: 0,
      minRaise: 10,
      toActIndex: null,
      lastAggressorIndex: 1,
      seed: 1,
      log: [
        'You posts SB 5',
        'Villain posts BB 10',
        'Flop: KS 7H 2H',
        'Villain checks',
        'You bets 40',
        'Villain calls 40',
        'Turn: 9H',
        'Villain checks',
        'You checks',
        'River: 3C',
        'Villain bets 200',
        'You calls 200',
        'Villain wins 540',
      ],
    }

    // The hero really did lose this pot to a flush.
    const summary = summarizeHand(finalState)
    expect(summary.reachedShowdown).toBe(true)
    expect(summary.winnerIds).toEqual(['opp-0'])

    const text = coachResultReaction(finalState, 0)
    const lower = text.toLowerCase()
    expect(lower).toContain('consider folding')
    expect(lower).toContain('passive')
    expect(lower).toContain('flush')
    expect(lower).not.toContain('good call')
    expect(text).not.toContain('\u2014')
  })

  it('returns no recap when the hero folded earlier (the in-the-moment note stands)', () => {
    const base = createInitialHand(COACHED_CFG, 31, 'You')
    const heroFolded: HandState = {
      ...base,
      phase: 'complete',
      toActIndex: null,
      seats: base.seats.map((s) => (s.isHero ? { ...s, folded: true } : s)),
    }
    expect(coachResultReaction(heroFolded, 0)).toBe('')
  })
})

describe('board reading (Room 1 coach) — do not present a shared board hand as the hero\'s', () => {
  function analysis(partial: Partial<SpotAnalysis>): SpotAnalysis {
    return {
      street: 'river',
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

  it('the in-the-moment reaction does not call a board pair the hero plays a good call', () => {
    const shared = analysis({
      madeLabel: 'Pair of Threes',
      madeCategory: 'pair',
      madeFromHole: false,
      boardMadeLabel: 'Pair of Threes',
      facingBet: true,
      potOddsPct: 30,
    })
    const text = composeCoachReaction('call', 'call', shared).toLowerCase()
    expect(text).toContain('on the board')
    expect(text).toContain('high-card')
    expect(text).not.toContain('good call')
  })

  it('still affirms a pair the hero actually made with a hole card', () => {
    const real = analysis({ madeLabel: 'Pair of Kings', madeCategory: 'pair', madeFromHole: true })
    const text = composeCoachReaction('call', 'call', real).toLowerCase()
    expect(text).toContain('good call')
    expect(text).not.toContain('on the board')
  })

  it('the end-of-hand recap names a shared board hand instead of mourning it', () => {
    const text = composeCoachResultReaction({
      reachedShowdown: true,
      heroWon: false,
      bigPot: true,
      heroCategory: 'pair',
      heroLabel: 'Pair of Threes',
      heroStrong: false,
      heroPlayedBoard: true,
      villainCategory: 'pair',
      villainLabel: 'Pair of Aces',
      boardThreat: 'board-pair',
      pricedIn: false,
      heroHadDraw: false,
      passiveThenAggressive: false,
    }).toLowerCase()
    expect(text).toContain('on the board')
    expect(text).toContain('shared by everyone')
    expect(text).not.toContain('good call')
  })

  it('buildDeepCoachContext captures the whole table (seats, personas, stacks, position)', () => {
    const hand = createInitialHand(COACHED_CFG, 77, 'You')
    const ctx = buildDeepCoachContext(hand, 0, (id) => (id === 'opp-0' ? 'a calling station' : undefined))
    expect(ctx.seats).toHaveLength(3)
    expect(ctx.seats[0].isHero).toBe(true)
    expect(ctx.seats.find((s) => s.name === 'A')?.persona).toBe('a calling station')
    expect(ctx.bigBlind).toBe(10)
    expect(['ip', 'oop']).toContain(ctx.position)
    expect(ctx.seats.every((s) => s.inHand)).toBe(true)
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

// Opponent action pacing (presentation timing only). Pure + deterministic: the
// delay before an AI action is applied depends only on whether the hero is still
// in the hand and the reduced-motion preference — never on the decision itself.
describe('opponentActionDelayMs (AI pacing)', () => {
  it('gives a deliberate ~1s thinking beat while the hero is still in the hand', () => {
    const d = opponentActionDelayMs({ heroInHand: true, reduceMotion: false })
    expect(d).toBe(OPPONENT_PACING.heroIn)
    // A natural "~1s" feel: between 900ms and 1.2s.
    expect(d).toBeGreaterThanOrEqual(900)
    expect(d).toBeLessThanOrEqual(1200)
  })

  it('keeps a shorter, but still functional, beat under reduced motion (hero in)', () => {
    const reduced = opponentActionDelayMs({ heroInHand: true, reduceMotion: true })
    expect(reduced).toBe(OPPONENT_PACING.heroInReduced)
    // Still a real delay you can follow, just shorter than the full beat.
    expect(reduced).toBeGreaterThan(0)
    expect(reduced).toBeLessThan(opponentActionDelayMs({ heroInHand: true, reduceMotion: false }))
  })

  it('resolves AI-vs-AI quickly once the hero has folded (out of the hand)', () => {
    const folded = opponentActionDelayMs({ heroInHand: false, reduceMotion: false })
    expect(folded).toBe(OPPONENT_PACING.heroOut)
    // Much snappier than the hero-in pacing so the user is not left waiting.
    expect(folded).toBeLessThan(opponentActionDelayMs({ heroInHand: true, reduceMotion: false }))
    expect(folded).toBeLessThan(opponentActionDelayMs({ heroInHand: true, reduceMotion: true }))
    // Reduced motion does not slow down the out-of-hand resolution.
    expect(opponentActionDelayMs({ heroInHand: false, reduceMotion: true })).toBe(folded)
  })
})
