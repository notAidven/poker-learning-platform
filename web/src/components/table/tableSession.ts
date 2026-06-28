/**
 * Casino hand session — the pure sequencing core of the live table.
 *
 * The bug-prone part of <PokerTable> is not WHICH action a seat takes (that is the
 * engine + `opponentAI`) but WHEN to apply it: turn order, the re-fire stale-guard on
 * a paced opponent decision, and whether a finished hand cleared the table. Those
 * decisions used to live inline in React effects and refs with no interface and no
 * test. They live here as pure functions over `HandState`, so the component is left
 * to render and fire timers while the sequencing itself is the test surface.
 *
 * Every "advance" settles the hand the moment it ends (via `finalizeHand`), so a
 * stored hand is always paid out. Applying against a stale hand (a re-fired timer, a
 * decision that resolved after the turn already moved) is a deliberate no-op: it
 * returns the SAME state object, never a duplicated action.
 */
import { applyAction, type AppliedAction, type HandState } from '../../lib/poker/handEngine'
import { finalizeHand, type HandSummary } from './tableRuntime'

/** Whether it is the hero's turn to act (a non-complete hand with the hero to act). */
export function heroToAct(state: HandState, heroIndex: number): boolean {
  return state.phase !== 'complete' && heroIndex >= 0 && state.toActIndex === heroIndex
}

/** The non-hero seat currently to act, or null (hand over, hero's turn, or nobody). */
export function opponentToAct(state: HandState): number | null {
  if (state.phase === 'complete' || state.toActIndex == null) return null
  return state.seats[state.toActIndex]?.isHero ? null : state.toActIndex
}

/**
 * Apply the hero's action ONLY when a hero is genuinely to act on this not-complete
 * hand, then settle. A wrong-turn or double-fire returns the SAME hand unchanged.
 */
export function advanceWithHeroAction(state: HandState, applied: AppliedAction): HandState {
  if (state.toActIndex == null || state.phase === 'complete') return state
  if (!state.seats[state.toActIndex]?.isHero) return state
  return finalizeHand(applyAction(state, applied))
}

/**
 * Apply an already-decided opponent action ONLY when that SAME seat is still to act
 * on this not-complete hand, then settle. This is the stale-guard that turns a
 * re-fired pacing timer (or a decision resolved against a now-moved-on hand) into a
 * no-op instead of applying the action twice.
 */
export function advanceWithOpponentAction(
  state: HandState,
  seatIndex: number,
  applied: AppliedAction,
): HandState {
  if (state.toActIndex !== seatIndex || state.phase === 'complete') return state
  return finalizeHand(applyAction(state, applied))
}

/** Whether a finished hand clears the table: the first showdown, or a hero pot win. */
export function clearsTable(summary: HandSummary): boolean {
  return summary.reachedShowdown || summary.winnerIds.includes('hero')
}
