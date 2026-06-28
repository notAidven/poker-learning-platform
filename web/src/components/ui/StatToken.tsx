import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate } from 'motion/react'
import { cx } from './cx'
import { DUR, EASE } from '../../lib/motion'
import { usePrefersReducedMotion } from '../lesson/interactions/usePrefersReducedMotion'

/** Chip denominations for the gamification tokens. */
export type TokenAccent = 'gold' | 'wine' | 'green' | 'slate'

const chipModifier: Record<TokenAccent, string> = {
  gold: '',
  wine: 'poker-chip--wine',
  green: 'poker-chip--green',
  slate: 'poker-chip--slate',
}

const chipInk: Record<TokenAccent, string> = {
  gold: 'text-night-900',
  wine: 'text-white',
  green: 'text-white',
  slate: 'text-white',
}

type StatTokenProps = {
  icon: ReactNode
  value: ReactNode
  label: string
  accent?: TokenAccent
  orientation?: 'row' | 'col'
  /** Entrance stagger in ms */
  delayMs?: number
  /** Count up + pulse when a numeric `value` changes (default true). */
  countUp?: boolean
  className?: string
}

/** A poker chip stacked on the felt — the gamification token for streak / level / XP. */
export function StatToken({
  icon,
  value,
  label,
  accent = 'gold',
  orientation = 'row',
  delayMs = 0,
  countUp = true,
  className,
}: StatTokenProps) {
  const col = orientation === 'col'
  return (
    <div
      className={cx(
        'anim-pop rounded-2xl border border-white/12 bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm',
        col
          ? 'flex flex-col items-center gap-2 px-2 py-4 text-center'
          : 'flex items-center gap-3 px-4 py-3',
        className,
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span
        className={cx(
          'poker-chip grid shrink-0 place-items-center',
          chipModifier[accent],
          chipInk[accent],
          col ? 'h-12 w-12 text-xl' : 'h-11 w-11 text-lg',
        )}
        aria-hidden
      >
        {icon}
      </span>
      <div className={cx('min-w-0', col && 'flex flex-col items-center')}>
        <p className="font-display text-2xl font-bold leading-none tnum text-white">
          {countUp && typeof value === 'number' ? <AnimatedValue value={value} /> : value}
        </p>
        <p
          className={cx(
            'font-semibold uppercase tracking-wide text-white/75',
            col ? 'mt-1 text-[10px]' : 'text-[11px]',
          )}
        >
          {label}
        </p>
      </div>
    </div>
  )
}

/**
 * Counts from the previous value to the new one and gives the number a quick pulse
 * whenever it changes — the gamification phase drives this off `'gamification-updated'`.
 * No count-up on first mount; reduced-motion jumps straight to the final value.
 */
function AnimatedValue({ value }: { value: number }) {
  const reduced = usePrefersReducedMotion()
  // Updated only by the running animation; reduced-motion bypasses it for `value`.
  const [counted, setCounted] = useState(value)
  const prev = useRef(value)
  const scope = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const from = prev.current
    prev.current = value
    if (reduced || from === value) return

    const delta = Math.abs(value - from)
    const duration = Math.min(DUR.celebrate, Math.max(DUR.base, delta * 0.04))
    const count = animate(from, value, {
      duration,
      ease: EASE.rake,
      onUpdate: (v) => setCounted(Math.round(v)),
    })
    const pulse = scope.current
      ? animate(scope.current, { scale: [1, 1.12, 1] }, { duration: DUR.base, ease: EASE.chip })
      : null

    return () => {
      count.stop()
      pulse?.stop()
    }
  }, [value, reduced])

  return (
    <span ref={scope} className="inline-block">
      {reduced ? value : counted}
    </span>
  )
}
