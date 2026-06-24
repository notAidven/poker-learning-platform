/**
 * Rule-based, explainable poker opponents (no ML) for Lessons 5–6. All randomness
 * is seeded so hands are reproducible for authoring and tests. See design doc §5.6.
 *
 * SHARED FILE — finalized signature. This baseline gives a working, deterministic
 * opponent so the betting/full-hand widgets and their tests have something to call.
 * The three difficulty tiers can be deepened later, but the `decideAI` /
 * `makeRng` signatures below are stable and should not change.
 */
import { evaluateBest, rankValue } from './handEvaluator'
import type { AIDecision, BettingAction } from '../../types/poker'
import type { CardId } from '../../types/lesson'

export type { AIDecision } from '../../types/poker'

export type AITier = 1 | 2 | 3

export type DecideAIParams = {
  tier: AITier
  hole: [CardId, CardId]
  board: CardId[]
  pot: number
  toCall: number
  /** In position (acts last) or out of position. */
  position: 'ip' | 'oop'
  /** Seeded RNG in [0, 1) for reproducibility. */
  rng: () => number
}

/** Deterministic seeded RNG (mulberry32). Same seed → same sequence. */
export function makeRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Rough hand-strength estimate in [0, 1].
 * Postflop (≥ 5 known cards) uses the made-hand category; preflop falls back to a
 * simple high-card / pair heuristic on the two hole cards.
 */
function heroStrength(hole: [CardId, CardId], board: CardId[]): number {
  const known = [...hole, ...board]
  if (known.length >= 5) {
    return evaluateBest(known).score[0] / 10 // categoryRank 1..10 → 0.1..1.0
  }
  const a = rankValue(hole[0])
  const b = rankValue(hole[1])
  const pair = a === b ? 0.35 : 0
  const highness = (a + b) / 28 // max (A+A) = 28
  return Math.min(1, pair + highness * 0.5)
}

/**
 * Decide one opponent action. Baseline behavior:
 * - No bet to call → bet ~½ pot when strong, otherwise check.
 * - Facing a bet → call/raise when strength clears the price (pot odds), else fold.
 * Higher tiers fold marginal hands more readily and add a small seeded bluff.
 */
export function decideAI(params: DecideAIParams): AIDecision {
  const { tier, hole, board, pot, toCall, rng } = params
  const strength = heroStrength(hole, board)
  const roll = rng()

  if (toCall <= 0) {
    // We can check for free or bet.
    const betThreshold = tier === 1 ? 0.8 : 0.55
    if (strength >= betThreshold) {
      const action: BettingAction = 'bet'
      return { action, amount: Math.round(pot * 0.66) }
    }
    // Occasional seeded bluff for tiers 2–3.
    if (tier >= 2 && roll < 0.1) {
      return { action: 'bet', amount: Math.round(pot * 0.66) }
    }
    return { action: 'check' }
  }

  // Facing a bet: compare strength to the price we are being laid.
  const requiredEquity = toCall / (pot + toCall)
  const callThreshold = tier === 1 ? 0.15 : requiredEquity // tier 1 is a calling station

  if (strength >= 0.7 && tier >= 2) {
    return { action: 'raise', amount: Math.round((pot + toCall) * 0.66) + toCall }
  }
  if (strength >= callThreshold) {
    return { action: 'call', amount: toCall }
  }
  return { action: 'fold' }
}
