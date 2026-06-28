import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { useProgress } from '../lib/progress'
import { areAllLessonsComplete, isCasinoFloorUnlocked, isTableCleared } from '../lib/casinoProgress'
import { grantBankroll, useBankroll } from '../lib/bankroll'
import { isAIConfigured } from '../lib/ai/aiClient'
import { casinoTables } from '../data/casinoTables'
import { CasinoTableCard } from '../components/casino/CasinoTableCard'
import { HouseStandings } from '../components/casino/HouseStandings'
import { Badge } from '../components/ui/Badge'
import { buttonVariants } from '../components/ui/buttonVariants'
import { NightPanel } from '../components/ui/NightPanel'
import { StatToken } from '../components/ui/StatToken'
import { Stagger } from '../components/ui/Stagger'
import { cx } from '../components/ui/cx'
import { CheckIcon, ChipIcon, LockIcon, SpadeIcon } from '../components/icons'

/**
 * The Casino Floor lobby (`/casino`).
 *
 *  - Locked: the floor is shut. We explain exactly how to earn a seat (clear both
 *    in-course practice tables) and link back to the course. The play routes are
 *    self-guarded separately (they bounce to /course), so this screen is the place
 *    a curious direct-link visitor learns how to get in.
 *  - Unlocked: the floor opens — a felt hero with the live bankroll, the three tables
 *    as white app cards, and a clean House Standings panel.
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

  const safeBankroll = Math.max(0, Math.round(bankroll))
  const aiOff = !isAIConfigured()

  return (
    <div className="space-y-8">
      <NightPanel className="p-6 sm:p-9 lg:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.35fr_1fr]">
          <Stagger delay={0.05} step={0.09} y={16}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold-300 ring-1 ring-inset ring-gold-400/25">
              <span aria-hidden>&spades;</span>
              After hours
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
              The Casino Floor
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              The course was the school; this is the floor. Take a seat against AI opponents that
              get tougher table by table, from the friendly Parlor to the high-limit Vault — all
              on play money.
            </p>
          </Stagger>

          <div className="anim-deal rounded-2xl border border-white/10 bg-white/[0.05] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-5">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
              Your floor
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <StatToken
                icon={<ChipIcon className="h-6 w-6" />}
                value={safeBankroll}
                label="Bankroll"
                accent="gold"
                orientation="col"
                delayMs={180}
              />
              <StatToken
                icon={<SpadeIcon className="h-6 w-6" />}
                value={casinoTables.length}
                label="Tables"
                accent="green"
                orientation="col"
                delayMs={260}
              />
            </div>
            {aiOff && (
              <p className="mt-3 rounded-xl border border-white/10 bg-night-950/40 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gold-200/80">
                AI offline · built-in strategy
              </p>
            )}
          </div>
        </div>
      </NightPanel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section>
          <div className="mb-5">
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              Choose your table
            </h2>
            <p className="mt-1 text-sm text-night-700/85">
              Buy in from your shared bankroll; cash out or bust and the result returns to it.
            </p>
          </div>

          <Stagger className="grid gap-4 sm:grid-cols-2" delay={0.05} step={0.06} y={14}>
            {casinoTables.map((table) => (
              <CasinoTableCard key={table.id} table={table} bankroll={bankroll} />
            ))}
          </Stagger>

          <p className="mt-4 text-xs leading-relaxed text-night-700/75">
            Play money only — no real wagering. Grind up at the softer games to afford the
            high-limit Vault.
          </p>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <HouseStandings />
        </aside>
      </div>
    </div>
  )
}

/** The closed-floor screen: how to earn a seat, with live progress on the two gates. */
function LockedFloor() {
  const gates: { label: string; sub: string; done: boolean }[] = [
    {
      label: "The Coach's Table",
      sub: 'Clear the coached room in the course',
      done: isTableCleared('room-1'),
    },
    {
      label: 'The AI Table',
      sub: 'Clear the AI room in the course',
      done: isTableCleared('room-2'),
    },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <NightPanel className="p-6 text-center sm:p-9">
        <span
          className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.07] text-gold-300 ring-1 ring-inset ring-gold-400/25"
          aria-hidden
        >
          <LockIcon className="h-7 w-7" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">
          Members only
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          The Casino Floor is closed
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
          Clear the Coach's Table and the AI Table in the course to earn your seat. The floor opens
          once you've proven yourself at both practice rooms.
        </p>
        <Link
          to="/course"
          className={buttonVariants({ variant: 'gold', size: 'lg', className: 'mt-7' })}
        >
          Back to the course
          <span aria-hidden>→</span>
        </Link>
      </NightPanel>

      <div className="rounded-2xl border border-night-900/10 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-night-700/80">
          Earn your seat
        </h2>
        <ul className="mt-4 space-y-2.5">
          {gates.map((gate) => (
            <li
              key={gate.label}
              className={cx(
                'flex items-center gap-3 rounded-xl border px-4 py-3',
                gate.done ? 'border-success-200 bg-success-50' : 'border-night-900/10 bg-night-900/[0.02]',
              )}
            >
              <span
                className={cx(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full',
                  gate.done
                    ? 'bg-success-500 text-white shadow-[0_2px_0_var(--color-success-700)]'
                    : 'bg-night-900/5 text-night-700/40 ring-1 ring-inset ring-night-900/10',
                )}
                aria-hidden
              >
                {gate.done ? <CheckIcon className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{gate.label}</span>
                <span className="block text-xs text-night-700/80">
                  {gate.done ? 'Cleared' : gate.sub}
                </span>
              </span>
              <span className="ml-auto shrink-0">
                {gate.done ? <Badge tone="success">Cleared</Badge> : <Badge tone="neutral">Locked</Badge>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
