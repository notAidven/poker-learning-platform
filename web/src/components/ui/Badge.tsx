import type { ReactNode } from 'react'
import { cx } from './cx'

export type BadgeTone =
  | 'brand'
  | 'success'
  | 'gold'
  | 'neutral'
  // Deprecated aliases — kept so cross-branch callers don't break at merge;
  // they now render the on-brand token equivalents below.
  | 'emerald'
  | 'slate'
  | 'sky'

const SUCCESS = 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-200'
const BRAND = 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100'
const NEUTRAL = 'bg-night-900/[0.06] text-night-700 ring-1 ring-inset ring-night-900/10'

const tones: Record<BadgeTone, string> = {
  brand: BRAND,
  success: SUCCESS,
  gold: 'bg-gold-200/70 text-gold-700 ring-1 ring-inset ring-gold-300',
  neutral: NEUTRAL,
  emerald: SUCCESS,
  slate: NEUTRAL,
  sky: BRAND,
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
