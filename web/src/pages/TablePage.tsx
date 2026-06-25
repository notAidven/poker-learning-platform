import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PokerTable } from '../components/table/PokerTable'
import { toRuntimeConfig } from '../components/table/tableRuntime'
import { Chip } from '../components/lesson/interactions/cards/PlayingCardKit'
import { buttonVariants } from '../components/ui/Button'
import { getTable } from '../data/tables'
import { useAuth } from '../contexts/AuthContext'
import { useCompletedLessons } from '../hooks/useCompletedLessons'
import { areAllLessonsComplete, isTableUnlocked, markTableCleared } from '../lib/lessonProgress'
import { STARTING_BANKROLL, grantBankroll, rebuy, setBankroll, useBankroll } from '../lib/bankroll'

/**
 * Casino-table route (`/table/:id`). Looks up the `TableConfig`, enforces the
 * unlock gate (all lessons complete, plus a cleared coached table for AI tables),
 * grants the starting bankroll once, and runs a buy-in "session" so the hero
 * plays with their bankroll and can rebuy when busted.
 */
export function TablePage() {
  const { id = '' } = useParams()
  const { completedIds } = useCompletedLessons()
  const { user, profile } = useAuth()
  const { chips: bankroll, granted } = useBankroll()

  const table = getTable(id)
  const runtime = useMemo(() => (table ? toRuntimeConfig(table) : null), [table])
  const tableId = table?.id
  const uid = user?.uid ?? null
  const allLessonsDone = areAllLessonsComplete(completedIds)

  // A "session" = one buy-in. It only changes on explicit sit-down / rebuy (user
  // events), so live bankroll updates never remount the table mid-hand.
  const [session, setSession] = useState<{ key: number; buyIn: number } | null>(null)

  const onCleared = useCallback(() => {
    if (tableId) markTableCleared(tableId)
  }, [tableId])

  const onHandSettled = useCallback(
    (heroStack: number) => {
      void setBankroll(uid, heroStack)
    },
    [uid],
  )

  const sitDown = useCallback(() => {
    setSession((s) => ({ key: (s?.key ?? 0) + 1, buyIn: bankroll }))
  }, [bankroll])

  const rebuyAndReseat = useCallback(() => {
    void rebuy(uid)
    setSession((s) => ({ key: (s?.key ?? 0) + 1, buyIn: STARTING_BANKROLL }))
  }, [uid])

  // Grant the starting bankroll once the casino unlocks (idempotent across
  // devices via the Firestore `bankrollGranted` flag). Fire-and-forget side effect.
  useEffect(() => {
    if (allLessonsDone) {
      void grantBankroll(uid, { profileGranted: Boolean(profile?.bankrollGranted) })
    }
  }, [allLessonsDone, uid, profile?.bankrollGranted])

  if (!table || !runtime) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-xl font-bold">Table not found</h1>
        <Link to="/course" className="mt-4 inline-block text-brand-600">
          ← Back to course
        </Link>
      </div>
    )
  }

  // Unlock gate on direct URLs: a locked table sends you back to the path.
  if (!isTableUnlocked(table, completedIds)) {
    return <Navigate to="/course" replace />
  }

  // Before sitting down: show the buy-in intro (or a rebuy prompt if busted).
  if (!session) {
    if (!granted && bankroll <= 0) {
      return <BuyInIntro title={table.title} preparing />
    }
    if (bankroll <= 0) {
      return <BuyInIntro title={table.title} busted onRebuy={rebuyAndReseat} />
    }
    return <BuyInIntro title={table.title} chips={bankroll} onSit={sitDown} />
  }

  return (
    <PokerTable
      key={session.key}
      config={runtime}
      heroName={profile?.username ?? 'You'}
      heroStack={session.buyIn}
      bankroll={bankroll}
      onCleared={onCleared}
      onHandSettled={onHandSettled}
      onRequestRebuy={rebuyAndReseat}
    />
  )
}

function BuyInIntro({
  title,
  chips,
  preparing,
  busted,
  onSit,
  onRebuy,
}: {
  title: string
  chips?: number
  preparing?: boolean
  busted?: boolean
  onSit?: () => void
  onRebuy?: () => void
}) {
  return (
    <div className="mx-auto max-w-md space-y-5 text-center">
      <div>
        <Link to="/course" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          ← Course path
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-night-700/70">Play money · learning chips, no real cash.</p>
      </div>

      <div className="rounded-2xl border border-night-900/10 bg-white p-6 shadow-card">
        {preparing ? (
          <p className="text-sm font-semibold text-night-700/80" aria-live="polite">
            Setting up your chips…
          </p>
        ) : busted ? (
          <>
            <p className="text-sm text-night-700/80">
              You are out of chips. Rebuy for a fresh stack of play-money chips to keep learning.
            </p>
            <button
              type="button"
              onClick={onRebuy}
              className={buttonVariants({ variant: 'gold', size: 'lg', className: 'mt-4 w-full' })}
            >
              Rebuy {STARTING_BANKROLL.toLocaleString()} chips
            </button>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-night-700/50">
              Your bankroll
            </p>
            <p className="mt-1 inline-flex items-center gap-2 text-3xl font-bold tabular-nums text-ink">
              <Chip size={22} tone="gold" />
              {(chips ?? 0).toLocaleString()}
            </p>
            <button
              type="button"
              onClick={onSit}
              className={buttonVariants({ variant: 'primary', size: 'lg', className: 'mt-5 w-full' })}
            >
              Take your seat
            </button>
          </>
        )}
      </div>
    </div>
  )
}
