import type { SVGProps } from 'react'

/**
 * Shared icon set for Brilliant Alpha.
 *
 * Design language:
 *  - 24×24 viewBox (LockIcon keeps a 20×20 grid for its legacy path).
 *  - `currentColor` everywhere so callers control color via text color.
 *  - Outline icons use a consistent strokeWidth of 2 with round caps/joins.
 *  - A small set of "glow" icons (flame, star, sparkle) are solid fills,
 *    which read better at small sizes and in colored chips.
 *  - Decorative by default (`aria-hidden`); pass `aria-hidden={false}` +
 *    `aria-label` / `role="img"` when an icon needs to be announced.
 *  - Size via `className` (defaults to `h-5 w-5`).
 */

export type IconProps = SVGProps<SVGSVGElement>

export {
  SpadeSuitIcon,
  HeartSuitIcon,
  DiamondSuitIcon,
  ClubSuitIcon,
  PokerChipIcon,
  CardPairIcon,
  DealerButtonIcon,
  AceCardIcon,
} from './animals'

const OUTLINE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Bold confirmation check. */
export function CheckIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg {...OUTLINE} className={className} aria-hidden {...props}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

/** Solid five-point star — XP / achievement / top score. */
export function StarIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      {...props}
    >
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 22 12 18.56 5.8 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
    </svg>
  )
}

/** Solid lock — locked / gated state. Keeps the original 20×20 path. */
export function LockIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Solid flame — streaks. Pairs well with amber/gold. */
export function FlameIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.547 3.75 3.75 0 0 1 3.255 3.719Z"
      />
    </svg>
  )
}

/** Solid four-point sparkle — used for "just practice" accents and highlights. */
export function SparkleIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      {...props}
    >
      <path d="M11.519 2.226a.5.5 0 0 1 .962 0l1.582 6.135A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0L9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5z" />
    </svg>
  )
}

/** Clockwise circular arrow — retry / try again. */
export function RetryIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg {...OUTLINE} className={className} aria-hidden {...props}>
      <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}

/** Outline trophy — wins / completion. */
export function TrophyIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg {...OUTLINE} className={className} aria-hidden {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

/** Triangle alert — form / validation errors. */
export function WarningIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg {...OUTLINE} className={className} aria-hidden {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

/** Trending-up line — level / progress. */
export function TrendingUpIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg {...OUTLINE} className={className} aria-hidden {...props}>
      <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
      <path d="M16 7h6v6" />
    </svg>
  )
}

/** Bar chart — feedback / stats. */
export function BarChartIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg {...OUTLINE} className={className} aria-hidden {...props}>
      <path d="M3 21h18" />
      <rect x="5" y="10" width="3.6" height="8" rx="1" />
      <rect x="10.2" y="6" width="3.6" height="12" rx="1" />
      <rect x="15.4" y="13" width="3.6" height="5" rx="1" />
    </svg>
  )
}

/** Die showing five pips — dice labs. */
export function DiceIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg {...OUTLINE} className={className} aria-hidden {...props}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <g fill="currentColor" stroke="none">
        <circle cx="8" cy="8" r="1.35" />
        <circle cx="16" cy="8" r="1.35" />
        <circle cx="12" cy="12" r="1.35" />
        <circle cx="8" cy="16" r="1.35" />
        <circle cx="16" cy="16" r="1.35" />
      </g>
    </svg>
  )
}

/** Coin / medallion — coin-flip labs. */
export function CoinIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg {...OUTLINE} className={className} aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
    </svg>
  )
}

/** Solid spade — poker suits / card play. */
export function SpadeIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...props}>
      <path d="M12 2 C12 2 5 8.5 5 13.5 c0 2.5 2 4.5 4.5 4.5 1 0 1.9 -.3 2.6 -.9 -.2 2.2 -1.3 3.9 -3.1 4.9 h6 c-1.8 -1 -2.9 -2.7 -3.1 -4.9 .7 .6 1.6 .9 2.6 .9 2.5 0 4.5 -2 4.5 -4.5 C19 8.5 12 2 12 2 Z" />
    </svg>
  )
}

/** Poker chip — wagering / betting. */
export function ChipIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg {...OUTLINE} className={className} aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </svg>
  )
}
