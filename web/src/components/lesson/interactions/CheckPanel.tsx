import { useEffect, useId, useRef, type ReactNode } from 'react'

type CheckPanelProps = {
  canSubmit: boolean
  submitted: boolean
  solved: boolean
  onSubmit: () => void
  onRetry: () => void
  submitLabel?: string
  allowRetry?: boolean
  /**
   * One-line reason shown beneath the submit button while it is disabled, e.g.
   * "Select 5 cards" or "Enter the count". Each interaction derives its own
   * reason. Rendered only when the button is visible AND disabled, and announced
   * politely so the learner always knows what is still needed.
   */
  disabledReason?: ReactNode
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
  disabledReason,
}: CheckPanelProps) {
  const submitRef = useRef<HTMLButtonElement>(null)
  const wasSubmitted = useRef(submitted)
  const reasonId = useId()
  const showReason = !canSubmit && Boolean(disabledReason)

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
        <div>
          <button
            ref={submitRef}
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            aria-describedby={showReason ? reasonId : undefined}
            className="min-h-11 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-40"
          >
            {submitLabel}
          </button>
          {showReason && (
            <p
              id={reasonId}
              className="mt-2 text-center text-xs font-medium text-slate-500"
              role="status"
              aria-live="polite"
            >
              {disabledReason}
            </p>
          )}
        </div>
      )}
      {confirmation && solved && (
        <p
          className="text-center text-sm font-semibold text-emerald-700"
          role="status"
          aria-live="polite"
        >
          {confirmation}
        </p>
      )}
      {!hideSubmit && submitted && !solved && allowRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Try again
        </button>
      )}
    </div>
  )
}
