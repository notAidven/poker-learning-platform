import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  applyAction,
  type AppliedAction,
  type HandState,
} from '../../lib/poker/handEngine'
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
  ChipStack,
  DeckPile,
  EmptySlot,
} from '../lesson/interactions/cards/PlayingCardKit'
import { topDenom, type ChipDenom } from '../lesson/interactions/cards/chipDenoms'
import { Seat } from './Seat'
import { ActionControls } from './ActionControls'
import { CoachPanel } from './CoachPanel'
import { HintBar } from './HintBar'
import { FirstTableIntro } from './FirstTableIntro'
import { hasSeenFirstTableIntro } from './tableIntro'
import {
  buildCoachContext,
  buildDeepCoachContext,
  buildHintContext,
  coachReactionFor,
  coachResultReaction,
  createInitialHand,
  createNextHand,
  decideOpponentAction,
  finalizeHand,
  groupHandLog,
  roleFor,
  summarizeHand,
  type HandSummary,
  type TableRuntimeConfig,
} from './tableRuntime'

/**
 * Table-only chrome: the wood/brass rail, the championship-green felt (warm center
 * spotlight + emerald dome + felt weave + vignette + a brass hairline), the seat
 * plaques, the spotlit pot glow, and the "your turn" pulse. Injected once via a
 * <style> in the table tree (the shared chip/card CSS lives in <CardKitStyles />).
 * All motion here is CSS, so the global reduced-motion kill-switch freezes it.
 */
const TABLE_STYLES = `
.suited-rail-wood {
  background: radial-gradient(130% 140% at 50% -10%, #6e5230 0%, #4a371f 44%, #2c2012 100%);
  box-shadow:
    0 26px 54px -22px rgba(0, 0, 0, 0.78),
    0 4px 10px rgba(0, 0, 0, 0.4),
    inset 0 2px 2px rgba(255, 231, 176, 0.22),
    inset 0 -10px 26px rgba(0, 0, 0, 0.5);
}
.suited-felt {
  background-color: #0a5a3d;
  background-image:
    radial-gradient(56% 44% at 50% 37%, rgba(255, 248, 224, 0.26) 0%, rgba(255, 246, 214, 0.06) 40%, transparent 66%),
    radial-gradient(126% 124% at 50% 40%, #1aa873 0%, #128a5c 24%, #0a5c40 50%, #073e2a 74%, #04271a 100%),
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.018) 0 2px, transparent 2px 6px),
    repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.06) 0 2px, transparent 2px 6px);
  box-shadow:
    inset 0 0 0 2px rgba(212, 173, 87, 0.6),
    inset 0 0 0 6px rgba(7, 21, 15, 0.4),
    inset 0 18px 50px rgba(0, 0, 0, 0.45),
    inset 0 -26px 72px rgba(0, 0, 0, 0.52);
}
.suited-seat {
  background-color: rgba(6, 20, 14, 0.5);
}
.suited-seat--active {
  background-color: rgba(6, 20, 14, 0.68);
}
.suited-pot-glow {
  position: absolute;
  left: 50%;
  top: 36%;
  width: 17rem;
  height: 10rem;
  transform: translate(-50%, -50%);
  border-radius: 9999px;
  background: radial-gradient(closest-side, rgba(255, 248, 224, 0.42), rgba(255, 246, 214, 0.08) 55%, transparent 72%);
  pointer-events: none;
  z-index: -1;
  filter: blur(3px);
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
  0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.6); }
  70% { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
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
  const rx = 40
  const ry = 37
  // Hero pinned a touch inside the bottom edge so a big seat never clips the felt.
  const positions: { x: number; y: number }[] = [{ x: cx, y: 86 }]
  const opponents = Math.max(0, count - 1)
  for (let k = 0; k < opponents; k++) {
    const t = opponents === 1 ? 0.5 : k / (opponents - 1)
    const rad = ((215 + t * 110) * Math.PI) / 180
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
const POT_ANCHOR: Point = { x: 50, y: 46 }

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

  const [baseSeed] = useState(() => (hashString(config.tableId) ^ (Date.now() >>> 0)) >>> 0)
  const [hand, setHand] = useState<HandState>(() =>
    createInitialHand(config, baseSeed, heroName, heroStack),
  )
  const [handIndex, setHandIndex] = useState(0)
  const [talk, setTalk] = useState<Record<string, string>>({})
  // Room 1 only: a supportive, rule-based reaction to the hero's last move.
  const [reaction, setReaction] = useState<{ handIndex: number; text: string } | null>(null)
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
  const isHeroTurn = !handOver && hand.toActIndex === heroIndex && heroIndex >= 0
  const activeOppIndex =
    !handOver && hand.toActIndex != null && !hand.seats[hand.toActIndex].isHero
      ? hand.toActIndex
      : null

  const personaForSeat = useCallback(
    (id: string): string | undefined => {
      const m = id.match(/^opp-(\d+)$/)
      return m ? config.opponents[Number(m[1])]?.persona : undefined
    },
    [config.opponents],
  )

  // --- Opponent auto-drive: schedule one decision per turn (setState only fires
  //     asynchronously inside the timer, never synchronously in the effect body). ---
  useEffect(() => {
    if (activeOppIndex == null) return
    const idx = activeOppIndex
    const seatId = hand.seats[idx].id
    let cancelled = false
    const delayMs = reduceMotion ? 180 : 600

    const timer = window.setTimeout(() => {
      void (async () => {
        const decision = await decideOpponentAction(hand, idx, config, personaForSeat(seatId))
        if (cancelled) return
        // Stale-guard: only apply if the same seat is still to act.
        setHand((cur) =>
          cur.toActIndex === idx && cur.phase !== 'complete'
            ? finalizeHand(applyAction(cur, decision.applied))
            : cur,
        )
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
    if (summary.reachedShowdown || summary.winnerIds.includes('hero')) {
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

  const heroAct = useCallback(
    (applied: AppliedAction) => {
      // Coach (Room 1) reacts to the move using the PRE-action state. Pure + AI-free.
      if (
        config.support === 'coach' &&
        heroIndex >= 0 &&
        hand.toActIndex === heroIndex &&
        hand.phase !== 'complete'
      ) {
        const text = coachReactionFor(hand, heroIndex, applied.action)
        if (text) setReaction({ handIndex, text })
      }
      setHand((cur) => {
        if (cur.toActIndex == null || cur.phase === 'complete' || !cur.seats[cur.toActIndex].isHero) {
          return cur
        }
        return finalizeHand(applyAction(cur, applied))
      })
    },
    [config.support, heroIndex, hand, handIndex],
  )

  const startNextHand = useCallback(() => {
    const next = createNextHand(hand, config)
    if (!next) return
    setTalk({})
    setReaction(null)
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

      {/* Table + action dock (main column) and the coach / hint side rail. The hero's
          hand sits at the bottom of the felt and the controls dock directly beneath
          it, so cards + actions read as one unit; the coach stays in view alongside. */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Main column: the felt, then the action dock under the hero's hand */}
        <div className="space-y-3">
          {/* Wood/brass rail wrapping the championship-green felt */}
          <div className="pck-scene relative mx-auto w-full max-w-2xl">
            <div className="suited-rail-wood relative rounded-[44%] p-2.5 sm:p-3.5">
              <div className="suited-felt relative aspect-square w-full overflow-visible rounded-[44%] sm:aspect-[7/5]">
                {/* Center: a spotlit pot, the board, and the deck + burns */}
                <div className="absolute left-1/2 top-1/2 z-[4] flex w-[72%] max-w-[20rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2.5">
                  <div className="relative flex flex-col items-center">
                    <span className="suited-pot-glow" aria-hidden />
                    {hand.pot > 0 && (
                      <div className={`mb-1.5 ${handOver ? 'pck-pot-pop' : ''}`}>
                        <ChipStack amount={hand.pot} size={34} />
                      </div>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-night-950/60 px-3.5 py-1 text-base font-bold shadow-lg ring-1 ring-inset ring-gold-300/35">
                      <Chip size={15} tone="gold" />
                      <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-gold-200/85">
                        Pot
                      </span>
                      <span className="tabular-nums text-white">{hand.pot.toLocaleString()}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const card = hand.board[i]
                      return card ? (
                        <CardFace key={card} id={card} size="sm" animate={animate} delay={i * 60} />
                      ) : (
                        <EmptySlot key={`board-${i}`} size="sm" />
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-2 opacity-90">
                    <DeckPile size="sm" count={hand.deck.length} />
                    {hand.burns.length > 0 && (
                      <div className="flex items-center">
                        {hand.burns.map((c) => (
                          <BurnCard key={c} size="sm" animate={animate} className="-ml-3 first:ml-0" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Each player's committed bet, shown as a real chip stack on the felt
                    between them and the pot (the chips then rake into the pot). */}
                {hand.seats.map((seat, index) => {
                  if (seat.folded || seat.committed <= 0) return null
                  const sp = positions[index]
                  const bp = {
                    x: sp.x + (POT_ANCHOR.x - sp.x) * 0.36,
                    y: sp.y + (POT_ANCHOR.y - sp.y) * 0.36,
                  }
                  return (
                    <div
                      key={`bet-${seat.id}`}
                      className="absolute z-[8] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
                      style={{ left: `${bp.x}%`, top: `${bp.y}%` }}
                    >
                      <ChipStack amount={seat.committed} size={17} />
                      <span className="rounded-full bg-night-950/70 px-1.5 py-0.5 text-[0.6rem] font-bold tabular-nums text-gold-100 ring-1 ring-inset ring-white/10">
                        {seat.committed.toLocaleString()}
                      </span>
                    </div>
                  )
                })}

                {/* Seats around the oval */}
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

          {/* Action dock — directly below the hero's hole cards */}
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
              <div className="rounded-2xl border border-night-900/10 bg-white p-3 shadow-card sm:p-4">
                <div className="mb-3 flex items-center justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                    <span className="suited-turn-dot" aria-hidden />
                    Your turn to act
                  </span>
                </div>
                <ActionControls state={hand} heroIndex={heroIndex} onAct={heroAct} />
              </div>
            ) : (
              <p className="rounded-2xl border border-night-900/10 bg-white p-4 text-center text-sm font-semibold text-night-700/70 shadow-card">
                {toActName ? `Waiting for ${toActName}…` : 'Dealing…'}
              </p>
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
            />
          ) : (
            <HintBar context={hintContext} active={isHeroTurn} />
          )}
        </div>
      </div>

      {/* Hand log — grouped by street for an easy read */}
      {logGroups.length > 0 && <HandLog key={handIndex} groups={logGroups} />}
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
