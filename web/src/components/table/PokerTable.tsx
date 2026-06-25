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
  createInitialHand,
  createNextHand,
  decideLLMAction,
  decideRuleAction,
  finalizeHand,
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

  const heroAct = useCallback((applied: AppliedAction) => {
    setHand((cur) => {
      if (cur.toActIndex == null || cur.phase === 'complete' || !cur.seats[cur.toActIndex].isHero) {
        return cur
      }
      return finalizeHand(applyAction(cur, applied))
    })
  }, [])

  const startNextHand = useCallback(() => {
    const next = createNextHand(hand, config)
    if (!next) return
    setTalk({})
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
  const opponents = hand.seats
    .map((seat, index) => ({ seat, index }))
    .filter((s) => !s.seat.isHero)

  const survivors = hand.seats.filter((s) => s.stack > 0)
  const heroLiveStack = heroSeat?.stack ?? 0
  const canContinue = handOver && survivors.length >= 2 && heroLiveStack > 0
  const heroBusted = handOver && heroLiveStack <= 0
  const tableCleared = handOver && survivors.length < 2 && heroLiveStack > 0

  const toActName = hand.toActIndex != null ? hand.seats[hand.toActIndex]?.name : undefined

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <CardKitStyles />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">{config.title}</h1>
          <p className="mt-0.5 text-sm text-night-700/70">
            {config.feature === 'coached'
              ? `Coached table · Tier ${config.tier} opponents`
              : 'AI opponents · live table'}
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
          <Link
            to="/course"
            className="rounded-lg border border-night-900/12 bg-white px-3 py-1.5 text-xs font-semibold text-night-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
          >
            ← Leave table
          </Link>
          {aiOff && (
            <span
              className="rounded-full bg-slate-800 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide text-amber-200"
              title="Firebase AI Logic is not provisioned; opponents and tips use the built-in strategy."
            >
              AI offline · built-in strategy
            </span>
          )}
        </div>
      </div>

      {/* The felt */}
      <div className="pck-scene pck-felt rounded-[2rem] p-4 shadow-xl ring-1 ring-black/20 sm:p-6">
        {/* Opponents */}
        <div className="flex flex-wrap items-start justify-center gap-3">
          {opponents.map(({ seat, index }) => (
            <Seat
              key={seat.id}
              seat={seat}
              active={hand.toActIndex === index && !handOver}
              thinking={activeOppIndex === index}
              role={roleFor(hand, index)}
              revealHole={Boolean(results?.reachedShowdown) && !seat.folded}
              winner={Boolean(results && results.winnerIds.includes(seat.id))}
              animate={animate}
              compact
              talk={talk[seat.id] ?? null}
            />
          ))}
        </div>

        {/* Center: deck, burns, board, pot */}
        <div className="my-5 flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-3">
            <DeckPile size="sm" count={hand.deck.length} />
            {hand.burns.length > 0 && (
              <div className="flex items-center">
                {hand.burns.map((c) => (
                  <BurnCard key={c} size="sm" animate={animate} className="-ml-3 first:ml-0" />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const card = hand.board[i]
              return card ? (
                <CardFace key={card} id={card} size="md" animate={animate} delay={i * 60} />
              ) : (
                <EmptySlot key={`board-${i}`} size="md" />
              )
            })}
          </div>

          <div className="flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5">
            <PotPile pop={handOver} />
            <span className="flex items-center gap-1.5 text-sm font-bold text-amber-100">
              <Chip size={15} tone="gold" />
              <span className="tabular-nums">Pot {hand.pot.toLocaleString()}</span>
            </span>
          </div>
        </div>

        {/* Hero */}
        {heroSeat && (
          <div className="flex justify-center">
            <Seat
              seat={heroSeat}
              active={isHeroTurn}
              thinking={false}
              role={roleFor(hand, heroIndex)}
              revealHole
              winner={Boolean(results && results.winnerIds.includes(heroSeat.id))}
              animate={animate}
              talk={talk[heroSeat.id] ?? null}
            />
          </div>
        )}
      </div>

      {/* Action area */}
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

      {/* Support: coach (Feature 1) or hint bar (Feature 2) */}
      {config.support === 'coach' ? (
        <CoachPanel context={coachContext} turnKey={turnKey} active={isHeroTurn} />
      ) : (
        <HintBar context={hintContext} active={isHeroTurn} />
      )}

      {/* Table feed */}
      {hand.log.length > 0 && (
        <details className="rounded-2xl border border-night-900/10 bg-white p-3 text-sm shadow-card">
          <summary className="cursor-pointer font-semibold text-night-700">Hand log</summary>
          <ul className="mt-2 space-y-0.5 text-night-700/80">
            {hand.log.slice(-8).map((line, i) => (
              <li key={`${handIndex}-${i}`} className="tabular-nums">
                {line}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
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
                : '—'}
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
          You busted every opponent — table cleared!
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
