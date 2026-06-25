/**
 * LLM-driven table opponents (Phase 2, Feature 2), guard-railed.
 *
 * `decideWithLLM` asks Gemini for a JSON decision, then *validates and clamps* it
 * against the exact legal actions before returning it. Any problem — AI off, bad
 * JSON, illegal action, missing/out-of-range amount, or timeout — resolves to the
 * caller-injected `fallback`. This module deliberately does NOT import the hand
 * engine or opponent AI: the deterministic strategy is injected, keeping the LLM
 * layer independently compilable and safe.
 */
import type { CardId } from '../../types/lesson'
import type { BettingAction, PokerStreet } from '../../types/poker'
import { generateJSON, generateText, isAIConfigured } from './aiClient'

export type OppDecision = { action: BettingAction; amount?: number; reason: string }
export type LegalAction = { action: BettingAction; min?: number; max?: number }

export type LLMOpponentContext = {
  persona?: string
  hole: [CardId, CardId]
  board: CardId[]
  street: PokerStreet
  pot: number
  toCall: number
  stack: number
  minRaise: number
  position?: 'ip' | 'oop'
  legalActions: LegalAction[]
}

type RawDecision = { action?: unknown; amount?: unknown; reason?: unknown }

const OPP_TIMEOUT_MS = 8000
const TABLE_TALK_TIMEOUT_MS = 6000

const DEFAULT_REASONS: Record<BettingAction, string> = {
  fold: 'This is too expensive for my hand.',
  check: 'Happy to take a free card here.',
  call: 'The price looks right to continue.',
  bet: 'Betting to build the pot / apply pressure.',
  raise: 'Raising to put you to a decision.',
}

/**
 * Ask the LLM for an opponent decision, validated/clamped to the legal actions.
 * Falls back to the injected deterministic strategy on any failure.
 */
export async function decideWithLLM(
  ctx: LLMOpponentContext,
  fallback: (ctx: LLMOpponentContext) => OppDecision,
): Promise<OppDecision> {
  if (!isAIConfigured()) return fallback(ctx)

  try {
    const raw = await generateJSON<RawDecision>({
      prompt: buildOpponentPrompt(ctx),
      timeoutMs: OPP_TIMEOUT_MS,
    })
    const decision = raw ? validateDecision(raw, ctx) : null
    return decision ?? fallback(ctx)
  } catch {
    return fallback(ctx)
  }
}

/** A short, in-character quip for flavor, or `null` when AI is off/unavailable. */
export async function getTableTalk(opts: { persona?: string; situation: string }): Promise<string | null> {
  if (!isAIConfigured()) return null

  const persona = opts.persona?.trim() || 'a casino poker regular'
  const prompt = [
    `You are ${persona}, a player at a casino poker table.`,
    `Say a single short, in-character line of table talk for this situation: ${opts.situation}.`,
    'Under 12 words. No quotes, no emojis, no real names. Output only the line.',
  ].join('\n')

  const text = await generateText({ prompt, timeoutMs: TABLE_TALK_TIMEOUT_MS })
  if (!text) return null

  const line = tidyLine(text)
  return line.length > 0 ? line : null
}

// --- validation --------------------------------------------------------------

function validateDecision(raw: RawDecision, ctx: LLMOpponentContext): OppDecision | null {
  const action = typeof raw.action === 'string' ? raw.action.trim().toLowerCase() : ''
  const legal = ctx.legalActions.find((la) => la.action === action)
  if (!legal) return null

  const betting = legal.action as BettingAction
  const reason = cleanReason(raw.reason, betting)

  if (betting === 'bet' || betting === 'raise') {
    const amount = Number(raw.amount)
    if (!Number.isFinite(amount)) return null
    const clamped = clampAmount(amount, legal.min, legal.max)
    if (clamped == null) return null
    return { action: betting, amount: clamped, reason }
  }

  return { action: betting, reason }
}

/** Clamp a chip amount into [min, max]; returns null for nonsensical bounds. */
function clampAmount(amount: number, min?: number, max?: number): number | null {
  if (min != null && max != null && max < min) return null
  let value = Math.round(amount)
  if (min != null) value = Math.max(value, min)
  if (max != null) value = Math.min(value, max)
  return value >= 0 ? value : null
}

function cleanReason(raw: unknown, action: BettingAction): string {
  if (typeof raw === 'string') {
    const text = raw
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^["'“”]+/, '')
      .replace(/["'“”]+$/, '')
      .trim()
    if (text) return text.slice(0, 160)
  }
  return DEFAULT_REASONS[action]
}

// --- prompt ------------------------------------------------------------------

function buildOpponentPrompt(ctx: LLMOpponentContext): string {
  const persona = ctx.persona?.trim() || 'a solid, balanced poker player'
  const board = ctx.board.length > 0 ? ctx.board.join(' ') : '(preflop, no board yet)'
  const position = ctx.position
    ? ctx.position === 'ip'
      ? 'in position (act last)'
      : 'out of position (act first)'
    : 'unknown'

  return [
    `You are ${persona}, playing one hand of No-Limit Texas Hold'em. Decide your next action and stay in character.`,
    '',
    'Spot:',
    `- Street: ${ctx.street}`,
    `- Your hole cards: ${ctx.hole.join(', ')}`,
    `- Board: ${board}`,
    `- Pot: ${ctx.pot}`,
    `- To call: ${ctx.toCall}`,
    `- Your stack: ${ctx.stack}`,
    `- Minimum raise (total): ${ctx.minRaise}`,
    `- Position: ${position}`,
    '',
    'Choose exactly one of these legal actions:',
    `- ${describeLegalActions(ctx)}`,
    '',
    'Respond with ONLY a JSON object (no code fences) in this exact shape:',
    '{"action": "<one legal action>", "amount": <number, REQUIRED only for bet or raise>, "reason": "<short in-character explanation, max ~15 words>"}',
    'For bet or raise, "amount" is the TOTAL chips committed and must fall within the listed min and max.',
  ].join('\n')
}

function describeLegalActions(ctx: LLMOpponentContext): string {
  if (ctx.legalActions.length === 0) return '(none)'
  return ctx.legalActions
    .map((la) => {
      if (la.action === 'call') return `call (to call ${ctx.toCall})`
      if (la.action === 'bet' || la.action === 'raise') {
        return `${la.action} (min ${la.min ?? '?'}, max ${la.max ?? '?'})`
      }
      return la.action
    })
    .join('\n- ')
}

function tidyLine(raw: string): string {
  const firstLine = raw.split('\n').map((line) => line.trim()).find((line) => line.length > 0) ?? ''
  return firstLine
    .replace(/\s+/g, ' ')
    .replace(/^["'“”]+/, '')
    .replace(/["'“”]+$/, '')
    .trim()
    .slice(0, 120)
}
