import { useRef } from 'react'
import type { BettingAction } from '../../types/poker'
import type { DrillReason, DrillVerdict } from '../../lib/poker/decisionDrill'
import { Modal } from '../ui/Modal'

/**
 * The per-decision coach verdict shown after EVERY hero action in the coached room
 * (Room 1 / the Decision Drill). It is presentation only: every field is derived
 * from the existing deterministic drill grade (`gradeHeroDecision` → `decisionDrill`),
 * so it never changes the correctness grading, the XP math, or the engine.
 */
export type CoachVerdict = {
  verdict: DrillVerdict
  reason: DrillReason
  /** The coach's reasoning — the affirmation (sound) or the "why it's not best" hint (mistake). */
  message: string
  /** The hero's chosen action, named back to them so the read is about THEIR move. */
  action: BettingAction
  /** Bet/raise "to" total, for the action label. */
  amount?: number
}

/** Name the hero's action back to them ("Raise to 120"), so the read is specific. */
function actionLabel(action: BettingAction, amount?: number): string {
  switch (action) {
    case 'fold':
      return 'Fold'
    case 'check':
      return 'Check'
    case 'call':
      return 'Call'
    case 'bet':
      return amount != null ? `Bet to ${amount.toLocaleString()}` : 'Bet'
    case 'raise':
      return amount != null ? `Raise to ${amount.toLocaleString()}` : 'Raise'
    default:
      return 'Move'
  }
}

/**
 * A coach "tells" card: a brass suit emblem as the coach's avatar, the verdict in
 * the coach's voice, the player's specific move, and the reasoning — then a single
 * clear way forward. The verdict tone (emerald = sound, gold = rethink) mirrors the
 * side-panel feed, so it reads as the same coach speaking, just up close.
 *
 * A sound play is AFFIRMED and the move is then taken on "Continue" (the action is
 * held until the player has read the read); a clear mistake is explained and NOT
 * taken — "Choose again" returns them to the spot. Built on the shared <Modal>, so
 * it is focus-trapped, Esc/backdrop dismissable, and reduced-motion friendly.
 */
export function CoachVerdictModal({
  verdict,
  onContinue,
}: {
  verdict: CoachVerdict | null
  /** Acknowledge the read: takes the held action (sound) or returns to the spot (mistake). */
  onContinue: () => void
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const open = verdict != null
  const sound = verdict?.verdict === 'sound'

  const headline = sound ? 'Sound decision' : "Let's rethink that"
  const pillText = sound ? 'Sound' : 'Rethink'
  const buttonText = sound ? 'Continue' : 'Choose again'

  return (
    <Modal
      open={open}
      onClose={onContinue}
      size="md"
      labelledBy="coach-verdict-title"
      describedBy="coach-verdict-body"
      initialFocusRef={buttonRef}
      className="p-0 overflow-hidden"
    >
      {verdict && (
        <div className="flex flex-col">
          {/* Coach header: the brass suit emblem + label, with the verdict tone pill. */}
          <div
            className={`flex items-center gap-3 px-6 pb-4 pt-6 ${
              sound
                ? 'bg-gradient-to-b from-success-50 to-white'
                : 'bg-gradient-to-b from-gold-50 to-white'
            }`}
          >
            <span
              aria-hidden
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-xl text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_10px_-4px_rgba(0,0,0,0.5)] ${
                sound
                  ? 'bg-gradient-to-br from-brand-500 to-brand-700'
                  : 'bg-gradient-to-br from-gold-400 to-gold-600'
              }`}
            >
              &clubs;
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-night-700/60">
                Your coach
              </p>
              <p
                id="coach-verdict-title"
                className="font-display text-lg font-bold leading-tight text-ink"
              >
                {headline}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide ${
                sound ? 'bg-success-100 text-success-700' : 'bg-gold-100 text-gold-800'
              }`}
            >
              {pillText}
            </span>
          </div>

          {/* The player's specific move + the coach's reasoning. */}
          <div className="px-6 pb-2">
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-night-900/[0.04] px-2.5 py-1 text-[0.7rem] font-semibold text-night-700/80">
              <span className="uppercase tracking-wide text-night-700/50">Your move</span>
              <span aria-hidden className="text-night-700/30">
                ·
              </span>
              <span className="text-ink">{actionLabel(verdict.action, verdict.amount)}</span>
            </p>
            <p
              id="coach-verdict-body"
              className="text-[0.95rem] leading-relaxed text-night-800"
            >
              {verdict.message}
            </p>
            {!sound && (
              <p className="mt-2 text-[0.8rem] font-medium leading-relaxed text-gold-800/90">
                That move was not locked in. Take another look and pick the line you like best.
              </p>
            )}
          </div>

          <div className="px-6 pb-6 pt-4">
            <button
              ref={buttonRef}
              type="button"
              onClick={onContinue}
              className={`w-full rounded-xl px-4 py-3 text-sm font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                sound
                  ? 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-300'
                  : 'bg-gold-400 text-night-900 hover:bg-gold-300 focus-visible:ring-gold-300'
              }`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
