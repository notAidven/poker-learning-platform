import type { ReactNode } from 'react'
import { cx } from './cx'

export type BadgeTone = 'brand' | 'emerald' | 'gold' | 'slate' | 'sky'

const tones: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100',
  gold: 'bg-gold-200/70 text-gold-600 ring-1 ring-inset ring-gold-300',
  slate: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
  sky: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100',
}

export function Badge({
  tone = 'slate',
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
