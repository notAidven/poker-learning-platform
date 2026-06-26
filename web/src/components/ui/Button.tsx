import type { ButtonHTMLAttributes } from 'react'
import { cx } from './cx'

export type ButtonVariant =
  | 'primary'
  | 'gold'
  | 'secondary'
  | 'ghost'
  | 'glass'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-[transform,background-color,box-shadow,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  // The "your move" action — oxblood with a tactile bottom edge + enamel sheen,
  // so it reads like a chip you can press.
  primary:
    'bg-brand-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_0_var(--color-brand-800),0_12px_22px_-10px_rgba(155,44,68,0.6)] hover:-translate-y-0.5 hover:bg-brand-500 active:translate-y-0 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_0_var(--color-brand-800)] focus-visible:ring-brand-500',
  // Brass chip — the premium / "all in" action.
  gold: 'bg-gold-400 text-night-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_0_var(--color-gold-600),0_12px_22px_-10px_rgba(187,143,60,0.55)] hover:-translate-y-0.5 hover:bg-gold-300 active:translate-y-0 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_1px_0_var(--color-gold-600)] focus-visible:ring-gold-300',
  secondary:
    'border border-night-900/12 bg-white text-night-800 shadow-sm hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 active:translate-y-0 focus-visible:ring-brand-400',
  ghost:
    'text-night-700/80 hover:bg-night-900/5 hover:text-brand-700 focus-visible:ring-brand-400',
  glass:
    'border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:-translate-y-0.5 hover:bg-white/20 active:translate-y-0 focus-visible:ring-gold-300/70',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
}

/** Returns the className for a button-styled element (use on <button> or react-router <Link>). */
export function buttonVariants({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}): string {
  return cx(base, variants[variant], sizes[size], className)
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  /** Show a spinner and disable the button while an action is in flight. */
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonVariants({ variant, size, className: cx(fullWidth && 'w-full', className) })}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

/** Inline loading spinner; the global reduced-motion kill-switch freezes its spin. */
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
