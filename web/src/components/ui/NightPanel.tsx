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
 * The "probability table" surface — deep indigo carrying the signature
 * sample-space dot field plus two soft corner glows. Content renders on top.
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
        'relative isolate overflow-hidden bg-night-900 text-white',
        rounded,
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 dot-field opacity-70 [mask-image:radial-gradient(120%_120%_at_50%_0%,black,transparent_78%)]"
        aria-hidden
      />
      {glow && (
        <>
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl"
            aria-hidden
          />
        </>
      )}
      <div className={cx('relative', contentClassName)}>{children}</div>
    </div>
  )
}
