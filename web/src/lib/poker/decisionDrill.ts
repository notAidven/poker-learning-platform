/**
 * The Coached Decision Drill grader (Room 1 only) — a pure, deterministic,
 * AI-free layer on top of the existing rule-based spot read (`analyzeSpot`) and
 * the Tier-3 rule recommendation (`decideAI`).
 *
 * It does NOT touch the poker engine, opponent logic, the coach's reads, or the
 * deterministic fallback — it only GRADES a decision the hero has already chosen:
 *
 *   - Grade LENIENTLY. Any clearly-reasonable / standard / +EV play is accepted
 *     as `sound`; more than one action can be acceptable in a spot. Only a few
 *     CLEAR, beginner-level mistakes are flagged:
 *       · folding a very strong made hand (two pair or better, made from hole),
 *       · calling a big bet with no made hand and no real draw (no equity),
 *       · raising trash (no pair, no draw) into a bet — a pure bluff into strength,
 *       · wildly wrong bet/raise sizing (a dribble bet with the nuts, or a >2x-pot
 *         overbet without a premium hand).
 *   - Preflop is graded leniently as always-sound: with only two known cards the
 *     made-hand/equity read does not exist, so standard preflop play is accepted.
 *
 * A `mistake` returns a `nudge` — a HINT about WHY the play is not best (framed as
 * a question / principle), never the answer. A `sound` decision returns no nudge;
 * the table pairs it with the existing supportive coach reaction.
 *
 * The session reducer (`recordDrillResult`) tracks best-on-first-try accuracy and
 * the modest, capped session XP, modelling the full "mistake → rethink → sound"
 * flow purely so it is trivially unit-testable.
 */
import { HAND_CATEGORY_RANK, type BettingAction } from '../../types/poker'
import type { SpotAnalysis } from './hints'
import { accumulateDrillXp } from '../gamification'

export type DrillVerdict = 'sound' | 'mistake'

/** A stable code for the grading outcome (drives tests + the nudge copy). */
export type DrillReason =
  | 'sound'
  | 'fold-strong'
  | 'call-no-equity'
  | 'raise-trash'
  | 'bad-sizing'

export type DrillGrade = {
  verdict: DrillVerdict
  reason: DrillReason
  /** A hint about WHY it is not best (mistakes only); '' for a sound decision. */
  nudge: string
}

/** The hero's chosen decision: an action plus, for bet/raise, the "to" total. */
export type DrillDecision = {
  action: BettingAction
  /** The total street commitment for a bet/raise (the engine's `AppliedAction.amount`). */
  amount?: number
}

/** Everything the grader needs about the spot, derived from the engine + rule reads. */
export type DrillSpot = {
  /** The rule-based read of the spot (`analyzeSpot`). */
  analysis: SpotAnalysis
  /** The Tier-3 rule recommendation's action (`decideAI`) — context only; grading is lenient. */
  recommended: BettingAction
  /** Chips owed to call (0 when not facing a bet). */
  toCall: number
  /** The bet-INCLUSIVE pot (same convention `analyzeSpot` uses). */
  pot: number
  /** The current street bet the hero must match (0 when first to act). */
  currentBet: number
  /** Legal "to" lower bound for the chosen bet/raise, if any. */
  sizingMin?: number
  /** Legal "to" upper bound (all-in) for the chosen bet/raise, if any. */
  sizingMax?: number
}

const TWO_PAIR_RANK = HAND_CATEGORY_RANK['two-pair']
const PAIR_RANK = HAND_CATEGORY_RANK['pair']

const NUDGE: Record<Exclude<DrillReason, 'sound'>, string> = {
  'fold-strong':
    "That's a big hand to let go — you've made two pair or better with your own cards. How often do you really think you're beaten here?",
  'call-no-equity':
    'You would be paying a big bet with no pair and no real draw. What hand are you hoping to beat, and which cards actually improve you?',
  'raise-trash':
    'Raising with no pair and no draw turns your hand into a pure bluff against shown strength. What worse hand can call you — and what is your plan if it does?',
  'bad-sizing':
    'That sizing does not fit the spot. Think about the pot: a strong hand wants a size that gets paid, and a bluff should not risk far more than the pot.',
}

const sound = (): DrillGrade => ({ verdict: 'sound', reason: 'sound', nudge: '' })
const mistake = (reason: Exclude<DrillReason, 'sound'>): DrillGrade => ({
  verdict: 'mistake',
  reason,
  nudge: NUDGE[reason],
})

/**
 * Grade a single hero decision. Pure and lenient: returns `sound` for anything
 * reasonable and only flags the handful of clear mistakes above.
 */
export function gradeDrillDecision(decision: DrillDecision, spot: DrillSpot): DrillGrade {
  const a = spot.analysis

  // Preflop (or no board to read): with two cards there is no made-hand/equity
  // read, so accept standard play. Checking is always free, so never a mistake.
  if (a.street === 'preflop' || decision.action === 'check') return sound()

  // Does the hero actually OWN the made hand, or is it a shared board hand? A
  // hand sitting entirely on the board is nobody's asset, so it is not "strength".
  const ownsMade = a.madeFromHole !== false
  const madeRank = ownsMade && a.madeCategory ? HAND_CATEGORY_RANK[a.madeCategory] : 0
  const strongMade = madeRank >= TWO_PAIR_RANK // two pair or better, made from hole
  const hasPairPlus = madeRank >= PAIR_RANK // at least a pair, made from hole
  const hasDraw = a.drawName != null && (a.outs ?? 0) > 0
  const pricedDraw = hasDraw && a.pricedIn === true
  // "Trash" = no made pair of the hero's own and no real draw: nothing to bet/call with.
  const trash = !hasPairPlus && !hasDraw
  const bigBet = a.bigBet === true

  switch (decision.action) {
    case 'fold':
      // Folding a genuinely strong made hand is the clearest beginner leak. Folding
      // anything weaker (one pair, a draw, air) is a defensible, accepted choice.
      return strongMade ? mistake('fold-strong') : sound()

    case 'call':
      // Calling a BIG bet with no made hand and no live draw is paying off with no
      // equity. Calling a small bet, or with a pair / draw, stays accepted (lenient).
      return bigBet && trash && !pricedDraw ? mistake('call-no-equity') : sound()

    case 'bet':
    case 'raise': {
      // Raising into a bet with complete trash is a pure bluff into shown strength.
      // (An opening bet as a bluff keeps fold equity, so it is left accepted.)
      if (decision.action === 'raise' && trash) return mistake('raise-trash')
      return gradeSizing(decision, spot, strongMade)
    }

    default:
      return sound()
  }
}

/**
 * Sizing check for a bet/raise — only flags WILDLY wrong sizes, so normal ¼-pot
 * through pot-plus sizes (and any all-in) are accepted:
 *   - a dribble bet (< ¼ pot) with a strong hand when a real bet was available, or
 *   - a > 2× pot overbet without a strong hand.
 */
function gradeSizing(decision: DrillDecision, spot: DrillSpot, strongMade: boolean): DrillGrade {
  const min = spot.sizingMin ?? spot.currentBet
  const max = spot.sizingMax ?? decision.amount ?? min
  const chosen = decision.amount ?? min

  // An all-in is always a legitimate size; never grade it as a sizing mistake.
  if (chosen >= max) return sound()

  const potRef = Math.max(1, spot.pot)
  const increment = chosen - spot.currentBet // chips put in beyond the call
  const couldSizeUp = max - spot.currentBet >= 0.5 * potRef

  if (strongMade && increment < 0.25 * potRef && couldSizeUp) return mistake('bad-sizing')
  if (!strongMade && increment > 2 * potRef) return mistake('bad-sizing')
  return sound()
}

// ---------------------------------------------------------------------------
// Session tracking — best-on-first-try accuracy + modest, capped XP.
//
// A "decision point" is one spot where the hero must act. The hero may rethink
// after a nudge; only the FIRST attempt at a spot counts toward accuracy, and a
// decision point is "completed" once a sound choice is finally made. The reducer
// is keyed by an opaque per-spot signature so the whole mistake→rethink→sound
// flow is modelled purely (and unit-tested without React).
// ---------------------------------------------------------------------------

export type DrillSessionState = {
  /** Completed decision points (a spot resolved by a sound choice). */
  decisions: number
  /** Of those, the ones that were sound on the FIRST attempt. */
  firstTryCorrect: number
  /** Modest, capped XP earned this session. */
  xp: number
  /** Signature of the spot currently mid-attempt (null once resolved). */
  spotSig: string | null
  /** Whether the current spot has already had a flagged mistake (so it is no longer first-try). */
  spotHadMistake: boolean
}

export function initialDrillSession(): DrillSessionState {
  return { decisions: 0, firstTryCorrect: 0, xp: 0, spotSig: null, spotHadMistake: false }
}

/**
 * Fold one graded attempt into the session.
 *   - A `mistake` is remembered against the current spot (so a later success there
 *     is not first-try) but completes nothing and earns nothing.
 *   - A `sound` choice completes the decision point, scores first-try accuracy, and
 *     earns the (capped) XP — more when no nudge was needed.
 * `spotSig` identifies the spot; a new signature starts a fresh attempt cleanly.
 */
export function recordDrillResult(
  state: DrillSessionState,
  spotSig: string,
  verdict: DrillVerdict,
): DrillSessionState {
  const sameSpot = state.spotSig === spotSig
  const hadMistake = sameSpot ? state.spotHadMistake : false

  if (verdict === 'mistake') {
    return { ...state, spotSig, spotHadMistake: true }
  }

  const firstTry = !hadMistake
  return {
    decisions: state.decisions + 1,
    firstTryCorrect: state.firstTryCorrect + (firstTry ? 1 : 0),
    xp: accumulateDrillXp(state.xp, firstTry),
    spotSig: null,
    spotHadMistake: false,
  }
}
