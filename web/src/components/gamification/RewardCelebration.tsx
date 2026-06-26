import { useEffect, useRef, useState } from 'react'
import { animate, motion, useAnimationControls, type AnimationPlaybackControls } from 'motion/react'
import { DUR, EASE, SPRING } from '../../lib/motion'
import { xpToNextLevel } from '../../lib/gamification'
import { usePrefersReducedMotion } from '../lesson/interactions/usePrefersReducedMotion'
import { FlameIcon, SpadeIcon } from '../icons'

type RewardCelebrationProps = {
  xpGained: number
  base: number
  bonus: number
  /** XP into the starting level. */
  fromXp: number
  /** XP into the final level. */
  toXp: number
  level: number
  leveledUp: boolean
  streak: number
  streakIncreased: boolean
  onDone?: () => void
}

const RAKE_CHIPS = 5
const SPARKS = 7

const clampPct = (n: number) => Math.max(0, Math.min(100, n))
const countDuration = (n: number) => Math.min(1.1, Math.max(0.5, n * 0.006))

/**
 * "Win the pot" — the XP / level-up / streak celebration. A small stack of chips is
 * raked into the level meter as the +XP counts up; crossing a level overflows the
 * meter and flips to the next level with a brass flourish + spade glint (reserved for
 * level-ups only). Reduced motion shows the final values with no rake/burst.
 */
export function RewardCelebration({
  xpGained,
  base,
  bonus,
  fromXp,
  toXp,
  level,
  leveledUp,
  streak,
  streakIncreased,
  onDone,
}: RewardCelebrationProps) {
  const reduced = usePrefersReducedMotion()
  const prevLevel = leveledUp ? Math.max(1, level - 1) : level
  const fromDenom = xpToNextLevel(prevLevel)
  const toDenom = xpToNextLevel(level)
  const fromPct = clampPct((fromXp / fromDenom) * 100)
  const toPct = clampPct((toXp / toDenom) * 100)

  const [counted, setCounted] = useState(reduced ? xpGained : 0)
  const [displayLevel, setDisplayLevel] = useState(reduced ? level : prevLevel)
  const [meterXp, setMeterXp] = useState(reduced ? toXp : fromXp)
  const [meterDenom, setMeterDenom] = useState(reduced ? toDenom : fromDenom)
  const [leveledFlash, setLeveledFlash] = useState(reduced ? leveledUp : false)

  const meter = useAnimationControls()
  const flourish = useAnimationControls()
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (reduced) {
      onDoneRef.current?.()
      return
    }

    let alive = true
    const counts: AnimationPlaybackControls[] = []
    counts.push(
      animate(0, xpGained, {
        delay: 0.15,
        duration: countDuration(xpGained),
        ease: EASE.rake,
        onUpdate: (v) => setCounted(Math.round(v)),
      }),
    )
    meter.set({ width: `${fromPct}%` })

    async function run() {
      if (leveledUp) {
        counts.push(
          animate(fromXp, fromDenom, {
            delay: 0.35,
            duration: 0.8,
            ease: EASE.rake,
            onUpdate: (v) => setMeterXp(Math.round(v)),
          }),
        )
        await meter.start({ width: '100%' }, { delay: 0.35, duration: 0.8, ease: EASE.rake })
        if (!alive) return
        setDisplayLevel(level)
        setMeterDenom(toDenom)
        setMeterXp(0)
        setLeveledFlash(true)
        meter.set({ width: '0%' })
        void flourish.start(
          { opacity: 1, scale: [0.6, 1.15, 1] },
          { duration: 0.55, ease: EASE.chip },
        )
        counts.push(
          animate(0, toXp, {
            delay: 0.1,
            duration: 0.75,
            ease: EASE.rake,
            onUpdate: (v) => setMeterXp(Math.round(v)),
          }),
        )
        await meter.start({ width: `${toPct}%` }, { delay: 0.1, duration: 0.75, ease: EASE.rake })
      } else {
        counts.push(
          animate(fromXp, toXp, {
            delay: 0.35,
            duration: 0.9,
            ease: EASE.rake,
            onUpdate: (v) => setMeterXp(Math.round(v)),
          }),
        )
        await meter.start({ width: `${toPct}%` }, { delay: 0.35, duration: 0.9, ease: EASE.rake })
      }
      if (alive) onDoneRef.current?.()
    }

    void run()

    return () => {
      alive = false
      counts.forEach((c) => c.stop())
      meter.stop()
      flourish.stop()
    }
    // Props are fixed for the lifetime of one celebration (set once on pass).
  }, [reduced, xpGained, leveledUp, fromXp, toXp, fromDenom, toDenom, fromPct, toPct, level, meter, flourish])

  return (
    <motion.div
      className="relative overflow-hidden rounded-card border border-gold-300/60 bg-gradient-to-b from-gold-50 to-white p-4 text-center shadow-pop"
      initial={reduced ? false : { opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduced ? { duration: 0 } : SPRING}
    >
      <p className="sr-only">
        Earned {xpGained} XP{leveledUp ? `, reached level ${level}` : ''}
        {streakIncreased ? `, ${streak} day streak` : ''}.
      </p>

      <p className="flex items-baseline justify-center gap-1.5" aria-hidden>
        <span className="font-display text-3xl font-bold tnum text-gold-700">+{counted}</span>
        <span className="text-sm font-bold uppercase tracking-wide text-gold-600">XP</span>
      </p>
      <p className="mt-0.5 text-xs font-medium tnum text-night-700/70" aria-hidden>
        {base} base{bonus > 0 ? ` + ${bonus} first-try bonus` : ''}
      </p>

      <div className="relative mt-5" aria-hidden>
        {!reduced && (
          <div className="pointer-events-none absolute inset-x-0 -top-3 flex justify-center">
            {Array.from({ length: RAKE_CHIPS }).map((_, i) => (
              <motion.span
                key={i}
                className="poker-chip absolute h-5 w-5"
                initial={{ x: 76 + i * 6, y: -14, opacity: 0, scale: 0.5 }}
                animate={{
                  x: [76 + i * 6, 12, -28 + i * 11],
                  y: [-14, 2, 16],
                  opacity: [0, 1, 1, 0],
                  scale: [0.5, 1, 1, 0.7],
                }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.09, ease: EASE.rake }}
              />
            ))}
          </div>
        )}

        <div className="flex items-baseline justify-between text-xs">
          <motion.span
            key={displayLevel}
            className="font-semibold text-night-800"
            initial={reduced ? false : { y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: DUR.quick, ease: EASE.standard }}
          >
            Level {displayLevel}
          </motion.span>
          <span className="tnum text-night-700/60">
            {meterXp} / {meterDenom} XP
          </span>
        </div>

        <div className="relative mt-1.5 h-2.5 overflow-hidden rounded-full bg-night-900/10 ring-1 ring-inset ring-night-900/5">
          <motion.div
            className="xp-meter-fill h-full rounded-full"
            initial={{ width: `${reduced ? toPct : fromPct}%` }}
            animate={meter}
          />
        </div>

        {leveledUp && leveledFlash && !reduced && (
          <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2">
            {Array.from({ length: SPARKS }).map((_, i) => {
              const angle = (i / SPARKS) * Math.PI * 2
              return (
                <motion.span
                  key={i}
                  className="absolute h-1.5 w-1.5 rounded-full bg-gold-400"
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: Math.cos(angle) * 46,
                    y: Math.sin(angle) * 26,
                    scale: [0.5, 1, 0.4],
                  }}
                  transition={{ duration: 0.7, ease: EASE.rake }}
                />
              )
            })}
          </div>
        )}
      </div>

      {leveledUp && (
        <motion.div
          className="mt-2 flex justify-center"
          initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
          animate={flourish}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-night-900 px-3 py-1 shadow-pop">
            <SpadeIcon className="h-4 w-4 text-gold-300" />
            <span className="font-display text-xs font-bold tracking-wide text-gold-200">
              Level up!
            </span>
          </span>
        </motion.div>
      )}

      {streakIncreased && (
        <motion.p
          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-sm font-bold text-gold-700"
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.5, duration: DUR.base, ease: EASE.standard }}
        >
          <FlameIcon className="h-4 w-4 text-gold-500" />
          {streak}-day streak
        </motion.p>
      )}
    </motion.div>
  )
}
