/**
 * AI poker coach (Phase 2, Feature 1).
 *
 * Produces a short, concept-naming coaching tip for the hero's current spot. The
 * prompt is *grounded*: it includes the real cards, the same made-hand / outs /
 * equity / pot-odds heuristics used by `lib/poker/hints.ts`, the legal actions,
 * and plain-language glossary definitions of the concepts in play. When AI Logic
 * is unavailable or the call fails, it returns the rule-based hint instead, so the
 * coach always responds.
 */
import type { CardId } from '../../types/lesson'
import { HAND_CATEGORY_RANK, type BettingAction, type PokerStreet } from '../../types/poker'
import { lookupGlossaryTerm } from '../../data/glossary'
import { rankValue } from '../poker/handEvaluator'
import { analyzeSpot, type HintContext, type SpotAnalysis } from '../poker/hints'
import { generateText, isAIConfigured } from './aiClient'
import { describeLegalActions, tidyModelText } from './aiText'

export type CoachContext = {
  hole: [CardId, CardId]
  board: CardId[]
  street: PokerStreet
  pot: number
  toCall: number
  heroStack: number
  opponentsInHand: number
  legalActions: { action: BettingAction; min?: number; max?: number }[]
}

export type CoachTip = {
  text: string
  source: 'ai' | 'fallback'
}

const COACH_TIMEOUT_MS = 8000

/**
 * Returns a coaching tip plus its provenance. Tries Gemini first (grounded prompt)
 * and falls back to the deterministic rule-based hint on any failure.
 */
export async function getCoachTip(ctx: CoachContext): Promise<CoachTip> {
  const analysis = analyzeSpot(toHintContext(ctx))
  const fallback: CoachTip = { text: analysis.tip, source: 'fallback' }

  if (!isAIConfigured()) return fallback

  const text = await generateText({ prompt: buildCoachPrompt(ctx, analysis), timeoutMs: COACH_TIMEOUT_MS })
  if (!text) return fallback

  const tidied = tidyTip(text)
  return tidied.length > 0 ? { text: tidied, source: 'ai' } : fallback
}

function toHintContext(ctx: CoachContext): HintContext {
  return { hole: ctx.hole, board: ctx.board, street: ctx.street, pot: ctx.pot, toCall: ctx.toCall }
}

function buildCoachPrompt(ctx: CoachContext, analysis: SpotAnalysis): string {
  const board = ctx.board.length > 0 ? ctx.board.join(' ') : '(preflop, no board yet)'
  const glossary = glossaryBlock(analysis)

  return [
    'You are a friendly, expert Texas Hold\'em coach helping a beginner improve their decision-making.',
    '',
    'Write ONE coaching tip of at most two short sentences. Requirements:',
    '- Name the single most relevant concept (pot odds, equity, position, or value betting).',
    '- Briefly explain the reasoning using the numbers provided below.',
    '- The numbers below are already worked out. Use them as given; do NOT recompute pot odds or equity, and do NOT invent more precise figures.',
    '- Guide their thinking; do NOT just tell them the one "correct" action to take.',
    '- Plain, encouraging language. No markdown, no preamble, no quotes.',
    '',
    'Glossary (use these meanings):',
    glossary,
    '',
    'Current spot:',
    `- Street: ${ctx.street}`,
    `- Hero hole cards: ${ctx.hole.join(', ')}`,
    `- Board: ${board}`,
    `- Pot: ${ctx.pot}; To call: ${ctx.toCall}; Hero stack: ${ctx.heroStack}; Opponents in hand: ${ctx.opponentsInHand}`,
    ...analysis.facts.map((fact) => `- ${fact}`),
    `- Legal actions: ${describeLegalActions(ctx.legalActions, 'inline')}`,
    '',
    'Coaching tip:',
  ].join('\n')
}

function glossaryBlock(analysis: SpotAnalysis): string {
  const terms = new Set<string>(['pot odds', 'equity', 'position'])
  if (analysis.drawName) terms.add('outs')
  // Only suggest value betting when the hero actually holds the strong hand (not a
  // shared board hand they are merely "playing the board" with).
  if (
    analysis.madeFromHole !== false &&
    analysis.madeCategory &&
    analysis.madeCategory !== 'high-card' &&
    analysis.madeCategory !== 'pair'
  ) {
    terms.add('value bet')
  }

  const lines: string[] = []
  for (const term of terms) {
    const entry = lookupGlossaryTerm(term)
    if (entry) lines.push(`- ${entry.term}: ${entry.definition}`)
  }
  return lines.length > 0 ? lines.join('\n') : '- (none)'
}

/** Normalize model output: collapse whitespace + strip quotes, then cap length. */
function tidyTip(raw: string): string {
  return limitSentences(tidyModelText(raw), 2).slice(0, 320).trim()
}

function limitSentences(text: string, max: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g)
  if (!sentences || sentences.length <= max) return text
  return sentences.slice(0, max).join(' ').trim()
}

// ---------------------------------------------------------------------------
// "Ask the coach for more" — a deeper, numbers-driven read of the WHOLE table.
//
// Where `getCoachTip` is one grounded sentence, this accounts for every opponent
// (count, persona, stack, who is still in), the hero's position, the pot, and the
// math: pot odds, the hero's outs -> rough equity, and the EV of calling. With AI
// on it returns a rich grounded analysis; with AI off it FALLS BACK to a detailed
// rule-based breakdown that actually computes and explains the numbers.
// ---------------------------------------------------------------------------

export type DeepCoachSeat = {
  name: string
  isHero: boolean
  persona?: string
  /** Chips behind (not yet wagered). */
  stack: number
  /** Chips this seat has put in the hand so far. */
  committed: number
  /** Still contesting the pot (not folded). */
  inHand: boolean
}

export type DeepCoachContext = CoachContext & {
  position: 'ip' | 'oop'
  bigBlind: number
  /** Every seat at the table, the hero included. */
  seats: DeepCoachSeat[]
}

const DEEP_COACH_TIMEOUT_MS = 9000

/**
 * A deep, table-wide read. Tries the grounded AI analysis first and falls back to
 * the deterministic rule-based breakdown on any failure, so it always responds.
 */
export async function getDeepCoachTip(ctx: DeepCoachContext): Promise<CoachTip> {
  const analysis = analyzeSpot(toHintContext(ctx))
  const fallback: CoachTip = { text: composeDeepRead(ctx, analysis), source: 'fallback' }

  if (!isAIConfigured()) return fallback

  const text = await generateText({
    prompt: buildDeepCoachPrompt(ctx, analysis),
    timeoutMs: DEEP_COACH_TIMEOUT_MS,
  })
  if (!text) return fallback

  const tidied = tidyDeep(text)
  return tidied.length > 0 ? { text: tidied, source: 'ai' } : fallback
}

/**
 * A one-pair holding is worth wildly different equity depending on WHICH pair it is:
 * an overpair or top-pair-top-kicker is a real favorite, while bottom pair with a
 * weak kicker is a marginal bluff-catcher. A flat 50% over-values the weak ones and
 * endorses loose calls, so tier the pair by overpair / top / middle / bottom and the
 * kicker. Only meaningful when the pair is actually made with a hole card.
 */
function onePairWinPct(hole: [CardId, CardId], board: CardId[]): number {
  if (board.length === 0) return 50
  const holeVals = hole.map(rankValue)
  const boardVals = board.map(rankValue).sort((a, b) => b - a)
  const topBoard = boardVals[0]
  const lowestBoard = boardVals[boardVals.length - 1]
  const isPocketPair = holeVals[0] === holeVals[1]

  // Overpair: a pocket pair larger than the entire board.
  if (isPocketPair && holeVals[0] > topBoard) return 60

  // The highest board rank a hole card pairs (null ⇒ a pocket pair under the board).
  const pairedRank = boardVals.find((v) => holeVals.includes(v)) ?? null
  if (pairedRank == null) return 40 // under-pair to the board

  const kicker = Math.max(0, ...holeVals.filter((v) => v !== pairedRank))
  if (pairedRank === topBoard) {
    // Top pair — a big kicker (A/K) plays much better than a weak one.
    return kicker >= 13 ? 58 : kicker >= 11 ? 54 : 50
  }
  if (pairedRank === lowestBoard) return 32 // bottom pair: a thin bluff-catcher
  return 42 // middle pair
}

/** Rough chance (0..100) the hero holds the best hand now, for the EV teaching math. */
export function roughWinPct(ctx: DeepCoachContext, analysis: SpotAnalysis): number {
  const madeRank = analysis.madeCategory ? HAND_CATEGORY_RANK[analysis.madeCategory] : 0
  const ownsMade = analysis.madeFromHole !== false
  let pct = 22
  if (ownsMade && madeRank >= HAND_CATEGORY_RANK['two-pair']) pct = 75
  else if (ownsMade && analysis.madeCategory === 'pair') pct = onePairWinPct(ctx.hole, ctx.board)
  if (analysis.equityPct != null) pct = Math.max(pct, analysis.equityPct)
  const live = ctx.seats.filter((s) => !s.isHero && s.inHand).length
  if (live > 1) pct -= 8 * (live - 1) // multiway shades a marginal holding down
  return Math.max(8, Math.min(95, Math.round(pct)))
}

/**
 * Every teaching number for the deep read, worked out DETERMINISTICALLY in one
 * place. Both the rule-based fallback (`composeDeepRead`) and the AI prompt
 * (`buildDeepCoachPrompt`) read from here, so the figures can never drift apart -
 * and, crucially, the LLM is only ever asked to PHRASE these, never to do the
 * arithmetic itself (LLMs are unreliable at math and could hand a beginner a
 * wrong price or EV).
 *
 * Pot odds is an exact price. Win chance is a rough estimate, so it is also
 * surfaced as an equity BAND and the EV is given as a small range, to avoid
 * false-precision point values.
 */
export type DeepReadNumbers = {
  facingBet: boolean
  /** Exact price to call as a percent, or null when there is no bet. */
  potOddsPct: number | null
  /** Rough point estimate of the hero's chance to hold the best hand. */
  winPct: number
  /** Rough equity band around `winPct` (percent). */
  equityLowPct: number
  equityHighPct: number
  /** Rough EV of calling in chips (point estimate), or null with no bet. */
  evChips: number | null
  /** Rough EV band in chips, or null with no bet. */
  evLowChips: number | null
  evHighChips: number | null
}

const EQUITY_BAND_PCT = 7

export function computeDeepReadNumbers(
  ctx: DeepCoachContext,
  analysis: SpotAnalysis,
): DeepReadNumbers {
  const facingBet = ctx.toCall > 0
  const potOddsPct = facingBet ? Math.round((ctx.toCall / (ctx.pot + ctx.toCall)) * 100) : null
  const winPct = roughWinPct(ctx, analysis)
  const equityLowPct = Math.max(2, winPct - EQUITY_BAND_PCT)
  const equityHighPct = Math.min(98, winPct + EQUITY_BAND_PCT)
  const evAt = (p: number) => Math.round((p / 100) * ctx.pot - (1 - p / 100) * ctx.toCall)
  return {
    facingBet,
    potOddsPct,
    winPct,
    equityLowPct,
    equityHighPct,
    evChips: facingBet ? evAt(winPct) : null,
    evLowChips: facingBet ? evAt(equityLowPct) : null,
    evHighChips: facingBet ? evAt(equityHighPct) : null,
  }
}

/**
 * The deterministic recommendation (without the "Recommendation:" prefix), shared
 * by the fallback text and the AI prompt so both always agree with the math.
 */
function deepReadRecommendation(analysis: SpotAnalysis, nums: DeepReadNumbers): string {
  const madeRank = analysis.madeCategory ? HAND_CATEGORY_RANK[analysis.madeCategory] : 0
  const ownsMade = analysis.madeFromHole !== false

  if (nums.facingBet && nums.potOddsPct != null) {
    const ev = nums.evChips ?? 0
    if (ownsMade && madeRank >= HAND_CATEGORY_RANK['trips']) {
      return 'raise for value. You are very likely ahead, so build the pot.'
    }
    if (nums.winPct >= nums.potOddsPct || ev > 0) {
      return `a call is justified. Your roughly ${nums.winPct}% to win clears the ${nums.potOddsPct}% price the pot is laying you.`
    }
    return `folding is likely best. Your roughly ${nums.winPct}% to win is short of the ${nums.potOddsPct}% price, so calling loses chips over time.`
  }
  if (ownsMade && madeRank >= HAND_CATEGORY_RANK['two-pair']) {
    return 'bet for value. With a strong hand you want to build the pot while you are ahead.'
  }
  if (analysis.drawName) {
    return 'a semi-bluff bet is reasonable. You can win it now or improve to the best hand.'
  }
  return 'checking is fine. Keep the pot small with a marginal hand and reassess.'
}

/** Format a rough chip range like "+42 to +64". */
function fmtChipRange(low: number | null, high: number | null): string {
  if (low == null || high == null) return ''
  const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`)
  return `${sign(low)} to ${sign(high)}`
}

/**
 * The deterministic, rule-based deep read (also the AI fallback). Pure: it computes
 * and explains pot odds, outs -> equity, the EV of calling, and a recommendation,
 * and it respects "playing the board" (a shared board hand is not the hero's).
 */
export function composeDeepRead(ctx: DeepCoachContext, analysis: SpotAnalysis): string {
  const nums = computeDeepReadNumbers(ctx, analysis)
  const facingBet = nums.facingBet
  const potOdds = nums.potOddsPct
  const live = ctx.seats.filter((s) => !s.isHero && s.inHand)
  const winPct = nums.winPct

  const handDesc = analysis.madeLabel
    ? analysis.madeFromHole === false
      ? `${analysis.madeLabel}, but that is on the board and shared by everyone (your hole cards do not improve it)`
      : `${analysis.madeLabel}, made with your hole cards`
    : analysis.drawName
      ? `no pair yet, but a ${analysis.drawName}`
      : 'no made hand yet'

  const drawLine =
    analysis.drawName && analysis.outs != null && analysis.equityPct != null
      ? `Outs: about ${analysis.outs} for your ${analysis.drawName}, around ${analysis.equityPct}% to get there by the river.`
      : 'Outs: no clean draw to count here.'

  const oppText =
    live.length === 0
      ? 'no opponents left in the pot (folded to you)'
      : live
          .map((s) => `${s.name} (${s.stack} behind${s.persona ? `, ${s.persona}` : ''})`)
          .join(', ')

  let evLine = 'No bet to call right now, so there is nothing to price.'
  if (facingBet && potOdds != null) {
    const ev = nums.evChips ?? 0
    evLine = `EV of calling: you win about ${winPct}% of the ${ctx.pot} pot and lose the ${ctx.toCall} call the rest of the time, so roughly ${ev >= 0 ? '+' : ''}${ev} chips per call.`
  }
  const recommendation = `Recommendation: ${deepReadRecommendation(analysis, nums)}`

  const lines = [
    'Deep read (rule-based):',
    `- Spot: ${ctx.street}. You hold ${ctx.hole.join(' ')} on ${ctx.board.length ? ctx.board.join(' ') : 'no board yet'}, ${ctx.position === 'ip' ? 'in position' : 'out of position'}.`,
    `- Your hand: ${handDesc}.`,
    `- Table: ${oppText}. Pot ${ctx.pot}${facingBet ? `, ${ctx.toCall} to call (pot odds ${potOdds}%)` : ', no bet to call'}.`,
    `- ${drawLine}`,
    `- ${evLine}`,
    `- ${recommendation}`,
  ]
  return lines.join('\n')
}

export function buildDeepCoachPrompt(ctx: DeepCoachContext, analysis: SpotAnalysis): string {
  const board = ctx.board.length > 0 ? ctx.board.join(' ') : '(preflop, no board yet)'
  const nums = computeDeepReadNumbers(ctx, analysis)
  const recommendation = deepReadRecommendation(analysis, nums)
  const seats = ctx.seats
    .map(
      (s) =>
        `- ${s.isHero ? 'You' : s.name}: ${s.stack} behind, ${s.committed} in the pot, ${s.inHand ? 'still in' : 'folded'}${s.persona ? ` (${s.persona})` : ''}`,
    )
    .join('\n')

  // Authoritative, pre-computed figures. The model PHRASES these; it must never
  // redo the arithmetic. Equity is a band and EV is a range on purpose, so the
  // coach never reads a false-precision number to a beginner.
  const computed = [
    'Pre-computed numbers (these are correct; use them VERBATIM, do NOT recalculate or change them):',
    nums.potOddsPct != null
      ? `- Pot odds (exact price to call): ${nums.potOddsPct}%`
      : '- Pot odds: not applicable (no bet to call)',
    `- Hero rough equity (chance to hold the best hand): about ${nums.equityLowPct}-${nums.equityHighPct}%`,
    analysis.drawName && analysis.outs != null
      ? `- Outs for the ${analysis.drawName}: about ${analysis.outs}`
      : '- Outs: no clean draw to count',
    nums.evChips != null
      ? `- EV of calling (rough estimate, not exact): around ${nums.evChips >= 0 ? '+' : ''}${nums.evChips} chips per call (roughly ${fmtChipRange(nums.evLowChips, nums.evHighChips)} chips depending on how it runs)`
      : '- EV of calling: not applicable (no bet to call)',
    `- Suggested line from the math: ${recommendation}`,
  ].join('\n')

  return [
    "You are a friendly, expert Texas Hold'em coach giving a beginner a DEEPER read of the current spot.",
    '',
    'Write a structured analysis of at most 5 short sentences, covering in order:',
    '1) The board texture and what the hero actually holds. If the made hand is entirely on the board, say they are playing the board and it is shared by everyone.',
    '2) The opponents still in (their stacks and personas) and the hero position.',
    '3) The math: restate the pot odds, the hero outs and rough equity, and the EV of calling using ONLY the pre-computed numbers below.',
    '4) A clear recommendation (fold, call, raise, bet, or check) and the reason.',
    'Phrase the pre-computed numbers in plain words. Do NOT recompute or change them, and do NOT invent more precise figures: keep equity and EV as the rough range/estimate given. Plain, encouraging language. No markdown, no preamble, no quotes.',
    '',
    'Glossary (use these meanings):',
    glossaryBlock(analysis),
    '',
    computed,
    '',
    'Current spot:',
    `- Street: ${ctx.street}`,
    `- Hero hole cards: ${ctx.hole.join(', ')}`,
    `- Board: ${board}`,
    `- Pot: ${ctx.pot}; To call: ${ctx.toCall}${nums.potOddsPct != null ? ` (pot odds ${nums.potOddsPct}%)` : ''}; Hero stack: ${ctx.heroStack}`,
    `- Hero position: ${ctx.position === 'ip' ? 'in position (acts last)' : 'out of position (acts first)'}`,
    'Seats:',
    seats,
    ...analysis.facts.map((fact) => `- ${fact}`),
    `- Legal actions: ${describeLegalActions(ctx.legalActions, 'inline')}`,
    '',
    'Deep analysis:',
  ].join('\n')
}

/** Tidy AI deep-read output but KEEP line breaks (it is a multi-line breakdown). */
function tidyDeep(raw: string): string {
  let text = raw.trim()
  text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim()
  text = text.replace(/^["'“”]+/, '').replace(/["'“”]+$/, '').trim()
  text = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')
  return text.slice(0, 900).trim()
}
