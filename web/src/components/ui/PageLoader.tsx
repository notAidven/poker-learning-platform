import { cx } from './cx'
import { usePrefersReducedMotion } from '../lesson/interactions/usePrefersReducedMotion'

/** Keyframe is component-scoped (not in index.css) to keep the shell merge-safe. */
const dealKeyframes = `
@keyframes suitedDeal {
  0%   { opacity: 0; transform: translate(-30px, 12px) rotate(-16deg) scale(0.9); }
  22%  { opacity: 1; }
  46%, 86% { opacity: 1; transform: translate(var(--card-x, 0), 0) rotate(var(--card-rot, 0deg)) scale(1); }
  100% { opacity: 0; transform: translate(var(--card-x, 0), -8px) rotate(var(--card-rot, 0deg)) scale(1); }
}
.suited-deal-card {
  transform-origin: bottom center;
  animation: suitedDeal 1.8s var(--ease-deal) infinite both;
}
`

const cards = [
  { rot: '-12deg', x: '-22px', delay: '0s', suit: '\u2660', tone: 'text-night-800' },
  { rot: '0deg', x: '0px', delay: '0.16s', suit: '\u2665', tone: 'text-brand-600' },
  { rot: '12deg', x: '22px', delay: '0.32s', suit: '\u2666', tone: 'text-brand-600' },
]

export function PageLoader({ label = 'Dealing\u2026' }: { label?: string }) {
  const reduced = usePrefersReducedMotion()
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-5"
      role="status"
      aria-live="polite"
    >
      {!reduced && <style>{dealKeyframes}</style>}
      <span className="relative grid h-16 w-28 place-items-center" aria-hidden>
        {cards.map((c) => (
          <span
            key={c.suit}
            className={cx(
              'absolute grid h-12 w-9 place-items-center rounded-md border border-night-900/12 bg-white shadow-card',
              !reduced && 'suited-deal-card',
            )}
            style={
              reduced
                ? { transform: `translate(${c.x}, 0) rotate(${c.rot})`, transformOrigin: 'bottom center' }
                : { ['--card-rot' as string]: c.rot, ['--card-x' as string]: c.x, animationDelay: c.delay }
            }
          >
            <span className={cx('font-display text-lg leading-none', c.tone)}>{c.suit}</span>
          </span>
        ))}
      </span>
      <p className="text-sm font-medium text-night-700/70">{label}</p>
    </div>
  )
}
