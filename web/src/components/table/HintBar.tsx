import { useMemo } from 'react'
import { getHint, type HintContext } from '../../lib/poker/hints'

type HintBarProps = {
  /** The hero's spot, or null when it is not the hero's turn. */
  context: HintContext | null
  active: boolean
}

/**
 * Feature 2 hint bar. The always-on, rule-based nudge (`getHint`) — pure and
 * synchronous, so it needs no AI and never blocks. Shown on AI tables in place of
 * the coach.
 */
export function HintBar({ context, active }: HintBarProps) {
  const hint = useMemo(() => (context ? getHint(context) : null), [context])

  return (
    <section className="rounded-2xl border border-gold-300 bg-gold-200/30 p-4 shadow-card">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-gold-700">
        <span aria-hidden>♠</span> Strategy hint
      </h3>
      <p className="min-h-[2.5rem] text-sm leading-relaxed text-slate-700" aria-live="polite">
        {hint ?? (active ? 'Sizing up the spot…' : 'A hint appears when it is your turn to act.')}
      </p>
    </section>
  )
}
