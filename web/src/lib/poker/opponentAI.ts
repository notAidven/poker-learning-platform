/**
 * Rule-based Texas Hold'em opponents for the Phase 2 "AI casino tables", in three
 * difficulty tiers. Pure and deterministic: every random choice (rare bluffs,
 * tie-breaks) flows through the caller-supplied seeded `rng`, so the same inputs
 * always yield the same decision.
 *
 * Strength is read off the existing evaluator (`evaluateBest`) plus a lightweight
 * draw/equity model (flush + straight outs × the rule of 2 & 4). The AI only ever
 * returns an action that appears in `input.legalActions`, with any `amount`
 * clamped to that action's `[min, max]`.
 */
import { parseCardId, type CardId, type CardSuit } from '../../types/lesson'
import { HAND_CATEGORY_RANK, type PokerStreet } from '../../types/poker'
import type { BettingAction } from '../../types/poker'
import { evaluateBest, rankValue } from './handEvaluator'
import type { LegalAction } from './handEngine'

export type AITier = 1 | 2 | 3

export type AIDecision = { action: BettingAction; amount?: number; reason: string }

export type AIDecisionInput = {
  tier: AITier
  hole: [CardId, CardId]
  board: CardId[]
  street: PokerStreet
  pot: number
  toCall: number
  minRaise: number
  stack: number
  bigBlind: number
  position?: 'ip' | 'oop'
  opponents?: number
  legalActions: LegalAction[]
  /** Seeded RNG for tie-breaks and rare bluffs. */
  rng: () => number
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function decideAI(input: AIDecisionInput): AIDecision {
  switch (input.tier) {
    case 1:
      return finalize(input, decideCallingStation(input))
    case 2:
      return finalize(input, decideTag(input, TIER2))
    case 3:
      return finalize(input, decideTag(input, tier3Params(input)))
    default:
      return finalize(input, { action: 'check', reason: 'Unknown tier; defaulted to check' })
  }
}

// ---------------------------------------------------------------------------
// Strength / equity model
// ---------------------------------------------------------------------------

type Strength = {
  /** HAND_CATEGORY_RANK of the current made hand (1..10), or null preflop. */
  madeRank: number | null
  /** Rough chance of holding/improving to the best hand by the river, 0..1. */
  equity: number
  /** Clean draw outs (flush / straight) used for the rule of 2 & 4. */
  drawOuts: number
  hasPairPlus: boolean
  hasTwoPairPlus: boolean
  hasTripsPlus: boolean
  hasDraw: boolean
}

function countBySuit(cards: CardId[]): Map<CardSuit, number> {
  const m = new Map<CardSuit, number>()
  for (const c of cards) {
    const { suit } = parseCardId(c)
    m.set(suit, (m.get(suit) ?? 0) + 1)
  }
  return m
}

/** 9 outs when exactly four cards share a suit (a flush draw); else 0. */
function flushDrawOuts(cards: CardId[]): number {
  let max = 0
  for (const n of countBySuit(cards).values()) max = Math.max(max, n)
  return max === 4 ? 9 : 0
}

/**
 * Straight-draw outs by counting rank "fillers": for every rank entirely absent
 * from the known cards, does adding it complete a 5-card straight? Each such rank
 * is 4 live cards. Open-ended → 8, gutshot → 4. Returns 0 once a straight is made.
 */
function straightDrawOuts(cards: CardId[]): number {
  const present = new Set<number>()
  for (const c of cards) {
    const v = rankValue(c)
    present.add(v)
    if (v === 14) present.add(1) // Ace also plays low for the wheel
  }
  const hasStraight = (vals: Set<number>): boolean => {
    for (let low = 1; low <= 10; low++) {
      let run = true
      for (let k = 0; k < 5; k++) if (!vals.has(low + k)) run = false
      if (run) return true
    }
    return false
  }
  if (hasStraight(present)) return 0

  let fillers = 0
  for (let r = 2; r <= 14; r++) {
    if (present.has(r)) continue
    const test = new Set(present)
    test.add(r)
    if (r === 14) test.add(1)
    if (hasStraight(test)) fillers++
  }
  return Math.min(fillers, 2) * 4
}

function preflopStrength(hole: [CardId, CardId]): number {
  const a = rankValue(hole[0])
  const b = rankValue(hole[1])
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  const suited = parseCardId(hole[0]).suit === parseCardId(hole[1]).suit
  if (a === b) {
    // Pocket pair: 22 ≈ 0.50 … AA ≈ 1.0.
    return clamp01(0.5 + ((hi - 2) / 12) * 0.5)
  }
  let s = 0.18 + ((hi - 2) / 12) * 0.26 + ((lo - 2) / 12) * 0.14
  if (suited) s += 0.05
  const gap = hi - lo
  if (gap <= 4) s += (4 - gap) * 0.01 // reward connectedness
  return clamp01(s)
}

function assessStrength(input: AIDecisionInput): Strength {
  const { hole, board } = input
  const opponents = Math.max(1, input.opponents ?? 1)

  if (board.length < 3) {
    const base = preflopStrength(hole)
    // More opponents dilute a raw preflop holding.
    const equity = clamp01(base / (1 + 0.18 * (opponents - 1)))
    const isPair = rankValue(hole[0]) === rankValue(hole[1])
    return {
      madeRank: isPair ? HAND_CATEGORY_RANK.pair : null,
      equity,
      drawOuts: 0,
      hasPairPlus: isPair,
      hasTwoPairPlus: false,
      hasTripsPlus: false,
      hasDraw: false,
    }
  }

  const cards = [...hole, ...board]
  const made = evaluateBest(cards)
  const madeRank = HAND_CATEGORY_RANK[made.category]

  const drawOuts = Math.min(flushDrawOuts(cards) + straightDrawOuts(cards), 15)
  const cardsToCome = board.length <= 3 ? 2 : board.length === 4 ? 1 : 0
  const multiplier = cardsToCome === 2 ? 4 : cardsToCome === 1 ? 2 : 0
  const drawEquity = Math.min((drawOuts * multiplier) / 100, 0.95)

  let madeEquity: number
  if (madeRank >= HAND_CATEGORY_RANK['full-house']) madeEquity = 0.95
  else if (madeRank >= HAND_CATEGORY_RANK.trips) madeEquity = 0.88
  else if (madeRank >= HAND_CATEGORY_RANK['two-pair']) madeEquity = 0.78
  else if (madeRank >= HAND_CATEGORY_RANK.pair) madeEquity = isTopPair(hole, board) ? 0.6 : 0.45
  else madeEquity = 0.18

  // A made hand plus a live draw is worth a touch more than either alone.
  let equity = Math.max(madeEquity, drawEquity)
  if (drawEquity > 0 && madeEquity >= 0.45) equity = Math.min(0.95, equity + 0.08)

  // Multiway shrinks the value of marginal holdings.
  if (opponents > 1 && equity < 0.85) equity = clamp01(equity - 0.06 * (opponents - 1))

  return {
    madeRank,
    equity: clamp01(equity),
    drawOuts,
    hasPairPlus: madeRank >= HAND_CATEGORY_RANK.pair,
    hasTwoPairPlus: madeRank >= HAND_CATEGORY_RANK['two-pair'],
    hasTripsPlus: madeRank >= HAND_CATEGORY_RANK.trips,
    hasDraw: drawOuts > 0,
  }
}

function isTopPair(hole: [CardId, CardId], board: CardId[]): boolean {
  if (board.length === 0) return false
  const topBoard = Math.max(...board.map(rankValue))
  const holeRanks = hole.map(rankValue)
  // Top pair (paired the highest board card) or an overpair to the board.
  return holeRanks.includes(topBoard) || (holeRanks[0] === holeRanks[1] && holeRanks[0] > topBoard)
}

// ---------------------------------------------------------------------------
// Tier 1 — "Calling station": never bluffs, never folds a made hand, calls draws.
// ---------------------------------------------------------------------------

function decideCallingStation(input: AIDecisionInput): AIDecision {
  const s = assessStrength(input)
  const facingBet = input.toCall > 0

  if (!facingBet) {
    // Only bets with two pair or better; otherwise checks.
    if (s.hasTwoPairPlus && has(input, 'bet')) {
      return { action: 'bet', amount: potFraction(input, 0.5), reason: 'Bet: two pair or better' }
    }
    if (s.hasTwoPairPlus && has(input, 'raise')) {
      return { action: 'raise', amount: raiseTo(input, 0.5), reason: 'Raised: two pair or better' }
    }
    return { action: 'check', reason: 'Checked it down' }
  }

  // Facing a bet: a calling station never folds — it only raises with the nuts-ish.
  if (s.hasTwoPairPlus && has(input, 'raise')) {
    return { action: 'raise', amount: raiseTo(input, 0.5), reason: 'Raised: two pair or better' }
  }
  if (has(input, 'call')) {
    if (s.hasPairPlus) return { action: 'call', reason: 'Called: never folds a made hand' }
    if (s.hasDraw) return { action: 'call', reason: 'Called: chasing the draw' }
    return { action: 'call', reason: 'Called: calling station never folds' }
  }
  return { action: 'check', reason: 'Checked' }
}

// ---------------------------------------------------------------------------
// Tier 2 / Tier 3 — pot-odds-aware TAG (Tier 3 = tighter + position-aware)
// ---------------------------------------------------------------------------

type TagParams = {
  bluffChance: number
  /** Extra equity required to continue (Tier 3 multiway tightening). */
  equityMargin: number
  /** Value-bet top pair too (Tier 3 in position). */
  thinValue: boolean
  /** Pot fraction for value bets. */
  betSize: number
}

const TIER2: TagParams = { bluffChance: 0.1, equityMargin: 0, thinValue: false, betSize: 2 / 3 }

function tier3Params(input: AIDecisionInput): TagParams {
  const opponents = Math.max(1, input.opponents ?? 1)
  const ip = input.position === 'ip'
  return {
    // A touch more bluffing in position, much less multiway.
    bluffChance: ip ? 0.14 : opponents > 1 ? 0.05 : 0.09,
    // Tighten up the more opponents are in the pot.
    equityMargin: opponents > 1 ? 0.08 + 0.03 * (opponents - 2) : 0,
    thinValue: ip,
    betSize: ip ? 0.75 : 0.6,
  }
}

function decideTag(input: AIDecisionInput, params: TagParams): AIDecision {
  const s = assessStrength(input)
  const facingBet = input.toCall > 0
  const required = facingBet ? input.toCall / (input.pot + input.toCall) : 0
  const threshold = required + params.equityMargin

  if (!facingBet) {
    // Checked to: value-bet strong hands, otherwise mostly check with a rare bluff.
    const wantsValue = s.hasTwoPairPlus || (params.thinValue && isStrongPair(s))
    if (wantsValue && has(input, 'bet')) {
      return {
        action: 'bet',
        amount: potFraction(input, params.betSize),
        reason: 'Value bet with a strong made hand',
      }
    }
    if (wantsValue && has(input, 'raise')) {
      return { action: 'raise', amount: raiseTo(input, params.betSize), reason: 'Value raise' }
    }
    // Semi-bluff a draw, or pure-bluff air, occasionally.
    if (has(input, 'bet') && s.equity < 0.5 && input.rng() < params.bluffChance) {
      const reason = s.hasDraw ? 'Semi-bluff with a draw' : 'Bluff at the pot'
      return { action: 'bet', amount: potFraction(input, params.betSize), reason }
    }
    return { action: 'check', reason: 'Checked: not enough to bet for value' }
  }

  // Facing a bet — compare equity to the price.
  if (s.equity >= threshold) {
    // Raise the strongest hands for value (sometimes), otherwise call and realise equity.
    if (s.hasTripsPlus && has(input, 'raise') && input.rng() > 0.35) {
      return { action: 'raise', amount: raiseTo(input, params.betSize), reason: 'Raised for value' }
    }
    if (has(input, 'call')) {
      const reason = s.hasDraw
        ? `Called: draw (~${s.drawOuts} outs) has the right pot odds`
        : `Called: ${pct(s.equity)} equity beats the ${pct(required)} price`
      return { action: 'call', reason }
    }
  }

  // Not priced in: fold, but mix in an occasional bluff-raise when cheap.
  if (
    has(input, 'raise') &&
    required < 0.45 &&
    s.equity < threshold &&
    input.rng() < params.bluffChance
  ) {
    return { action: 'raise', amount: raiseTo(input, params.betSize), reason: 'Bluff-raise' }
  }
  if (has(input, 'fold')) {
    return { action: 'fold', reason: `Folded: ${pct(s.equity)} equity < ${pct(required)} price` }
  }
  if (has(input, 'check')) return { action: 'check', reason: 'Checked' }
  return { action: 'call', reason: 'Called: no fold available' }
}

function isStrongPair(s: Strength): boolean {
  return s.madeRank === HAND_CATEGORY_RANK.pair && s.equity >= 0.55
}

// ---------------------------------------------------------------------------
// Sizing helpers (always clamped to the legal action in `finalize`)
// ---------------------------------------------------------------------------

function potFraction(input: AIDecisionInput, fraction: number): number {
  return Math.max(input.bigBlind, Math.round(input.pot * fraction))
}

/** A "raise to" total ≈ the call plus a pot fraction; clamped later to [min,max]. */
function raiseTo(input: AIDecisionInput, fraction: number): number {
  const legal = input.legalActions.find((a) => a.action === 'raise')
  const floor = legal?.min ?? input.toCall + input.minRaise
  return Math.round(floor + Math.max(0, input.pot * fraction))
}

// ---------------------------------------------------------------------------
// Legality guard — every decision is forced into `input.legalActions`
// ---------------------------------------------------------------------------

function has(input: AIDecisionInput, action: BettingAction): boolean {
  return input.legalActions.some((a) => a.action === action)
}

function finalize(input: AIDecisionInput, decision: AIDecision): AIDecision {
  const legal = input.legalActions
  if (legal.length === 0) {
    return { action: decision.action, amount: undefined, reason: decision.reason }
  }

  let match = legal.find((a) => a.action === decision.action)
  let reason = decision.reason
  if (!match) {
    // Fall back to the safest available action, preserving intent in the reason.
    const fallback =
      legal.find((a) => a.action === 'check') ??
      legal.find((a) => a.action === 'call') ??
      legal.find((a) => a.action === 'fold') ??
      legal[0]
    match = fallback
    reason = `${decision.reason} (adjusted to legal: ${fallback.action})`
  }

  if (match.action === 'bet' || match.action === 'raise') {
    const lo = match.min ?? 0
    const hi = match.max ?? Math.max(lo, decision.amount ?? lo)
    const amount = clampInt(decision.amount ?? lo, lo, hi)
    return { action: match.action, amount, reason }
  }
  return { action: match.action, amount: undefined, reason }
}

// ---------------------------------------------------------------------------
// Misc utilities
// ---------------------------------------------------------------------------

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function clampInt(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(v)))
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`
}
