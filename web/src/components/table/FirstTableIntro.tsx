import { useCallback, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { markFirstTableIntroSeen } from './tableIntro'

type Position = { code: string; name: string; blurb: string }

const POSITIONS: Position[] = [
  { code: 'BTN', name: 'Button (dealer)', blurb: 'Acts last after the flop. The best seat at the table.' },
  { code: 'SB', name: 'Small blind', blurb: 'Posts the small forced bet, just left of the button.' },
  { code: 'BB', name: 'Big blind', blurb: 'Posts the big forced bet and acts last before the flop.' },
]

type FirstTableIntroProps = {
  /** Whether this room has a coach (Room 1) or the rule-based hint bar (Room 2). */
  support: 'coach' | 'hints'
  onClose: () => void
}

/**
 * A one-time, dismissible "how this table works" overlay shown the first time a
 * learner sits at any casino table. It explains the position markers (BTN / SB /
 * BB), where the hero's hole cards sit, and what the coach or hint bar does. The
 * "seen" flag is persisted in localStorage so it appears exactly once.
 *
 * Accessibility: a focus-managed modal dialog (labelled + described, Escape to
 * close, focus moves to the dismiss button on open and the backdrop is inert to
 * the rest of the page via aria-modal).
 */
export function FirstTableIntro({ support, onClose }: FirstTableIntroProps) {
  const titleId = useId()
  const descId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  // Persist "seen" exactly when the learner dismisses it, however they close it.
  const handleClose = useCallback(() => {
    markFirstTableIntroSeen()
    onClose()
  }, [onClose])

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [handleClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-night-950/70 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="my-auto w-full max-w-md rounded-2xl border border-night-900/10 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-xl font-bold text-ink">
          How this table works
        </h2>
        <p id={descId} className="mt-1 text-sm text-night-700/75">
          A quick tour before your first hand. This shows once, so here is everything in one place.
        </p>

        <div className="mt-5 space-y-4">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-night-700/50">
              Seat markers
            </h3>
            <ul className="mt-2 space-y-2">
              {POSITIONS.map((pos) => (
                <li key={pos.code} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-7 w-9 shrink-0 place-items-center rounded-md bg-night-900 text-[0.7rem] font-bold tracking-wide text-gold-300">
                    {pos.code}
                  </span>
                  <span className="text-sm text-night-700/85">
                    <span className="font-semibold text-ink">{pos.name}.</span> {pos.blurb}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl bg-night-900/[0.03] p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-night-700/50">
              Your cards
            </h3>
            <p className="mt-1 text-sm text-night-700/85">
              You sit at the bottom, marked <span className="font-semibold text-ink">You</span>. Your
              two private hole cards are dealt face up there so only you can build a hand from them.
            </p>
          </section>

          <section className="rounded-xl bg-brand-50/60 p-3 ring-1 ring-inset ring-brand-100">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-700/70">
              {support === 'coach' ? 'Your coach' : 'Your hint bar'}
            </h3>
            <p className="mt-1 text-sm text-night-700/85">
              {support === 'coach'
                ? 'On your turn, the coach panel suggests a play and explains why, then reacts to the move you make. It always works, even with AI turned off.'
                : 'On your turn, the hint bar gives an always-on, rule-based read of the spot to guide your decision.'}
            </p>
          </section>
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={handleClose}
          className="mt-6 min-h-11 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
        >
          Got it, deal me in
        </button>
      </div>
    </div>,
    document.body,
  )
}
