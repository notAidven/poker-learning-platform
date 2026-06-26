/**
 * Shared text helpers for the AI layer (the coach + the LLM opponents). Pure and
 * dependency-light so both modules can share one implementation.
 */
import type { BettingAction } from '../../types/poker'

/** Collapse internal whitespace and strip wrapping quotes from raw model output. */
export function tidyModelText(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^["'“”]+/, '')
    .replace(/["'“”]+$/, '')
    .trim()
}

export type LegalActionLike = { action: BettingAction; min?: number; max?: number }

/**
 * Render the legal actions for an LLM prompt. Two grounded styles are in use, and
 * each MUST stay byte-identical to the prompt it feeds:
 *  - 'inline' (coach prompts): comma-joined; bet/raise show "(min–max)" only when a
 *    bound is present, e.g. "bet (10–100), call, fold".
 *  - 'list' (opponent prompt): newline-bulleted; call shows "(to call N)" and
 *    bet/raise show "(min X, max Y)".
 */
export function describeLegalActions(
  legalActions: LegalActionLike[],
  style: 'inline' | 'list',
  toCall = 0,
): string {
  if (legalActions.length === 0) return '(none)'

  if (style === 'list') {
    return legalActions
      .map((la) => {
        if (la.action === 'call') return `call (to call ${toCall})`
        if (la.action === 'bet' || la.action === 'raise') {
          return `${la.action} (min ${la.min ?? '?'}, max ${la.max ?? '?'})`
        }
        return la.action
      })
      .join('\n- ')
  }

  return legalActions
    .map((la) => {
      if ((la.action === 'bet' || la.action === 'raise') && (la.min != null || la.max != null)) {
        return `${la.action} (${la.min ?? '?'}–${la.max ?? '?'})`
      }
      return la.action
    })
    .join(', ')
}
