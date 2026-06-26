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
import type { BettingAction, HandCategory, PokerStreet } from '../../types/poker'
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
import { analyzeSpot, type HintContext, type SpotAnalysis } from '../../lib/poker/hints'
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

// ---------------------------------------------------------------------------
// Rule-based coach reaction (Room 1) — a supportive, GUIDING note about the play
// the hero just made. Pure and AI-free: it reads the spot with `analyzeSpot` and
// compares the hero's action to the Tier-3 rule recommendation (`decideAI`), so it
// works fully with AI off. Tested directly in tableRuntime.test.ts.
// ---------------------------------------------------------------------------

const STRONG_MADE: Set<HandCategory> = new Set([
  'two-pair',
  'trips',
  'straight',
  'flush',
  'full-house',
  'quads',
  'straight-flush',
  'royal-flush',
])

function lowerFirst(s: string): string {
  return s.length > 0 ? s[0].toLowerCase() + s.slice(1) : s
}

function upperFirst(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s
}

/**
 * A short, supportive coaching reaction to the action the hero just took, derived
 * from the rule logic (no AI). `state` is the pre-action hand (the hero's turn),
 * `action` is what they chose. Returns '' when there is nothing to read.
 */
export function coachReactionFor(
  state: HandState,
  heroIndex: number,
  action: BettingAction,
): string {
  const seat = state.seats[heroIndex]
  if (!seat || !seat.holeCards) return ''
  const analysis = analyzeSpot(buildHintContext(state, heroIndex))
  const rec = decideAI(buildAIDecisionInput(state, heroIndex, 3))
  return composeCoachReaction(action, rec.action, analysis)
}

/** Pure formatter for the coach reaction (exported for tests). */
export function composeCoachReaction(
  hero: BettingAction,
  rec: BettingAction,
  a: SpotAnalysis,
): string {
  const strong = a.madeCategory ? STRONG_MADE.has(a.madeCategory) : false
  const handBit = a.madeLabel
    ? `your ${lowerFirst(a.madeLabel)}`
    : a.drawName
      ? `your ${a.drawName}`
      : 'this hand'
  const odds = a.potOddsPct

  switch (hero) {
    case 'fold':
      if (rec === 'fold') {
        return a.drawName
          ? `Good discipline. A ${a.drawName} that is not getting the right price is a fine fold, and you keep your chips for a better spot.`
          : 'Good fold. With little to continue with, folding keeps your chips for a stronger hand.'
      }
      return strong
        ? `That is a safe fold, but ${handBit} was strong enough to keep going. No harm done, just one to notice next time.`
        : `Folding is safe here, though ${handBit} could have continued. You can trust spots like this a little more.`
    case 'check':
      if (rec === 'bet' || rec === 'raise') {
        return strong
          ? `Steady, but with ${handBit} you can bet for value and get paid by weaker hands. Try a bet here next time.`
          : 'Checking keeps the pot small, which is fine. When you hold a strong hand, look to bet it for value.'
      }
      return 'Good check. With a marginal hand, taking a free card and keeping the pot small is the disciplined play.'
    case 'call':
      if (rec === 'raise') {
        return `Solid call, and nice that you stayed in. With ${handBit} you could even raise for value to build the pot.`
      }
      if (rec === 'fold') {
        return odds != null
          ? `That call is on the loose side. You needed about ${odds}% to call, so make sure the hand clears that price.`
          : 'That call is a touch loose. Weigh your hand strength against the price before you call.'
      }
      return a.drawName && a.pricedIn
        ? `Good call. Your ${a.drawName} is getting the right price, so chasing it is profitable.`
        : `Good call. ${upperFirst(handBit)} is worth continuing at this price.`
    case 'bet':
      if (rec === 'bet' || rec === 'raise') {
        return strong
          ? `Great value bet with ${handBit}. Betting while you are ahead builds the pot you will usually win.`
          : a.drawName
            ? `Nice aggression. Betting your ${a.drawName} adds fold equity to the outs you already have.`
            : 'Nice bet. Putting on pressure can win the pot right now.'
      }
      return 'Betting can work as a bluff, but with a weak hand checking is often safer. Bet with a clear plan for why.'
    case 'raise':
      if (rec === 'raise' || rec === 'bet') {
        return strong
          ? `Great raise. With ${handBit} you raise for value and make weaker hands pay.`
          : 'Strong, aggressive play. Keep your bluff-raises balanced so you are not doing it too often.'
      }
      if (rec === 'call') {
        return `Aggressive line. Raising is fine, though calling also kept you in cheaply with ${handBit}.`
      }
      return 'Bold raise. With little equity that is a bluff, which can work, but pick your spots so you do not bluff too much.'
    default:
      return 'Nice. Keep weighing your hand strength against the price before each move.'
  }
}

// ---------------------------------------------------------------------------
// Hand log — grouped by street for a clean, readable feed
// ---------------------------------------------------------------------------

export type HandLogGroup = {
  /** 'Preflop' | 'Flop' | 'Turn' | 'River' | 'Result'. */
  label: string
  /** Community cards dealt on this street (Flop/Turn/River), as a "AS KD 2C" string. */
  cards?: string
  entries: string[]
}

/**
 * Turn the engine's flat `log` into clean per-street groups: the blind posts and
 * preflop action, then one group per dealt street (carrying its cards), then a
 * "Result" group for the showdown / payout lines. Pure dealing noise
 * ("Dealt ... two cards") is dropped so the feed stays concise. Used by the table
 * hand-log panel; pure, so it is unit-tested directly.
 */
export function groupHandLog(log: string[]): HandLogGroup[] {
  const groups: HandLogGroup[] = []
  let current: HandLogGroup = { label: 'Preflop', entries: [] }

  const flush = () => {
    if (current.entries.length > 0 || current.cards) groups.push(current)
  }

  for (const line of log) {
    if (line.startsWith('Dealt ')) continue // dealing noise

    const flop = /^Flop:\s*(.+)$/.exec(line)
    const turn = /^Turn:\s*(.+)$/.exec(line)
    const river = /^River:\s*(.+)$/.exec(line)
    if (flop) {
      flush()
      current = { label: 'Flop', cards: flop[1], entries: [] }
      continue
    }
    if (turn) {
      flush()
      current = { label: 'Turn', cards: turn[1], entries: [] }
      continue
    }
    if (river) {
      flush()
      current = { label: 'River', cards: river[1], entries: [] }
      continue
    }

    // Showdown / payout lines collect into a single "Result" group at the end.
    if (/\b(shows|wins|split)\b/.test(line)) {
      if (current.label !== 'Result') {
        flush()
        current = { label: 'Result', entries: [] }
      }
      current.entries.push(line)
      continue
    }

    current.entries.push(line)
  }

  flush()
  return groups
}
