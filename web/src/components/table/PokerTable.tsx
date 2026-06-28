import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { type AppliedAction, type HandState } from '../../lib/poker/handEngine'
import { isAIConfigured } from '../../lib/ai/aiClient'
import { getTableTalk } from '../../lib/ai/llmOpponent'
import { STARTING_BANKROLL } from '../../lib/bankroll'
import { DUR, EASE } from '../../lib/motion'
import { usePrefersReducedMotion } from '../lesson/interactions/usePrefersReducedMotion'
import {
  BurnCard,
  CardFace,
  CardKitStyles,
  Chip,
  ChipDisc,
  DeckPile,
  EmptySlot,
} from '../lesson/interactions/cards/PlayingCardKit'
import { topDenom, type ChipDenom } from '../lesson/interactions/cards/chipDenoms'
import { Seat } from './Seat'
import { ActionControls } from './ActionControls'
import { CoachPanel } from './CoachPanel'
import { CoachVerdictModal, type CoachVerdict } from './CoachVerdictModal'
import { HintBar } from './HintBar'
import { FirstTableIntro } from './FirstTableIntro'
import { hasSeenFirstTableIntro } from './tableIntro'
import {
  buildCoachContext,
  buildDeepCoachContext,
  buildHintContext,
  createInitialHand,
  createNextHand,
  decideOpponentAction,
  opponentActionDelayMs,
  roleFor,
  summarizeHand,
  type HandSummary,
  type TableRuntimeConfig,
} from './tableRuntime'
import {
  coachReactionFor,
  coachResultReaction,
  drillSpotSignature,
  gradeHeroDecision,
  groupHandLog,
} from './coachFeedback'
import {
  advanceWithHeroAction,
  advanceWithOpponentAction,
  clearsTable,
  heroToAct,
  opponentToAct,
} from './tableSession'
import {
  initialDrillSession,
  recordDrillResult,
  type DrillSessionState,
} from '../../lib/poker/decisionDrill'
import { drillAccuracyPct } from '../../lib/gamification'

/**
 * Table-only chrome for the pro online-poker layout: the dark "room" the felt is
 * inset into, the wood/brass rail, the muted championship-green felt (one restrained
 * overhead dealer light + a crisp brass betting-line inlay + a quiet weave), the
 * centered board tray, the seat nameplates (active = brightened plate + crisp brass
 * ring, no glow), the action apron + bet slider, and the "your turn" pulse. Injected
 * once via a <style> in the table tree (the shared chip/card CSS lives in
 * <CardKitStyles />). All CSS motion here is frozen by the global reduced-motion
 * kill-switch; the JS-driven motion is gated on `animate`.
 *
 * Palette is on-brand: the felt rides the `night`/`success` green ramp (no neon
 * emerald), brass (`gold-300`) is the lone metal accent, used with restraint.
 */
const TABLE_STYLES = `
.suited-room {
  background:
    radial-gradient(120% 110% at 50% -10%, rgba(20, 64, 42, 0.26), transparent 60%),
    linear-gradient(180deg, #0a1b12 0%, #050f0a 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 0 1px rgba(212, 173, 87, 0.1),
    0 28px 56px -32px rgba(0, 0, 0, 0.72);
}
.suited-rail-wood {
  background: radial-gradient(135% 150% at 50% -12%, #5b4527 0%, #41301c 46%, #271c10 100%);
  box-shadow:
    0 22px 46px -22px rgba(0, 0, 0, 0.74),
    0 3px 8px rgba(0, 0, 0, 0.36),
    inset 0 2px 2px rgba(255, 226, 168, 0.16),
    inset 0 -10px 22px rgba(0, 0, 0, 0.48);
}
.suited-felt {
  position: relative;
  background-color: #0f4a30;
  background-image:
    radial-gradient(54% 44% at 50% 15%, rgba(244, 236, 208, 0.1) 0%, rgba(244, 236, 208, 0.028) 46%, transparent 72%),
    radial-gradient(125% 122% at 50% 30%, #145c3a 0%, #0f4a30 36%, #0c3b27 64%, #082c1f 86%, #061d14 100%),
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.013) 0 2px, transparent 2px 7px);
  box-shadow:
    inset 0 0 0 1px rgba(231, 205, 134, 0.32),
    inset 0 0 0 5px rgba(6, 20, 14, 0.5),
    inset 0 16px 42px rgba(0, 0, 0, 0.36),
    inset 0 -24px 60px rgba(0, 0, 0, 0.46);
}
/* The brass "betting line" inlay — the one real-table signature; quiet everywhere else. */
.suited-felt::after {
  content: "";
  position: absolute;
  inset: 8% 6%;
  border-radius: 44% / 50%;
  border: 1px solid rgba(231, 205, 134, 0.14);
  pointer-events: none;
  z-index: 1;
}
/* A faint brass center monogram so an empty felt still reads as "a real table". */
.suited-center-mark {
  position: absolute;
  left: 50%;
  top: 46%;
  transform: translate(-50%, -50%);
  font-size: 3.5rem;
  line-height: 1;
  color: rgba(244, 236, 208, 0.05);
  pointer-events: none;
  z-index: 0;
  user-select: none;
}
/* The community-board tray — a quiet dark inlay the five cards sit in, dead center. */
.suited-board-tray {
  background: linear-gradient(180deg, rgba(4, 16, 11, 0.52), rgba(4, 16, 11, 0.2));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 2px 7px rgba(0, 0, 0, 0.38);
}
/* The seat nameplate "pod". Active = brightened plate + a crisp brass ring (no glow). */
.suited-plate {
  border-radius: 0.85rem;
  background: linear-gradient(180deg, #123523 0%, #0a2014 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 6px 14px -10px rgba(0, 0, 0, 0.6);
  outline: 1px solid rgba(255, 255, 255, 0.07);
  outline-offset: -1px;
}
.suited-plate--active {
  background: linear-gradient(180deg, #1b4530 0%, #0e2c1d 100%);
  outline: 1.5px solid rgba(231, 205, 134, 0.85);
  outline-offset: -1.5px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(231, 205, 134, 0.22), 0 6px 14px -10px rgba(0, 0, 0, 0.6);
}
.suited-plate--win {
  outline: 1.5px solid rgba(212, 173, 87, 0.95);
  outline-offset: -1.5px;
}
.suited-plate--hero {
  outline-color: rgba(231, 205, 134, 0.5);
}
.suited-plate--hero.suited-plate--active {
  outline-color: rgba(231, 205, 134, 0.95);
}
/* The action apron — the dark "table edge" the betting controls live on. */
.suited-apron {
  background: linear-gradient(180deg, #0c2a1e 0%, #07150f 100%);
  box-shadow:
    inset 0 1px 0 rgba(212, 173, 87, 0.28),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 16px 32px -20px rgba(0, 0, 0, 0.7);
}
.suited-apron-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background: #e7cd86;
  animation: suited-turn-pulse 1.5s ease-out infinite;
}
.suited-turn-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background: #fff;
  animation: suited-turn-pulse 1.5s ease-out infinite;
}
@keyframes suited-turn-pulse {
  0% { box-shadow: 0 0 0 0 rgba(231, 205, 134, 0.6); }
  70% { box-shadow: 0 0 0 6px rgba(231, 205, 134, 0); }
  100% { box-shadow: 0 0 0 0 rgba(231, 205, 134, 0); }
}
/* The bet-sizing slider, re-skinned for the dark apron with a brass thumb. */
.suited-bet-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 9999px;
  background: linear-gradient(90deg, rgba(212, 173, 87, 0.55), rgba(212, 173, 87, 0.18));
  outline: none;
  cursor: pointer;
}
.suited-bet-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background: radial-gradient(circle at 50% 32%, #f6e4ac, #bb8f3c);
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  cursor: pointer;
}
.suited-bet-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background: radial-gradient(circle at 50% 32%, #f6e4ac, #bb8f3c);
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  cursor: pointer;
}
.suited-bet-slider:focus-visible {
  outline: 2px solid var(--color-gold-300);
  outline-offset: 3px;
}
.suited-bet-slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`

type PokerTableProps = {
  config: TableRuntimeConfig
  heroName?: string
  /** The hero's buy-in for this session (their bankroll). Defaults to the table stack. */
  heroStack?: number
  /** The persistent play-money bankroll, shown in the header. */
  bankroll?: number
  /** Called once when the table is "cleared" (a hand reaches showdown or the hero wins one). */
  onCleared?: () => void
  /** Called once per completed hand with the hero's resulting stack (to persist the bankroll). */
  onHandSettled?: (heroStack: number) => void
  /** Called when the busted hero asks to rebuy. */
  onRequestRebuy?: () => void
  /**
   * Visual theme. 'casino' hides the built-in header (the Casino Floor page renders
   * its own brass chrome + bankroll) and re-skins the felt to the casino palette;
   * 'course' (default) keeps the original in-course chrome unchanged.
   */
  theme?: 'course' | 'casino'
  /** Where the in-table "Leave" links navigate (default: the course path). */
  leaveTo?: string
  /** Label for the busted action button (casino overrides the rebuy-to-1000 copy). */
  rebuyLabel?: string
  /** Note shown when the hero busts (casino overrides the rebuy-to-1000 copy). */
  bustedNote?: string
}

/**
 * Seat centers on an oval (percent of the felt box). Index 0 (the hero) sits at the
 * bottom-center; the opponents spread across the TOP arc (215deg to 325deg in screen
 * space, y pointing down) so they ring the felt up top and never crowd the central
 * board, which keeps the layout clean for both 3-handed and 4-handed rooms.
 */
function ovalPositions(count: number): { x: number; y: number }[] {
  const cx = 50
  const cy = 50
  const rx = 41
  const ry = 35
  // Hero pinned a touch inside the bottom edge so a big seat never clips the felt.
  const positions: { x: number; y: number }[] = [{ x: cx, y: 87 }]
  const opponents = Math.max(0, count - 1)
  // Opponents ring the TOP + SIDES (208°…332° in screen space, y pointing down) so
  // they never crowd the centered board, reading clean from heads-up to 4-handed.
  for (let k = 0; k < opponents; k++) {
    const t = opponents === 1 ? 0.5 : k / (opponents - 1)
    const rad = ((208 + t * 124) * Math.PI) / 180
    positions.push({ x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) })
  }
  return positions
}

// ---------------------------------------------------------------------------
// Chip movement — chips physically rake bet → pot, then pot → winner. Percent
// coordinates share the same felt box as the seats (see ovalPositions).
// ---------------------------------------------------------------------------

type Point = { x: number; y: number }

/** A batch of chips gliding from one felt point to another. */
type ChipFlightSpec = {
  id: number
  from: Point
  to: Point
  count: number
  kind: 'bet' | 'win'
  /** Denomination color of the chips in flight (top denom of the amount moved). */
  denom: ChipDenom
}

/** Where the pot sits on the felt (the chip pile atop the centered board column). */
const POT_ANCHOR: Point = { x: 50, y: 40 }

/** Chips to show for a bet: scaled by size in big blinds, kept readable (1–4). */
function betChipCount(amount: number, bb: number): number {
  return Math.max(1, Math.min(4, Math.round(amount / Math.max(1, bb))))
}

/** Chips to show raking a won pot to a seat: a little fuller than a bet (3–6). */
function winChipCount(pot: number, bb: number): number {
  return Math.max(3, Math.min(6, Math.round(pot / Math.max(1, bb))))
}

/**
 * One batch of `.poker-chip`s sliding `from → to` with `EASE.rake`. Each chip is
 * lightly fanned and staggered so a bet reads as a small handful of chips, not a
 * single sprite. Self-removes via the last chip's `onAnimationComplete`. Only ever
 * rendered when motion is allowed (the parent gates on reduced motion).
 */
function ChipFlight({ flight, onDone }: { flight: ChipFlightSpec; onDone: (id: number) => void }) {
  const { from, to, count, kind, denom } = flight
  const duration = kind === 'win' ? DUR.celebrate : DUR.deal
  // A won pot waits a beat so the final bet settles in before the rake pulls out.
  const baseDelay = kind === 'win' ? 0.3 : 0
  const size = 15

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const off = i - (count - 1) / 2
        const fromX = from.x + off * 1.7
        const toX = to.x + off * 1.4
        const fromY = from.y + Math.abs(off) * 0.6
        return (
          <motion.span
            key={i}
            className="absolute"
            style={{ marginLeft: -size / 2, marginTop: -size / 2 }}
            initial={{ left: `${fromX}%`, top: `${fromY}%`, opacity: 0, scale: 0.5 }}
            animate={{
              left: `${toX}%`,
              top: `${to.y}%`,
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1, 1, 0.85],
            }}
            transition={{ duration, delay: baseDelay + i * 0.05, ease: EASE.rake }}
            onAnimationComplete={i === count - 1 ? () => onDone(flight.id) : undefined}
          >
            <ChipDisc denom={denom} size={size} />
          </motion.span>
        )
      })}
    </>
  )
}

export function PokerTable({
  config,
  heroName = 'You',
  heroStack,
  bankroll,
  onCleared,
  onHandSettled,
  onRequestRebuy,
  theme = 'course',
  leaveTo = '/course',
  rebuyLabel,
  bustedNote,
}: PokerTableProps) {
  const reduceMotion = usePrefersReducedMotion()
  const aiOff = useMemo(() => !isAIConfigured(), [])
  const isCasino = theme === 'casino'
  // Room 1 only: the coached table runs as a graded Decision Drill. Never enabled
  // for Room 2 (hints) or the Casino Floor, so those stay free play.
  const drill = config.drill === true && config.support === 'coach'

  const [baseSeed] = useState(() => (hashString(config.tableId) ^ (Date.now() >>> 0)) >>> 0)
  const [hand, setHand] = useState<HandState>(() =>
    createInitialHand(config, baseSeed, heroName, heroStack),
  )
  const [handIndex, setHandIndex] = useState(0)
  const [talk, setTalk] = useState<Record<string, string>>({})
  // Room 1 only: a supportive, rule-based reaction to the hero's last move.
  const [reaction, setReaction] = useState<{ handIndex: number; text: string } | null>(null)
  // Decision Drill (Room 1 only): per-session accuracy + XP, plus a pending rethink
  // nudge keyed to the spot it belongs to (so it auto-clears once the spot moves on).
  const [drillSession, setDrillSession] = useState<DrillSessionState>(initialDrillSession)
  const [nudge, setNudge] = useState<{ sig: string; text: string } | null>(null)
  // Decision Drill (Room 1 only): the per-decision coach verdict popup shown after
  // every hero action. A sound play holds its action here (`pendingAction`) until the
  // hero has read the read, then applies it on "Continue"; a clear mistake shows the
  // "why" and is NOT applied, so "Choose again" simply returns them to the spot.
  const [verdictModal, setVerdictModal] = useState<
    (CoachVerdict & { pendingAction: AppliedAction | null }) | null
  >(null)
  // A one-time "how this table works" intro, shown on the first casino entry only.
  const [showIntro, setShowIntro] = useState(() => !hasSeenFirstTableIntro())

  const clearedRef = useRef(false)
  const reportedHandRef = useRef(-1)

  // Chips in flight (bet → pot, pot → winner). Self-removing once landed.
  const [flights, setFlights] = useState<ChipFlightSpec[]>([])
  const flightIdRef = useRef(0)
  const prevCommitRef = useRef<Map<string, number>>(new Map())
  const prevHandIndexRef = useRef(-1)
  const winRakeRef = useRef(-1)
  const removeFlight = useCallback((id: number) => {
    setFlights((cur) => cur.filter((f) => f.id !== id))
  }, [])

  const heroIndex = hand.seats.findIndex((s) => s.isHero)
  const heroSeat = heroIndex >= 0 ? hand.seats[heroIndex] : undefined

  // Derived state — no setState-in-effect needed. A finished hand is always stored
  // already settled (phase 'complete'), so results read straight off the hand.
  const handOver = hand.phase === 'complete'
  const results = useMemo<HandSummary | null>(
    () => (handOver ? summarizeHand(hand) : null),
    [handOver, hand],
  )
  // Turn order comes from the pure session module, so the sequencing is testable.
  const isHeroTurn = heroToAct(hand, heroIndex)
  const activeOppIndex = opponentToAct(hand)

  const personaForSeat = useCallback(
    (id: string): string | undefined => {
      const m = id.match(/^opp-(\d+)$/)
      return m ? config.opponents[Number(m[1])]?.persona : undefined
    },
    [config.opponents],
  )

  // --- Opponent auto-drive: schedule one decision per turn (setState only fires
  //     asynchronously inside the timer, never synchronously in the effect body).
  //     PACING: while the hero is still in the hand, give each opponent a deliberate
  //     ~1s "thinking" beat so the user can follow who does what; once the hero has
  //     folded, resolve the remaining AI-vs-AI action quickly. Timing only — the
  //     decision itself (decideOpponentAction) is unchanged. ---
  useEffect(() => {
    if (activeOppIndex == null) return
    const idx = activeOppIndex
    const seatId = hand.seats[idx].id
    let cancelled = false
    const heroInHand = hand.seats.some((s) => s.isHero && !s.folded)
    const delayMs = opponentActionDelayMs({ heroInHand, reduceMotion })

    const timer = window.setTimeout(() => {
      void (async () => {
        const decision = await decideOpponentAction(hand, idx, config, personaForSeat(seatId))
        if (cancelled) return
        // Stale-guard lives in the pure session: a re-fired timer is a no-op.
        setHand((cur) => advanceWithOpponentAction(cur, idx, decision.applied))
      })()
    }, delayMs)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [hand, activeOppIndex, reduceMotion, config, personaForSeat])

  // --- Mark the table cleared once (side effect only — no React state set here). ---
  useEffect(() => {
    if (clearedRef.current || !handOver) return
    const summary = summarizeHand(hand)
    if (clearsTable(summary)) {
      clearedRef.current = true
      onCleared?.()
    }
  }, [handOver, hand, onCleared])

  // --- Report the hero's resulting stack once per finished hand so the bankroll
  //     can be persisted (the hand is already settled, so the stack is final). ---
  useEffect(() => {
    if (!handOver || reportedHandRef.current === handIndex) return
    reportedHandRef.current = handIndex
    const hero = hand.seats.find((s) => s.isHero)
    if (hero) onHandSettled?.(hero.stack)
  }, [handOver, handIndex, hand, onHandSettled])

  // --- Optional table-talk flavor (AI tables only; silent when AI is off, or when
  //     a table opts out via `config.tableTalk === false`). ------------------------
  useEffect(() => {
    if (aiOff || !handOver || config.tableTalk === false) return
    const summary = summarizeHand(hand)
    const winnerOpp = hand.seats.find((s) => !s.isHero && summary.winnerIds.includes(s.id))
    if (!winnerOpp) return
    let cancelled = false
    void getTableTalk({
      persona: personaForSeat(winnerOpp.id),
      situation: 'you just won a pot at showdown',
    }).then((line) => {
      if (!cancelled && line) setTalk((t) => ({ ...t, [winnerOpp.id]: line }))
    })
    return () => {
      cancelled = true
    }
  }, [handOver, hand, aiOff, personaForSeat, config.tableTalk])

  // --- Chip rake (bet → pot): when a seat commits more chips, slide a small stack
  //     from that seat into the pot. We diff each seat's running `totalCommitted`
  //     (monotonic within a hand) so every voluntary bet/call/raise animates, while
  //     forced blinds and the fresh deal at the start of a hand do not. setState
  //     only fires asynchronously (never synchronously in the effect body). --------
  useEffect(() => {
    if (reduceMotion) {
      prevCommitRef.current = new Map(hand.seats.map((s) => [s.id, s.totalCommitted]))
      prevHandIndexRef.current = handIndex
      return
    }
    const newHand = prevHandIndexRef.current !== handIndex
    const prevMap = prevCommitRef.current
    const pos = ovalPositions(hand.seats.length)
    const spawned: ChipFlightSpec[] = []
    const nextMap = new Map<string, number>()
    hand.seats.forEach((s, i) => {
      nextMap.set(s.id, s.totalCommitted)
      if (newHand) return
      const delta = s.totalCommitted - (prevMap.get(s.id) ?? 0)
      if (delta > 0) {
        spawned.push({
          id: ++flightIdRef.current,
          from: pos[i],
          to: POT_ANCHOR,
          count: betChipCount(delta, hand.bb),
          kind: 'bet',
          denom: topDenom(delta),
        })
      }
    })
    prevCommitRef.current = nextMap
    prevHandIndexRef.current = handIndex
    // A fresh hand clears any chips still raking in from the previous one.
    if (newHand) {
      const t = window.setTimeout(() => setFlights([]), 0)
      return () => window.clearTimeout(t)
    }
    if (spawned.length === 0) return
    const t = window.setTimeout(() => setFlights((cur) => [...cur, ...spawned]), 0)
    return () => window.clearTimeout(t)
  }, [hand, handIndex, reduceMotion])

  // --- Pot rake (pot → winner): once per finished hand, slide the pot out to each
  //     winning seat. Guarded so it fires a single time per hand. ------------------
  useEffect(() => {
    if (!handOver || winRakeRef.current === handIndex) return
    winRakeRef.current = handIndex
    if (reduceMotion || !results) return
    const pos = ovalPositions(hand.seats.length)
    const spawned: ChipFlightSpec[] = []
    hand.seats.forEach((s, i) => {
      if (results.winnerIds.includes(s.id)) {
        spawned.push({
          id: ++flightIdRef.current,
          from: POT_ANCHOR,
          to: pos[i],
          count: winChipCount(hand.pot, hand.bb),
          kind: 'win',
          denom: topDenom(hand.pot),
        })
      }
    })
    if (spawned.length === 0) return
    const t = window.setTimeout(() => setFlights((cur) => [...cur, ...spawned]), 0)
    return () => window.clearTimeout(t)
  }, [handOver, handIndex, hand, results, reduceMotion])

  const applyHeroAction = useCallback((applied: AppliedAction) => {
    setHand((cur) => advanceWithHeroAction(cur, applied))
  }, [])

  const heroAct = useCallback(
    (applied: AppliedAction) => {
      const onHeroTurn =
        heroIndex >= 0 && hand.toActIndex === heroIndex && hand.phase !== 'complete'

      // DECISION DRILL (Room 1): grade the choice BEFORE applying. A sound play is
      // supported and taken; a clear mistake is nudged and NOT applied, so the hero
      // re-thinks and chooses again. Pure + AI-free (rule read + Tier-3 rec).
      if (drill && onHeroTurn) {
        const grade = gradeHeroDecision(hand, heroIndex, applied)
        const sig = drillSpotSignature(handIndex, hand, heroIndex)
        setDrillSession((s) => recordDrillResult(s, sig, grade.verdict))

        // Every decision gets a coach verdict popup explaining WHY it was good or not.
        // The verdict's fields all come from the deterministic grade, so the grading,
        // accuracy and XP behaviour above are untouched — this only presents the read.
        const verdict: CoachVerdict = {
          verdict: grade.verdict,
          reason: grade.reason,
          message: grade.message,
          action: applied.action,
          amount: applied.amount,
        }

        if (grade.verdict === 'mistake') {
          // Hold the hero on this spot: explain WHY in the popup and keep a quiet
          // rethink reminder in the panel for after they dismiss. Action NOT applied.
          setNudge({ sig, text: grade.message })
          setVerdictModal({ ...verdict, pendingAction: null })
          return
        }

        // Sound: clear any rethink hint, affirm the play in the popup, and hold the
        // action until they acknowledge it so they can read the coach before play moves.
        setNudge(null)
        setVerdictModal({ ...verdict, pendingAction: applied })
        return
      }

      // Non-drill coached fallback (kept for safety; no current config uses it).
      // Room 2 / Casino tables ('hints') simply apply the action — free play.
      if (config.support === 'coach' && onHeroTurn) {
        const text = coachReactionFor(hand, heroIndex, applied.action)
        if (text) setReaction({ handIndex, text })
      }
      applyHeroAction(applied)
    },
    [drill, config.support, heroIndex, hand, handIndex, applyHeroAction],
  )

  // Acknowledge the coach verdict popup: a sound play's held action is taken now (so
  // play only resumes once the read has been seen); a mistake applied nothing, so the
  // hero simply returns to the spot (the panel keeps the rethink reminder).
  const dismissVerdict = useCallback(() => {
    const pending = verdictModal?.pendingAction ?? null
    setVerdictModal(null)
    if (pending) applyHeroAction(pending)
  }, [verdictModal, applyHeroAction])

  const startNextHand = useCallback(() => {
    const next = createNextHand(hand, config)
    if (!next) return
    setTalk({})
    setReaction(null)
    setNudge(null)
    setVerdictModal(null)
    setHandIndex((i) => i + 1)
    setHand(next)
  }, [hand, config])

  const turnKey = `${handIndex}:${hand.phase}:${hand.toActIndex ?? 'x'}:${hand.pot}`
  const coachContext = useMemo(
    () =>
      config.support === 'coach' && isHeroTurn && heroSeat?.holeCards
        ? buildCoachContext(hand, heroIndex)
        : null,
    [config.support, isHeroTurn, hand, heroIndex, heroSeat?.holeCards],
  )
  const deepCoachContext = useMemo(
    () =>
      config.support === 'coach' && isHeroTurn && heroSeat?.holeCards
        ? buildDeepCoachContext(hand, heroIndex, personaForSeat)
        : null,
    [config.support, isHeroTurn, hand, heroIndex, heroSeat?.holeCards, personaForSeat],
  )
  const hintContext = useMemo(
    () =>
      config.support === 'hints' && isHeroTurn && heroSeat?.holeCards
        ? buildHintContext(hand, heroIndex)
        : null,
    [config.support, isHeroTurn, hand, heroIndex, heroSeat?.holeCards],
  )

  const animate = !reduceMotion
  const positions = ovalPositions(hand.seats.length)

  const survivors = hand.seats.filter((s) => s.stack > 0)
  const heroLiveStack = heroSeat?.stack ?? 0
  const canContinue = handOver && survivors.length >= 2 && heroLiveStack > 0
  const heroBusted = handOver && heroLiveStack <= 0
  const tableCleared = handOver && survivors.length < 2 && heroLiveStack > 0

  const toActName = hand.toActIndex != null ? hand.seats[hand.toActIndex]?.name : undefined
  const logGroups = useMemo(() => groupHandLog(hand.log), [hand.log])
  const liveReaction = reaction?.handIndex === handIndex ? reaction.text : null
  // Drill: the rethink hint shows only while it still applies to the current spot
  // (the hero's turn, same signature), so it auto-hides once the action moves on.
  const currentSpotSig =
    drill && isHeroTurn && heroIndex >= 0 ? drillSpotSignature(handIndex, hand, heroIndex) : null
  // The popup carries the rethink "why" while it is open; the panel keeps a quiet
  // reminder only once the popup is dismissed (so the same line is never doubled).
  const liveNudge =
    nudge && currentSpotSig && nudge.sig === currentSpotSig && !verdictModal ? nudge.text : null
  const sessionStats = drill
    ? {
        decisions: drillSession.decisions,
        firstTryCorrect: drillSession.firstTryCorrect,
        accuracyPct: drillAccuracyPct(drillSession.firstTryCorrect, drillSession.decisions),
        xp: drillSession.xp,
      }
    : null
  // Room 1: a result-aware recap derived from the finished (settled) hand. Pure and
  // deterministic, so it needs no state and works fully with AI off.
  const liveRecap = useMemo(
    () =>
      config.support === 'coach' && handOver && heroIndex >= 0
        ? coachResultReaction(hand, heroIndex) || null
        : null,
    [config.support, handOver, hand, heroIndex],
  )

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <CardKitStyles />
      <style>{TABLE_STYLES}</style>

      {showIntro && (
        <FirstTableIntro support={config.support} onClose={() => setShowIntro(false)} />
      )}

      {/* Header — hidden on the Casino Floor, where the page renders brass chrome. */}
      {!isCasino && (
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">{config.title}</h1>
          <p className="mt-0.5 text-sm text-night-700/70">
            {config.feature === 'coached'
              ? 'Room 1 · Coached · rule-based opponents'
              : 'Room 2 · AI opponents · hint bar'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {typeof bankroll === 'number' && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-night-900 px-3 py-1.5 text-sm font-bold text-gold-300 shadow-sm"
              title="Your play-money bankroll (learning chips, no real money)"
            >
              <Chip size={16} tone="gold" />
              <span className="tabular-nums">{bankroll.toLocaleString()}</span>
              <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-white/50">
                bankroll
              </span>
            </span>
          )}
          <div className="flex items-center gap-1.5">
            {aiOff && (
              <span
                className="rounded-full bg-night-900 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide text-gold-200"
                title="Firebase AI Logic is not provisioned; opponents and tips use the built-in strategy."
              >
                AI offline · built-in strategy
              </span>
            )}
            <Link
              to="/course"
              className="rounded-lg border border-night-900/12 bg-white px-3 py-1.5 text-xs font-semibold text-night-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
            >
              ← Leave
            </Link>
          </div>
        </div>
      </div>
      )}

      {/* The poker-room "table window" (main column) + the coach / hint side rail.
          The felt is inset into a dark room so it reads like a real online client;
          the hero's hand sits bottom-center and the action apron docks beneath it, so
          cards + controls read as one unit. The coach stays in view alongside. */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Main column: the dark table window, then the action apron under it */}
        <div className="space-y-3">
          <div className="suited-room relative mx-auto w-full max-w-2xl rounded-[1.75rem] p-2.5 sm:p-3.5">
            {/* Table info strip — blinds + hand number, for at-a-glance tracking. */}
            <div className="mb-2.5 flex items-center justify-between gap-2 px-1 text-[0.62rem] font-semibold sm:mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 ring-1 ring-inset ring-white/10">
                <span className="uppercase tracking-[0.18em] text-white/40">Blinds</span>
                <span className="tabular-nums text-white">
                  {config.smallBlind.toLocaleString()}/{config.bigBlind.toLocaleString()}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 ring-1 ring-inset ring-white/10">
                <span className="uppercase tracking-[0.18em] text-white/40">Hand</span>
                <span className="tabular-nums text-white">#{handIndex + 1}</span>
              </span>
            </div>

            {/* Wood/brass rail wrapping the championship-green felt */}
            <div className="pck-scene relative w-full">
              <div className="suited-rail-wood relative rounded-[44%] p-2 sm:p-3">
                <div className="suited-felt relative aspect-square w-full overflow-visible rounded-[44%] sm:aspect-[7/5]">
                  {/* Faint brass center logo so the felt always reads as a real table. */}
                  <span className="suited-center-mark font-display" aria-hidden>
                    ♠
                  </span>

                  {/* DEAD CENTER — the gaze anchor: the pot, then the community board. */}
                  <div className="absolute left-1/2 top-[43%] z-[4] flex w-[82%] max-w-[21rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2.5">
                    <div className="relative flex flex-col items-center">
                      {/* The pot is a single clean coin pill, cohesive with the bankroll
                          pills and the per-seat "Bet" labels. No chip stack on the felt. */}
                      <span
                        className={`inline-flex items-center gap-2 rounded-full bg-night-950/80 px-4 py-2 shadow-[0_6px_16px_-8px_rgba(0,0,0,0.7)] ring-1 ring-inset ring-gold-300/35 ${
                          handOver ? 'pck-pot-pop' : ''
                        }`}
                      >
                        <Chip size={18} tone="gold" />
                        <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-gold-200/80">
                          Pot
                        </span>
                        <span className="text-xl font-bold tabular-nums text-white">
                          {hand.pot.toLocaleString()}
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[0.55rem] font-bold uppercase tracking-[0.18em] text-white/40">
                        {handOver
                          ? results?.reachedShowdown
                            ? 'Showdown'
                            : 'Hand complete'
                          : hand.board.length >= 5
                            ? 'River'
                            : hand.board.length === 4
                              ? 'Turn'
                              : hand.board.length === 3
                                ? 'Flop'
                                : 'Pre-flop'}
                      </span>
                      <div className="suited-board-tray flex items-center justify-center gap-1.5 rounded-xl px-2 py-1.5">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const card = hand.board[i]
                          return card ? (
                            <CardFace key={card} id={card} size="sm" animate={animate} delay={i * 60} />
                          ) : (
                            <EmptySlot key={`board-${i}`} size="sm" />
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Quieted periphery: the deck + burns tucked to the left edge. */}
                  <div className="absolute left-[7%] top-[53%] z-[2] flex -translate-y-1/2 scale-[0.82] items-center gap-1.5 opacity-70">
                    <DeckPile size="sm" count={hand.deck.length} />
                    {hand.burns.length > 0 && (
                      <div className="flex items-center">
                        {hand.burns.map((c) => (
                          <BurnCard key={c} size="sm" animate={animate} className="-ml-3 first:ml-0" />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Each player's committed bet — a clean amount label on the felt between
                      them and the pot. No per-seat chip graphic: the only chip stack on the
                      felt is the central pot, so the bets stay readable without clutter. */}
                  {hand.seats.map((seat, index) => {
                    if (seat.folded || seat.committed <= 0) return null
                    const sp = positions[index]
                    const bp = {
                      x: sp.x + (POT_ANCHOR.x - sp.x) * 0.34,
                      y: sp.y + (POT_ANCHOR.y - sp.y) * 0.34,
                    }
                    return (
                      <div
                        key={`bet-${seat.id}`}
                        className="absolute z-[8] -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${bp.x}%`, top: `${bp.y}%` }}
                      >
                        <span className="inline-flex items-baseline gap-1 rounded-full bg-night-950/80 px-2 py-0.5 shadow-[0_3px_8px_-4px_rgba(0,0,0,0.7)] ring-1 ring-inset ring-gold-300/25">
                          <span className="text-[0.5rem] font-semibold uppercase tracking-[0.1em] text-gold-200/70">
                            Bet
                          </span>
                          <span className="text-[0.66rem] font-bold tabular-nums text-gold-100">
                            {seat.committed.toLocaleString()}
                          </span>
                        </span>
                      </div>
                    )
                  })}

                  {/* Seats ringed around the oval (hero bottom-center) */}
                  {hand.seats.map((seat, index) => {
                    const pos = positions[index]
                    return (
                      <div
                        key={seat.id}
                        className="absolute z-[6] -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      >
                        <Seat
                          seat={seat}
                          active={hand.toActIndex === index && !handOver}
                          thinking={activeOppIndex === index}
                          role={roleFor(hand, index)}
                          revealHole={seat.isHero || (Boolean(results?.reachedShowdown) && !seat.folded)}
                          winner={Boolean(results && results.winnerIds.includes(seat.id))}
                          animate={animate}
                          compact={!seat.isHero}
                          talk={talk[seat.id] ?? null}
                          // Coaching room (Room 1): drop the active-seat countdown ring so
                          // there is no time pressure (the brightened plate + crisp brass
                          // ring still flag the turn).
                          showTurnTimer={!drill}
                        />
                      </div>
                    )
                  })}

                  {/* Chips in flight (bet → pot, pot → winner), atop the felt. */}
                  {animate && flights.length > 0 && (
                    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible" aria-hidden>
                      {flights.map((f) => (
                        <ChipFlight key={f.id} flight={f} onDone={removeFlight} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action apron — docks under the table window. Bottom-right action cluster
              on desktop; full-width thumb zone on mobile. It still feeds the single
              hero-action funnel (heroAct → drill grader). */}
          <div className="mx-auto w-full max-w-2xl">
            {results ? (
              <ResultsPanel
                hand={hand}
                summary={results}
                canContinue={canContinue}
                heroBusted={heroBusted}
                tableCleared={tableCleared}
                onNextHand={startNextHand}
                onRequestRebuy={onRequestRebuy}
                leaveTo={leaveTo}
                rebuyLabel={rebuyLabel}
                bustedNote={bustedNote}
              />
            ) : isHeroTurn && heroIndex >= 0 ? (
              <ActionControls
                state={hand}
                heroIndex={heroIndex}
                onAct={heroAct}
                animate={animate}
                // Coaching room (Room 1): no turn timer, so the player reads the coach
                // at their own pace. Casino / Room 2 keep the timer (showTimer default).
                showTimer={!drill}
              />
            ) : (
              <div className="suited-apron flex items-center justify-center gap-2.5 rounded-2xl px-4 py-5 text-sm font-semibold text-white/75">
                <span className="suited-apron-dot opacity-70" aria-hidden />
                {toActName ? `Waiting for ${toActName}…` : 'Dealing the next hand…'}
              </div>
            )}
          </div>
        </div>

        {/* Side rail: the coach (or hint bar) stays in view next to the felt */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-4">
          {config.support === 'coach' ? (
            <CoachPanel
              context={coachContext}
              deepContext={deepCoachContext}
              turnKey={turnKey}
              handKey={handIndex}
              active={isHeroTurn}
              reaction={liveReaction}
              resultReflection={liveRecap}
              nudge={liveNudge}
              sessionStats={sessionStats}
            />
          ) : (
            <HintBar context={hintContext} active={isHeroTurn} />
          )}
        </div>
      </div>

      {/* Hand log — grouped by street for an easy read */}
      {logGroups.length > 0 && <HandLog key={handIndex} groups={logGroups} />}

      {/* Coaching room (Room 1) only: the per-decision coach verdict popup. */}
      {drill && <CoachVerdictModal verdict={verdictModal} onContinue={dismissVerdict} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hand log
// ---------------------------------------------------------------------------

function HandLog({ groups }: { groups: ReturnType<typeof groupHandLog> }) {
  return (
    <details className="rounded-2xl border border-night-900/10 bg-white p-3 text-sm shadow-card">
      <summary className="cursor-pointer font-semibold text-night-700">Hand log</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group, gi) => (
          <div key={`${group.label}-${gi}`} className="rounded-xl bg-night-900/[0.03] p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-night-700/70">
                {group.label}
              </span>
              {group.cards && (
                <span className="font-mono text-xs font-semibold tabular-nums text-night-700">
                  {group.cards}
                </span>
              )}
            </div>
            <ul className="mt-1.5 space-y-0.5 text-[0.8rem] leading-snug text-night-700/85">
              {group.entries.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  )
}

// ---------------------------------------------------------------------------
// Results panel
// ---------------------------------------------------------------------------

function ResultsPanel({
  hand,
  summary,
  canContinue,
  heroBusted,
  tableCleared,
  onNextHand,
  onRequestRebuy,
  leaveTo = '/course',
  rebuyLabel,
  bustedNote,
}: {
  hand: HandState
  summary: HandSummary
  canContinue: boolean
  heroBusted: boolean
  tableCleared: boolean
  onNextHand: () => void
  onRequestRebuy?: () => void
  leaveTo?: string
  rebuyLabel?: string
  bustedNote?: string
}) {
  const nameFor = (id: string) => hand.seats.find((s) => s.id === id)?.name ?? id
  const heroWon = summary.winnerIds.includes('hero')

  return (
    <div className="space-y-3 rounded-2xl border border-night-900/10 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">
          {summary.reachedShowdown ? 'Showdown' : 'Hand complete'}
        </h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            heroWon ? 'bg-success-100 text-success-700' : 'bg-night-100 text-night-700'
          }`}
        >
          {heroWon ? 'You won a pot' : 'You did not win'}
        </span>
      </div>

      <ul className="space-y-1.5">
        {summary.pots.map((pot, i) => (
          <li
            key={i}
            className="flex items-center justify-between rounded-xl bg-night-900/[0.03] px-3 py-2 text-sm"
          >
            <span className="font-semibold text-night-700">
              {summary.pots.length > 1 ? (i === 0 ? 'Main pot' : `Side pot ${i}`) : 'Pot'}
              <span className="ml-2 tabular-nums text-ink">{pot.amount.toLocaleString()}</span>
            </span>
            <span className="text-right font-semibold text-success-700">
              {pot.winnerSeatIds.length > 0
                ? `${pot.winnerSeatIds.map(nameFor).join(', ')}${
                    pot.winnerSeatIds.length > 1 ? ' (split)' : ''
                  }`
                : 'no winner'}
            </span>
          </li>
        ))}
      </ul>

      {heroBusted && (
        <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-700">
          {bustedNote ??
            `You are out of chips. Rebuy for ${STARTING_BANKROLL.toLocaleString()} play-money chips to keep playing, or leave the table.`}
        </p>
      )}
      {tableCleared && (
        <p className="rounded-xl bg-success-50 px-3 py-2 text-sm font-semibold text-success-700">
          You busted every opponent. Table cleared!
        </p>
      )}

      <div className="flex gap-2">
        {heroBusted && onRequestRebuy ? (
          <button
            type="button"
            onClick={onRequestRebuy}
            className="flex-1 rounded-xl bg-gold-400 px-4 py-3 text-center text-sm font-bold text-night-900 shadow-sm transition hover:bg-gold-300"
          >
            {rebuyLabel ?? `Rebuy ${STARTING_BANKROLL.toLocaleString()}`}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNextHand}
            disabled={!canContinue}
            className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            Next hand
          </button>
        )}
        <Link
          to={leaveTo}
          className="flex-1 rounded-xl border border-night-900/12 bg-white px-4 py-3 text-center text-sm font-bold text-night-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          Leave table
        </Link>
      </div>
    </div>
  )
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
