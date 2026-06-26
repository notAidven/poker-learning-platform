import type { IconProps } from '../icons'

// Outline icons consistent with the shared icon set (24x24, currentColor, 2px).
const OUTLINE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** At-sign — usernames / handles. */
export function AtIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg {...OUTLINE} className={className} aria-hidden {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </svg>
  )
}

/** Envelope — email address. */
export function MailIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg {...OUTLINE} className={className} aria-hidden {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

/** Key — password / credentials. */
export function KeyIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg {...OUTLINE} className={className} aria-hidden {...props}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m10.7 12.3 8.3-8.3" />
      <path d="m16 5 3 3" />
      <path d="m19 8 2-2-3-3" />
    </svg>
  )
}
