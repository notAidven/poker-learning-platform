/**
 * Coach feedback — the casino coach's VOICE, in one place.
 *
 * Everything that turns "what just happened at the table" into coach text lives here:
 *   - the in-the-moment reaction to the action the hero just took (`coachReactionFor`),
 *   - the graded Decision Drill verdict + its coach line (`gradeHeroDecision`),
 *   - the result-aware end-of-hand reflection (`coachResultReaction`), and
 *   - the per-street hand-log grouping for the feed (`groupHandLog`).
 *
 * This was lifted out of `tableRuntime` (which is engine<->AI wiring + hand lifecycle):
 * ~48% of that file was self-contained, AI-free pedagogy and log presentation with no
 * relation to opponent routing. Concentrating it here gives the coach voice locality
 * (a coach-wording bug no longer hides next to "how an opponent decides") and keeps the
 * runtime glue down to what it names.
 *
 * It is pure and AI-free: it reads structured spot facts via `analyzeSpot` (the
 * spot-strength read) and the Tier-3 rule recommendation via `decideAI`, so the coach
 * works fully with AI off and the engine only ever GRADES — the LLM, when present,
 * merely rephrases these lines. It depends on `tableRuntime` only for the small
 * context builders (`buildHintContext`, `buildAIDecisionInput`) and `summarizeHand`;
 * the runtime never depends back on it.
 */
import { parseCardId, type CardId } from '../../types/lesson'
import type { BettingAction, EvaluatedHand, HandCategory, PokerStreet } from '../../types/poker'
import {
  legalActions,
  toCallFor,
  type AppliedAction,
  type HandState,
  type SeatState,
} from '../../lib/poker/handEngine'
import {
  compareHands,
  evaluateHoldem,
  holeCardsImproveBoard,
  rankValue,
} from '../../lib/poker/handEvaluator'
import { decideAI } from '../../lib/poker/opponentAI'
import { analyzeSpot, type SpotAnalysis } from '../../lib/poker/hints'
import { gradeDrillDecision, type DrillReason, type DrillVerdict } from '../../lib/poker/decisionDrill'
import { buildAIDecisionInput, buildHintContext, summarizeHand } from './tableRuntime'

// ---------------------------------------------------------------------------
// Rule-based coach reaction (Room 1) — a supportive, GUIDING note about the play
// the hero just made. Pure and AI-free: it reads the spot with `analyzeSpot` and
// compares the hero's action to the Tier-3 rule recommendation (`decideAI`), so it
// works fully with AI off. Tested directly in coachFeedback.test.ts.
// ---------------------------------------------------------------------------

const STRONG_MADE: Set<HandCategory> = new Set([
  'two-pair',
  'trips',
  'straight',
  'flush',
  'full-house',
  'quads',
  'straight-flush',
  'royal-flush',
])

function lowerFirst(s: string): string {
  return s.length > 0 ? s[0].toLowerCase() + s.slice(1) : s
}

function upperFirst(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s
}

/**
 * A short, supportive coaching reaction to the action the hero just took, derived
 * from the rule logic (no AI). `state` is the pre-action hand (the hero's turn),
 * `action` is what they chose. Returns '' when there is nothing to read.
 */
export function coachReactionFor(
  state: HandState,
  heroIndex: number,
  action: BettingAction,
): string {
  const seat = state.seats[heroIndex]
  if (!seat || !seat.holeCards) return ''
  const analysis = analyzeSpot(buildHintContext(state, heroIndex))
  const rec = decideAI(buildAIDecisionInput(state, heroIndex, 3))
  return composeCoachReaction(action, rec.action, analysis)
}

/**
 * Reaction for the case where the hero's made hand is entirely on the board (a
 * shared board pair / "playing the board"), with no draw of their own. The coach
 * must NOT present that shared hand as the hero's asset.
 */
function composeBoardSharedReaction(hero: BettingAction, a: SpotAnalysis): string {
  const shared = a.boardMadeLabel ? lowerFirst(a.boardMadeLabel) : 'made hand'
  const note = `that ${shared} is on the board, so everyone shares it and it is not your hand`
  switch (hero) {
    case 'fold':
      return `Good fold. ${upperFirst(note)}, so there was nothing of your own to keep going with.`
    case 'check':
      return `Smart check. ${upperFirst(note)}, so keep the pot small until your hole cards actually connect.`
    case 'call':
      return `Careful here. ${upperFirst(note)}. Your hole cards have not connected, so you effectively have high-card strength; make sure the price is right before paying off a bet.`
    case 'bet':
    case 'raise':
      return `${upperFirst(note)}. Betting this is a bluff and not value, since your hole cards have not improved on the board, so only do it with a clear plan.`
    default:
      return `${upperFirst(note)}, so treat it as a weak holding until your hole cards connect.`
  }
}

/** Pure formatter for the coach reaction (exported for tests). */
export function composeCoachReaction(
  hero: BettingAction,
  rec: BettingAction,
  a: SpotAnalysis,
): string {
  // Playing the board (a shared board hand, no draw of the hero's own): correct the
  // read instead of treating the board's hand as the hero's.
  if (a.madeLabel != null && a.madeFromHole === false && !a.drawName) {
    return composeBoardSharedReaction(hero, a)
  }

  const strong = a.madeCategory ? STRONG_MADE.has(a.madeCategory) && a.madeFromHole !== false : false
  const handBit =
    a.madeLabel && a.madeFromHole !== false
      ? `your ${lowerFirst(a.madeLabel)}`
      : a.drawName
        ? `your ${a.drawName}`
        : 'this hand'
  const odds = a.potOddsPct

  switch (hero) {
    case 'fold':
      if (rec === 'fold') {
        return a.drawName
          ? `Good discipline. A ${a.drawName} that is not getting the right price is a fine fold, and you keep your chips for a better spot.`
          : 'Good fold. With little to continue with, folding keeps your chips for a stronger hand.'
      }
      return strong
        ? `That is a safe fold, but ${handBit} was strong enough to keep going. No harm done, just one to notice next time.`
        : `Folding is safe here, though ${handBit} could have continued. You can trust spots like this a little more.`
    case 'check':
      if (rec === 'bet' || rec === 'raise') {
        return strong
          ? `Steady, but with ${handBit} you can bet for value and get paid by weaker hands. Try a bet here next time.`
          : 'Checking keeps the pot small, which is fine. When you hold a strong hand, look to bet it for value.'
      }
      return 'Good check. With a marginal hand, taking a free card and keeping the pot small is the disciplined play.'
    case 'call':
      if (rec === 'raise') {
        return `Solid call, and nice that you stayed in. With ${handBit} you could even raise for value to build the pot.`
      }
      if (rec === 'fold') {
        return odds != null
          ? `That call is on the loose side. You needed about ${odds}% to call, so make sure the hand clears that price.`
          : 'That call is a touch loose. Weigh your hand strength against the price before you call.'
      }
      return a.drawName && a.pricedIn
        ? `Good call. Your ${a.drawName} is getting the right price, so chasing it is profitable.`
        : `Good call. ${upperFirst(handBit)} is worth continuing at this price.`
    case 'bet':
      if (rec === 'bet' || rec === 'raise') {
        return strong
          ? `Great value bet with ${handBit}. Betting while you are ahead builds the pot you will usually win.`
          : a.drawName
            ? `Nice aggression. Betting your ${a.drawName} adds fold equity to the outs you already have.`
            : 'Nice bet. Putting on pressure can win the pot right now.'
      }
      return 'Betting can work as a bluff, but with a weak hand checking is often safer. Bet with a clear plan for why.'
    case 'raise':
      if (rec === 'raise' || rec === 'bet') {
        return strong
          ? `Great raise. With ${handBit} you raise for value and make weaker hands pay.`
          : 'Strong, aggressive play. Keep your bluff-raises balanced so you are not doing it too often.'
      }
      if (rec === 'call') {
        return `Aggressive line. Raising is fine, though calling also kept you in cheaply with ${handBit}.`
      }
      return 'Bold raise. With little equity that is a bluff, which can work, but pick your spots so you do not bluff too much.'
    default:
      return 'Nice. Keep weighing your hand strength against the price before each move.'
  }
}

// ---------------------------------------------------------------------------
// Graded Decision Drill (Room 1 only) — grade the hero's chosen action, then
// either SUPPORT it (sound → take the action) or NUDGE it (clear mistake → the
// action is not applied and the hero re-thinks). Pure + AI-free: it reads the spot
// with `analyzeSpot` and the Tier-3 rule recommendation with `decideAI`, then
// defers the lenient accept/flag decision to the pure grader in `decisionDrill`.
// ---------------------------------------------------------------------------

export type HeroDecisionGrade = {
  verdict: DrillVerdict
  reason: DrillReason
  /**
   * The coach line to show: a brief, supportive "why it's right" for a sound move
   * (reusing the existing rule-based reaction voice), or a hint nudge ("why it's
   * not best", never the answer) for a clear mistake.
   */
  message: string
}

/**
 * Grade the action the hero just chose on the coached table. `state` is the
 * pre-action hand (the hero's turn); `applied` is their chosen action (+ size).
 * Returns a sound/mistake verdict plus the coach message. A non-gradeable spot
 * (no hero / not their turn) is treated as sound so the move simply applies.
 */
export function gradeHeroDecision(
  state: HandState,
  heroIndex: number,
  applied: AppliedAction,
): HeroDecisionGrade {
  const seat = state.seats[heroIndex]
  if (!seat || !seat.holeCards || state.toActIndex !== heroIndex) {
    return { verdict: 'sound', reason: 'sound', message: '' }
  }

  const analysis = analyzeSpot(buildHintContext(state, heroIndex))
  const rec = decideAI(buildAIDecisionInput(state, heroIndex, 3))
  const bounds = legalActions(state).find((a) => a.action === applied.action)

  // Stack/commitment context for the grader: the effective stack (the most a single
  // live opponent can put at risk against the hero) sets the stack depth and SPR, and
  // the commit fraction tells a preflop shove / call-off from a normal-sized bet.
  const toCall = toCallFor(state, heroIndex)
  const heroTotal = seat.stack + seat.committed
  let villainTotal = 0
  state.seats.forEach((s, i) => {
    if (i !== heroIndex && !s.folded) villainTotal = Math.max(villainTotal, s.stack + s.committed)
  })
  const effectiveStack = Math.max(1, Math.min(heroTotal, villainTotal || heroTotal))
  const added =
    applied.action === 'bet' || applied.action === 'raise'
      ? Math.max(0, (applied.amount ?? 0) - seat.committed)
      : applied.action === 'call'
        ? toCall
        : 0
  const commitFraction = Math.min(seat.committed + added, effectiveStack) / effectiveStack

  const grade = gradeDrillDecision(
    { action: applied.action, amount: applied.amount },
    {
      analysis,
      recommended: rec.action,
      toCall,
      pot: state.pot,
      currentBet: state.currentBet,
      sizingMin: bounds?.min,
      sizingMax: bounds?.max,
      hole: seat.holeCards ?? undefined,
      board: state.board,
      bb: state.bb,
      effectiveStack,
      commitFraction,
    },
  )

  const message =
    grade.verdict === 'mistake'
      ? grade.nudge
      : composeCoachReaction(applied.action, rec.action, analysis)

  return { verdict: grade.verdict, reason: grade.reason, message }
}

/**
 * Opaque per-spot signature for the drill session reducer: stable while the hero
 * re-thinks the SAME spot (the hand does not change until a sound action applies)
 * and different once the action moves on. `handIndex` namespaces it across hands.
 */
export function drillSpotSignature(handIndex: number, state: HandState, heroIndex: number): string {
  return [
    handIndex,
    state.phase,
    state.toActIndex ?? 'x',
    state.currentBet,
    state.pot,
    state.board.length,
    state.seats[heroIndex]?.committed ?? 0,
  ].join(':')
}

// ---------------------------------------------------------------------------
// Result-aware end-of-hand coach reflection (Room 1) — a supportive "what just
// happened" recap shown once the hand is OVER (showdown or everyone folded).
//
// Where `coachReactionFor` reacts to a single action in the moment, this factors
// in HOW the hand ended: did the hero win or lose, how big was the pot, what was
// the hero's final hand, and — at showdown — the hand that beat them plus whether
// an obvious draw completed on the board (a 3-flush, a 4-card straight, or a
// paired board). It is deliberately NOT results-oriented: a well-priced call that
// lost is framed as variance ("keep making it"), while a loose call into a danger
// board is gently corrected ("a spot to consider folding"). Pure + AI-free; the
// formatter is exported and unit-tested directly.
// ---------------------------------------------------------------------------

/** A completed-draw threat visible on the final board. */
export type BoardThreat = 'flush' | 'straight' | 'board-pair' | null

/** Structured, result-aware read of a finished hand (the formatter's input). */
export type HandResultRead = {
  /** Did the hand reach showdown, so the opponents' cards are revealed? */
  reachedShowdown: boolean
  /** Did the hero win any pot? */
  heroWon: boolean
  /** A meaningful pot relative to the blinds (wording emphasis only). */
  bigPot: boolean
  /** Hero's final hand category + label (null when it cannot be read). */
  heroCategory: HandCategory | null
  heroLabel: string | null
  /** Hero's final hand is two pair or better AND made with the hero's hole cards. */
  heroStrong: boolean
  /** The hero's made hand was entirely on the board (they were playing the board). */
  heroPlayedBoard: boolean
  /** At showdown: the hand that beat the hero (best non-hero shown hand). */
  villainCategory: HandCategory | null
  villainLabel: string | null
  /** A scary draw visibly completed on the board, or the board paired. */
  boardThreat: BoardThreat
  /** The hero's continue was defensible on price/equity (a real, live draw). */
  pricedIn: boolean
  /** The hero was chasing a genuine flush / open-ended straight draw. */
  heroHadDraw: boolean
  /** A previously passive opponent suddenly bet or raised on the turn / river. */
  passiveThenAggressive: boolean
}

/** Pot >= this many big blinds reads as "a big pot" for wording emphasis. */
const BIG_POT_BB = 25

/** Read the most salient completed-draw threat off the final board (pure). */
export function boardThreatOf(board: CardId[]): BoardThreat {
  if (board.length < 3) return null

  // Flush threat: three or more of a single suit already sit on the board.
  const suitCounts = new Map<string, number>()
  for (const c of board) {
    const { suit } = parseCardId(c)
    suitCounts.set(suit, (suitCounts.get(suit) ?? 0) + 1)
  }
  if ([...suitCounts.values()].some((n) => n >= 3)) return 'flush'

  // Straight threat: four board cards fall inside some 5-rank window (Ace high/low).
  const present = new Set<number>()
  for (const c of board) {
    const v = rankValue(c)
    present.add(v)
    if (v === 14) present.add(1)
  }
  for (let low = 1; low <= 10; low++) {
    let inWindow = 0
    for (let k = 0; k < 5; k++) if (present.has(low + k)) inWindow++
    if (inWindow >= 4) return 'straight'
  }

  // Paired board: a rank appears at least twice among the community cards.
  const rankCounts = new Map<number, number>()
  for (const c of board) {
    const v = rankValue(c)
    rankCounts.set(v, (rankCounts.get(v) ?? 0) + 1)
  }
  if ([...rankCounts.values()].some((n) => n >= 2)) return 'board-pair'

  return null
}

/**
 * Best-effort read of the hero's decisive continue: did they hold a genuine, live
 * draw (a flush draw or an open-ended straight draw) on the flop or turn? Such a
 * draw makes a call defensible on price even when it ultimately bricks, which is
 * the difference between variance and a leak. The engine deals the board in order,
 * so a prefix of the final board reconstructs an earlier street; `analyzeSpot`
 * then reports the draw. We treat 8+ clean outs as "priced in" for typical bets.
 */
export function readHeroContinue(
  hole: [CardId, CardId],
  board: CardId[],
): { heroHadDraw: boolean; pricedIn: boolean } {
  let heroHadDraw = false
  for (const len of [3, 4] as const) {
    if (board.length < len) break
    const a = analyzeSpot({
      hole,
      board: board.slice(0, len),
      street: len === 3 ? 'flop' : 'turn',
      pot: 0,
      toCall: 0,
    })
    const liveDraw =
      a.drawName === 'flush draw' ||
      a.drawName === 'open-ended straight draw' ||
      a.drawName === 'flush draw + straight draw'
    if (liveDraw && a.outs != null && a.outs >= 8) heroHadDraw = true
  }
  return { heroHadDraw, pricedIn: heroHadDraw }
}

/** The strongest non-hero seat still in at showdown — i.e. the hand that won. */
function bestVillainAtShowdown(state: HandState, heroId: string): SeatState | null {
  let best: SeatState | null = null
  let bestHand: EvaluatedHand | null = null
  for (const seat of state.seats) {
    if (seat.id === heroId || seat.folded || !seat.holeCards) continue
    let hand: EvaluatedHand
    try {
      hand = evaluateHoldem(seat.holeCards, state.board)
    } catch {
      continue
    }
    if (!bestHand || compareHands(hand, bestHand) > 0) {
      bestHand = hand
      best = seat
    }
  }
  return best
}

/**
 * Did `villainName` play passively (only checks/calls) and THEN fire a bet or raise
 * on the turn or river? Parses the engine's stable log lines; deterministic.
 */
export function readPassiveThenAggressive(log: string[], villainName: string): boolean {
  let street: PokerStreet = 'preflop'
  let sawPassive = false
  const prefix = `${villainName} `
  for (const line of log) {
    if (line.startsWith('Flop:')) street = 'flop'
    else if (line.startsWith('Turn:')) street = 'turn'
    else if (line.startsWith('River:')) street = 'river'
    else if (line.startsWith(prefix)) {
      const rest = line.slice(prefix.length)
      if (rest.startsWith('checks') || rest.startsWith('calls')) {
        sawPassive = true
      } else if (rest.startsWith('bets') || rest.startsWith('raises')) {
        if (sawPassive && (street === 'turn' || street === 'river')) return true
      }
    }
  }
  return false
}

/**
 * Build a result-aware reflection for a finished hand. `finalState` is the settled
 * hand (phase 'complete'); `heroIndex` is the hero's seat. Returns '' when there is
 * nothing to reflect on (no hero, or the hero folded earlier so the in-the-moment
 * fold note already stands). Pure + AI-free.
 */
export function coachResultReaction(finalState: HandState, heroIndex: number): string {
  const hero = finalState.seats[heroIndex]
  if (!hero) return ''
  // The hero gave the hand up earlier; let the in-the-moment fold note be the word.
  if (hero.folded) return ''

  const summary = summarizeHand(finalState)
  const board = finalState.board
  const heroWon = summary.winnerIds.includes(hero.id)
  const bigPot = finalState.pot >= BIG_POT_BB * Math.max(1, finalState.bb)

  let heroCategory: HandCategory | null = null
  let heroLabel: string | null = null
  let heroMadeFromHole = true
  if (hero.holeCards && board.length >= 3) {
    try {
      const e = evaluateHoldem(hero.holeCards, board)
      heroCategory = e.category
      heroLabel = e.label
      heroMadeFromHole = holeCardsImproveBoard(hero.holeCards, board)
    } catch {
      // Leave null and fall back to generic wording.
    }
  }
  // A shared board hand (the hero "played the board") is not the hero's strength.
  const heroStrong = heroCategory ? STRONG_MADE.has(heroCategory) && heroMadeFromHole : false
  const heroPlayedBoard = heroCategory != null && !heroMadeFromHole

  const villain = summary.reachedShowdown ? bestVillainAtShowdown(finalState, hero.id) : null
  let villainCategory: HandCategory | null = null
  let villainLabel: string | null = null
  if (villain?.holeCards) {
    try {
      const e = evaluateHoldem(villain.holeCards, board)
      villainCategory = e.category
      villainLabel = e.label
    } catch {
      // Leave null.
    }
  }

  const boardThreat = summary.reachedShowdown ? boardThreatOf(board) : null
  const { heroHadDraw, pricedIn } = hero.holeCards
    ? readHeroContinue(hero.holeCards, board)
    : { heroHadDraw: false, pricedIn: false }
  const passiveThenAggressive = villain
    ? readPassiveThenAggressive(finalState.log, villain.name)
    : false

  return composeCoachResultReaction({
    reachedShowdown: summary.reachedShowdown,
    heroWon,
    bigPot,
    heroCategory,
    heroLabel,
    heroStrong,
    heroPlayedBoard,
    villainCategory,
    villainLabel,
    boardThreat,
    pricedIn,
    heroHadDraw,
    passiveThenAggressive,
  })
}

/** Pure formatter for the end-of-hand reflection (exported for tests). */
export function composeCoachResultReaction(r: HandResultRead): string {
  const heroHand = r.heroLabel ? lowerFirst(r.heroLabel) : 'your hand'
  const beat = r.villainLabel ? lowerFirst(r.villainLabel) : 'a stronger hand'
  const potBit = r.bigPot ? 'a big pot' : 'the pot'
  const villainStrong = r.villainCategory ? STRONG_MADE.has(r.villainCategory) : false

  // --- Hero won --------------------------------------------------------------
  if (r.heroWon) {
    if (!r.reachedShowdown) {
      return 'You took it down without a showdown. Getting opponents to fold is a great way to win pots, so nice work applying pressure.'
    }
    if (r.heroStrong) {
      return `Great result. Your ${heroHand} was the best hand and took down ${potBit}. When you are ahead like that, keep betting for value so you get paid off.`
    }
    if (r.pricedIn && r.heroHadDraw) {
      return `Nice, your draw got there and won ${potBit}. That was a fair price to chase, so keep taking those when the odds are right.`
    }
    // Won with a weak, loose holding: celebrate it, but nudge toward selectivity.
    return `That one got there for you. Winning ${potBit} feels good, but ${heroHand} was on the thin side to put chips in with, so try to be a little more selective with weak hands next time.`
  }

  // --- Hero lost, no showdown (they were still contesting but missed) ---------
  if (!r.reachedShowdown) {
    return 'That one did not go your way, and with no showdown there is nothing to read into it. Shake it off and bring the same focus to the next hand.'
  }

  // --- Hero lost at showdown -------------------------------------------------
  // Playing the board: the made hand was shared, never the hero's, so name that
  // plainly rather than mourning a hand they did not really have.
  if (r.heroPlayedBoard && !r.pricedIn) {
    return `Key read: ${heroHand} was on the board, shared by everyone, so it was not your hand. Your hole cards did not improve on it, so you could only win by beating that shared hand; against a big bet there, folding is usually the play.`
  }

  // A loose call into a danger board is a real leak to gently correct. Note it is
  // the danger signals + a weak hand that make it a leak, NOT the loss by itself.
  if (!r.heroStrong && r.boardThreat && villainStrong && !r.pricedIn) {
    const completed =
      r.boardThreat === 'flush'
        ? 'a flush completes'
        : r.boardThreat === 'straight'
          ? 'a straight completes'
          : 'the board pairs'
    const lead = r.passiveThenAggressive
      ? `When a player who has been passive suddenly bets big and ${completed}, `
      : `When ${completed} and you hold one pair, `
    return `${lead}one pair is usually beaten. You held ${heroHand} and ran into ${beat}, so that is a good spot to consider folding and saving those chips for a better one.`
  }

  // A well-priced continue that simply lost is variance, not a mistake.
  if (r.pricedIn) {
    return r.heroHadDraw
      ? 'Tough one, but no mistake. Your draw was getting the right price, it just did not get there this time. That is variance, not a leak, so keep making that call when the odds are right.'
      : `Tough beat, but no mistake. You had the right price to call and simply ran into ${beat}. Keep making that call and the math pays off over time.`
  }

  // Lost with a genuinely strong hand: a cooler, not a leak.
  if (r.heroStrong) {
    return `Nothing you could do there. Your ${heroHand} ran into ${beat}, which is just a cooler. No leak, so keep playing your strong hands strongly.`
  }

  // Lost with a weak hand on a quieter board: a gentle reminder, no scolding.
  return `You ran into ${beat} there. One pair can be tricky to call big bets with, so weigh how likely you are already beaten before putting in more chips.`
}

// ---------------------------------------------------------------------------
// Hand log — grouped by street for a clean, readable feed
// ---------------------------------------------------------------------------

export type HandLogGroup = {
  /** 'Preflop' | 'Flop' | 'Turn' | 'River' | 'Result'. */
  label: string
  /** Community cards dealt on this street (Flop/Turn/River), as a "AS KD 2C" string. */
  cards?: string
  entries: string[]
}

/**
 * Turn the engine's flat `log` into clean per-street groups: the blind posts and
 * preflop action, then one group per dealt street (carrying its cards), then a
 * "Result" group for the showdown / payout lines. Pure dealing noise
 * ("Dealt ... two cards") is dropped so the feed stays concise. Used by the table
 * hand-log panel; pure, so it is unit-tested directly.
 */
export function groupHandLog(log: string[]): HandLogGroup[] {
  const groups: HandLogGroup[] = []
  let current: HandLogGroup = { label: 'Preflop', entries: [] }

  const flush = () => {
    if (current.entries.length > 0 || current.cards) groups.push(current)
  }

  for (const line of log) {
    if (line.startsWith('Dealt ')) continue // dealing noise

    const flop = /^Flop:\s*(.+)$/.exec(line)
    const turn = /^Turn:\s*(.+)$/.exec(line)
    const river = /^River:\s*(.+)$/.exec(line)
    if (flop) {
      flush()
      current = { label: 'Flop', cards: flop[1], entries: [] }
      continue
    }
    if (turn) {
      flush()
      current = { label: 'Turn', cards: turn[1], entries: [] }
      continue
    }
    if (river) {
      flush()
      current = { label: 'River', cards: river[1], entries: [] }
      continue
    }

    // Showdown / payout lines collect into a single "Result" group at the end.
    if (/\b(shows|wins|split)\b/.test(line)) {
      if (current.label !== 'Result') {
        flush()
        current = { label: 'Result', entries: [] }
      }
      current.entries.push(line)
      continue
    }

    current.entries.push(line)
  }

  flush()
  return groups
}
