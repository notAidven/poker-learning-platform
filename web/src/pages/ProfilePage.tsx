import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { animate, motion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { getEffectiveStreak, getLevelProgress } from '../lib/gamification'
import { useBankroll } from '../lib/bankroll'
import { DUR, EASE } from '../lib/motion'
import { AnimalAvatar } from '../components/AnimalAvatar'
import { SetPasswordCard } from '../components/SetPasswordCard'
import { AccountSettings } from '../components/account/AccountSettings'
import { SET_PASSWORD_ANCHOR_ID } from '../components/account/PasswordSetting'
import { Chip } from '../components/lesson/interactions/cards/PlayingCardKit'
import { Button, buttonVariants } from '../components/ui/Button'
import { NightPanel } from '../components/ui/NightPanel'
import { StatToken } from '../components/ui/StatToken'
import { usePrefersReducedMotion } from '../components/lesson/interactions/usePrefersReducedMotion'
import { FlameIcon, StarIcon, TrendingUpIcon } from '../components/icons'

export function ProfilePage() {
  const { user, profile, logOut } = useAuth()
  const { chips: bankroll, granted: bankrollGranted } = useBankroll()
  const reduced = usePrefersReducedMotion()
  const totalXp = profile?.totalXp ?? 0
  const levelProgress = getLevelProgress(totalXp)
  const streak = getEffectiveStreak(profile?.streak ?? 0, profile?.lastActivityDate ?? null)

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <NightPanel className="p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <motion.div
            className="shrink-0"
            whileHover={reduced ? undefined : { scale: 1.05, rotate: -3 }}
            whileTap={reduced ? undefined : { scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          >
            <AnimalAvatar id={profile?.profileAnimal} size="lg" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold tracking-tight">
              {profile?.username ?? 'Learner'}
            </h1>
            <p className="truncate text-sm text-white/60">{user?.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2.5">
          <StatToken icon={<TrendingUpIcon className="h-6 w-6" />} value={levelProgress.level} label="Level" accent="green" orientation="col" delayMs={120} />
          <StatToken icon={<StarIcon className="h-6 w-6" />} value={totalXp} label="Total XP" accent="wine" orientation="col" delayMs={200} />
          <StatToken icon={<FlameIcon className="h-6 w-6" />} value={streak} label="Day streak" accent="gold" orientation="col" delayMs={280} />
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-night-950/40 p-4">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-semibold text-white/85">Level {levelProgress.level}</span>
            <span className="tnum text-white/55">
              {levelProgress.xpInLevel} / {levelProgress.xpToNext} XP to level{' '}
              {levelProgress.level + 1}
            </span>
          </div>
          <div
            className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-night-950/70 ring-1 ring-inset ring-white/10"
            role="progressbar"
            aria-valuenow={levelProgress.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Level ${levelProgress.level} progress`}
          >
            <div
              className="xp-meter-fill h-full rounded-full transition-[width] duration-700"
              style={{ width: `${Math.max(levelProgress.progressPercent, 4)}%` }}
            />
          </div>
        </div>

        {bankrollGranted && (
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-night-950/40 p-4">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/85">
              <Chip size={18} tone="gold" />
              Casino bankroll
            </span>
            <span className="tnum text-lg font-bold text-gold-300">
              <CountUp value={bankroll} />
            </span>
          </div>
        )}
      </NightPanel>

      <AccountSettings />

      {/* The canonical "set a password" flow for Google-only accounts. The
          Account settings password row scrolls/focuses this when needed, so we
          keep a single source of truth instead of duplicating the link flow. */}
      <div id={SET_PASSWORD_ANCHOR_ID} tabIndex={-1} className="scroll-mt-24 focus:outline-none">
        <SetPasswordCard />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/course" className={buttonVariants({ variant: 'primary', size: 'lg', className: 'w-full' })}>
          Continue course
        </Link>
        <Button variant="secondary" size="lg" fullWidth onClick={() => logOut()}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

/** Rakes the bankroll up from zero on arrival (and across updates); reduced-motion
 *  shows the final total immediately. */
function CountUp({ value }: { value: number }) {
  const reduced = usePrefersReducedMotion()
  const [display, setDisplay] = useState(reduced ? value : 0)
  const from = useRef(reduced ? value : 0)

  // Reduced-motion always renders `value` directly below, so the effect only runs
  // the rake animation (state updates live in the async `onUpdate` callback).
  useEffect(() => {
    if (reduced) return
    const start = from.current
    from.current = value
    if (start === value) return
    const controls = animate(start, value, {
      duration: Math.min(DUR.celebrate, Math.max(DUR.base, Math.abs(value - start) * 0.0006)),
      ease: EASE.rake,
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value, reduced])

  return <>{(reduced ? value : display).toLocaleString()}</>
}
