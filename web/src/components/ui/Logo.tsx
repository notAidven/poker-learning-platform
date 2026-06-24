import { cx } from './cx'

/** The Suited mark — a playing card with a spade pip. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cx('shrink-0', className)}
      role="img"
      aria-label="Suited"
    >
      <defs>
        <linearGradient id="bm-card" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4f90f8" />
          <stop offset="0.5" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1a317d" />
        </linearGradient>
        <linearGradient id="bm-spade" x1="16" y1="12" x2="32" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6eefc" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#bm-card)" />
      <path
        d="M4 16C4 9.373 9.373 4 16 4h16c6.627 0 12 5.373 12 12v4C44 13.373 38.627 8 32 8H16C9.373 8 4 13.373 4 20v-4z"
        fill="#ffffff"
        fillOpacity="0.22"
      />
      <g transform="translate(12 11)" fill="url(#bm-spade)">
        <path d="M12 2 C12 2 5 8.5 5 13.5 c0 2.5 2 4.5 4.5 4.5 1 0 1.9 -.3 2.6 -.9 -.2 2.2 -1.3 3.9 -3.1 4.9 h6 c-1.8 -1 -2.9 -2.7 -3.1 -4.9 .7 .6 1.6 .9 2.6 .9 2.5 0 4.5 -2 4.5 -4.5 C19 8.5 12 2 12 2 Z" />
      </g>
    </svg>
  )
}

type LogoProps = {
  withWordmark?: boolean
  className?: string
  markClassName?: string
  tone?: 'dark' | 'light'
}

export function Logo({
  withWordmark = true,
  className,
  markClassName,
  tone = 'dark',
}: LogoProps) {
  return (
    <span className={cx('flex min-w-0 items-center gap-2.5', className)}>
      <BrandMark className={cx('h-9 w-9', markClassName)} />
      {withWordmark && (
        <span className="min-w-0 leading-tight">
          <span
            className={cx(
              'block font-display text-[15px] font-bold tracking-tight',
              tone === 'light' ? 'text-white' : 'text-ink',
            )}
          >
            Suited
          </span>
          <span
            className={cx(
              'block truncate text-[11px] font-medium',
              tone === 'light' ? 'text-white/60' : 'text-slate-500',
            )}
          >
            Texas Hold&apos;em Poker
          </span>
        </span>
      )}
    </span>
  )
}
