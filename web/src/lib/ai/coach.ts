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
import type { BettingAction, PokerStreet } from '../../types/poker'
import { lookupGlossaryTerm } from '../../data/glossary'
import { analyzeSpot, type HintContext, type SpotAnalysis } from '../poker/hints'
import { generateText, isAIConfigured } from './aiClient'

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
    `- Legal actions: ${describeLegalActions(ctx.legalActions)}`,
    '',
    'Coaching tip:',
  ].join('\n')
}

function glossaryBlock(analysis: SpotAnalysis): string {
  const terms = new Set<string>(['pot odds', 'equity', 'position'])
  if (analysis.drawName) terms.add('outs')
  if (analysis.madeCategory && analysis.madeCategory !== 'high-card' && analysis.madeCategory !== 'pair') {
    terms.add('value bet')
  }

  const lines: string[] = []
  for (const term of terms) {
    const entry = lookupGlossaryTerm(term)
    if (entry) lines.push(`- ${entry.term}: ${entry.definition}`)
  }
  return lines.length > 0 ? lines.join('\n') : '- (none)'
}

function describeLegalActions(legalActions: CoachContext['legalActions']): string {
  if (legalActions.length === 0) return '(none)'
  return legalActions
    .map((la) => {
      if ((la.action === 'bet' || la.action === 'raise') && (la.min != null || la.max != null)) {
        return `${la.action} (${la.min ?? '?'}–${la.max ?? '?'})`
      }
      return la.action
    })
    .join(', ')
}

/** Normalize model output: collapse whitespace, strip wrapping quotes, cap length. */
function tidyTip(raw: string): string {
  let text = raw.trim().replace(/\s+/g, ' ')
  text = text.replace(/^["'“”]+/, '').replace(/["'“”]+$/, '').trim()
  return limitSentences(text, 2).slice(0, 320).trim()
}

function limitSentences(text: string, max: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g)
  if (!sentences || sentences.length <= max) return text
  return sentences.slice(0, max).join(' ').trim()
}
