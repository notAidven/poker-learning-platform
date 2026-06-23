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
  // Tactile action button — the small bottom edge echoes the lesson dice chips
  primary:
    'bg-brand-600 text-white shadow-[0_2px_0_var(--color-brand-800),0_12px_22px_-10px_rgba(29,78,216,0.65)] hover:-translate-y-0.5 hover:bg-brand-500 active:translate-y-0 active:shadow-[0_1px_0_var(--color-brand-800)] focus-visible:ring-brand-500',
  gold: 'bg-gold-400 text-night-900 shadow-[0_2px_0_var(--color-gold-600),0_12px_22px_-10px_rgba(245,158,11,0.6)] hover:-translate-y-0.5 hover:bg-gold-300 active:translate-y-0 active:shadow-[0_1px_0_var(--color-gold-600)] focus-visible:ring-gold-300',
  secondary:
    'border border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 active:translate-y-0 focus-visible:ring-brand-400',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-brand-400',
  glass:
    'border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:-translate-y-0.5 hover:bg-white/20 active:translate-y-0 focus-visible:ring-white/70',
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
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, className: cx(fullWidth && 'w-full', className) })}
      {...props}
    />
  )
}
