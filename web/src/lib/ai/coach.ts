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
 * The deterministic, rule-based deep read (also the AI fallback). Pure: it computes
 * and explains pot odds, outs -> equity, the EV of calling, and a recommendation,
 * and it respects "playing the board" (a shared board hand is not the hero's).
 */
export function composeDeepRead(ctx: DeepCoachContext, analysis: SpotAnalysis): string {
  const facingBet = ctx.toCall > 0
  const potOdds = facingBet ? Math.round((ctx.toCall / (ctx.pot + ctx.toCall)) * 100) : null
  const live = ctx.seats.filter((s) => !s.isHero && s.inHand)
  const winPct = roughWinPct(ctx, analysis)
  const madeRank = analysis.madeCategory ? HAND_CATEGORY_RANK[analysis.madeCategory] : 0
  const ownsMade = analysis.madeFromHole !== false

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
  let recommendation: string

  if (facingBet && potOdds != null) {
    const ev = Math.round((winPct / 100) * ctx.pot - (1 - winPct / 100) * ctx.toCall)
    evLine = `EV of calling: you win about ${winPct}% of the ${ctx.pot} pot and lose the ${ctx.toCall} call the rest of the time, so roughly ${ev >= 0 ? '+' : ''}${ev} chips per call.`
    if (ownsMade && madeRank >= HAND_CATEGORY_RANK['trips']) {
      recommendation = 'Recommendation: raise for value. You are very likely ahead, so build the pot.'
    } else if (winPct >= potOdds || ev > 0) {
      recommendation = `Recommendation: a call is justified. Your roughly ${winPct}% to win clears the ${potOdds}% price the pot is laying you.`
    } else {
      recommendation = `Recommendation: folding is likely best. Your roughly ${winPct}% to win is short of the ${potOdds}% price, so calling loses chips over time.`
    }
  } else if (ownsMade && madeRank >= HAND_CATEGORY_RANK['two-pair']) {
    recommendation = 'Recommendation: bet for value. With a strong hand you want to build the pot while you are ahead.'
  } else if (analysis.drawName) {
    recommendation = 'Recommendation: a semi-bluff bet is reasonable. You can win it now or improve to the best hand.'
  } else {
    recommendation = 'Recommendation: checking is fine. Keep the pot small with a marginal hand and reassess.'
  }

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

function buildDeepCoachPrompt(ctx: DeepCoachContext, analysis: SpotAnalysis): string {
  const board = ctx.board.length > 0 ? ctx.board.join(' ') : '(preflop, no board yet)'
  const potOdds = ctx.toCall > 0 ? Math.round((ctx.toCall / (ctx.pot + ctx.toCall)) * 100) : null
  const seats = ctx.seats
    .map(
      (s) =>
        `- ${s.isHero ? 'You' : s.name}: ${s.stack} behind, ${s.committed} in the pot, ${s.inHand ? 'still in' : 'folded'}${s.persona ? ` (${s.persona})` : ''}`,
    )
    .join('\n')

  return [
    "You are a friendly, expert Texas Hold'em coach giving a beginner a DEEPER read of the current spot.",
    '',
    'Write a structured analysis of at most 5 short sentences, covering in order:',
    '1) The board texture and what the hero actually holds. If the made hand is entirely on the board, say they are playing the board and it is shared by everyone.',
    '2) The opponents still in (their stacks and personas) and the hero position.',
    '3) The math: pot odds, the hero outs and rough equity, and the EV of calling.',
    '4) A clear recommendation (fold, call, raise, bet, or check) and the reason.',
    'Plain, encouraging language. No markdown, no preamble, no quotes.',
    '',
    'Glossary (use these meanings):',
    glossaryBlock(analysis),
    '',
    'Current spot:',
    `- Street: ${ctx.street}`,
    `- Hero hole cards: ${ctx.hole.join(', ')}`,
    `- Board: ${board}`,
    `- Pot: ${ctx.pot}; To call: ${ctx.toCall}${potOdds != null ? ` (pot odds ${potOdds}%)` : ''}; Hero stack: ${ctx.heroStack}`,
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
