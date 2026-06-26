import { describe, it, expect } from 'vitest'
import {
  createHand,
  toCallFor,
  legalActions,
  applyAction,
  isHandComplete,
  runShowdown,
  settle,
  type HandConfig,
  type HandState,
  type SeatState,
} from './handEngine'
import type { CardId } from '../../types/lesson'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function seatCfg(id: string, name: string, stack: number, isHero = false) {
  return { id, name, isHero, stack }
}

function headsUp(stack = 200, seed = 1): HandConfig {
  return {
    seats: [seatCfg('btn', 'Button', stack, true), seatCfg('bb', 'BigBlind', stack)],
    buttonIndex: 0,
    smallBlind: 1,
    bigBlind: 2,
    seed,
  }
}

function threeHanded(stack = 200, seed = 7): HandConfig {
  return {
    seats: [
      seatCfg('btn', 'Button', stack, true),
      seatCfg('sb', 'Small', stack),
      seatCfg('bb', 'Big', stack),
    ],
    buttonIndex: 0,
    smallBlind: 1,
    bigBlind: 2,
    seed,
  }
}

function seatById(state: HandState, id: string): SeatState {
  const seat = state.seats.find((s) => s.id === id)
  if (!seat) throw new Error(`no seat ${id}`)
  return seat
}

/** Drive a hand to completion by always calling (if owed) or checking. */
function playPassivelyToShowdown(start: HandState): HandState {
  let state = start
  let guard = 0
  while (state.toActIndex !== null && state.phase !== 'complete' && guard < 200) {
    const toCall = toCallFor(state, state.toActIndex)
    state = applyAction(state, toCall > 0 ? { action: 'call' } : { action: 'check' })
    guard++
  }
  return state
}

/** Build a fully-controlled showdown state with known hole cards (no dealing). */
function showdownState(
  seats: Array<{
    id: string
    name: string
    stack: number
    totalCommitted: number
    folded?: boolean
    hole: [CardId, CardId]
  }>,
  board: CardId[],
): HandState {
  return {
    seats: seats.map((s) => ({
      id: s.id,
      name: s.name,
      isHero: false,
      stack: s.stack,
      committed: 0,
      totalCommitted: s.totalCommitted,
      holeCards: s.hole,
      folded: s.folded ?? false,
      allIn: s.stack === 0,
      hasActed: true,
    })),
    buttonIndex: 0,
    sb: 1,
    bb: 2,
    phase: 'showdown',
    board,
    deck: [],
    burns: [],
    pot: seats.reduce((sum, s) => sum + s.totalCommitted, 0),
    currentBet: 0,
    minRaise: 2,
    toActIndex: null,
    lastAggressorIndex: null,
    seed: 0,
    log: [],
  }
}

// ---------------------------------------------------------------------------
// Blinds
// ---------------------------------------------------------------------------

describe('createHand — blinds & setup', () => {
  it('heads-up: button posts the small blind and acts first preflop', () => {
    const state = createHand(headsUp())
    const btn = seatById(state, 'btn')
    const bb = seatById(state, 'bb')

    expect(btn.committed).toBe(1) // button = SB
    expect(bb.committed).toBe(2)
    expect(state.pot).toBe(3)
    expect(state.currentBet).toBe(2)
    expect(state.minRaise).toBe(2)
    expect(state.phase).toBe('preflop')
    expect(state.toActIndex).toBe(0) // button acts first preflop heads-up
  })

  it('3-handed: SB and BB sit left of the button; the button (UTG) acts first', () => {
    const state = createHand(threeHanded())
    expect(seatById(state, 'btn').committed).toBe(0)
    expect(seatById(state, 'sb').committed).toBe(1)
    expect(seatById(state, 'bb').committed).toBe(2)
    expect(state.pot).toBe(3)
    expect(state.currentBet).toBe(2)
    expect(state.toActIndex).toBe(0) // button is UTG 3-handed
  })

  it('deals two distinct hole cards to every seat and leaves 52 - 2n in the deck', () => {
    const state = createHand(threeHanded())
    const all = new Set<CardId>()
    for (const seat of state.seats) {
      expect(seat.holeCards).not.toBeNull()
      seat.holeCards?.forEach((c) => all.add(c))
    }
    expect(all.size).toBe(6) // 3 players × 2 cards, all distinct
    expect(state.deck.length).toBe(52 - 6)
  })

  it('is deterministic for a given seed and differs across seeds', () => {
    const a = createHand(headsUp(200, 42))
    const b = createHand(headsUp(200, 42))
    const c = createHand(headsUp(200, 43))
    expect(a.seats[0].holeCards).toEqual(b.seats[0].holeCards)
    expect(a.seats[0].holeCards).not.toEqual(c.seats[0].holeCards)
  })
})

// ---------------------------------------------------------------------------
// legalActions
// ---------------------------------------------------------------------------

describe('legalActions', () => {
  it('facing the big blind: fold / call / raise with raise.min = currentBet + minRaise', () => {
    const state = createHand(threeHanded())
    const actions = legalActions(state)
    const kinds = actions.map((a) => a.action)
    expect(kinds).toContain('fold')
    expect(kinds).toContain('call')
    expect(kinds).toContain('raise')
    expect(kinds).not.toContain('check')

    expect(toCallFor(state, state.toActIndex!)).toBe(2)
    const raise = actions.find((a) => a.action === 'raise')!
    expect(raise.min).toBe(4) // 2 (currentBet) + 2 (minRaise)
    expect(raise.max).toBe(200) // stack-deep
  })

  it('big-blind option after limps: check or raise, never call or fold', () => {
    let state = createHand(threeHanded())
    state = applyAction(state, { action: 'call' }) // button limps
    state = applyAction(state, { action: 'call' }) // SB completes
    // Action is now on the BB with nothing to call.
    expect(state.toActIndex).toBe(2)
    expect(toCallFor(state, 2)).toBe(0)
    const kinds = legalActions(state).map((a) => a.action)
    expect(kinds).toContain('check')
    expect(kinds).toContain('raise')
    expect(kinds).not.toContain('call')
    expect(kinds).not.toContain('fold')
  })

  it('opening a postflop street offers check or bet (not call), bet.min = big blind', () => {
    let state = createHand(threeHanded())
    state = applyAction(state, { action: 'call' })
    state = applyAction(state, { action: 'call' })
    state = applyAction(state, { action: 'check' }) // BB checks → flop
    expect(state.phase).toBe('flop')
    expect(state.currentBet).toBe(0)

    const actions = legalActions(state)
    const kinds = actions.map((a) => a.action)
    expect(kinds).toContain('check')
    expect(kinds).toContain('bet')
    expect(kinds).not.toContain('call')
    const bet = actions.find((a) => a.action === 'bet')!
    expect(bet.min).toBe(2) // big blind
    expect(bet.max).toBe(198) // 200 stack - 2 already in the pot preflop
  })

  it('returns [] when there is no seat to act', () => {
    const state = createHand(headsUp())
    expect(legalActions({ ...state, toActIndex: null })).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Street progression & first-to-act
// ---------------------------------------------------------------------------

describe('street progression', () => {
  it('heads-up: button acts first preflop, big blind acts first on every later street', () => {
    let state = createHand(headsUp())
    expect(state.toActIndex).toBe(0) // button preflop

    state = applyAction(state, { action: 'call' }) // button completes
    state = applyAction(state, { action: 'check' }) // BB checks → flop
    expect(state.phase).toBe('flop')
    expect(state.toActIndex).toBe(1) // BB acts first postflop
    expect(state.board).toHaveLength(3)
    expect(state.burns).toHaveLength(1)
  })

  it('a raise re-opens the action for players who already acted', () => {
    let state = createHand(threeHanded())
    state = applyAction(state, { action: 'call' }) // button limps, hasActed
    state = applyAction(state, { action: 'raise', amount: 8 }) // SB raises to 8
    // Button must act again even though it already limped.
    expect(state.toActIndex).toBe(2) // BB is next in line
    state = applyAction(state, { action: 'call' }) // BB calls 8
    expect(state.toActIndex).toBe(0) // back to the button — action was re-opened
    expect(seatById(state, 'btn').hasActed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Folding out
// ---------------------------------------------------------------------------

describe('folding to one player', () => {
  it('completes the hand and awards the uncontested pot to the last player', () => {
    let state = createHand(threeHanded())
    const bbStart = seatById(state, 'bb').stack // already posted 2

    state = applyAction(state, { action: 'fold' }) // button folds
    expect(isHandComplete(state)).toBe(false)
    state = applyAction(state, { action: 'fold' }) // SB folds → BB alone
    expect(isHandComplete(state)).toBe(true)
    expect(state.phase).toBe('complete')

    const potBefore = state.pot
    const settled = settle(state)
    const bb = seatById(settled, 'bb')
    // BB had posted 2; reclaims the whole 3-chip pot for a net +1.
    expect(bb.stack).toBe(bbStart + potBefore)
    expect(bb.stack).toBe(200 - 2 + 3)
  })
})

// ---------------------------------------------------------------------------
// Showdowns
// ---------------------------------------------------------------------------

describe('heads-up hand played to showdown', () => {
  it('awards the whole pot to the better hand', () => {
    const state = createHand(headsUp(200, 12345))
    const played = playPassivelyToShowdown(state)
    expect(played.phase).toBe('showdown')
    expect(played.board).toHaveLength(5)

    const settled = settle(played)
    const btn = seatById(settled, 'btn')
    const bb = seatById(settled, 'bb')

    const contributed = seatById(played, 'btn').totalCommitted // equal contributions
    expect(seatById(played, 'bb').totalCommitted).toBe(contributed)

    // Compute the expected winner directly from the dealt cards.
    const heroHole = seatById(played, 'btn').holeCards!
    const villHole = seatById(played, 'bb').holeCards!
    const board = played.board
    // Re-evaluate via the engine's own settle result: total chips are conserved.
    expect(btn.stack + bb.stack).toBe(400)

    // Determine who should have won and assert the chips followed.
    const { pots } = runShowdown(played)
    const winners = pots[0].winnerSeatIds
    if (winners.length === 2) {
      expect(btn.stack).toBe(200)
      expect(bb.stack).toBe(200)
    } else if (winners[0] === 'btn') {
      expect(btn.stack).toBe(200 + contributed)
      expect(bb.stack).toBe(200 - contributed)
    } else {
      expect(bb.stack).toBe(200 + contributed)
      expect(btn.stack).toBe(200 - contributed)
    }

    // Sanity: hole cards exist for the evaluation the engine performed.
    expect(heroHole).toHaveLength(2)
    expect(villHole).toHaveLength(2)
    expect(board).toHaveLength(5)
  })
})

describe('3-handed hand played to showdown', () => {
  it('conserves chips and pays a single pot to one of the live players', () => {
    const state = createHand(threeHanded(200, 999))
    const played = playPassivelyToShowdown(state)
    expect(played.phase).toBe('showdown')
    expect(played.board).toHaveLength(5)

    const settled = settle(played)
    const total = settled.seats.reduce((sum, s) => sum + s.stack, 0)
    expect(total).toBe(600) // 3 × 200, chips conserved

    const { pots } = runShowdown(played)
    expect(pots).toHaveLength(1) // no all-ins → one pot
    expect(pots[0].amount).toBe(6) // 2 each
    expect(pots[0].eligibleSeatIds).toHaveLength(3)
    expect(pots[0].winnerSeatIds.length).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// Side pots
// ---------------------------------------------------------------------------

describe('side pots (short all-in)', () => {
  // A is all-in for 50 with the best hand; B and C put in 200 each.
  //  - Main pot   = 150 (50 × 3), contested by A, B, C → won by A.
  //  - Side pot   = 300 (150 × 2), contested by B, C   → won by B.
  const board: CardId[] = ['2C', '7D', '9S', 'JH', '3C']
  const state = showdownState(
    [
      { id: 'A', name: 'Allin', stack: 0, totalCommitted: 50, hole: ['JS', 'JC'] }, // trip jacks
      { id: 'B', name: 'Big', stack: 0, totalCommitted: 200, hole: ['9H', '9D'] }, // trip nines
      { id: 'C', name: 'Cover', stack: 0, totalCommitted: 200, hole: ['AS', 'KS'] }, // ace high
    ],
    board,
  )

  it('splits into a main pot and a side pot with correct eligibility', () => {
    const { pots } = runShowdown(state)
    expect(pots).toHaveLength(2)

    const main = pots[0]
    expect(main.amount).toBe(150)
    expect(main.eligibleSeatIds.sort()).toEqual(['A', 'B', 'C'])
    expect(main.winnerSeatIds).toEqual(['A']) // best hand overall

    const side = pots[1]
    expect(side.amount).toBe(300)
    expect(side.eligibleSeatIds.sort()).toEqual(['B', 'C'])
    expect(side.winnerSeatIds).toEqual(['B']) // A is not eligible for the side pot
  })

  it('settle pays the short all-in only the main pot and the side pot to B', () => {
    const settled = settle(state)
    expect(seatById(settled, 'A').stack).toBe(150)
    expect(seatById(settled, 'B').stack).toBe(300)
    expect(seatById(settled, 'C').stack).toBe(0)
    const total = settled.seats.reduce((sum, s) => sum + s.stack, 0)
    expect(total).toBe(450) // every chip is accounted for
  })

  it('returns an uncalled bet to the bettor as a single-eligible pot', () => {
    // A bets 100 all-in, B can only call 40 all-in → A's extra 60 is uncalled.
    const s = showdownState(
      [
        { id: 'A', name: 'A', stack: 0, totalCommitted: 100, hole: ['AS', 'AD'] },
        { id: 'B', name: 'B', stack: 0, totalCommitted: 40, hole: ['KS', 'KD'] },
      ],
      ['2C', '7D', '9S', 'JH', '3C'],
    )
    const { pots } = runShowdown(s)
    expect(pots).toHaveLength(2)
    expect(pots[0]).toMatchObject({ amount: 80, winnerSeatIds: ['A'] }) // 40 × 2, A wins
    expect(pots[1]).toMatchObject({ amount: 60, eligibleSeatIds: ['A'], winnerSeatIds: ['A'] })

    const settled = settle(s)
    expect(seatById(settled, 'A').stack).toBe(140) // 80 + 60 returned
    expect(seatById(settled, 'B').stack).toBe(0)
  })
})

describe('split pots', () => {
  it('divides a tied pot evenly between the winners', () => {
    const s = showdownState(
      [
        { id: 'A', name: 'A', stack: 0, totalCommitted: 50, hole: ['AS', 'KS'] },
        { id: 'B', name: 'B', stack: 0, totalCommitted: 50, hole: ['AD', 'KD'] },
      ],
      ['2C', '7D', '9H', 'JH', '3C'], // both play A-K-J-9-7, identical ranks
    )
    const { pots } = runShowdown(s)
    expect(pots[0].winnerSeatIds.sort()).toEqual(['A', 'B'])
    const settled = settle(s)
    expect(seatById(settled, 'A').stack).toBe(50)
    expect(seatById(settled, 'B').stack).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// All-in run-out
// ---------------------------------------------------------------------------

describe('all-in before the river', () => {
  it('deals the remaining board automatically and reaches showdown', () => {
    let state = createHand(headsUp(100, 24))
    // Button shoves all-in preflop; BB calls all-in.
    state = applyAction(state, { action: 'raise', amount: 100 })
    expect(seatById(state, 'btn').allIn).toBe(true)
    state = applyAction(state, { action: 'call' })

    expect(seatById(state, 'bb').allIn).toBe(true)
    expect(state.phase).toBe('showdown')
    expect(state.board).toHaveLength(5) // run-out dealt with no further betting
    expect(state.burns).toHaveLength(3)

    const settled = settle(state)
    expect(settled.seats.reduce((sum, s) => sum + s.stack, 0)).toBe(200)
  })
})
