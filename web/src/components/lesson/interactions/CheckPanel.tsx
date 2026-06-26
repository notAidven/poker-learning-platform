import { useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { DUR, EASE } from '../../../lib/motion'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

type CheckPanelProps = {
  canSubmit: boolean
  submitted: boolean
  solved: boolean
  onSubmit: () => void
  onRetry: () => void
  submitLabel?: string
  allowRetry?: boolean
  /**
   * Hide the submit ("Check answer") button entirely. Use for genuinely
   * no-input / observational steps that auto-complete once the required action
   * is done (or that show their own confirmation), so the learner never sees a
   * misleading "Check answer" when there is nothing to answer.
   * Backward-compatible: defaults to false → unchanged behavior.
   */
  hideSubmit?: boolean
  /**
   * Small affirmation rendered once the step is `solved` (e.g. "✓ All cards
   * dealt"). Intended for auto-completing no-input steps where there is no
   * "Correct!" verdict to show. Backward-compatible: undefined → renders nothing.
   */
  confirmation?: ReactNode
}

export function CheckPanel({
  canSubmit,
  submitted,
  solved,
  onSubmit,
  onRetry,
  submitLabel = 'Check answer',
  allowRetry = true,
  hideSubmit = false,
  confirmation,
}: CheckPanelProps) {
  const reduced = usePrefersReducedMotion()
  const submitRef = useRef<HTMLButtonElement>(null)
  const wasSubmitted = useRef(submitted)

  // After a wrong attempt is retried (submitted flips true -> false) the "Try again"
  // button unmounts and the submit button reappears. Move focus onto it so keyboard
  // and screen-reader users land on a sensible control instead of dropping to <body>.
  // Only fires on the retry transition, never on first mount or when there is no
  // submit button (reveal-gate steps), so it never steals focus unexpectedly.
  useEffect(() => {
    if (wasSubmitted.current && !submitted && !hideSubmit) {
      submitRef.current?.focus()
    }
    wasSubmitted.current = submitted
  }, [submitted, hideSubmit])

  return (
    <div className="space-y-3">
      {!hideSubmit && !submitted && (
        <button
          ref={submitRef}
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="min-h-11 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-40"
        >
          {submitLabel}
        </button>
      )}
      {confirmation && solved && (
        <p
          className="text-center text-sm font-semibold text-success-700"
          role="status"
          aria-live="polite"
        >
          {confirmation}
        </p>
      )}
      {!hideSubmit && submitted && !solved && allowRetry && (
        <motion.button
          type="button"
          onClick={onRetry}
          className="min-h-11 w-full rounded-xl border border-night-200 px-4 py-3 text-sm font-semibold text-night-700 hover:bg-night-50"
          initial={reduced ? false : { x: 0 }}
          animate={reduced ? undefined : { x: [0, -5, 5, -4, 4, -2, 2, 0] }}
          transition={reduced ? undefined : { duration: DUR.base * 1.4, ease: EASE.standard }}
        >
          Try again
        </motion.button>
      )}
    </div>
  )
}
