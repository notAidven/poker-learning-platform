import { cx } from './cx'

/** The Suited mark — the ace of spades: a felt-green card, brass keyline and
 *  index, ivory spade. Self-contained so it reads on both ivory and felt. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cx('shrink-0', className)}
      role="img"
      aria-label="Suited — ace of spades"
    >
      <defs>
        <linearGradient id="bm-card" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1e5b3d" />
          <stop offset="0.55" stopColor="#114231" />
          <stop offset="1" stopColor="#0a2419" />
        </linearGradient>
        <linearGradient id="bm-spade" x1="16" y1="12" x2="32" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f8f4ea" />
          <stop offset="1" stopColor="#e7dcc4" />
        </linearGradient>
      </defs>
      <rect
        x="4.6"
        y="4.6"
        width="38.8"
        height="38.8"
        rx="11"
        fill="url(#bm-card)"
        stroke="#bb8f3c"
        strokeWidth="1.4"
      />
      <path
        d="M5 16C5 10 10 5 16 5h16c6 0 11 5 11 11v3C43 13.5 38.5 9 33 9H15C9.5 9 5 13.5 5 19v-3z"
        fill="#ffffff"
        fillOpacity="0.16"
      />
      <g transform="translate(12 11)" fill="url(#bm-spade)">
        <path d="M12 2 C12 2 5 8.5 5 13.5 c0 2.5 2 4.5 4.5 4.5 1 0 1.9 -.3 2.6 -.9 -.2 2.2 -1.3 3.9 -3.1 4.9 h6 c-1.8 -1 -2.9 -2.7 -3.1 -4.9 .7 .6 1.6 .9 2.6 .9 2.5 0 4.5 -2 4.5 -4.5 C19 8.5 12 2 12 2 Z" />
      </g>
      <text
        x="9"
        y="16.5"
        fill="#e7cd86"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontSize="9"
      >
        A
      </text>
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
              'block font-display text-[19px] font-semibold leading-none tracking-[-0.01em]',
              tone === 'light' ? 'text-white' : 'text-ink',
            )}
          >
            Suited
          </span>
          <span
            className={cx(
              'mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.16em]',
              tone === 'light' ? 'text-gold-300' : 'text-gold-600',
            )}
          >
            Texas Hold&apos;em
          </span>
        </span>
      )}
    </span>
  )
}
