import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  applyAction,
  type AppliedAction,
  type HandState,
} from '../../lib/poker/handEngine'
import { isAIConfigured } from '../../lib/ai/aiClient'
import { getTableTalk } from '../../lib/ai/llmOpponent'
import { STARTING_BANKROLL } from '../../lib/bankroll'
import { usePrefersReducedMotion } from '../lesson/interactions/usePrefersReducedMotion'
import {
  BurnCard,
  CardFace,
  CardKitStyles,
  Chip,
  DeckPile,
  EmptySlot,
  PotPile,
} from '../lesson/interactions/cards/PlayingCardKit'
import { Seat } from './Seat'
import { ActionControls } from './ActionControls'
import { CoachPanel } from './CoachPanel'
import { HintBar } from './HintBar'
import {
  buildCoachContext,
  buildHintContext,
  coachReactionFor,
  coachResultReaction,
  createInitialHand,
  createNextHand,
  decideLLMAction,
  decideRuleAction,
  finalizeHand,
  groupHandLog,
  roleFor,
  summarizeHand,
  type HandSummary,
  type TableRuntimeConfig,
} from './tableRuntime'

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

export function PokerTable({
  config,
  heroName = 'You',
  heroStack,
  bankroll,
  onCleared,
  onHandSettled,
  onRequestRebuy,
}: PokerTableProps) {
  const reduceMotion = usePrefersReducedMotion()
  const aiOff = useMemo(() => !isAIConfigured(), [])

  const [baseSeed] = useState(() => (hashString(config.tableId) ^ (Date.now() >>> 0)) >>> 0)
  const [hand, setHand] = useState<HandState>(() =>
    createInitialHand(config, baseSeed, heroName, heroStack),
  )
  const [handIndex, setHandIndex] = useState(0)
  const [talk, setTalk] = useState<Record<string, string>>({})
  // Room 1 only: a supportive, rule-based reaction to the hero's last move.
  const [reaction, setReaction] = useState<{ handIndex: number; text: string } | null>(null)

  const clearedRef = useRef(false)
  const reportedHandRef = useRef(-1)

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
        const decision =
          config.opponentSource === 'rule'
            ? decideRuleAction(hand, idx, config.tier)
            : await decideLLMAction(hand, idx, personaForSeat(seatId))
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
  }, [hand, activeOppIndex, reduceMotion, config.opponentSource, config.tier, personaForSeat])

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

  // --- Optional table-talk flavor (AI tables only; silent when AI is off). ------
  useEffect(() => {
    if (aiOff || !handOver) return
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
  }, [handOver, hand, aiOff, personaForSeat])

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

      {/* Header */}
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
                className="rounded-full bg-slate-800 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide text-amber-200"
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

      {/* Table (round felt) + side rail (actions + support), so everything is in view. */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        {/* Round felt */}
        <div className="pck-scene relative mx-auto w-full max-w-2xl">
          <div className="pck-felt relative aspect-square w-full overflow-visible rounded-[44%] border border-emerald-900/40 shadow-xl ring-1 ring-black/25 sm:aspect-[7/5]">
            {/* Inner felt line */}
            <div
              className="pointer-events-none absolute inset-[7%] rounded-[44%] ring-2 ring-white/10"
              aria-hidden
            />

            {/* Center: pot, board, deck + burns */}
            <div className="absolute left-1/2 top-1/2 flex max-w-[64%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-black/35 px-3 py-1">
                <PotPile pop={handOver} />
                <span className="flex items-center gap-1.5 text-sm font-bold text-amber-100">
                  <Chip size={14} tone="gold" />
                  <span className="tabular-nums">Pot {hand.pot.toLocaleString()}</span>
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

              <div className="flex items-center gap-2">
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

            {/* Seats around the oval */}
            {hand.seats.map((seat, index) => {
              const pos = positions[index]
              return (
                <div
                  key={seat.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
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
          </div>
        </div>

        {/* Right rail: action / results on top (high + visible), then support panel */}
        <div className="flex flex-col gap-3">
          {results ? (
            <ResultsPanel
              hand={hand}
              summary={results}
              canContinue={canContinue}
              heroBusted={heroBusted}
              tableCleared={tableCleared}
              onNextHand={startNextHand}
              onRequestRebuy={onRequestRebuy}
            />
          ) : isHeroTurn && heroIndex >= 0 ? (
            <div className="space-y-2">
              <p className="text-center text-sm font-bold text-brand-700">Your turn to act</p>
              <ActionControls state={hand} heroIndex={heroIndex} onAct={heroAct} />
            </div>
          ) : (
            <p className="rounded-2xl border border-night-900/10 bg-white p-4 text-center text-sm font-semibold text-night-700/70 shadow-card">
              {toActName ? `Waiting for ${toActName}…` : 'Dealing…'}
            </p>
          )}

          {config.support === 'coach' ? (
            <CoachPanel
              context={coachContext}
              turnKey={turnKey}
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
}: {
  hand: HandState
  summary: HandSummary
  canContinue: boolean
  heroBusted: boolean
  tableCleared: boolean
  onNextHand: () => void
  onRequestRebuy?: () => void
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
            heroWon ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
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
            <span className="text-right font-semibold text-emerald-700">
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
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          You are out of chips. Rebuy for {STARTING_BANKROLL.toLocaleString()} play-money chips to
          keep playing, or leave the table.
        </p>
      )}
      {tableCleared && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
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
            Rebuy {STARTING_BANKROLL.toLocaleString()}
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
          to="/course"
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
