/**
 * Pure grading + math for the `betting-round` interaction (design doc §5.5). The
 * verdict for all three tasks (choose-action, choose-size, ev-of-call) and the EV
 * breakdown shown on reveal live here, lifted out of the widget so they are tested
 * return values. The widget keeps the felt, the chip animation, and the lifecycle.
 */
import type { BettingAction } from '../../../types/poker'
import type { BettingRoundAnswer, BettingRoundConfig } from '../../../types/lesson'

/** Parse a signed decimal (e.g. "16" or "-8"); invalid input returns null. */
export function parseSignedNumber(raw: string): number | null {
  const t = raw.trim()
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** True when the entered EV is within `tolerance` of the expected signed EV. */
export function evMatches(raw: string, expected: number, tolerance: number): boolean {
  const n = parseSignedNumber(raw)
  return n !== null && Math.abs(n - expected) <= tolerance
}

export type EvBreakdown = {
  equity: number
  win: number
  lose: number
  ev: number
  required: number
  decision: 'call' | 'fold'
}

/**
 * Recover the implied equity from the authored EV so the reveal can show the full
 * arithmetic: with EV = p*win - (1-p)*lose, p = (EV + lose) / (win + lose). The
 * required equity to call is lose / (win + lose).
 */
export function buildEvBreakdown(config: BettingRoundConfig, answer: BettingRoundAnswer): EvBreakdown {
  const win = config.pot
  const lose = config.facing?.amount ?? 0
  const ev = answer.evChips ?? 0
  const denom = win + lose
  const equity = denom > 0 ? (ev + lose) / denom : 0
  const required = denom > 0 ? lose / denom : 0
  return { equity, win, lose, ev, required, decision: ev > 0 ? 'call' : 'fold' }
}

export type BettingRoundSubmission = {
  /** choose-action: the chosen action. */
  action: BettingAction | null
  /** choose-size: the chosen fraction-of-pot. */
  sizeFraction: number | null
  /** ev-of-call: the raw EV input. */
  evInput: string
}

/** Grade a betting-round attempt for the configured task. */
export function gradeBettingRound(
  config: BettingRoundConfig,
  answer: BettingRoundAnswer,
  submission: BettingRoundSubmission,
): boolean {
  if (config.task === 'choose-action') {
    return submission.action !== null && submission.action === answer.action
  }
  if (config.task === 'choose-size') {
    if (submission.sizeFraction === null || answer.sizeFraction === undefined) return false
    return Math.abs(submission.sizeFraction - answer.sizeFraction) <= (answer.sizeTolerance ?? 0.05)
  }
  return evMatches(submission.evInput, answer.evChips ?? 0, answer.evTolerance ?? 1)
}
