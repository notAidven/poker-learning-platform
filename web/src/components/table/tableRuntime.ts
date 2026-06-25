/**
 * Adapter glue between the pure hand engine and the AI layer for the casino tables.
 *
 * The engine (`lib/poker/handEngine`) is React-free and knows nothing about AI.
 * The AI modules (`lib/poker/opponentAI`, `lib/ai/*`, `lib/poker/hints`) are pure
 * but each wants a slightly different "context" object. This module builds those
 * contexts from a live `HandState` + the acting seat index, computes the small
 * heuristics they need (position, opponent count, a deterministic RNG), and maps
 * decisions back into the engine's `AppliedAction` shape.
 *
 * Feature 1 (coached) opponents decide synchronously via `decideAI`.
 * Feature 2 (ai) opponents decide via `decideWithLLM`, which is *injected* with a
 * deterministic Tier-3 `decideAI` fallback — so a hand still plays start to finish
 * with AI un-provisioned. Nothing here imports React, so it is unit-testable.
 */
import type { CardId } from '../../types/lesson'
import type { PokerStreet } from '../../types/poker'
import {
  createHand,
  legalActions,
  runShowdown,
  settle,
  toCallFor,
  type AppliedAction,
  type HandState,
  type PotResult,
  type SeatState,
} from '../../lib/poker/handEngine'
import { decideAI, type AIDecisionInput, type AITier } from '../../lib/poker/opponentAI'
import { decideWithLLM, type LLMOpponentContext, type OppDecision } from '../../lib/ai/llmOpponent'
import type { CoachContext } from '../../lib/ai/coach'
import type { HintContext } from '../../lib/poker/hints'
import type { TableConfig, TableFeature } from '../../data/tables'
import type { SeatRole } from './Seat'

// ---------------------------------------------------------------------------
// Runtime config consumed by <PokerTable>
// ---------------------------------------------------------------------------

/** How a non-hero seat reaches its decision. */
export type OpponentSource = 'rule' | 'llm'

/** Which assist the hero gets: the AI coach (Feature 1) or the rule hint bar (Feature 2). */
export type SupportMode = 'coach' | 'hints'

export type TableRuntimeConfig = {
  tableId: string
  title: string
  subtitle?: string
  feature: TableFeature
  /** 'rule' = synchronous `decideAI` (Feature 1); 'llm' = `decideWithLLM` + fallback (Feature 2). */
  opponentSource: OpponentSource
  /** Difficulty tier for the rule AI. The Feature-2 LLM fallback always uses Tier 3. */
  tier: AITier
  support: SupportMode
  opponents: { name: string; persona?: string }[]
  smallBlind: number
  bigBlind: number
  startingStack: number
}

/** Derive the runtime config (decision source + support mode) from a `TableConfig`. */
export function toRuntimeConfig(table: TableConfig): TableRuntimeConfig {
  const coached = table.feature === 'coached'
  return {
    tableId: table.id,
    title: table.title,
    subtitle: table.subtitle,
    feature: table.feature,
    opponentSource: coached ? 'rule' : 'llm',
    tier: table.tier,
    support: coached ? 'coach' : 'hints',
    opponents: table.opponents,
    smallBlind: table.smallBlind,
    bigBlind: table.bigBlind,
    startingStack: table.startingStack,
  }
}

// ---------------------------------------------------------------------------
// Small heuristics shared by every context builder
// ---------------------------------------------------------------------------

/** The betting street for AI/hint context. Only meaningful while a seat is to act. */
export function streetOf(state: HandState): PokerStreet {
  switch (state.phase) {
    case 'flop':
      return 'flop'
    case 'turn':
      return 'turn'
    case 'river':
    case 'showdown':
    case 'complete':
      return 'river'
    default:
      return 'preflop'
  }
}

/**
 * Position heuristic: a seat is "in position" when it is the LAST non-folded seat
 * to act on the street. Postflop action runs button+1 … button, so the last active
 * seat is the nearest non-folded seat to (and including) the button.
 */
export function positionFor(state: HandState, seatIndex: number): 'ip' | 'oop' {
  const n = state.seats.length
  for (let off = 0; off < n; off++) {
    const idx = (state.buttonIndex - off + n) % n
    if (!state.seats[idx].folded) {
      return idx === seatIndex ? 'ip' : 'oop'
    }
  }
  return 'oop'
}

/** Other non-folded seats still contesting the pot. */
export function liveOpponents(state: HandState, seatIndex: number): number {
  return state.seats.reduce((n, s, i) => (i !== seatIndex && !s.folded ? n + 1 : n), 0)
}

/**
 * Deterministic per-decision RNG seeded from `state.seed` plus the spot, so the AI
 * is reproducible and a double-fired effect can never produce a different action
 * for the same state.
 */
export function decisionRng(state: HandState, seatIndex: number): () => number {
  let a =
    (state.seed ^
      Math.imul(seatIndex + 1, 0x9e3779b1) ^
      Math.imul(state.board.length + 1, 0x85ebca6b) ^
      Math.imul(state.pot + 1, 0xc2b2ae35)) >>>
    0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function holeOf(seat: SeatState): [CardId, CardId] {
  if (!seat.holeCards) throw new Error('Seat has no hole cards yet')
  return seat.holeCards
}

/** Safest legal action for a seat (used only as a last-resort guard). */
export function safeAction(state: HandState): AppliedAction {
  const legal = legalActions(state)
  const pick =
    legal.find((a) => a.action === 'check') ??
    legal.find((a) => a.action === 'call') ??
    legal.find((a) => a.action === 'fold') ??
    legal[0]
  return pick ? { action: pick.action } : { action: 'check' }
}

// ---------------------------------------------------------------------------
// Context builders
// ---------------------------------------------------------------------------

export function buildAIDecisionInput(
  state: HandState,
  seatIndex: number,
  tier: AITier,
): AIDecisionInput {
  const seat = state.seats[seatIndex]
  return {
    tier,
    hole: holeOf(seat),
    board: state.board,
    street: streetOf(state),
    pot: state.pot,
    toCall: toCallFor(state, seatIndex),
    minRaise: state.minRaise,
    stack: seat.stack,
    bigBlind: state.bb,
    position: positionFor(state, seatIndex),
    opponents: liveOpponents(state, seatIndex),
    legalActions: legalActions(state),
    rng: decisionRng(state, seatIndex),
  }
}

export function buildLLMContext(
  state: HandState,
  seatIndex: number,
  persona?: string,
): LLMOpponentContext {
  const seat = state.seats[seatIndex]
  return {
    persona,
    hole: holeOf(seat),
    board: state.board,
    street: streetOf(state),
    pot: state.pot,
    toCall: toCallFor(state, seatIndex),
    stack: seat.stack,
    minRaise: state.minRaise,
    position: positionFor(state, seatIndex),
    legalActions: legalActions(state),
  }
}

export function buildCoachContext(state: HandState, heroIndex: number): CoachContext {
  const seat = state.seats[heroIndex]
  return {
    hole: holeOf(seat),
    board: state.board,
    street: streetOf(state),
    pot: state.pot,
    toCall: toCallFor(state, heroIndex),
    heroStack: seat.stack,
    opponentsInHand: liveOpponents(state, heroIndex),
    legalActions: legalActions(state),
  }
}

export function buildHintContext(state: HandState, heroIndex: number): HintContext {
  const seat = state.seats[heroIndex]
  return {
    hole: holeOf(seat),
    board: state.board,
    street: streetOf(state),
    pot: state.pot,
    toCall: toCallFor(state, heroIndex),
    position: positionFor(state, heroIndex),
  }
}

// ---------------------------------------------------------------------------
// Decisions (mapped back into the engine's AppliedAction)
// ---------------------------------------------------------------------------

/** Feature 1 / coached: synchronous rule decision. */
export function decideRuleAction(
  state: HandState,
  seatIndex: number,
  tier: AITier,
): { applied: AppliedAction; reason: string } {
  const seat = state.seats[seatIndex]
  if (!seat || !seat.holeCards) return { applied: safeAction(state), reason: '' }
  const d = decideAI(buildAIDecisionInput(state, seatIndex, tier))
  return { applied: { action: d.action, amount: d.amount }, reason: d.reason }
}

/**
 * The deterministic Tier-3 strategy injected into `decideWithLLM`. It maps the
 * LLM context back into an `AIDecisionInput` and runs the rule AI, so the table
 * still plays a full hand when AI Logic is off (or the model fails/times out).
 */
export function makeTier3Fallback(
  state: HandState,
  seatIndex: number,
): (ctx: LLMOpponentContext) => OppDecision {
  return (ctx) => {
    const input: AIDecisionInput = {
      tier: 3,
      hole: ctx.hole,
      board: ctx.board,
      street: ctx.street,
      pot: ctx.pot,
      toCall: ctx.toCall,
      minRaise: ctx.minRaise,
      stack: ctx.stack,
      bigBlind: state.bb,
      position: ctx.position,
      opponents: liveOpponents(state, seatIndex),
      legalActions: ctx.legalActions,
      rng: decisionRng(state, seatIndex),
    }
    const d = decideAI(input)
    return { action: d.action, amount: d.amount, reason: d.reason }
  }
}

/** Feature 2 / ai: LLM decision validated + clamped, falling back to Tier-3 rule AI. */
export async function decideLLMAction(
  state: HandState,
  seatIndex: number,
  persona?: string,
): Promise<{ applied: AppliedAction; reason: string }> {
  const seat = state.seats[seatIndex]
  if (!seat || !seat.holeCards) return { applied: safeAction(state), reason: '' }
  const ctx = buildLLMContext(state, seatIndex, persona)
  const fallback = makeTier3Fallback(state, seatIndex)
  const d = await decideWithLLM(ctx, fallback)
  return { applied: { action: d.action, amount: d.amount }, reason: d.reason }
}

// ---------------------------------------------------------------------------
// Hand lifecycle (pure) — used by <PokerTable> and unit-tested directly
// ---------------------------------------------------------------------------

export type HandSummary = {
  reachedShowdown: boolean
  pots: PotResult[]
  /** Union of every pot's winner ids (handy for "did the hero win?"). */
  winnerIds: string[]
}

/**
 * Build the first hand of a table session: hero in seat 0, opponents after. The
 * hero buys in with `heroStack` (their bankroll); opponents use the table's
 * `startingStack`. Defaults the hero to the table stack when no bankroll is given.
 */
export function createInitialHand(
  config: TableRuntimeConfig,
  seed: number,
  heroName: string,
  heroStack: number = config.startingStack,
): HandState {
  const seats = [
    { id: 'hero', name: heroName, isHero: true, stack: Math.max(0, Math.floor(heroStack)) },
    ...config.opponents.map((o, i) => ({
      id: `opp-${i}`,
      name: o.name,
      isHero: false,
      stack: config.startingStack,
    })),
  ]
  return createHand({
    seats,
    buttonIndex: 0,
    smallBlind: config.smallBlind,
    bigBlind: config.bigBlind,
    seed,
  })
}

/**
 * Start the next hand: carry stacks forward, drop busted seats, advance the button
 * to the next survivor, and use a fresh (deterministic) seed. Returns null when
 * fewer than two players remain (the table is over).
 */
export function createNextHand(prev: HandState, config: TableRuntimeConfig): HandState | null {
  const survivors = prev.seats.filter((s) => s.stack > 0)
  if (survivors.length < 2) return null

  const prevButtonId = prev.seats[prev.buttonIndex]?.id
  const seats = survivors.map((s) => ({
    id: s.id,
    name: s.name,
    isHero: s.isHero,
    stack: s.stack,
  }))
  const prevButtonSeat = seats.findIndex((s) => s.id === prevButtonId)
  const buttonIndex = ((prevButtonSeat >= 0 ? prevButtonSeat : 0) + 1) % seats.length
  const seed = (prev.seed + 0x9e3779b9) >>> 0

  return createHand({
    seats,
    buttonIndex,
    smallBlind: config.smallBlind,
    bigBlind: config.bigBlind,
    seed,
  })
}

/**
 * Settle a hand the moment it ends so the stored state is always paid out. Streets
 * still being bet are returned unchanged.
 */
export function finalizeHand(next: HandState): HandState {
  return next.phase === 'showdown' || next.phase === 'complete' ? settle(next) : next
}

/**
 * Pot results read off a hand. Safe on a settled hand: `settle` never touches
 * `totalCommitted` / `board` / `holeCards` / `folded`, so the pot layers are stable.
 */
export function summarizeHand(state: HandState): HandSummary {
  const stillIn = state.seats.filter((s) => !s.folded)
  if (stillIn.length <= 1) {
    const winner = stillIn[0]
    return {
      reachedShowdown: false,
      pots: [
        {
          amount: state.pot,
          eligibleSeatIds: winner ? [winner.id] : [],
          winnerSeatIds: winner ? [winner.id] : [],
        },
      ],
      winnerIds: winner ? [winner.id] : [],
    }
  }
  const { pots } = runShowdown(state)
  const winnerIds = [...new Set(pots.flatMap((p) => p.winnerSeatIds))]
  return { reachedShowdown: true, pots, winnerIds }
}

/** The BTN / SB / BB badge for a seat (heads-up: the button is the small blind). */
export function roleFor(state: HandState, index: number): SeatRole {
  const n = state.seats.length
  const sb = n === 2 ? state.buttonIndex : (state.buttonIndex + 1) % n
  const bb = n === 2 ? (state.buttonIndex + 1) % n : (state.buttonIndex + 2) % n
  if (index === state.buttonIndex) return 'BTN'
  if (index === sb) return 'SB'
  if (index === bb) return 'BB'
  return null
}
