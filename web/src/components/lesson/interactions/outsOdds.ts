/**
 * Pure grader for the `outs-odds` interaction (Lesson 5/6 math). The expected outs,
 * equity, pot-odds price, and call/fold decision are DERIVED here from the spot,
 * reading the one spot-strength module (`poker/spotStrength`) so the lesson can never
 * disagree with the coach or the bots. The widget keeps only inputs + the reveal.
 *
 * The interface is the test surface: `deriveOutsOdds` returns the right answers and
 * `gradeOutsOdds` turns a learner submission into a verdict, both without React.
 */
import type { HandCategory } from '../../../types/poker'
import type { OutsOddsAnswer, OutsOddsAsk, OutsOddsConfig } from '../../../types/lesson'
import { countOuts } from '../../../lib/poker/handEvaluator'
import { potOddsExactPct, ruleEquityPct } from '../../../lib/poker/spotStrength'
import { countMatches, percentMatches } from './numericAnswer'
import { fractionPercentMatches } from './fractionAnswer'

/** Pot odds is an exact price, so only round-off slack is allowed. */
export const POT_ODDS_TOLERANCE = 1
/** Rule of 2 & 4 is an estimate — accept a band around it (the rule OR the exact value). */
export const DEFAULT_EQUITY_TOLERANCE = 3

/**
 * Map a draw's plain-language label to the hand category it completes, so outs can be
 * validated by the evaluator (`countOuts`) instead of a hard-coded number. A combo
 * maps to `straight` (the lower category) — every card that makes either draw lifts
 * the hand to at least a straight.
 */
export function deriveTarget(drawLabel: string): HandCategory | undefined {
  const s = drawLabel.toLowerCase()
  if (s.includes('straight')) return 'straight'
  if (s.includes('flush')) return 'flush'
  if (s.includes('full')) return 'full-house'
  if (s.includes('quad') || s.includes('four of a kind')) return 'quads'
  if (s.includes('trip') || s.includes('set') || s.includes('three of a kind')) return 'trips'
  if (s.includes('two pair')) return 'two-pair'
  if (s.includes('pair') || s.includes('overcard')) return 'pair'
  return undefined
}

export type OutsOddsExpected = {
  /** Evaluator out count (authored fallback only if the spot cannot be evaluated). */
  outs: number
  /** Cards still to come: 2 on the flop, 1 on the turn. */
  cardsToCome: 1 | 2
  /** The Rule-of-2-&-4 equity estimate used for the decision + reveal. */
  ruleEquity: number
  /** The graded equity target: authored `equityPercent` if present, else the rule. */
  equityCenter: number
  /** Exact required equity to call (unrounded), or null when there is no price. */
  requiredEquityPct: number | null
  /** call / fold from comparing the rule equity to the price, or the authored decision. */
  decision: 'call' | 'fold' | null
}

/** The right answers for an outs-odds spot, derived purely from config + answer. */
export function deriveOutsOdds(config: OutsOddsConfig, answer: OutsOddsAnswer): OutsOddsExpected {
  const target = deriveTarget(config.drawLabel)
  let outsCount: number | null
  try {
    outsCount = countOuts(config.hole, config.board, target).count
  } catch {
    outsCount = null
  }
  const outs = outsCount ?? answer.outs ?? 0
  const cardsToCome: 1 | 2 = config.street === 'flop' ? 2 : 1

  const requiredEquityPct =
    config.pot != null && config.betToCall != null
      ? potOddsExactPct(config.pot, config.betToCall)
      : (answer.potOddsPercent ?? null)

  const ruleEquity = ruleEquityPct(outs, cardsToCome)
  const decision: 'call' | 'fold' | null =
    requiredEquityPct != null
      ? ruleEquity >= requiredEquityPct
        ? 'call'
        : 'fold'
      : (answer.decision ?? null)

  return {
    outs,
    cardsToCome,
    ruleEquity,
    equityCenter: answer.equityPercent ?? ruleEquity,
    requiredEquityPct,
    decision,
  }
}

/** A ratio answer entered either as a whole percent or as a fraction. */
export type RatioEntry =
  | { kind: 'percent'; value: string }
  | { kind: 'fraction'; num: string; den: string }

export type OutsOddsSubmission = {
  outsInput: string
  equity: RatioEntry
  potOdds: RatioEntry
  decision: 'call' | 'fold' | null
}

export type OutsOddsGrade = { correct: boolean; expected: OutsOddsExpected }

function ratioMatches(entry: RatioEntry, expectedPercent: number, tolerance: number): boolean {
  return entry.kind === 'fraction'
    ? fractionPercentMatches(entry.num, entry.den, expectedPercent, tolerance)
    : percentMatches(entry.value, expectedPercent, tolerance)
}

/** Grade an outs-odds submission against the derived expected answers. */
export function gradeOutsOdds(
  config: OutsOddsConfig,
  answer: OutsOddsAnswer,
  submission: OutsOddsSubmission,
): OutsOddsGrade {
  const expected = deriveOutsOdds(config, answer)
  const asks = config.ask
  const asked = (a: OutsOddsAsk) => asks.includes(a)
  const equityTol = answer.equityTolerance ?? DEFAULT_EQUITY_TOLERANCE

  const outsOk = !asked('outs') || countMatches(submission.outsInput, expected.outs)
  const equityOk = !asked('equity') || ratioMatches(submission.equity, expected.equityCenter, equityTol)
  const potOddsOk =
    !asked('potOdds') ||
    expected.requiredEquityPct == null ||
    ratioMatches(submission.potOdds, expected.requiredEquityPct, POT_ODDS_TOLERANCE)
  const decisionOk =
    !asked('decision') || (submission.decision != null && submission.decision === expected.decision)

  return { correct: outsOk && equityOk && potOddsOk && decisionOk, expected }
}
