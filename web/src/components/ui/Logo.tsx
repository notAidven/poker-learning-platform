import { cx } from './cx'

/** The Brilliant Alpha mark — a die face whose pips double as a sample space. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cx('shrink-0', className)}
      role="img"
      aria-label="Brilliant Alpha"
    >
      <defs>
        <linearGradient id="bm-die" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4f90f8" />
          <stop offset="0.5" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1a317d" />
        </linearGradient>
        <radialGradient id="bm-pip" cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#bm-die)" />
      <path
        d="M4 16C4 9.373 9.373 4 16 4h16c6.627 0 12 5.373 12 12v4C44 13.373 38.627 8 32 8H16C9.373 8 4 13.373 4 20v-4z"
        fill="#ffffff"
        fillOpacity="0.22"
      />
      <g fill="url(#bm-pip)">
        <circle cx="15" cy="15" r="3.6" />
        <circle cx="33" cy="15" r="3.6" />
        <circle cx="24" cy="24" r="3.6" />
        <circle cx="15" cy="33" r="3.6" />
        <circle cx="33" cy="33" r="3.6" />
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
            Brilliant Alpha
          </span>
          <span
            className={cx(
              'block truncate text-[11px] font-medium',
              tone === 'light' ? 'text-white/60' : 'text-slate-500',
            )}
          >
            Probability &amp; Random Variables
          </span>
        </span>
      )}
    </span>
  )
}
