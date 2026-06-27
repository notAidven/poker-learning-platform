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
import { parseCardId, type CardId } from '../../types/lesson'
import type { BettingAction, EvaluatedHand, HandCategory, PokerStreet } from '../../types/poker'
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
import {
  compareHands,
  evaluateHoldem,
  holeCardsImproveBoard,
  rankValue,
} from '../../lib/poker/handEvaluator'
import {
  decideAI,
  MAX_AI_RAISES_PER_STREET,
  type AIDecisionInput,
  type AITier,
} from '../../lib/poker/opponentAI'
import {
  casinoTierProfile,
  shapePersona,
  shouldQueryLLM,
  type CasinoAiTier,
} from '../../lib/poker/casinoAi'
import { decideWithLLM, type LLMOpponentContext, type OppDecision } from '../../lib/ai/llmOpponent'
import type { CoachContext, DeepCoachContext } from '../../lib/ai/coach'
import { analyzeSpot, type HintContext, type SpotAnalysis } from '../../lib/poker/hints'
import type { TableConfig, TableFeature } from '../../data/tables'
import type { CasinoTableConfig } from '../../data/casinoTables'
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
  /**
   * Casino Floor difficulty band (Phase 3). When set, `decideOpponentAction` routes
   * opponents through the tiered policy in `lib/poker/casinoAi` (rule vs gated LLM)
   * instead of the in-course `opponentSource` branch. Absent for the in-course rooms.
   */
  aiTier?: CasinoAiTier
  /** Whether opponents may emit (light) AI table-talk flavor. Defaults to on. */
  tableTalk?: boolean
}

/** Derive the runtime config (decision source + support mode) from a `TableConfig`. */
export function toRuntimeConfig(table: TableConfig): TableRuntimeConfig {
  const coached = table.feature === 'coached'
  return {
    tableId: table.id,
    title: table.title,
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

/**
 * Derive the runtime config for a Casino Floor table. Casino tables are always
 * "ai" feature with the rule-based hint bar (no coach); the difficulty band
 * (`aiTier`) drives how opponents think via `decideOpponentAction`. `tier` carries
 * the band's rule fallback tier so any rule decision (and the LLM fallback) matches.
 */
export function toCasinoRuntimeConfig(table: CasinoTableConfig): TableRuntimeConfig {
  const profile = casinoTierProfile(table.aiTier)
  return {
    tableId: table.id,
    title: table.name,
    feature: 'ai',
    opponentSource: profile.source,
    tier: profile.ruleTier,
    support: 'hints',
    opponents: table.opponents,
    smallBlind: table.smallBlind,
    bigBlind: table.bigBlind,
    startingStack: table.startingStack,
    aiTier: table.aiTier,
    tableTalk: profile.tableTalk,
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
    raisesThisStreet: state.streetRaiseCount,
    rng: decisionRng(state, seatIndex),
  }
}

export function buildLLMContext(
  state: HandState,
  seatIndex: number,
  persona?: string,
): LLMOpponentContext {
  const seat = state.seats[seatIndex]
  // Apply the same per-street raise cap as the rule AI: once the street has been
  // (re-)raised enough, do not even offer `raise` to the model, so it cannot be
  // talked into an endless 3-bet/4-bet war. It may still call or fold.
  const legal = legalActions(state)
  const capped = state.streetRaiseCount >= MAX_AI_RAISES_PER_STREET
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
    legalActions: capped ? legal.filter((a) => a.action !== 'raise') : legal,
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

/**
 * A richer, table-wide coach context for the "Ask the coach for more" deep read:
 * the per-spot facts plus every seat (persona, stack, chips in, still in or folded)
 * and the hero's position. `personaOf` maps a seat id to its persona string.
 */
export function buildDeepCoachContext(
  state: HandState,
  heroIndex: number,
  personaOf: (seatId: string) => string | undefined,
): DeepCoachContext {
  const base = buildCoachContext(state, heroIndex)
  const seats = state.seats.map((s) => ({
    name: s.name,
    isHero: s.isHero,
    persona: s.isHero ? undefined : personaOf(s.id),
    stack: s.stack,
    committed: s.totalCommitted,
    inHand: !s.folded,
  }))
  return {
    ...base,
    position: positionFor(state, heroIndex),
    bigBlind: state.bb,
    seats,
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
 * The deterministic rule strategy injected into `decideWithLLM`. It maps the LLM
 * context back into an `AIDecisionInput` and runs the rule AI at `tier`, so the
 * table still plays a full hand when AI Logic is off (or the model fails/times out).
 * `tier` lets a casino band pick the fallback strength that matches its difficulty.
 */
export function makeRuleFallback(
  state: HandState,
  seatIndex: number,
  tier: AITier = 3,
): (ctx: LLMOpponentContext) => OppDecision {
  return (ctx) => {
    const input: AIDecisionInput = {
      tier,
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
      raisesThisStreet: state.streetRaiseCount,
      rng: decisionRng(state, seatIndex),
    }
    const d = decideAI(input)
    return { action: d.action, amount: d.amount, reason: d.reason }
  }
}

/**
 * Back-compat alias for the Tier-3 rule fallback injected into `decideWithLLM`
 * (used by the in-course Room 2 path and exercised directly in the unit tests).
 */
export function makeTier3Fallback(
  state: HandState,
  seatIndex: number,
): (ctx: LLMOpponentContext) => OppDecision {
  return makeRuleFallback(state, seatIndex, 3)
}

/** Feature 2 / ai: LLM decision validated + clamped, falling back to a rule-AI tier. */
export async function decideLLMAction(
  state: HandState,
  seatIndex: number,
  persona?: string,
  fallbackTier: AITier = 3,
): Promise<{ applied: AppliedAction; reason: string }> {
  const seat = state.seats[seatIndex]
  if (!seat || !seat.holeCards) return { applied: safeAction(state), reason: '' }
  const ctx = buildLLMContext(state, seatIndex, persona)
  const fallback = makeRuleFallback(state, seatIndex, fallbackTier)
  const d = await decideWithLLM(ctx, fallback)
  return { applied: { action: d.action, amount: d.amount }, reason: d.reason }
}

/**
 * Route a single opponent decision to the right policy, always async so
 * <PokerTable> can `await` one code path regardless of table type.
 *
 *   - In-course tables (no `aiTier`): preserve the EXACT existing behavior —
 *     `opponentSource` picks the synchronous rule AI or the LLM (Tier-3 fallback).
 *   - Casino tables (`aiTier` set): apply the tiered policy in `lib/poker/casinoAi`:
 *       · 'novice' → rule AI at the band tier (no proxy calls);
 *       · 'solid'  → LLM only on spots that matter (else rule fallback), loose persona;
 *       · 'sharp'  → full-strength LLM with a relentless persona.
 *     Every casino path still degrades to the deterministic rule AI when AI is off
 *     (or when a spot is gated out), so a hand always plays to completion.
 */
export async function decideOpponentAction(
  state: HandState,
  seatIndex: number,
  config: TableRuntimeConfig,
  persona?: string,
): Promise<{ applied: AppliedAction; reason: string }> {
  if (!config.aiTier) {
    return config.opponentSource === 'rule'
      ? decideRuleAction(state, seatIndex, config.tier)
      : decideLLMAction(state, seatIndex, persona)
  }

  const profile = casinoTierProfile(config.aiTier)
  if (profile.source === 'rule') {
    return decideRuleAction(state, seatIndex, profile.ruleTier)
  }

  const spot = { street: streetOf(state), toCall: toCallFor(state, seatIndex) }
  if (!shouldQueryLLM(config.aiTier, spot)) {
    return decideRuleAction(state, seatIndex, profile.ruleTier)
  }
  return decideLLMAction(
    state,
    seatIndex,
    shapePersona(persona, profile.personaStyle),
    profile.ruleTier,
  )
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

  const seats = survivors.map((s) => ({
    id: s.id,
    name: s.name,
    isHero: s.isHero,
    stack: s.stack,
  }))

  // Advance the button one seat clockwise from the OLD button position, skipping any
  // busted seats. We walk the PREVIOUS seat ordering (not the compacted survivor
  // list) so the button/blinds stay correct even when the previous button player
  // busted — finding the old button id in the compacted list would return -1 and
  // wrongly fall back to seat 0, misplacing the button and blinds.
  const n = prev.seats.length
  let nextButtonId = seats[0].id
  for (let step = 1; step <= n; step++) {
    const seat = prev.seats[(prev.buttonIndex + step) % n]
    if (seat.stack > 0) {
      nextButtonId = seat.id
      break
    }
  }
  const foundIndex = seats.findIndex((s) => s.id === nextButtonId)
  const buttonIndex = foundIndex >= 0 ? foundIndex : 0
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

/**
 * Reaction for the case where the hero's made hand is entirely on the board (a
 * shared board pair / "playing the board"), with no draw of their own. The coach
 * must NOT present that shared hand as the hero's asset.
 */
function composeBoardSharedReaction(hero: BettingAction, a: SpotAnalysis): string {
  const shared = a.boardMadeLabel ? lowerFirst(a.boardMadeLabel) : 'made hand'
  const note = `that ${shared} is on the board, so everyone shares it and it is not your hand`
  switch (hero) {
    case 'fold':
      return `Good fold. ${upperFirst(note)}, so there was nothing of your own to keep going with.`
    case 'check':
      return `Smart check. ${upperFirst(note)}, so keep the pot small until your hole cards actually connect.`
    case 'call':
      return `Careful here. ${upperFirst(note)}. Your hole cards have not connected, so you effectively have high-card strength; make sure the price is right before paying off a bet.`
    case 'bet':
    case 'raise':
      return `${upperFirst(note)}. Betting this is a bluff and not value, since your hole cards have not improved on the board, so only do it with a clear plan.`
    default:
      return `${upperFirst(note)}, so treat it as a weak holding until your hole cards connect.`
  }
}

/** Pure formatter for the coach reaction (exported for tests). */
export function composeCoachReaction(
  hero: BettingAction,
  rec: BettingAction,
  a: SpotAnalysis,
): string {
  // Playing the board (a shared board hand, no draw of the hero's own): correct the
  // read instead of treating the board's hand as the hero's.
  if (a.madeLabel != null && a.madeFromHole === false && !a.drawName) {
    return composeBoardSharedReaction(hero, a)
  }

  const strong = a.madeCategory ? STRONG_MADE.has(a.madeCategory) && a.madeFromHole !== false : false
  const handBit =
    a.madeLabel && a.madeFromHole !== false
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
// Result-aware end-of-hand coach reflection (Room 1) — a supportive "what just
// happened" recap shown once the hand is OVER (showdown or everyone folded).
//
// Where `coachReactionFor` reacts to a single action in the moment, this factors
// in HOW the hand ended: did the hero win or lose, how big was the pot, what was
// the hero's final hand, and — at showdown — the hand that beat them plus whether
// an obvious draw completed on the board (a 3-flush, a 4-card straight, or a
// paired board). It is deliberately NOT results-oriented: a well-priced call that
// lost is framed as variance ("keep making it"), while a loose call into a danger
// board is gently corrected ("a spot to consider folding"). Pure + AI-free; the
// formatter is exported and unit-tested directly.
// ---------------------------------------------------------------------------

/** A completed-draw threat visible on the final board. */
export type BoardThreat = 'flush' | 'straight' | 'board-pair' | null

/** Structured, result-aware read of a finished hand (the formatter's input). */
export type HandResultRead = {
  /** Did the hand reach showdown, so the opponents' cards are revealed? */
  reachedShowdown: boolean
  /** Did the hero win any pot? */
  heroWon: boolean
  /** A meaningful pot relative to the blinds (wording emphasis only). */
  bigPot: boolean
  /** Hero's final hand category + label (null when it cannot be read). */
  heroCategory: HandCategory | null
  heroLabel: string | null
  /** Hero's final hand is two pair or better AND made with the hero's hole cards. */
  heroStrong: boolean
  /** The hero's made hand was entirely on the board (they were playing the board). */
  heroPlayedBoard: boolean
  /** At showdown: the hand that beat the hero (best non-hero shown hand). */
  villainCategory: HandCategory | null
  villainLabel: string | null
  /** A scary draw visibly completed on the board, or the board paired. */
  boardThreat: BoardThreat
  /** The hero's continue was defensible on price/equity (a real, live draw). */
  pricedIn: boolean
  /** The hero was chasing a genuine flush / open-ended straight draw. */
  heroHadDraw: boolean
  /** A previously passive opponent suddenly bet or raised on the turn / river. */
  passiveThenAggressive: boolean
}

/** Pot >= this many big blinds reads as "a big pot" for wording emphasis. */
const BIG_POT_BB = 25

/** Read the most salient completed-draw threat off the final board (pure). */
export function boardThreatOf(board: CardId[]): BoardThreat {
  if (board.length < 3) return null

  // Flush threat: three or more of a single suit already sit on the board.
  const suitCounts = new Map<string, number>()
  for (const c of board) {
    const { suit } = parseCardId(c)
    suitCounts.set(suit, (suitCounts.get(suit) ?? 0) + 1)
  }
  if ([...suitCounts.values()].some((n) => n >= 3)) return 'flush'

  // Straight threat: four board cards fall inside some 5-rank window (Ace high/low).
  const present = new Set<number>()
  for (const c of board) {
    const v = rankValue(c)
    present.add(v)
    if (v === 14) present.add(1)
  }
  for (let low = 1; low <= 10; low++) {
    let inWindow = 0
    for (let k = 0; k < 5; k++) if (present.has(low + k)) inWindow++
    if (inWindow >= 4) return 'straight'
  }

  // Paired board: a rank appears at least twice among the community cards.
  const rankCounts = new Map<number, number>()
  for (const c of board) {
    const v = rankValue(c)
    rankCounts.set(v, (rankCounts.get(v) ?? 0) + 1)
  }
  if ([...rankCounts.values()].some((n) => n >= 2)) return 'board-pair'

  return null
}

/**
 * Best-effort read of the hero's decisive continue: did they hold a genuine, live
 * draw (a flush draw or an open-ended straight draw) on the flop or turn? Such a
 * draw makes a call defensible on price even when it ultimately bricks, which is
 * the difference between variance and a leak. The engine deals the board in order,
 * so a prefix of the final board reconstructs an earlier street; `analyzeSpot`
 * then reports the draw. We treat 8+ clean outs as "priced in" for typical bets.
 */
export function readHeroContinue(
  hole: [CardId, CardId],
  board: CardId[],
): { heroHadDraw: boolean; pricedIn: boolean } {
  let heroHadDraw = false
  for (const len of [3, 4] as const) {
    if (board.length < len) break
    const a = analyzeSpot({
      hole,
      board: board.slice(0, len),
      street: len === 3 ? 'flop' : 'turn',
      pot: 0,
      toCall: 0,
    })
    const liveDraw =
      a.drawName === 'flush draw' ||
      a.drawName === 'open-ended straight draw' ||
      a.drawName === 'flush draw + straight draw'
    if (liveDraw && a.outs != null && a.outs >= 8) heroHadDraw = true
  }
  return { heroHadDraw, pricedIn: heroHadDraw }
}

/** The strongest non-hero seat still in at showdown — i.e. the hand that won. */
function bestVillainAtShowdown(state: HandState, heroId: string): SeatState | null {
  let best: SeatState | null = null
  let bestHand: EvaluatedHand | null = null
  for (const seat of state.seats) {
    if (seat.id === heroId || seat.folded || !seat.holeCards) continue
    let hand: EvaluatedHand
    try {
      hand = evaluateHoldem(seat.holeCards, state.board)
    } catch {
      continue
    }
    if (!bestHand || compareHands(hand, bestHand) > 0) {
      bestHand = hand
      best = seat
    }
  }
  return best
}

/**
 * Did `villainName` play passively (only checks/calls) and THEN fire a bet or raise
 * on the turn or river? Parses the engine's stable log lines; deterministic.
 */
export function readPassiveThenAggressive(log: string[], villainName: string): boolean {
  let street: PokerStreet = 'preflop'
  let sawPassive = false
  const prefix = `${villainName} `
  for (const line of log) {
    if (line.startsWith('Flop:')) street = 'flop'
    else if (line.startsWith('Turn:')) street = 'turn'
    else if (line.startsWith('River:')) street = 'river'
    else if (line.startsWith(prefix)) {
      const rest = line.slice(prefix.length)
      if (rest.startsWith('checks') || rest.startsWith('calls')) {
        sawPassive = true
      } else if (rest.startsWith('bets') || rest.startsWith('raises')) {
        if (sawPassive && (street === 'turn' || street === 'river')) return true
      }
    }
  }
  return false
}

/**
 * Build a result-aware reflection for a finished hand. `finalState` is the settled
 * hand (phase 'complete'); `heroIndex` is the hero's seat. Returns '' when there is
 * nothing to reflect on (no hero, or the hero folded earlier so the in-the-moment
 * fold note already stands). Pure + AI-free.
 */
export function coachResultReaction(finalState: HandState, heroIndex: number): string {
  const hero = finalState.seats[heroIndex]
  if (!hero) return ''
  // The hero gave the hand up earlier; let the in-the-moment fold note be the word.
  if (hero.folded) return ''

  const summary = summarizeHand(finalState)
  const board = finalState.board
  const heroWon = summary.winnerIds.includes(hero.id)
  const bigPot = finalState.pot >= BIG_POT_BB * Math.max(1, finalState.bb)

  let heroCategory: HandCategory | null = null
  let heroLabel: string | null = null
  let heroMadeFromHole = true
  if (hero.holeCards && board.length >= 3) {
    try {
      const e = evaluateHoldem(hero.holeCards, board)
      heroCategory = e.category
      heroLabel = e.label
      heroMadeFromHole = holeCardsImproveBoard(hero.holeCards, board)
    } catch {
      // Leave null and fall back to generic wording.
    }
  }
  // A shared board hand (the hero "played the board") is not the hero's strength.
  const heroStrong = heroCategory ? STRONG_MADE.has(heroCategory) && heroMadeFromHole : false
  const heroPlayedBoard = heroCategory != null && !heroMadeFromHole

  const villain = summary.reachedShowdown ? bestVillainAtShowdown(finalState, hero.id) : null
  let villainCategory: HandCategory | null = null
  let villainLabel: string | null = null
  if (villain?.holeCards) {
    try {
      const e = evaluateHoldem(villain.holeCards, board)
      villainCategory = e.category
      villainLabel = e.label
    } catch {
      // Leave null.
    }
  }

  const boardThreat = summary.reachedShowdown ? boardThreatOf(board) : null
  const { heroHadDraw, pricedIn } = hero.holeCards
    ? readHeroContinue(hero.holeCards, board)
    : { heroHadDraw: false, pricedIn: false }
  const passiveThenAggressive = villain
    ? readPassiveThenAggressive(finalState.log, villain.name)
    : false

  return composeCoachResultReaction({
    reachedShowdown: summary.reachedShowdown,
    heroWon,
    bigPot,
    heroCategory,
    heroLabel,
    heroStrong,
    heroPlayedBoard,
    villainCategory,
    villainLabel,
    boardThreat,
    pricedIn,
    heroHadDraw,
    passiveThenAggressive,
  })
}

/** Pure formatter for the end-of-hand reflection (exported for tests). */
export function composeCoachResultReaction(r: HandResultRead): string {
  const heroHand = r.heroLabel ? lowerFirst(r.heroLabel) : 'your hand'
  const beat = r.villainLabel ? lowerFirst(r.villainLabel) : 'a stronger hand'
  const potBit = r.bigPot ? 'a big pot' : 'the pot'
  const villainStrong = r.villainCategory ? STRONG_MADE.has(r.villainCategory) : false

  // --- Hero won --------------------------------------------------------------
  if (r.heroWon) {
    if (!r.reachedShowdown) {
      return 'You took it down without a showdown. Getting opponents to fold is a great way to win pots, so nice work applying pressure.'
    }
    if (r.heroStrong) {
      return `Great result. Your ${heroHand} was the best hand and took down ${potBit}. When you are ahead like that, keep betting for value so you get paid off.`
    }
    if (r.pricedIn && r.heroHadDraw) {
      return `Nice, your draw got there and won ${potBit}. That was a fair price to chase, so keep taking those when the odds are right.`
    }
    // Won with a weak, loose holding: celebrate it, but nudge toward selectivity.
    return `That one got there for you. Winning ${potBit} feels good, but ${heroHand} was on the thin side to put chips in with, so try to be a little more selective with weak hands next time.`
  }

  // --- Hero lost, no showdown (they were still contesting but missed) ---------
  if (!r.reachedShowdown) {
    return 'That one did not go your way, and with no showdown there is nothing to read into it. Shake it off and bring the same focus to the next hand.'
  }

  // --- Hero lost at showdown -------------------------------------------------
  // Playing the board: the made hand was shared, never the hero's, so name that
  // plainly rather than mourning a hand they did not really have.
  if (r.heroPlayedBoard && !r.pricedIn) {
    return `Key read: ${heroHand} was on the board, shared by everyone, so it was not your hand. Your hole cards did not improve on it, so you could only win by beating that shared hand; against a big bet there, folding is usually the play.`
  }

  // A loose call into a danger board is a real leak to gently correct. Note it is
  // the danger signals + a weak hand that make it a leak, NOT the loss by itself.
  if (!r.heroStrong && r.boardThreat && villainStrong && !r.pricedIn) {
    const completed =
      r.boardThreat === 'flush'
        ? 'a flush completes'
        : r.boardThreat === 'straight'
          ? 'a straight completes'
          : 'the board pairs'
    const lead = r.passiveThenAggressive
      ? `When a player who has been passive suddenly bets big and ${completed}, `
      : `When ${completed} and you hold one pair, `
    return `${lead}one pair is usually beaten. You held ${heroHand} and ran into ${beat}, so that is a good spot to consider folding and saving those chips for a better one.`
  }

  // A well-priced continue that simply lost is variance, not a mistake.
  if (r.pricedIn) {
    return r.heroHadDraw
      ? 'Tough one, but no mistake. Your draw was getting the right price, it just did not get there this time. That is variance, not a leak, so keep making that call when the odds are right.'
      : `Tough beat, but no mistake. You had the right price to call and simply ran into ${beat}. Keep making that call and the math pays off over time.`
  }

  // Lost with a genuinely strong hand: a cooler, not a leak.
  if (r.heroStrong) {
    return `Nothing you could do there. Your ${heroHand} ran into ${beat}, which is just a cooler. No leak, so keep playing your strong hands strongly.`
  }

  // Lost with a weak hand on a quieter board: a gentle reminder, no scolding.
  return `You ran into ${beat} there. One pair can be tricky to call big bets with, so weigh how likely you are already beaten before putting in more chips.`
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
