import { describe, it, expect } from 'vitest'
import { decideAI, type AIDecisionInput, type AITier } from './opponentAI'
import type { LegalAction } from './handEngine'
import type { CardId } from '../../types/lesson'
import type { PokerStreet } from '../../types/poker'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FACING_BET: LegalAction[] = [
  { action: 'fold' },
  { action: 'call' },
  { action: 'raise', min: 40, max: 500 },
]
const CHECK_OR_BET: LegalAction[] = [
  { action: 'check' },
  { action: 'bet', min: 2, max: 500 },
]

function makeInput(overrides: Partial<AIDecisionInput>): AIDecisionInput {
  return {
    tier: 2,
    hole: ['AS', 'KS'],
    board: ['QH', '7D', '2C'],
    street: 'flop',
    pot: 100,
    toCall: 0,
    minRaise: 20,
    stack: 500,
    bigBlind: 2,
    legalActions: CHECK_OR_BET,
    rng: () => 0.5,
    ...overrides,
  }
}

/** Assert a decision is legal: action present, amount (if any) within [min,max]. */
function expectLegal(decision: { action: string; amount?: number }, legal: LegalAction[]) {
  const match = legal.find((a) => a.action === decision.action)
  expect(match, `action ${decision.action} must be legal`).toBeTruthy()
  if (decision.action === 'bet' || decision.action === 'raise') {
    expect(typeof decision.amount).toBe('number')
    expect(decision.amount!).toBeGreaterThanOrEqual(match!.min ?? 0)
    expect(decision.amount!).toBeLessThanOrEqual(match!.max ?? Infinity)
  }
}

// A small grid of varied situations to fuzz every tier against.
const SCENARIOS: Array<{ hole: [CardId, CardId]; board: CardId[]; street: PokerStreet }> = [
  { hole: ['AS', 'AD'], board: [], street: 'preflop' },
  { hole: ['7D', '2C'], board: [], street: 'preflop' },
  { hole: ['JS', 'JC'], board: ['JH', '9S', '2D'], street: 'flop' }, // set
  { hole: ['AH', 'KH'], board: ['QH', '7H', '2C'], street: 'flop' }, // flush draw
  { hole: ['9C', '8C'], board: ['7D', '6S', '2H'], street: 'flop' }, // open-ender
  { hole: ['AS', 'QD'], board: ['AC', '8H', '3S'], street: 'flop' }, // top pair
  { hole: ['KS', 'KD'], board: ['AC', '7H', '2S', '9D'], street: 'turn' }, // 2nd pair
  { hole: ['5S', '5D'], board: ['AH', 'KH', 'QC', 'JD', '2S'], street: 'river' }, // weak pair
  { hole: ['AD', 'KC'], board: ['AS', 'KD', '2C', '7H', '9S'], street: 'river' }, // two pair
]

// ---------------------------------------------------------------------------
// Legality across all tiers
// ---------------------------------------------------------------------------

describe('decideAI — always returns a legal action', () => {
  const tiers: AITier[] = [1, 2, 3]
  const betStates: Array<{ label: string; legal: LegalAction[]; toCall: number; pot: number }> = [
    { label: 'facing a bet', legal: FACING_BET, toCall: 40, pot: 100 },
    { label: 'checked to', legal: CHECK_OR_BET, toCall: 0, pot: 100 },
    {
      label: 'facing an all-in (no raise available)',
      legal: [{ action: 'fold' }, { action: 'call' }],
      toCall: 480,
      pot: 200,
    },
    { label: 'call-only', legal: [{ action: 'call' }], toCall: 5, pot: 50 },
  ]

  for (const tier of tiers) {
    for (const sc of SCENARIOS) {
      for (const bs of betStates) {
        for (const seed of [0.05, 0.5, 0.95]) {
          it(`tier ${tier} · ${sc.hole.join('')} on [${sc.board.join(' ')}] · ${bs.label} · rng ${seed}`, () => {
            const decision = decideAI(
              makeInput({
                tier,
                hole: sc.hole,
                board: sc.board,
                street: sc.street,
                legalActions: bs.legal,
                toCall: bs.toCall,
                pot: bs.pot,
                rng: () => seed,
                opponents: tier === 3 ? 2 : 1,
                position: tier === 3 ? 'ip' : undefined,
              }),
            )
            expectLegal(decision, bs.legal)
            expect(decision.reason.length).toBeGreaterThan(0)
          })
        }
      }
    }
  }
})

// ---------------------------------------------------------------------------
// Tier 1 — calling station
// ---------------------------------------------------------------------------

describe('Tier 1 — calling station', () => {
  it('never folds a set facing a bet (calls or raises)', () => {
    for (const seed of [0.0, 0.25, 0.5, 0.75, 0.99]) {
      const decision = decideAI(
        makeInput({
          tier: 1,
          hole: ['9H', '9C'],
          board: ['9S', '2D', '7H'], // trip nines
          street: 'flop',
          legalActions: FACING_BET,
          toCall: 50,
          pot: 100,
          rng: () => seed,
        }),
      )
      expect(decision.action).not.toBe('fold')
      expect(['call', 'raise']).toContain(decision.action)
    }
  })

  it('never folds, even with total air facing a bet', () => {
    const decision = decideAI(
      makeInput({
        tier: 1,
        hole: ['7D', '2C'],
        board: ['AH', 'KS', 'QD'],
        street: 'flop',
        legalActions: FACING_BET,
        toCall: 75,
        pot: 100,
        rng: () => 0.5,
      }),
    )
    expect(decision.action).toBe('call')
  })

  it('only bets with two pair or better; checks a one-pair hand', () => {
    const onePair = decideAI(
      makeInput({
        tier: 1,
        hole: ['AS', 'QD'],
        board: ['AC', '8H', '3S'], // top pair, not two pair
        street: 'flop',
        legalActions: CHECK_OR_BET,
        toCall: 0,
        rng: () => 0.5,
      }),
    )
    expect(onePair.action).toBe('check')

    const twoPair = decideAI(
      makeInput({
        tier: 1,
        hole: ['AS', 'KD'],
        board: ['AC', 'KH', '3S'], // two pair
        street: 'flop',
        legalActions: CHECK_OR_BET,
        toCall: 0,
        rng: () => 0.5,
      }),
    )
    expect(twoPair.action).toBe('bet')
    expectLegal(twoPair, CHECK_OR_BET)
  })
})

// ---------------------------------------------------------------------------
// Tier 2 — pot-odds-aware TAG
// ---------------------------------------------------------------------------

describe('Tier 2 — pot odds', () => {
  it('folds a weak hand to a pot-sized bet', () => {
    const decision = decideAI(
      makeInput({
        tier: 2,
        hole: ['7D', '2C'],
        board: ['AS', 'KD', 'QH'], // no pair, no draw
        street: 'flop',
        legalActions: FACING_BET,
        pot: 100,
        toCall: 100, // pot-sized → needs 50% equity
        rng: () => 0.99, // no bluff
      }),
    )
    expect(decision.action).toBe('fold')
  })

  it('calls a flush draw that is getting the right price', () => {
    const decision = decideAI(
      makeInput({
        tier: 2,
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C'], // four hearts → 9-out flush draw (~36% on the flop)
        street: 'flop',
        legalActions: FACING_BET,
        pot: 100,
        toCall: 20, // needs ~17% equity
        rng: () => 0.99, // suppress the rare value-raise / bluff
      }),
    )
    expect(decision.action).toBe('call')
    expect(decision.reason.toLowerCase()).toContain('odds')
  })

  it('folds the same flush draw when the price is too steep', () => {
    const decision = decideAI(
      makeInput({
        tier: 2,
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C'],
        street: 'flop',
        legalActions: FACING_BET,
        pot: 20,
        toCall: 100, // needs ~83% equity — way more than a draw has
        rng: () => 0.99,
      }),
    )
    expect(decision.action).toBe('fold')
  })

  it('value-bets a strong made hand when checked to', () => {
    const decision = decideAI(
      makeInput({
        tier: 2,
        hole: ['AS', 'KD'],
        board: ['AC', 'KH', '3S'], // two pair
        street: 'flop',
        legalActions: CHECK_OR_BET,
        toCall: 0,
        pot: 100,
        rng: () => 0.99,
      }),
    )
    expect(decision.action).toBe('bet')
    expect(decision.amount).toBeGreaterThan(0)
    expectLegal(decision, CHECK_OR_BET)
  })
})

// ---------------------------------------------------------------------------
// Preflop premium re-raising (Tier 2 / Tier 3 TAG)
// ---------------------------------------------------------------------------

describe('preflop — premiums re-raise instead of only calling', () => {
  const premiums: [CardId, CardId][] = [
    ['AS', 'AD'],
    ['KS', 'KD'],
    ['QS', 'QH'],
    ['AS', 'KD'],
  ]

  it('re-raises QQ+/AK facing a preflop bet (both TAG tiers)', () => {
    for (const tier of [2, 3] as AITier[]) {
      for (const hole of premiums) {
        const d = decideAI(
          makeInput({
            tier,
            hole,
            board: [],
            street: 'preflop',
            legalActions: FACING_BET,
            pot: 30,
            toCall: 10,
            opponents: 1,
            position: 'ip',
            rng: () => 0.99, // suppress any rng-gated value-raise; the re-raise is deterministic
          }),
        )
        expect(d.action).toBe('raise')
        expectLegal(d, FACING_BET)
      }
    }
  })

  it('still flat-calls a strong-but-not-premium hand (JJ) facing a preflop bet', () => {
    const d = decideAI(
      makeInput({
        tier: 3,
        hole: ['JS', 'JD'],
        board: [],
        street: 'preflop',
        legalActions: FACING_BET,
        pot: 30,
        toCall: 10,
        opponents: 1,
        position: 'ip',
        rng: () => 0.99,
      }),
    )
    expect(d.action).toBe('call')
  })

  it('does not auto re-raise a premium postflop (the nudge is preflop only)', () => {
    // AK on a brick flop with no pair/draw is just ace-high; it should not raise here.
    const d = decideAI(
      makeInput({
        tier: 3,
        hole: ['AS', 'KD'],
        board: ['9H', '5C', '2S'],
        street: 'flop',
        legalActions: FACING_BET,
        pot: 100,
        toCall: 60,
        opponents: 1,
        position: 'ip',
        rng: () => 0.99,
      }),
    )
    expect(d.action).not.toBe('raise')
  })
})

// ---------------------------------------------------------------------------
// Tier 3 — multiway, position-aware
// ---------------------------------------------------------------------------

describe('Tier 3 — multiway tightening', () => {
  it('a marginal call heads-up becomes a fold multiway at the same price', () => {
    const base = {
      tier: 3 as AITier,
      hole: ['9C', '8C'] as [CardId, CardId],
      board: ['7D', '6S', 'AH'] as CardId[], // open-ended straight draw, ~32%
      street: 'flop' as PokerStreet,
      legalActions: FACING_BET,
      pot: 100,
      toCall: 45, // needs ~31% equity — right on the bubble
      rng: () => 0.99,
    }
    const headsUp = decideAI(makeInput({ ...base, opponents: 1, position: 'ip' }))
    const multiway = decideAI(makeInput({ ...base, opponents: 3, position: 'oop' }))

    expect(headsUp.action).toBe('call')
    expect(multiway.action).toBe('fold')
  })

  it('still returns legal actions when in position with bluffs enabled', () => {
    for (const seed of [0.01, 0.1, 0.5, 0.9]) {
      const decision = decideAI(
        makeInput({
          tier: 3,
          hole: ['JS', '4D'],
          board: ['9H', '5C', '2S'],
          street: 'flop',
          legalActions: CHECK_OR_BET,
          toCall: 0,
          pot: 60,
          position: 'ip',
          opponents: 1,
          rng: () => seed,
        }),
      )
      expectLegal(decision, CHECK_OR_BET)
    }
  })
})
