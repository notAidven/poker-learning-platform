import type { ReactNode } from 'react'
import { cx } from './cx'

export type TokenAccent = 'gold' | 'sky' | 'emerald' | 'brand'

const accentChip: Record<TokenAccent, string> = {
  gold: 'bg-gold-400/20 text-gold-300 ring-1 ring-inset ring-gold-300/30',
  sky: 'bg-sky-400/20 text-sky-200 ring-1 ring-inset ring-sky-300/30',
  emerald: 'bg-emerald-400/20 text-emerald-200 ring-1 ring-inset ring-emerald-300/30',
  brand: 'bg-brand-400/25 text-brand-100 ring-1 ring-inset ring-brand-300/30',
}

type StatTokenProps = {
  icon: ReactNode
  value: ReactNode
  label: string
  accent?: TokenAccent
  orientation?: 'row' | 'col'
  /** Entrance stagger in ms */
  delayMs?: number
  className?: string
}

/** A collectible "chip" on the probability table — used for streak / level / XP. */
export function StatToken({
  icon,
  value,
  label,
  accent = 'gold',
  orientation = 'row',
  delayMs = 0,
  className,
}: StatTokenProps) {
  const col = orientation === 'col'
  return (
    <div
      className={cx(
        'anim-pop rounded-2xl border border-white/12 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm',
        col
          ? 'flex flex-col items-center gap-1.5 px-2 py-4 text-center'
          : 'flex items-center gap-3 px-4 py-3',
        className,
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span
        className={cx(
          'grid shrink-0 place-items-center rounded-xl',
          col ? 'h-11 w-11 text-2xl' : 'h-10 w-10 text-xl',
          accentChip[accent],
        )}
        aria-hidden
      >
        {icon}
      </span>
      <div className={cx('min-w-0', col && 'flex flex-col items-center')}>
        <p className="font-display text-2xl font-bold leading-none tnum text-white">{value}</p>
        <p
          className={cx(
            'font-medium uppercase tracking-wide text-white/55',
            col ? 'mt-1 text-[10px]' : 'text-[11px]',
          )}
        >
          {label}
        </p>
      </div>
    </div>
  )
}
