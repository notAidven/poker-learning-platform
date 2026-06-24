import type { ReactNode } from 'react'
import { cx } from './cx'

type NightPanelProps = {
  children: ReactNode
  className?: string
  /** Classes applied to the inner content wrapper (e.g. to make it fill height) */
  contentClassName?: string
  /** Tailwind rounding utility, e.g. "rounded-3xl" (default) */
  rounded?: string
  /** Strength of the ambient corner glows */
  glow?: boolean
}

/**
 * The card table — deep felt baize with a subtle weave, a gilt brass edge,
 * warm corner light and a faint spade watermark. Feature content is dealt
 * onto it (the hero, the profile header, the auth aside).
 */
export function NightPanel({
  children,
  className,
  contentClassName,
  rounded = 'rounded-3xl',
  glow = true,
}: NightPanelProps) {
  return (
    <div
      className={cx(
        'relative isolate overflow-hidden bg-night-900 felt text-white ring-1 ring-inset ring-gold-500/15',
        rounded,
        className,
      )}
    >
      <span
        className="pointer-events-none absolute -right-5 -top-9 select-none font-display text-[8.5rem] leading-none text-white/[0.05]"
        aria-hidden
      >
        ♠
      </span>
      {glow && (
        <>
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl"
            aria-hidden
          />
        </>
      )}
      <div className={cx('relative', contentClassName)}>{children}</div>
    </div>
  )
}
