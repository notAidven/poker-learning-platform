/**
 * Pure, rule-based poker hints — the always-on coach that needs no AI.
 *
 * Everything here is a deterministic function of a plain `HintContext`, built on
 * top of the existing `handEvaluator` (made-hand category, outs, equity). It never
 * touches the game engine, network, or React, so it is trivially testable and is
 * also reused by the LLM coach (`lib/ai/coach.ts`) as both prompt-grounding facts
 * and a graceful fallback when AI is unavailable.
 */
import { parseCardId, type CardId } from '../../types/lesson'
import { HAND_CATEGORY_RANK, type HandCategory, type PokerStreet } from '../../types/poker'
import {
  countOuts,
  evaluateBest,
  evaluateBoardOnly,
  holeCardsImproveBoard,
  rankValue,
} from './handEvaluator'

export type HintContext = {
  hole: [CardId, CardId]
  board: CardId[]
  street: PokerStreet
  pot: number
  toCall: number
  position?: 'ip' | 'oop'
}

/**
 * Structured read of a spot, shared by `getHint` (its `.tip`) and the LLM coach
 * (its `.facts` ground the prompt; its `.tip` is the rule-based fallback).
 */
export type SpotAnalysis = {
  street: PokerStreet
  /** Best made hand label once >= 5 cards are known (e.g. "Two pair, Kings and Sevens"). */
  madeLabel: string | null
  madeCategory: HandCategory | null
  /**
   * Whether the hero's HOLE CARDS make the current made hand. `false` means the made
   * hand is entirely on the board (a shared board pair / "playing the board"), so it
   * is not the hero's own asset. Null preflop or when there is no made hand.
   */
  madeFromHole: boolean | null
  /** The board's OWN best hand label (e.g. "Pair of Threes"), for board-reading copy. */
  boardMadeLabel: string | null
  /** The board's OWN best hand category (so copy can tell a shared pair from a shared straight). */
  boardMadeCategory: HandCategory | null
  /** Primary draw name when a clean flush/straight draw exists. */
  drawName: string | null
  /** Clean outs for the primary draw (flush/straight), if any. */
  outs: number | null
  /** Rough Rule-of-2-&-4 equity for the draw, as a percent (0–95). */
  equityPct: number | null
  /** Required equity to call = toCall / (pot + toCall), as a percent. */
  potOddsPct: number | null
  /** True when the draw's equity meets/exceeds the pot-odds price. */
  pricedIn: boolean | null
  facingBet: boolean
  /** Facing a bet of ~2/3 pot or larger (a "big bet"). */
  bigBet: boolean
  position?: 'ip' | 'oop'
  /** Compact factual lines, suitable for grounding an LLM prompt. */
  facts: string[]
  /** One-sentence, rule-based nudge (what `getHint` returns). */
  tip: string
}

const MAX_HINT_LEN = 140
const PAIR_RANK = HAND_CATEGORY_RANK['pair']
const TWO_PAIR_RANK = HAND_CATEGORY_RANK['two-pair']
const STRAIGHT_RANK = HAND_CATEGORY_RANK['straight']
const FLUSH_RANK = HAND_CATEGORY_RANK['flush']

/**
 * One concise (<= ~140 chars), useful nudge for the current spot. Always returns
 * a sentence — every code path is guarded so this can never throw.
 */
export function getHint(ctx: HintContext): string {
  try {
    return analyzeSpot(ctx).tip
  } catch {
    return 'Weigh your hand strength against the pot odds before you act.'
  }
}

/** Full structured read of a spot (made hand, draws, equity, pot odds, tip). */
export function analyzeSpot(ctx: HintContext): SpotAnalysis {
  const { hole, board, street, pot, toCall, position } = ctx
  const known = [...hole, ...board]

  const facingBet = toCall > 0
  const potOddsPct = facingBet ? Math.round((toCall / (pot + toCall)) * 100) : null
  const bigBet = facingBet && pot > 0 && toCall >= pot * 0.66

  const analysis: SpotAnalysis = {
    street,
    madeLabel: null,
    madeCategory: null,
    madeFromHole: null,
    boardMadeLabel: null,
    boardMadeCategory: null,
    drawName: null,
    outs: null,
    equityPct: null,
    potOddsPct,
    pricedIn: null,
    facingBet,
    bigBet,
    position,
    facts: [],
    tip: '',
  }

  // Preflop: only two cards are known, so the evaluator can't run — classify the
  // starting hand instead.
  if (board.length === 0) {
    analysis.facts = preflopFacts(analysis, ctx)
    analysis.tip = preflopTip(hole, position)
    return analysis
  }

  // Rule of 2 & 4: cards still to come set the equity multiplier.
  const cardsToCome = board.length >= 5 ? 0 : board.length === 4 ? 1 : board.length === 3 ? 2 : 0
  const equityMultiplier = cardsToCome === 2 ? 4 : cardsToCome === 1 ? 2 : 0

  if (known.length >= 5) {
    try {
      const made = evaluateBest(known)
      analysis.madeLabel = made.label
      analysis.madeCategory = made.category
      // Does the made hand belong to the hero, or is it sitting on the board? A
      // shared board hand (e.g. a board pair) is no one's asset in particular.
      analysis.madeFromHole = holeCardsImproveBoard(hole, board)
      const boardOwn = evaluateBoardOnly(board)
      analysis.boardMadeLabel = boardOwn?.label ?? null
      analysis.boardMadeCategory = boardOwn?.category ?? null
      const madeRank = HAND_CATEGORY_RANK[made.category]

      // Clean outs toward the two classic draws — only when not already there.
      const flushOuts = madeRank < FLUSH_RANK ? safeOuts(hole, board, 'flush') : 0
      const straightOuts = madeRank < STRAIGHT_RANK ? safeOuts(hole, board, 'straight') : 0

      if (equityMultiplier > 0 && (flushOuts > 0 || straightOuts > 0)) {
        if (flushOuts >= straightOuts && flushOuts > 0) {
          analysis.drawName = 'flush draw'
          analysis.outs = flushOuts
        } else {
          analysis.drawName =
            straightOuts >= 8
              ? 'open-ended straight draw'
              : straightOuts === 4
                ? 'gutshot straight draw'
                : 'straight draw'
          analysis.outs = straightOuts
        }
        analysis.equityPct = Math.min(95, Math.round(analysis.outs * equityMultiplier))
      }

      if (facingBet && analysis.equityPct != null && potOddsPct != null) {
        analysis.pricedIn = analysis.equityPct >= potOddsPct
      }
    } catch {
      // Bad/duplicate cards — leave made/draw null and fall through to a generic nudge.
    }
  }

  analysis.facts = postflopFacts(analysis, ctx)
  analysis.tip = postflopTip(analysis, ctx)
  return analysis
}

function safeOuts(hole: [CardId, CardId], board: CardId[], target: HandCategory): number {
  try {
    return countOuts(hole, board, target).count
  } catch {
    return 0
  }
}

// --- preflop -----------------------------------------------------------------

function preflopFacts(a: SpotAnalysis, ctx: HintContext): string[] {
  const facts = [
    `Starting hand: ${startingHandCode(ctx.hole)} (${ctx.hole.join(', ')})`,
    a.facingBet
      ? `Facing ${ctx.toCall} into ${ctx.pot} → pot odds ${a.potOddsPct}%`
      : `No bet to call yet (pot ${ctx.pot})`,
  ]
  const pf = positionFact(ctx.position)
  if (pf) facts.push(pf)
  return facts
}

function preflopTip(hole: [CardId, CardId], position?: 'ip' | 'oop'): string {
  const code = startingHandCode(hole)
  const a = parseCardId(hole[0])
  const b = parseCardId(hole[1])
  const suited = a.suit === b.suit
  const isPair = a.rank === b.rank
  const gap = Math.abs(rankValue(hole[0]) - rankValue(hole[1]))
  const hiVal = Math.max(rankValue(hole[0]), rankValue(hole[1]))
  const posTag = positionTag(position)
  const tail = posTag ? ` You're ${posTag}.` : ''

  const PREMIUM = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo'])
  const STRONG = new Set(['JJ', 'TT', 'AQs', 'AQo', 'AJs', 'KQs'])

  if (PREMIUM.has(code)) {
    return clampSentence(`${code} is a premium hand—raise to build the pot and thin the field.${tail}`)
  }
  if (STRONG.has(code)) {
    return clampSentence(`${code} is strong enough to raise with—just respect heavy resistance.${tail}`)
  }
  if (isPair) {
    return clampSentence(`${code} is a small pocket pair—see a cheap flop and hope to hit a set.${tail}`)
  }
  if (suited && hiVal === 14) {
    return clampSentence(`${code} has nut-flush potential—playable, and stronger in position.${tail}`)
  }
  if (suited && gap <= 2) {
    return clampSentence(`${code} is a suited connector that can flop straights and flushes.${tail}`)
  }
  return clampSentence(`${code} is marginal—let position and pot odds decide whether to play.${tail}`)
}

/** Standard shorthand for a starting hand, e.g. "AA", "AKs", "T9o". */
function startingHandCode(hole: [CardId, CardId]): string {
  const a = parseCardId(hole[0])
  const b = parseCardId(hole[1])
  const sym = (rank: string) => (rank === '10' ? 'T' : rank)
  if (a.rank === b.rank) return `${sym(a.rank)}${sym(b.rank)}`
  const [hi, lo] = rankValue(hole[0]) >= rankValue(hole[1]) ? [a.rank, b.rank] : [b.rank, a.rank]
  return `${sym(hi)}${sym(lo)}${a.suit === b.suit ? 's' : 'o'}`
}

// --- postflop ----------------------------------------------------------------

function postflopFacts(a: SpotAnalysis, ctx: HintContext): string[] {
  const facts = [`Hole: ${ctx.hole.join(', ')}`, `Board: ${ctx.board.join(' ') || '(none)'}`]
  if (a.madeLabel) {
    facts.push(
      a.madeFromHole === false
        ? `Best 5 cards: ${a.madeLabel}, but it is entirely on the board (your hole cards do not improve it) - you are playing the board, so this hand is shared by everyone`
        : `Best hand now: ${a.madeLabel} (made with your hole cards)`,
    )
  }
  if (a.drawName && a.outs != null) {
    const eq = a.equityPct != null ? `, ~${a.equityPct}% by the river` : ''
    facts.push(`Draw: ${a.drawName}, ${a.outs} outs${eq}`)
  }
  facts.push(
    a.facingBet && a.potOddsPct != null
      ? `Facing ${ctx.toCall} into ${ctx.pot} → pot odds ${a.potOddsPct}%`
      : `No bet to call (pot ${ctx.pot})`,
  )
  const pf = positionFact(ctx.position)
  if (pf) facts.push(pf)
  return facts
}

function postflopTip(a: SpotAnalysis, ctx: HintContext): string {
  // Evaluator unavailable (e.g. a partial board) — fall back to a pot-odds nudge.
  if (!a.madeLabel) {
    if (a.facingBet && a.potOddsPct != null) {
      return clampSentence(
        `You need about ${a.potOddsPct}% equity to call—continue only with a hand or draw that clears that bar.`,
      )
    }
    return clampSentence('No bet to call—take the free card and reassess as the board develops.')
  }

  const madeRank = a.madeCategory ? HAND_CATEGORY_RANK[a.madeCategory] : PAIR_RANK
  const hasDraw = a.drawName != null && a.outs != null && a.equityPct != null
  const sunk = a.bigBet ? ` Remember, the chips already in the pot aren't yours.` : ''

  // Playing the board: the made hand is on the community cards, shared by everyone,
  // so it is not the hero's asset. Coach the true strength (unless a live draw is
  // the real reason to continue, in which case fall through to the draw advice).
  if (a.madeFromHole === false && !hasDraw) {
    const shared = a.boardMadeLabel ? lowerFirst(a.boardMadeLabel) : 'made hand'
    const boardStrong = a.boardMadeCategory ? HAND_CATEGORY_RANK[a.boardMadeCategory] >= TWO_PAIR_RANK : false
    return clampSentence(
      boardStrong
        ? `The ${shared} is on the board and shared by everyone, so you only win if your hole cards beat it.`
        : `Your hole cards haven't connected; the ${shared} is on the board, shared by everyone, so play it as a weak hand.`,
    )
  }

  // A shared board hand is never the hero's value, so do not treat it as strong.
  const strong = madeRank >= TWO_PAIR_RANK && a.madeFromHole !== false

  if (a.facingBet) {
    if (hasDraw && !strong) {
      const verdict = a.pricedIn
        ? `you're getting the right price to chase`
        : `the price is too steep for the draw`
      return clampSentence(
        `Your ${a.drawName} (~${a.equityPct}% by the river) vs ${a.potOddsPct}% pot odds—${verdict}.${sunk}`,
      )
    }
    if (strong) {
      return clampSentence(
        `You hold ${a.madeLabel}—a value hand, so raising for value usually beats just calling.`,
      )
    }
    return clampSentence(
      `Only ${lowerFirst(a.madeLabel)} with little to draw to; ${a.potOddsPct}% pot odds is a steep price.${sunk}`,
    )
  }

  // No bet to call — we can check or bet.
  if (strong) {
    return clampSentence(`You hold ${a.madeLabel}—bet for value so weaker hands pay you off.`)
  }
  if (hasDraw) {
    return clampSentence(
      `You have a ${a.drawName} (${a.outs} outs, ~${a.equityPct}%)—a semi-bluff adds fold equity to the draw.`,
    )
  }
  const posTag = positionTag(ctx.position)
  const posTail = posTag ? ` Use being ${posTag} to control the pot.` : ''
  return clampSentence(`Just ${lowerFirst(a.madeLabel)}—checking to keep the pot small is reasonable.${posTail}`)
}

// --- shared helpers ----------------------------------------------------------

function positionFact(position?: 'ip' | 'oop'): string | null {
  if (!position) return null
  return position === 'ip' ? 'Position: in position (act last)' : 'Position: out of position (act first)'
}

function positionTag(position?: 'ip' | 'oop'): string | null {
  if (!position) return null
  return position === 'ip' ? 'in position' : 'out of position'
}

function lowerFirst(label: string): string {
  return label.length > 0 ? label[0].toLowerCase() + label.slice(1) : label
}

/** Keep a hint to one tidy sentence: drop a trailing aside, else hard-trim. */
function clampSentence(sentence: string): string {
  const trimmed = sentence.trim()
  if (trimmed.length <= MAX_HINT_LEN) return trimmed
  const firstStop = trimmed.indexOf('. ')
  if (firstStop > 0 && firstStop + 1 <= MAX_HINT_LEN) return trimmed.slice(0, firstStop + 1)
  return `${trimmed.slice(0, MAX_HINT_LEN - 1).trimEnd()}…`
}
