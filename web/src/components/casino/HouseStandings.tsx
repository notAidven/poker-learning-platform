import { useEffect, useState } from 'react'
import { fetchLeaderboard, type LeaderboardEntry } from '../../lib/leaderboard'
import { useAuth } from '../../contexts/AuthContext'
import { AnimalAvatar } from '../AnimalAvatar'
import { cx } from '../ui/cx'
import { useCountUp } from './useCountUp'

/** A small brass crown for the leader marker (the memorable tote-board flourish). */
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
    value > 0 ? 'text-casino-brass-bright' : value < 0 ? 'text-casino-ember' : 'text-casino-bone/70'
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return (
    <span className={cx('casino-numeral text-xl sm:text-2xl', tone)}>
      {sign}
      {Math.abs(shown).toLocaleString()}
    </span>
  )
}

function BoardShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-labelledby="house-standings-title"
      className="tote-board overflow-hidden rounded-2xl p-5 sm:p-6"
    >
      <header className="flex items-center justify-between gap-3 border-b border-casino-brass/20 pb-4">
        <div>
          <h2 id="house-standings-title" className="casino-label text-base sm:text-lg">
            House Standings
          </h2>
          <p className="mt-1 text-xs font-medium text-casino-bone/55">
            Lifetime net winnings · play money
          </p>
        </div>
        <CrownIcon className="h-7 w-7 text-casino-brass/70" />
      </header>
      {children}
    </section>
  )
}

/**
 * The signature House Standings board — a vintage brass tote-board hung over the
 * floor. Ranks every player by lifetime net winnings (desc), marks the leader with
 * a crown + a lit brass row, and counts each figure up on load. The signed-in user's
 * row is ringed so they can find themselves at a glance.
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
            <li key={i} className="h-12 animate-pulse rounded-xl bg-casino-bone/5" />
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
        <div className="mt-6 rounded-xl border border-dashed border-casino-brass/25 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-casino-bone/80">No standings posted yet.</p>
          <p className="mt-1 text-xs text-casino-bone/55">
            Finish a session at any table to put your name on the board.
          </p>
        </div>
      </BoardShell>
    )
  }

  return (
    <BoardShell>
      <ol className="mt-2">
        {entries.map((entry, i) => {
          const rank = i + 1
          const isLeader = rank === 1
          const isYou = Boolean(user && entry.uid === user.uid)
          return (
            <li
              key={entry.uid}
              className={cx(
                'tote-row flex items-center gap-3 px-1 py-3',
                isLeader && 'tote-row--leader',
              )}
            >
              <span
                className={cx(
                  'casino-numeral w-7 shrink-0 text-center text-lg',
                  isLeader ? 'text-casino-brass-bright' : 'text-casino-bone/60',
                )}
              >
                {rank}
              </span>
              <div className="relative shrink-0">
                <AnimalAvatar id={entry.profileAnimal} size="sm" />
                {isLeader && (
                  <CrownIcon className="absolute -right-1.5 -top-2 h-4 w-4 -rotate-12 text-casino-brass-bright" />
                )}
              </div>
              <span
                className={cx(
                  'min-w-0 flex-1 truncate text-sm font-semibold',
                  isYou ? 'text-casino-brass-bright' : 'text-casino-bone/90',
                )}
              >
                {entry.username}
                {isYou && (
                  <span className="ml-2 rounded-full border border-casino-brass/40 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-casino-brass">
                    You
                  </span>
                )}
              </span>
              <NetFigure value={entry.netWinnings} />
            </li>
          )
        })}
      </ol>
    </BoardShell>
  )
}
