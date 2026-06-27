/**
 * Pure, framework-free helpers for the `range-grid` interaction (Advanced Play).
 *
 * The 169 starting-hand classes are laid out on a 13x13 matrix:
 *   - rows    = the first  rank, A..2 (high -> low)
 *   - columns = the second rank, A..2 (high -> low)
 *   - the diagonal (row === col) is the pocket pairs: AA, KK, ..., 22
 *   - the UPPER triangle (col > row, above the diagonal) is the suited hands: 'AKs'
 *   - the LOWER triangle (col < row, below the diagonal) is the offsuit hands: 'AKo'
 *
 * Hand ids use the standard poker shorthand with the higher rank first and 'T' for ten,
 * e.g. 'AA', 'AKs', 'AKo', 'T9s', '72o'. Everything here is deterministic and has no
 * dependency on React, so the widget and its unit tests share the exact same grading.
 */

/** The 13 ranks, strongest first. Ten is 'T' so every rank is a single character. */
export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const

export type Rank = (typeof RANKS)[number]

/** The three classes a starting-hand cell can belong to. */
export type HandClass = 'pair' | 'suited' | 'offsuit'

/** Number of rows / columns in the grid (13). */
export const GRID_SIZE = RANKS.length

/**
 * The hand-class id at grid position (row, col). The higher of the two ranks always
 * comes first in the id. On the diagonal it is a pair (e.g. 'AA'); above the diagonal
 * (col > row) it is suited ('AKs'); below it is offsuit ('AKo').
 */
export function handAt(row: number, col: number): string {
  const hi = RANKS[Math.min(row, col)]
  const lo = RANKS[Math.max(row, col)]
  if (row === col) return `${hi}${hi}`
  // col > row sits above the diagonal -> suited; otherwise offsuit.
  return col > row ? `${hi}${lo}s` : `${hi}${lo}o`
}

/** All 169 starting-hand class ids, in row-major order (matches the rendered grid). */
export function allHands(): string[] {
  const out: string[] = []
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      out.push(handAt(row, col))
    }
  }
  return out
}

/** Classify a hand id as a pocket pair, a suited hand, or an offsuit hand. */
export function classify(hand: string): HandClass {
  if (hand.endsWith('s')) return 'suited'
  if (hand.endsWith('o')) return 'offsuit'
  return 'pair'
}

/** True when `hand` is one of the classes listed in `range`. */
export function isHandInRange(hand: string, range: readonly string[]): boolean {
  return range.includes(hand)
}

/**
 * True when the learner's tapped selection is EXACTLY the target range (same members,
 * no extras, no omissions). Accepts either an array or a Set so callers can pass their
 * live selection straight through.
 */
export function gradeRangeSelection(
  selected: readonly string[] | Set<string>,
  target: readonly string[],
): boolean {
  const selectedSet = selected instanceof Set ? selected : new Set(selected)
  const targetSet = new Set(target)
  if (selectedSet.size !== targetSet.size) return false
  for (const hand of targetSet) {
    if (!selectedSet.has(hand)) return false
  }
  return true
}
