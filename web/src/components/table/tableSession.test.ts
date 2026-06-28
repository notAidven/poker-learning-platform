/**
 * The hand-session sequencing is now the test surface: turn order, the opponent
 * stale-guard, the hero wrong-turn guard, and "did the hand clear the table" — all
 * pure, exercised without mounting <PokerTable>.
 */
import { describe, expect, it } from 'vitest'
import { applyAction, createHand, legalActions, type HandState } from '../../lib/poker/handEngine'
import { finalizeHand } from './tableRuntime'
import {
  advanceWithHeroAction,
  advanceWithOpponentAction,
  clearsTable,
  heroToAct,
  opponentToAct,
} from './tableSession'

function freshHand(): HandState {
  return createHand({
    seats: [
      { id: 'hero', name: 'You', isHero: true, stack: 200 },
      { id: 'opp', name: 'Opp', isHero: false, stack: 200 },
    ],
    buttonIndex: 0,
    smallBlind: 5,
    bigBlind: 10,
    seed: 1,
  })
}

describe('turn helpers', () => {
  it('heroToAct and opponentToAct agree on whose turn it is', () => {
    const h = freshHand()
    const toAct = h.toActIndex
    expect(toAct).not.toBeNull()
    const heroIndex = h.seats.findIndex((s) => s.isHero)
    if (h.seats[toAct as number].isHero) {
      expect(heroToAct(h, heroIndex)).toBe(true)
      expect(opponentToAct(h)).toBeNull()
    } else {
      expect(heroToAct(h, heroIndex)).toBe(false)
      expect(opponentToAct(h)).toBe(toAct)
    }
  })
})

describe('advanceWithOpponentAction — the re-fire stale-guard', () => {
  it('is a no-op when the named seat is not the one to act', () => {
    const h = freshHand()
    const toAct = h.toActIndex as number
    const wrongSeat = (toAct + 1) % h.seats.length
    const action = { action: legalActions(h)[0].action }
    expect(advanceWithOpponentAction(h, wrongSeat, action)).toBe(h)
  })

  it('applies (advancing the hand) when the named seat is still to act', () => {
    const h = freshHand()
    const toAct = h.toActIndex as number
    const action = { action: legalActions(h)[0].action }
    expect(advanceWithOpponentAction(h, toAct, action)).not.toBe(h)
  })
})

describe('advanceWithHeroAction — the wrong-turn guard', () => {
  it('applies only when a hero is to act, otherwise is a no-op', () => {
    const h = freshHand()
    const toAct = h.toActIndex as number
    const action = { action: legalActions(h)[0].action }
    if (h.seats[toAct].isHero) {
      expect(advanceWithHeroAction(h, action)).not.toBe(h)
    } else {
      expect(advanceWithHeroAction(h, action)).toBe(h)
    }
  })
})

describe('a completed hand', () => {
  it('has nobody to act and ignores any further action', () => {
    // Heads-up: the first seat to act folds, ending the hand once settled.
    const h = finalizeHand(applyAction(freshHand(), { action: 'fold' }))
    expect(h.phase).toBe('complete')
    const heroIndex = h.seats.findIndex((s) => s.isHero)
    expect(opponentToAct(h)).toBeNull()
    expect(heroToAct(h, heroIndex)).toBe(false)
    expect(advanceWithHeroAction(h, { action: 'fold' })).toBe(h)
    expect(advanceWithOpponentAction(h, 0, { action: 'fold' })).toBe(h)
  })
})

describe('clearsTable', () => {
  it('clears on the first showdown or a hero pot win, not otherwise', () => {
    expect(clearsTable({ reachedShowdown: true, pots: [], winnerIds: ['opp'] })).toBe(true)
    expect(clearsTable({ reachedShowdown: false, pots: [], winnerIds: ['hero'] })).toBe(true)
    expect(clearsTable({ reachedShowdown: false, pots: [], winnerIds: ['opp'] })).toBe(false)
  })
})
