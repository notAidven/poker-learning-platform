import type { ReactNode } from 'react'
import { cx } from './cx'

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
        <p className="font-display text-2xl font-bold leading-none tnum text-white">{value}</p>
        <p
          className={cx(
            'font-semibold uppercase tracking-wide text-white/55',
            col ? 'mt-1 text-[10px]' : 'text-[11px]',
          )}
        >
          {label}
        </p>
      </div>
    </div>
  )
}
