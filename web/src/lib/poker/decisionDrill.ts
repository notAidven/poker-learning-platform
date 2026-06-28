/**
 * The Coached Decision Drill grader (Room 1 only) — a pure, deterministic,
 * AI-free layer on top of the existing rule-based spot read (`analyzeSpot`) and
 * the Tier-3 rule recommendation (`decideAI`).
 *
 * It does NOT touch the poker engine, opponent logic, the coach's reads, or the
 * deterministic fallback — it only GRADES a decision the hero has already chosen,
 * and the verdict is derived from the SAME math the lessons teach, per street and
 * per action. It stays LENIENT: when more than one line is reasonable the play is
 * accepted as `sound`; only CLEAR deviations from the taught line are flagged, each
 * with a `nudge` that points at the concept the lesson used.
 *
 * Preflop (Playing Preflop / adv-ranges / adv-icm):
 *   - folding a premium (AA, KK, QQ, JJ, AK) is a clear leak (`fold-premium`),
 *   - limping (flat-calling with no raise yet) a premium is too passive (`limp-premium`),
 *   - shoving / calling off a deep stack with a hand outside a sensible range, or
 *     jamming pure trash when short, risks the stack with the worst of it (`shove-weak`).
 *   - Normal opens / calls / 3-bets are accepted (opening ranges are wide and overlap,
 *     so only the clear blunders above are flagged).
 *
 * Postflop (Outs & Equity / Pot Odds / Fold Equity / Bet Sizing / Board Texture / SPR):
 *   - folding two pair or better made from the hole (`fold-strong`),
 *   - calling a big bet with no pair and no draw — drawing dead (`call-no-equity`),
 *   - calling a draw that the price does not justify and implied odds cannot save —
 *     short stack / low SPR, or a weak draw on the turn (`call-bad-odds`),
 *   - raising trash into a bet — a pure bluff into shown strength (`raise-trash`),
 *   - betting pure air into a wet board that smashes the caller (`bet-air-wet`),
 *   - wildly wrong bet/raise sizing (`bad-sizing`).
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
import { parseCardId, type CardId } from '../../types/lesson'
import { rankValue } from './handEvaluator'
import type { SpotAnalysis } from './hints'
import { accumulateDrillXp } from '../gamification'

export type DrillVerdict = 'sound' | 'mistake'

/** A stable code for the grading outcome (drives tests + the nudge copy). */
export type DrillReason =
  | 'sound'
  | 'fold-strong'
  | 'fold-premium'
  | 'limp-premium'
  | 'shove-weak'
  | 'call-no-equity'
  | 'call-bad-odds'
  | 'raise-trash'
  | 'bet-air-wet'
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
  /** The hero's two hole cards — preflop hand classification (ranges + premiums). */
  hole?: [CardId, CardId]
  /** The community cards — postflop board-texture (wet vs dry) read. */
  board?: CardId[]
  /** The big blind, to read stack depth in big blinds preflop. */
  bb?: number
  /** Effective stack in CHIPS (min of the hero's and the largest live opponent's chips). */
  effectiveStack?: number
  /** Fraction of the effective stack this action commits (1 ≈ all-in / call-off); preflop. */
  commitFraction?: number
}

const TWO_PAIR_RANK = HAND_CATEGORY_RANK['two-pair']
const PAIR_RANK = HAND_CATEGORY_RANK['pair']

// --- Preflop ranges (the lessons' taught ground truth) ----------------------
// Premiums you open from ANY seat and never fold/limp (Playing Preflop "premium";
// adv-ranges EARLY_PREMIUM core; adv-icm BUBBLE_TIGHT).
const PREMIUM_PREFLOP = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'])

// The widest sensible raise-first-in range (adv-ranges BTN_OPEN, the button). A hand
// OUTSIDE this is one you would not even open from the best seat, so committing a deep
// stack with it preflop is never right.
const BTN_OPEN = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
  'QJs', 'QTs', 'Q9s', 'Q8s',
  'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s', '54s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
])

// The widest short-stack jamming range (adv-icm SHOVE_WIDE, ~10bb button, no ICM).
// Short stacks play push/fold, so anything in here is a fine jam; only true trash is not.
const SHOVE_WIDE = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  'KQo', 'KJo', 'KTo', 'K9o', 'K8o',
  'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'QJo', 'QTo',
  'JTs', 'J9s', 'J8s', 'JTo', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s', '54s',
])

/** At or below this effective depth (big blinds) we are in push/fold territory. */
const PUSHFOLD_BB = 15
/** A bet/raise/call committing at least this fraction of the effective stack is a shove/call-off. */
const COMMIT_FRACTION = 0.5
/** SPR below this is "low" — close to committed, so implied odds have all but vanished. */
const LOW_SPR = 2

const NUDGE: Record<Exclude<DrillReason, 'sound'>, string> = {
  'fold-strong':
    "That's a big hand to let go. You've made two pair or better with your own cards, so how often do you really think you're beaten here?",
  'fold-premium':
    'That is one of the strongest hands you can be dealt before the flop. A premium hand wants chips in while it is ahead, so how sure are you that you are already beaten?',
  'limp-premium':
    'Just matching the big blind with a premium hand is the passive trap to avoid. With one of the best starting hands, how do you make weaker hands pay to see a flop?',
  'shove-weak':
    'Moving all in before the flop with a weak hand risks your whole stack against the hands strong enough to commit, and those have you in bad shape. Is this really in a sensible shoving range for this stack depth?',
  'call-no-equity':
    'You would be paying a big bet with no pair and no real draw. What hand are you hoping to beat, and which cards actually improve you?',
  'call-bad-odds':
    'The pot is not laying you a good enough price for this draw, and there is little left behind to win if it gets there. Weigh your chance to complete against the price you are paying.',
  'raise-trash':
    'Raising with no pair and no draw turns your hand into a pure bluff against shown strength. What worse hand can call you, and what is your plan if it does?',
  'bet-air-wet':
    'This board is wet and connects with the hands that continue against you, and you hold no pair and no draw to fall back on. What worse hand can you make fold, and what is your plan when it does not?',
  'bad-sizing':
    'That sizing does not fit the spot. Think about the pot: a strong hand wants a size that gets paid, and a bluff should not risk far more than the pot.',
}

const sound = (): DrillGrade => ({ verdict: 'sound', reason: 'sound', nudge: '' })
const mistake = (reason: Exclude<DrillReason, 'sound'>): DrillGrade => ({
  verdict: 'mistake',
  reason,
  nudge: NUDGE[reason],
})

/** Standard shorthand for a starting hand, e.g. "AA", "AKs", "T6o" (matches the lessons). */
export function startingHandCode(hole: [CardId, CardId]): string {
  const a = parseCardId(hole[0])
  const b = parseCardId(hole[1])
  const sym = (rank: string) => (rank === '10' ? 'T' : rank)
  if (a.rank === b.rank) return `${sym(a.rank)}${sym(b.rank)}`
  const [hi, lo] = rankValue(hole[0]) >= rankValue(hole[1]) ? [a.rank, b.rank] : [b.rank, a.rank]
  return `${sym(hi)}${sym(lo)}${a.suit === b.suit ? 's' : 'o'}`
}

/**
 * Is the flop/turn/river board WET (draw-heavy), the way Board Texture & C-Betting
 * defines it? Wet = a real flush threat (three+ of a suit, or two of a suit on a
 * connected board) or a connected, straighty run (three ranks inside a five-card
 * window). Everything else (a spread-out rainbow like K-7-2) reads as dry. Pure.
 */
export function isWetBoard(board: CardId[]): boolean {
  if (board.length < 3) return false

  const suitCounts = new Map<string, number>()
  for (const c of board) {
    const s = parseCardId(c).suit
    suitCounts.set(s, (suitCounts.get(s) ?? 0) + 1)
  }
  const suitMax = Math.max(...suitCounts.values())

  // Rank coordination (Ace also plays low for the wheel).
  const ranks = new Set<number>()
  for (const c of board) {
    const v = rankValue(c)
    ranks.add(v)
    if (v === 14) ranks.add(1)
  }
  const uniq = [...ranks].sort((x, y) => x - y)
  let connected = false
  for (let i = 0; i < uniq.length; i++) {
    for (let j = i + 1; j < uniq.length; j++) {
      const gap = uniq[j] - uniq[i]
      if (gap >= 1 && gap <= 2) connected = true
    }
  }
  let veryConnected = false
  for (const low of uniq) {
    if (uniq.filter((r) => r >= low && r <= low + 4).length >= 3) veryConnected = true
  }

  return suitMax >= 3 || (suitMax >= 2 && connected) || veryConnected
}

/**
 * Grade a single hero decision. Pure and lenient: returns `sound` for anything
 * reasonable and only flags the clear, lesson-defined mistakes. Checking is free, so
 * it is never a mistake; preflop and postflop are graded against their own math.
 */
export function gradeDrillDecision(decision: DrillDecision, spot: DrillSpot): DrillGrade {
  if (decision.action === 'check') return sound()
  if (spot.analysis.street === 'preflop') return gradePreflop(decision, spot)
  return gradePostflop(decision, spot)
}

/**
 * Preflop grading (Playing Preflop / adv-ranges / adv-icm). Lenient for standard
 * opens / calls / 3-bets; flags only the clear, taught blunders: folding or limping
 * a premium, and stacking off (shove or call-off) with a hand outside a sensible
 * range for the stack depth.
 */
function gradePreflop(decision: DrillDecision, spot: DrillSpot): DrillGrade {
  const hole = spot.hole
  if (!hole) return sound() // no read available → accept (back-compat / non-drill callers)

  const code = startingHandCode(hole)
  const premium = PREMIUM_PREFLOP.has(code)

  // Folding a premium before the flop throws away a clear edge (Playing Preflop p1).
  if (decision.action === 'fold') return premium ? mistake('fold-premium') : sound()

  // Limping (flat-calling with no raise in front) a premium is the passive trap the
  // preflop lesson warns about: no raise yet means the current bet is just the blind.
  const noRaiseYet = spot.bb != null && spot.currentBet > 0 && spot.currentBet <= spot.bb
  if (decision.action === 'call' && noRaiseYet && premium) return mistake('limp-premium')

  // A near-all-in commitment (a shove, a huge overbet, or a call-off) is graded
  // against the taught shoving ranges; everything smaller stays lenient.
  const commits =
    (decision.action === 'bet' || decision.action === 'raise' || decision.action === 'call') &&
    (spot.commitFraction ?? 0) >= COMMIT_FRACTION
  if (commits) {
    const depthBB = depthInBB(spot)
    if (depthBB != null && depthBB <= PUSHFOLD_BB) {
      // Short stack push/fold (adv-icm): jam a wide range; only true trash is wrong.
      return SHOVE_WIDE.has(code) ? sound() : mistake('shove-weak')
    }
    // Deep: stacking off preflop is only right with a hand you would even open from
    // the best seat. Anything outside the widest RFI is far behind any calling range.
    return BTN_OPEN.has(code) ? sound() : mistake('shove-weak')
  }

  return sound()
}

/**
 * Postflop grading (Outs & Equity / Pot Odds / Fold Equity / Bet Sizing / Board
 * Texture / SPR). Reads the made hand, draw, pot-odds price, board texture, and SPR
 * straight off the deterministic spot read and grades each action against them.
 */
function gradePostflop(decision: DrillDecision, spot: DrillSpot): DrillGrade {
  const a = spot.analysis

  // Does the hero actually OWN the made hand, or is it a shared board hand? A hand
  // sitting entirely on the board is nobody's asset, so it is not "strength".
  const ownsMade = a.madeFromHole !== false
  const madeRank = ownsMade && a.madeCategory ? HAND_CATEGORY_RANK[a.madeCategory] : 0
  const strongMade = madeRank >= TWO_PAIR_RANK // two pair or better, made from hole
  const hasPairPlus = madeRank >= PAIR_RANK // at least a pair, made from hole
  const hasDraw = a.drawName != null && (a.outs ?? 0) > 0
  const pricedDraw = hasDraw && a.pricedIn === true
  // "Trash" = no made pair of the hero's own and no real draw: nothing to bet/call with.
  const trash = !hasPairPlus && !hasDraw
  const bigBet = a.bigBet === true
  const wet = spot.board ? isWetBoard(spot.board) : false
  const spr =
    spot.effectiveStack != null && spot.pot > 0 ? spot.effectiveStack / spot.pot : null

  switch (decision.action) {
    case 'fold':
      // Folding a genuinely strong made hand is the clearest beginner leak. Folding
      // anything weaker (one pair, a draw, air) is a defensible, accepted choice.
      return strongMade ? mistake('fold-strong') : sound()

    case 'call': {
      // A strong made hand never needs to fold; calling (or raising) is always fine.
      if (strongMade) return sound()
      // Calling a BIG bet with no made hand and no live draw is paying off with no
      // equity (drawing dead). A small bet, or a pair / draw, stays accepted (lenient).
      if (trash && bigBet && !pricedDraw) return mistake('call-no-equity')
      // A draw the price does not justify, with no implied odds to rescue it: short
      // stack / low SPR (implied odds gone, adv-implied), or a weak turn draw (Pot Odds).
      if (hasDraw && a.pricedIn === false) {
        const lowSpr = spr != null && spr < LOW_SPR
        const weakTurnDraw = a.street === 'turn' && (a.outs ?? 0) < 8
        if (lowSpr || weakTurnDraw) return mistake('call-bad-odds')
      }
      return sound()
    }

    case 'bet':
    case 'raise': {
      // Raising into a bet with complete trash is a pure bluff into shown strength.
      if (decision.action === 'raise' && trash) return mistake('raise-trash')
      // Betting pure air into a WET board that smashes the caller has neither value
      // nor real fold equity (Board Texture & C-Betting). On a dry board an air c-bet
      // keeps fold equity, so only the wet case is flagged.
      if (decision.action === 'bet' && trash && wet) return mistake('bet-air-wet')
      return gradeSizing(decision, spot, strongMade)
    }

    default:
      return sound()
  }
}

/** Effective stack depth in big blinds, when the inputs are present. */
function depthInBB(spot: DrillSpot): number | null {
  if (spot.effectiveStack == null || spot.bb == null || spot.bb <= 0) return null
  return spot.effectiveStack / spot.bb
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
