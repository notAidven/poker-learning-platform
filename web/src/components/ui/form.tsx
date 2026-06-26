import { type InputHTMLAttributes, type ReactNode, useId } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cx } from './cx'
import { buttonVariants } from './Button'
import { DUR, EASE } from '../../lib/motion'
import { usePrefersReducedMotion } from '../lesson/interactions/usePrefersReducedMotion'
import { WarningIcon } from '../icons'

/** Default (valid) input styling — a plain literal so it stays a constant export. */
export const fieldInputClass =
  'w-full rounded-control border border-night-900/12 bg-night-900/[0.03] px-4 py-3 text-sm text-ink shadow-[inset_0_1px_2px_rgba(7,21,15,0.06)] outline-none transition placeholder:text-night-700/40 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/15'

/** Invalid state: clay-red border/ring, swapped in atomically so utilities don't clash. */
const fieldInvalidClass =
  'w-full rounded-control border border-danger-400 bg-danger-50/50 px-4 py-3 text-sm text-ink shadow-[inset_0_1px_2px_rgba(7,21,15,0.06)] outline-none transition placeholder:text-night-700/40 focus:border-danger-500 focus:bg-white focus:ring-4 focus:ring-danger-500/20'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  /** Inline validation message; swaps in for the hint with a height/opacity transition. */
  error?: string
}

export function Field({ label, hint, error, id, className, ...props }: FieldProps) {
  const reduced = usePrefersReducedMotion()
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const messageId = error || hint ? `${fieldId}-msg` : undefined
  const message = error ?? hint
  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium text-night-800">
        {label}
      </label>
      <input
        id={fieldId}
        aria-describedby={messageId}
        aria-invalid={error ? true : undefined}
        className={cx('mt-1.5', error ? fieldInvalidClass : fieldInputClass, className)}
        {...props}
      />
      <AnimatePresence initial={false} mode="wait">
        {message && (
          <motion.span
            key={error ? 'error' : 'hint'}
            id={messageId}
            role={error ? 'alert' : undefined}
            className={cx(
              'block overflow-hidden text-xs',
              error ? 'mt-1.5 font-medium text-danger-700' : 'mt-1.5 text-night-700/60',
            )}
            initial={reduced ? false : { opacity: 0, height: 0, y: -2 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0, y: -2 }}
            transition={{ duration: reduced ? 0 : DUR.quick, ease: EASE.standard }}
          >
            {message}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FormError({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion()
  return (
    <motion.p
      role="alert"
      className="flex items-start gap-2 rounded-control border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700"
      initial={reduced ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : DUR.base, ease: EASE.deal }}
    >
      <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger-500" />
      <span>{children}</span>
    </motion.p>
  )
}

export function OrDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-3" aria-hidden>
      <div className="h-px flex-1 bg-night-900/10" />
      <span className="text-xs font-medium uppercase tracking-wide text-night-700/45">{label}</span>
      <div className="h-px flex-1 bg-night-900/10" />
    </div>
  )
}

export function GoogleButton({
  onClick,
  disabled,
  label = 'Continue with Google',
}: {
  onClick: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={buttonVariants({
        variant: 'secondary',
        size: 'lg',
        className: 'w-full gap-2.5',
      })}
    >
      <GoogleIcon />
      {label}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
