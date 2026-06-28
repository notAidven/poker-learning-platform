import { useEffect, useState } from 'react'
import { fetchLeaderboard, type LeaderboardEntry } from '../../lib/leaderboard'
import { useAuth } from '../../contexts/useAuth'
import { AnimalAvatar } from '../AnimalAvatar'
import { Badge } from '../ui/Badge'
import { cx } from '../ui/cx'
import { useCountUp } from './useCountUp'

/** A small gold crown marking the leader at the top of the board. */
function CrownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 7l4 4 5-7 5 7 4-4-1.6 11.2a1 1 0 0 1-1 .8H5.6a1 1 0 0 1-1-.8L3 7zm2.8 9h12.4l.5-3.4-2.9 2.9-4.8-6.7-4.8 6.7-2.9-2.9L5.8 16z" />
    </svg>
  )
}

/** The animated net-winnings figure for one row (counts up on load; reduced-motion safe). */
function NetFigure({ value }: { value: number }) {
  const shown = useCountUp(value)
  const tone =
    value > 0 ? 'text-success-600' : value < 0 ? 'text-danger-600' : 'text-night-700/80'
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return (
    <span className={cx('font-display text-lg font-bold tabular-nums sm:text-xl', tone)}>
      {sign}
      {Math.abs(shown).toLocaleString()}
    </span>
  )
}

function BoardShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-labelledby="house-standings-title"
      className="rounded-2xl border border-night-900/10 bg-white p-5 shadow-card sm:p-6"
    >
      <header className="border-b border-night-900/10 pb-4">
        <h2
          id="house-standings-title"
          className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl"
        >
          House Standings
        </h2>
        <p className="mt-1 text-xs font-medium text-night-700/80">
          Lifetime net winnings · play money
        </p>
      </header>
      {children}
    </section>
  )
}

/**
 * The House Standings board — a clean, ranked panel in the app's card style. Ranks
 * every player by lifetime net winnings (desc), marks the leader with a crown + a
 * soft gold row, and counts each figure up on load. The signed-in user's row is
 * tinted in brand so they can find themselves at a glance.
 */
export function HouseStandings({ topN = 20 }: { topN?: number }) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)

  useEffect(() => {
    let cancelled = false
    // Load (and reload on the post-session event). setState lives in the async
    // `.then` callback, never synchronously in the effect body. Existing rows stay
    // visible across a refetch (no skeleton flash); the initial null state covers
    // first load.
    const load = () => {
      void fetchLeaderboard(topN).then((rows) => {
        if (!cancelled) setEntries(rows)
      })
    }
    load()
    window.addEventListener('casino-standings-updated', load)
    return () => {
      cancelled = true
      window.removeEventListener('casino-standings-updated', load)
    }
  }, [topN, user?.uid])

  if (entries === null) {
    return (
      <BoardShell>
        <ul className="mt-4 space-y-2" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="h-12 animate-pulse rounded-xl bg-night-900/[0.04]" />
          ))}
        </ul>
        <p className="sr-only" aria-live="polite">
          Loading the House Standings…
        </p>
      </BoardShell>
    )
  }

  if (entries.length === 0) {
    return (
      <BoardShell>
        <div className="mt-5 rounded-xl border border-dashed border-night-900/15 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-ink">No standings posted yet.</p>
          <p className="mt-1 text-xs text-night-700/80">
            Finish a session at any table to put your name on the board.
          </p>
        </div>
      </BoardShell>
    )
  }

  return (
    <BoardShell>
      <ol className="mt-3 space-y-1.5">
        {entries.map((entry, i) => {
          const rank = i + 1
          const isLeader = rank === 1
          const isYou = Boolean(user && entry.uid === user.uid)
          return (
            <li
              key={entry.uid}
              className={cx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5',
                isLeader
                  ? 'bg-gold-50 ring-1 ring-inset ring-gold-300/70'
                  : isYou
                    ? 'bg-brand-50/70 ring-1 ring-inset ring-brand-200/70'
                    : 'bg-night-900/[0.02]',
              )}
            >
              <span
                className={cx(
                  'w-6 shrink-0 text-center font-display text-sm font-bold tabular-nums',
                  isLeader ? 'text-gold-700' : 'text-night-700/80',
                )}
              >
                {rank}
              </span>
              <div className="relative shrink-0">
                <AnimalAvatar id={entry.profileAnimal} size="sm" />
                {isLeader && (
                  <CrownIcon className="absolute -right-1.5 -top-2 h-4 w-4 -rotate-12 text-gold-500" />
                )}
              </div>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="min-w-0 truncate text-sm font-semibold text-ink">
                  {entry.username}
                </span>
                {isYou && <Badge tone="brand">You</Badge>}
              </span>
              <NetFigure value={entry.netWinnings} />
            </li>
          )
        })}
      </ol>
    </BoardShell>
  )
}
