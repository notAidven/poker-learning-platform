/**
 * Deterministic AI-vs-AI convergence simulation (regression for the "raise-war"
 * bug). Models the exact reported spot: the human hero has FOLDED, leaving two
 * rule-AI opponents to play each other heads-up. We deal many seeded hands, drive
 * every decision through the SAME path the live table uses (`buildAIDecisionInput`
 * + `decideAI`), and assert that hands CONVERGE — all-in is the rare exception, the
 * per-street re-raise count is bounded by the cap, and the bots respond to a bet by
 * calling/folding far more often than they re-raise.
 *
 * Measured on THIS harness (400 seeded hands per tier), before vs after the fix.
 * Before, the novice band (Tier 1 calling station) NEVER folded and re-raised any
 * two-pair-plus with no cap, so two stations jammed all-in in ~1 of 5 hands; the
 * thinking tiers also had unbounded 3-bet/4-bet wars (max 3-4 raises a street):
 *
 *            all-in  maxStreetRaises   vs-bet: call / fold / raise
 *   Tier 1   19.3%        4              72% /  0% / 28%   →  after  0.0%  0  100/0/0
 *   Tier 2    1.8%        3              83% / 11% /  6%   →  after  1.5%  2  83/11/6
 *   Tier 3    2.8%        4              81% / 12% /  6%   →  after  1.8%  2  82/12/6
 *
 * After the fix (asserted below): Tier 1 is loose-passive (calls, never re-raises)
 * so it never wars, and every tier is bounded by `MAX_AI_RAISES_PER_STREET`.
 */
import { describe, it, expect } from 'vitest'
import {
  createHand,
  applyAction,
  toCallFor,
  settle,
  type HandState,
} from './handEngine'
import { decideAI, MAX_AI_RAISES_PER_STREET, type AITier } from './opponentAI'
import { buildAIDecisionInput } from '../../components/table/tableRuntime'

type HandStats = {
  reachedShowdown: boolean
  /** Any contesting seat finished with no chips behind (got it all-in). */
  anyAllIn: boolean
  /** Both contesting seats finished all-in (the raise-war symptom). */
  bothAllIn: boolean
  totalRaises: number
  maxRaisesInStreet: number
  facingBet: number
  facingBetCall: number
  facingBetFold: number
  facingBetRaise: number
}

/**
 * Play one heads-up hand between two rule AIs at `tier` (the state left behind once
 * a 3-handed table's hero folds). Returns convergence stats. Throws if the betting
 * fails to converge — a runaway raise-war would trip the guard rather than hang.
 */
function playHeadsUpAiHand(seed: number, tier: AITier): HandStats {
  let state: HandState = createHand({
    seats: [
      { id: 'a', name: 'A', isHero: false, stack: 100 },
      { id: 'b', name: 'B', isHero: false, stack: 100 },
    ],
    buttonIndex: seed % 2,
    smallBlind: 1,
    bigBlind: 2,
    seed,
  })

  let totalRaises = 0
  let facingBet = 0
  let facingBetCall = 0
  let facingBetFold = 0
  let facingBetRaise = 0
  const raisesByStreet = new Map<string, number>()
  let guard = 0

  while (state.toActIndex !== null && state.phase !== 'complete' && state.phase !== 'showdown') {
    if (guard++ > 400) throw new Error(`no convergence: seed=${seed} tier=${tier}`)
    const i = state.toActIndex
    const toCall = toCallFor(state, i)
    const d = decideAI(buildAIDecisionInput(state, i, tier))

    if (toCall > 0) {
      facingBet++
      if (d.action === 'call') facingBetCall++
      else if (d.action === 'fold') facingBetFold++
      else if (d.action === 'raise') facingBetRaise++
    }
    if (d.action === 'raise') {
      totalRaises++
      raisesByStreet.set(state.phase, (raisesByStreet.get(state.phase) ?? 0) + 1)
    }
    state = applyAction(state, { action: d.action, amount: d.amount })
  }

  if (state.phase === 'showdown') state = settle(state)

  const contesting = state.seats.filter((s) => !s.folded)
  const allInSeats = contesting.filter((s) => s.allIn || s.stack === 0)
  return {
    reachedShowdown: state.phase === 'complete' && contesting.length >= 2,
    anyAllIn: allInSeats.length >= 1,
    bothAllIn: contesting.length >= 2 && allInSeats.length === contesting.length,
    totalRaises,
    maxRaisesInStreet: Math.max(0, ...raisesByStreet.values()),
    facingBet,
    facingBetCall,
    facingBetFold,
    facingBetRaise,
  }
}

type Aggregate = {
  hands: number
  anyAllIn: number
  bothAllIn: number
  showdowns: number
  maxStreetRaises: number
  facingBet: number
  calls: number
  folds: number
  raises: number
}

function simulateTier(tier: AITier, hands: number): Aggregate {
  const agg: Aggregate = {
    hands,
    anyAllIn: 0,
    bothAllIn: 0,
    showdowns: 0,
    maxStreetRaises: 0,
    facingBet: 0,
    calls: 0,
    folds: 0,
    raises: 0,
  }
  for (let seed = 1; seed <= hands; seed++) {
    const s = playHeadsUpAiHand(seed, tier)
    if (s.anyAllIn) agg.anyAllIn++
    if (s.bothAllIn) agg.bothAllIn++
    if (s.reachedShowdown) agg.showdowns++
    agg.maxStreetRaises = Math.max(agg.maxStreetRaises, s.maxRaisesInStreet)
    agg.facingBet += s.facingBet
    agg.calls += s.facingBetCall
    agg.folds += s.facingBetFold
    agg.raises += s.facingBetRaise
  }
  return agg
}

const HANDS = 400
const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0)

describe('AI-vs-AI convergence (hero folded, two bots heads-up)', () => {
  for (const tier of [1, 2, 3] as AITier[]) {
    describe(`tier ${tier}`, () => {
      const agg = simulateTier(tier, HANDS)
      const allInRate = pct(agg.bothAllIn, agg.hands)
      const raiseRate = pct(agg.raises, agg.facingBet)
      const callOrFoldRate = pct(agg.calls + agg.folds, agg.facingBet)

      console.log(
        `[sim] tier ${tier}: allIn=${allInRate.toFixed(1)}% showdown=${pct(
          agg.showdowns,
          agg.hands,
        ).toFixed(1)}% maxStreetRaises=${agg.maxStreetRaises} ` +
          `vsBet[n=${agg.facingBet}] call=${pct(agg.calls, agg.facingBet).toFixed(0)}% ` +
          `fold=${pct(agg.folds, agg.facingBet).toFixed(0)}% raise=${raiseRate.toFixed(0)}%`,
      )

      it('never fails to converge (no runaway raise-war)', () => {
        // playHeadsUpAiHand throws on a runaway; reaching here means every hand ended.
        expect(agg.hands).toBe(HANDS)
      })

      it('gets all chips in only as a rare exception, not the norm', () => {
        // Was 23.5% for the novice band; an all-in must now be uncommon.
        expect(allInRate).toBeLessThanOrEqual(8)
        // Far more hands end without a jam than with one.
        expect(agg.bothAllIn).toBeLessThan(agg.hands - agg.bothAllIn)
      })

      it('bounds escalating re-raises by the per-street cap', () => {
        expect(agg.maxStreetRaises).toBeLessThanOrEqual(MAX_AI_RAISES_PER_STREET)
      })

      it('responds to a bet by calling/folding far more than re-raising', () => {
        expect(agg.facingBet).toBeGreaterThan(0)
        // Re-raising is a small minority of the responses to aggression…
        expect(raiseRate).toBeLessThanOrEqual(25)
        // …and calling-or-folding is the overwhelming majority.
        expect(callOrFoldRate).toBeGreaterThanOrEqual(75)
      })
    })
  }

  it('preserves tiered difficulty: tighter tiers fold to aggression more', () => {
    const t1 = simulateTier(1, HANDS)
    const t2 = simulateTier(2, HANDS)
    const t3 = simulateTier(3, HANDS)

    // Novice is loose-passive: it calls down and (almost) never folds…
    expect(pct(t1.folds, t1.facingBet)).toBeLessThan(pct(t2.folds, t2.facingBet))
    // …while the sharp tier is the most disciplined folder facing a bet.
    expect(pct(t3.folds, t3.facingBet)).toBeGreaterThanOrEqual(pct(t2.folds, t2.facingBet))

    // And the novice band specifically must no longer raise-war into all-ins.
    expect(pct(t1.bothAllIn, t1.hands)).toBeLessThanOrEqual(2)
    expect(pct(t1.raises, t1.facingBet)).toBeLessThanOrEqual(2)
  })
})
