import type { ReactNode } from 'react'
import { Logo } from './Logo'
import { NightPanel } from './NightPanel'
import { BarChartIcon, ChipIcon, FlameIcon, SpadeIcon } from '../icons'

const valueProps = [
  { icon: <SpadeIcon className="h-5 w-5" />, text: 'Hands-on card & betting practice' },
  { icon: <BarChartIcon className="h-5 w-5" />, text: 'Instant feedback, never a lecture' },
  { icon: <FlameIcon className="h-5 w-5" />, text: 'Streaks, XP and levels to keep you going' },
]

function AuthAside() {
  return (
    <NightPanel className="hidden p-8 lg:flex lg:flex-col" rounded="rounded-3xl">
      <span
        className="pointer-events-none absolute right-6 top-24 select-none text-white opacity-20 anim-float"
        style={{ ['--float-rot' as string]: '12deg' }}
        aria-hidden
      >
        <SpadeIcon className="h-16 w-16" />
      </span>
      <span
        className="pointer-events-none absolute -bottom-2 right-16 select-none text-white opacity-20 anim-float"
        style={{ animationDelay: '1.4s', ['--float-rot' as string]: '-8deg' }}
        aria-hidden
      >
        <ChipIcon className="h-14 w-14" strokeWidth={1.5} />
      </span>

      <Logo tone="light" />

      <div className="mt-auto pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
          Interactive course
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight">
          Learn Texas Hold&apos;em by playing.
        </h2>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/65">
          From the deck and hand rankings to a full hand vs AI — six lessons you play
          through, not read.
        </p>

        <ul className="mt-7 space-y-3">
          {valueProps.map((item) => (
            <li key={item.text} className="flex items-center gap-3 text-sm text-white/85">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-base ring-1 ring-inset ring-white/15"
                aria-hidden
              >
                {item.icon}
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </NightPanel>
  )
}

type AuthLayoutProps = {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** Width of the form card column on large screens */
  maxWidthClass?: string
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="mx-auto grid w-full max-w-5xl items-stretch gap-6 py-2 lg:grid-cols-[1.02fr_0.98fr]">
      <AuthAside />

      <div className="anim-fade-up">
        <div className="mb-6 flex justify-center lg:hidden">
          <Logo />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
