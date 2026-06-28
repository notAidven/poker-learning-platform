import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PokerTable } from '../components/table/PokerTable'
import { toCasinoRuntimeConfig } from '../components/table/tableRuntime'
import { DifficultyBadge } from '../components/casino/DifficultyBadge'
import { Chip } from '../components/lesson/interactions/cards/PlayingCardKit'
import { buttonVariants } from '../components/ui/buttonVariants'
import { getCasinoTable } from '../data/casinoTables'
import { useAuth } from '../contexts/useAuth'
import { isCasinoFloorUnlocked } from '../lib/casinoProgress'
import {
  STARTING_BANKROLL,
  bankrollAfterCashOut,
  canCoverBuyIn,
  pocketAfterBuyIn,
  rebuy,
  sessionNet,
  setBankroll,
  useBankroll,
} from '../lib/bankroll'
import { recordCasinoResult } from '../lib/leaderboard'
import { isAIConfigured } from '../lib/ai/aiClient'

type Session = { key: number; buyIn: number; pocket: number }

/**
 * A Casino Floor seat (`/casino/:tableId`). Self-guards the unlock gate, then runs a
 * shared-bankroll buy-in session over the re-skinned <PokerTable>:
 *
 *   - Buy in  → move the table's buy-in off the shared bankroll (pocket = bankroll − buyIn).
 *   - Play    → the table stack floats with the hero's stack; the pocket stays put.
 *   - End     → cash out (or bust): the final table stack returns to the pocket and the
 *               session's signed net (final − buyIn) is recorded to the House Standings.
 *
 * "End" fires on bust, on the in-table Leave link (→ /casino), and as an unmount safety
 * net for any other navigation — all idempotent per session via `settledKeyRef`.
 */
export function CasinoTablePage() {
  const { tableId = '' } = useParams()
  const { user, profile } = useAuth()
  const { chips: bankroll } = useBankroll()
  const uid = user?.uid ?? null

  const table = getCasinoTable(tableId)
  const runtime = useMemo(() => (table ? toCasinoRuntimeConfig(table) : null), [table])

  const [session, setSession] = useState<Session | null>(null)
  const [liveStack, setLiveStack] = useState(0)

  // Refs so the unmount cash-out reads the latest values without re-subscribing.
  const liveStackRef = useRef(0)
  const settledKeyRef = useRef<number | null>(null)
  const sessionRef = useRef<Session | null>(null)
  const uidRef = useRef<string | null>(uid)
  useEffect(() => {
    sessionRef.current = session
  }, [session])
  useEffect(() => {
    uidRef.current = uid
  }, [uid])

  /** Settle a session exactly once: return the table stack to the pocket + record net. */
  const settle = useCallback((s: Session | null) => {
    if (!s || settledKeyRef.current === s.key) return
    settledKeyRef.current = s.key
    const finalStack = liveStackRef.current
    void setBankroll(uidRef.current, bankrollAfterCashOut(s.pocket, finalStack))
    void recordCasinoResult(sessionNet(finalStack, s.buyIn))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('casino-standings-updated'))
    }
  }, [])

  // Cash-out safety net: settle the active session on any unmount (incl. the
  // in-table Leave → /casino navigation).
  useEffect(() => {
    return () => settle(sessionRef.current)
  }, [settle])

  const onHandSettled = useCallback((heroStack: number) => {
    liveStackRef.current = heroStack
    setLiveStack(heroStack)
  }, [])

  const sitDown = useCallback(() => {
    if (!table || !canCoverBuyIn(bankroll, table.buyIn)) return
    const pocket = pocketAfterBuyIn(bankroll, table.buyIn)
    void setBankroll(uid, pocket) // move the buy-in off the shared bankroll
    liveStackRef.current = table.buyIn
    setLiveStack(table.buyIn)
    setSession((s) => ({ key: (s?.key ?? 0) + 1, buyIn: table.buyIn, pocket }))
  }, [table, bankroll, uid])

  // Busted at the table: settle (final ≈ 0 → net −buyIn), then back to the buy-in
  // panel where the insufficient-funds guard + safety rebuy live.
  const onBust = useCallback(() => {
    settle(sessionRef.current)
    setSession(null)
  }, [settle])

  const safetyRebuy = useCallback(() => {
    void rebuy(uid)
  }, [uid])

  if (!table || !runtime) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <h1 className="font-display text-xl font-bold text-ink">Table not found</h1>
        <Link to="/casino" className="mt-4 inline-block font-semibold text-brand-600">
          ← Back to the floor
        </Link>
      </div>
    )
  }

  // Unlock guard on direct URLs: a locked seat sends you back to the course gate.
  if (!isCasinoFloorUnlocked()) {
    return <Navigate to="/course" replace />
  }

  return (
    <div className="space-y-4">
      <TablePlacard
        name={table.name}
        smallBlind={table.smallBlind}
        bigBlind={table.bigBlind}
        aiTier={table.aiTier}
        bankroll={bankroll}
        onTable={session ? liveStack : null}
      />

      {session ? (
        <PokerTable
          key={session.key}
          theme="casino"
          config={runtime}
          heroName={profile?.username ?? 'You'}
          heroStack={session.buyIn}
          bankroll={bankroll}
          onHandSettled={onHandSettled}
          onRequestRebuy={onBust}
          leaveTo="/casino"
          rebuyLabel="Back to the buy-in"
          bustedNote="You busted this table — your buy-in is gone. Head back to the buy-in to sit down again, or try a softer game."
        />
      ) : (
        <BuyInPanel
          buyIn={table.buyIn}
          bankroll={bankroll}
          onSit={sitDown}
          onRebuy={safetyRebuy}
        />
      )}
    </div>
  )
}

/** A clean white placard naming the table, its stakes, difficulty, and live chips. */
function TablePlacard({
  name,
  smallBlind,
  bigBlind,
  aiTier,
  bankroll,
  onTable,
}: {
  name: string
  smallBlind: number
  bigBlind: number
  aiTier: Parameters<typeof DifficultyBadge>[0]['tier']
  bankroll: number
  onTable: number | null
}) {
  const aiOff = !isAIConfigured()
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-night-900/10 bg-white px-4 py-3 shadow-card sm:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/casino"
          className="rounded-lg border border-night-900/12 bg-white px-3 py-1.5 text-xs font-semibold text-night-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
        >
          ← Cash out & leave
        </Link>
        <div>
          <h1 className="font-display text-base font-bold leading-tight text-ink sm:text-lg">
            {name}
          </h1>
          <p className="mt-0.5 text-[0.7rem] font-medium text-night-700/60">
            Blinds{' '}
            <span className="tabular-nums text-night-800">
              {smallBlind}/{bigBlind}
            </span>{' '}
            · play money
          </p>
        </div>
        <DifficultyBadge tier={aiTier} />
        {aiOff && (
          <span className="rounded-full bg-night-900 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide text-gold-200">
            AI offline
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-night-900 px-3 py-1.5 text-sm font-bold text-gold-300 shadow-sm">
          <Chip size={16} tone="gold" />
          <span className="tabular-nums">{Math.max(0, Math.round(bankroll)).toLocaleString()}</span>
          <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-white/50">
            bankroll
          </span>
        </span>
        {onTable != null && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-night-900/[0.06] px-3 py-1.5 text-sm font-bold text-ink ring-1 ring-inset ring-night-900/10">
            <Chip size={16} tone="gold" />
            <span className="tabular-nums">{onTable.toLocaleString()}</span>
            <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-night-700/50">
              on table
            </span>
          </span>
        )}
      </div>
    </div>
  )
}

/** Pre-seat panel: buy in if affordable; otherwise the guard (+ safety rebuy when it helps). */
function BuyInPanel({
  buyIn,
  bankroll,
  onSit,
  onRebuy,
}: {
  buyIn: number
  bankroll: number
  onSit: () => void
  onRebuy: () => void
}) {
  const affordable = canCoverBuyIn(bankroll, buyIn)
  const safeBankroll = Math.max(0, Math.round(bankroll))
  const shortfall = Math.max(0, buyIn - safeBankroll)
  // A safety rebuy only helps when STARTING_BANKROLL would actually cover the seat
  // (so we never offer a "rebuy" that would lower a richer bankroll).
  const rebuyHelps = !affordable && safeBankroll < STARTING_BANKROLL && STARTING_BANKROLL >= buyIn

  return (
    <div className="mx-auto max-w-md py-4 text-center">
      <div className="rounded-2xl border border-night-900/10 bg-white p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-night-700/50">Buy-in</p>
        <p className="mt-1 inline-flex items-center gap-2 text-3xl font-bold tabular-nums text-ink">
          <Chip size={22} tone="gold" />
          {buyIn.toLocaleString()}
        </p>

        <p className="mt-4 text-sm text-night-700/70">
          Your bankroll:{' '}
          <span className="font-bold tabular-nums text-ink">{safeBankroll.toLocaleString()}</span>
        </p>

        {affordable ? (
          <button
            type="button"
            onClick={onSit}
            className={buttonVariants({ variant: 'primary', size: 'lg', className: 'mt-5 w-full' })}
          >
            Take your seat
          </button>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-700">
              You need {shortfall.toLocaleString()} more to sit at this table.
            </p>
            {rebuyHelps ? (
              <button
                type="button"
                onClick={onRebuy}
                className={buttonVariants({ variant: 'gold', size: 'lg', className: 'w-full' })}
              >
                Rebuy {STARTING_BANKROLL.toLocaleString()} chips
              </button>
            ) : (
              <p className="text-sm text-night-700/70">
                Grind up at a lower-stakes table to afford this seat.
              </p>
            )}
          </div>
        )}

        <Link
          to="/casino"
          className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'mt-3 w-full' })}
        >
          ← Back to the floor
        </Link>
      </div>
    </div>
  )
}
