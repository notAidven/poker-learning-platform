import type { ReactNode } from 'react'
import { cx } from './cx'

/** Component-scoped (kept out of index.css for merge-safety). Auto-frozen by the
 *  global reduced-motion kill-switch since it targets every element's animation. */
const glowKeyframes = `
@keyframes suitedGlowBreathe {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.09); }
}
.suited-glow { animation: suitedGlowBreathe 9s ease-in-out infinite; }
`

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
          <style>{glowKeyframes}</style>
          <div
            className="suited-glow pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl"
            aria-hidden
          />
          <div
            className="suited-glow pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl"
            style={{ animationDelay: '-4.5s' }}
            aria-hidden
          />
        </>
      )}
      <div className={cx('relative', contentClassName)}>{children}</div>
    </div>
  )
}
