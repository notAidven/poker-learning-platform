import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProgress } from '../lib/progress'
import { areAllLessonsComplete, isCasinoFloorUnlocked, isTableCleared } from '../lib/casinoProgress'
import { grantBankroll, useBankroll } from '../lib/bankroll'
import { isAIConfigured } from '../lib/ai/aiClient'
import { casinoTables } from '../data/casinoTables'
import { CasinoTableCard } from '../components/casino/CasinoTableCard'
import { HouseStandings } from '../components/casino/HouseStandings'
import { useCountUp } from '../components/casino/useCountUp'
import { cx } from '../components/ui/cx'
import { CheckIcon, LockIcon } from '../components/icons'
import { buttonVariants } from '../components/ui/Button'

/**
 * The Casino Floor lobby (`/casino`).
 *
 *  - Locked: the floor is shut. We explain exactly how to earn a seat (clear both
 *    in-course practice tables) and link back to the course. The play routes are
 *    self-guarded separately (they bounce to /course), so this screen is the place
 *    a curious direct-link visitor learns how to get in.
 *  - Unlocked: the floor opens — a brass header with the live bankroll, the three
 *    tables as oval-felt vignettes, and the signature House Standings tote-board.
 */
export function CasinoLobbyPage() {
  const { user, profile } = useAuth()
  const { completedIds } = useProgress()
  const { chips: bankroll } = useBankroll()
  const unlocked = isCasinoFloorUnlocked()
  const uid = user?.uid ?? null

  // Idempotent safety: ensure the starting bankroll is granted once the floor is
  // open (it normally already is, since clearing both rooms requires it). Cheap and
  // guarded by the Firestore `bankrollGranted` flag for signed-in users.
  useEffect(() => {
    if (unlocked && areAllLessonsComplete(completedIds)) {
      void grantBankroll(uid, { profileGranted: Boolean(profile?.bankrollGranted) })
    }
  }, [unlocked, completedIds, uid, profile?.bankrollGranted])

  if (!unlocked) {
    return <LockedFloor />
  }

  return (
    <div className="casino-floor -mx-4 rounded-none px-4 py-8 sm:-mx-6 sm:rounded-3xl sm:px-8 lg:px-10">
      <FloorHeader bankroll={bankroll} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div>
          <h2 className="casino-label mb-3 text-xs text-casino-bone/60">The Tables</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {casinoTables.map((table) => (
              <CasinoTableCard key={table.id} table={table} bankroll={bankroll} />
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-casino-bone/50">
            Play money only — no real wagering. Buy in from your shared bankroll; cash out or
            bust and the result returns to it. Grind up to afford the high-limit Vault.
          </p>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <HouseStandings />
        </div>
      </div>
    </div>
  )
}

function FloorHeader({ bankroll }: { bankroll: number }) {
  const shownBankroll = useCountUp(bankroll)
  const aiOff = !isAIConfigured()
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-casino-brass/20 pb-6">
      <div>
        <p className="casino-label text-xs text-casino-brass/70">After hours</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-casino-bone sm:text-4xl">
          The Casino Floor
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-casino-bone/70">
          The course was the school. This is the floor at midnight — hushed, luxe, and
          high-limit. Pick your table and take a seat.
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="rounded-2xl border border-casino-brass/30 bg-black/30 px-5 py-3 text-right">
          <p className="casino-label text-[0.5625rem] text-casino-bone/55">Your bankroll</p>
          <p className="casino-numeral text-3xl sm:text-4xl">{shownBankroll.toLocaleString()}</p>
        </div>
        {aiOff && (
          <span className="rounded-full border border-casino-brass/30 bg-black/30 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide text-casino-brass/80">
            AI offline · built-in strategy
          </span>
        )}
      </div>
    </header>
  )
}

/** The closed-floor screen: how to earn a seat, with live progress on the two gates. */
function LockedFloor() {
  const room1Cleared = isTableCleared('room-1')
  const room2Cleared = isTableCleared('room-2')
  const gates: { label: string; sub: string; done: boolean }[] = [
    {
      label: "The Coach's Table",
      sub: 'Clear the coached room in the course',
      done: room1Cleared,
    },
    { label: 'The AI Table', sub: 'Clear the AI room in the course', done: room2Cleared },
  ]

  return (
    <div className="casino-floor -mx-4 rounded-none px-4 py-12 sm:-mx-6 sm:rounded-3xl sm:px-8">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-casino-brass/40 bg-black/30">
          <LockIcon className="h-7 w-7 text-casino-brass" />
        </span>
        <p className="casino-label mt-5 text-xs text-casino-brass/70">Members only</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-casino-bone">
          The Casino Floor is closed
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-casino-bone/75">
          Clear the Coach's Table and the AI Table in the course to earn your seat. The floor
          opens once you've proven yourself at both practice rooms.
        </p>

        <ul className="mx-auto mt-7 max-w-sm space-y-2.5 text-left">
          {gates.map((gate) => (
            <li
              key={gate.label}
              className={cx(
                'flex items-center gap-3 rounded-xl border px-4 py-3',
                gate.done
                  ? 'border-casino-brass/40 bg-casino-brass/10'
                  : 'border-casino-bone/15 bg-black/25',
              )}
            >
              <span
                className={cx(
                  'grid h-7 w-7 shrink-0 place-items-center rounded-full',
                  gate.done ? 'bg-casino-brass/25 text-casino-brass-bright' : 'bg-black/40 text-casino-bone/50',
                )}
              >
                {gate.done ? <CheckIcon className="h-4 w-4" /> : <LockIcon className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0">
                <span
                  className={cx(
                    'block text-sm font-bold',
                    gate.done ? 'text-casino-brass-bright' : 'text-casino-bone/85',
                  )}
                >
                  {gate.label}
                </span>
                <span className="block text-xs text-casino-bone/55">
                  {gate.done ? 'Cleared' : gate.sub}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <Link
          to="/course"
          className={buttonVariants({ variant: 'gold', size: 'lg', className: 'mt-8' })}
        >
          Back to the course
        </Link>
      </div>
    </div>
  )
}
