import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '../ui/cx'
import { CheckIcon, WarningIcon } from '../icons'

/**
 * Input styling for the dark "night" panels (the Account settings live on the
 * felt table, not the light auth pages). Mirrors the field treatment already
 * used by SetPasswordCard so the whole profile reads as one surface.
 */
export const darkFieldClass =
  'mt-1.5 w-full rounded-xl border border-white/12 bg-night-950/50 px-4 py-3 text-sm text-white shadow-[inset_0_1px_2px_rgba(7,21,15,0.35)] outline-none transition placeholder:text-white/30 focus:border-gold-400/60 focus:bg-night-950/70 focus:ring-4 focus:ring-gold-500/15 disabled:opacity-50'

type DarkFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: ReactNode
}

/** Labeled text input for dark panels. Forwards a ref so rows can focus it on open. */
export const DarkField = forwardRef<HTMLInputElement, DarkFieldProps>(
  function DarkField({ label, hint, id, className, ...props }, ref) {
    const generatedId = useId()
    const fieldId = id ?? generatedId
    const hintId = hint ? `${fieldId}-hint` : undefined
    return (
      <div>
        <label htmlFor={fieldId} className="block text-sm font-medium text-white/85">
          {label}
        </label>
        <input
          id={fieldId}
          ref={ref}
          aria-describedby={hintId}
          className={cx(darkFieldClass, className)}
          {...props}
        />
        {hint && (
          <span id={hintId} className="mt-1.5 block text-xs text-white/50">
            {hint}
          </span>
        )}
      </div>
    )
  },
)

/** Inline error for dark panels. Announced to assistive tech via role="alert". */
export function DarkAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-brand-400/40 bg-brand-500/15 px-4 py-3 text-sm text-brand-100"
    >
      <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

/** Inline success/info for dark panels. role="status" so it's politely announced. */
export function DarkNotice({
  children,
  tone = 'success',
}: {
  children: ReactNode
  tone?: 'success' | 'info'
}) {
  const styles =
    tone === 'success'
      ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100'
      : 'border-gold-400/30 bg-gold-500/12 text-gold-100'
  return (
    <p
      role="status"
      className={cx('flex items-start gap-2 rounded-xl border px-4 py-3 text-sm', styles)}
    >
      {tone === 'success' && <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{children}</span>
    </p>
  )
}
