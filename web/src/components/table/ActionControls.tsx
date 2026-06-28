import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import {
  legalActions,
  toCallFor,
  type AppliedAction,
  type HandState,
} from '../../lib/poker/handEngine'
import { Chip } from '../lesson/interactions/cards/PlayingCardKit'

type ActionControlsProps = {
  state: HandState
  heroIndex: number
  onAct: (action: AppliedAction) => void
  disabled?: boolean
  /** Play the depleting turn-timer (false under reduced motion). */
  animate?: boolean
  /**
   * Show the cosmetic per-decision turn timer. Off in the coached room (Room 1), where
   * there is deliberately no time pressure; on by default for the Casino / Room 2.
   */
  showTimer?: boolean
}

/** Cosmetic per-decision turn clock (seconds). Never auto-acts — it only paces the UI. */
const TURN_SECONDS = 20

/**
 * The hero's betting controls — a professional online-poker action bar.
 *
 * Visually this is the table "apron": a dark, high-contrast strip that docks under
 * the felt with a depleting turn timer, the live to-call / pot readout, a bet-sizing
 * slider with preset chips (½ / ¾ / pot / all-in), and three unmistakable action
 * buttons — Fold (red), Check/Call (green), Bet/Raise (gold) — laid out thumb-first
 * on mobile and clustered bottom-right on desktop.
 *
 * Behaviourally it is UNCHANGED: every option is still built straight from
 * `legalActions(state)` so it always matches the engine, and submitting hands the
 * chosen `AppliedAction` back to <PokerTable> (→ `heroAct`, which grades it for the
 * Room 1 drill before applying). The single hero-action funnel is preserved.
 */
export function ActionControls({
  state,
  heroIndex,
  onAct,
  disabled = false,
  animate = true,
  showTimer = true,
}: ActionControlsProps) {
  const legal = useMemo(() => legalActions(state), [state])
  const toCall = toCallFor(state, heroIndex)

  const betOrRaise = legal.find((a) => a.action === 'bet' || a.action === 'raise')
  const min = betOrRaise?.min ?? 0
  const max = betOrRaise?.max ?? 0

  // Slider value, scoped to the current spot: when the street / facing bet changes
  // the key changes and the value automatically falls back to the new minimum
  // (no setState-in-effect needed).
  const spotKey = `${state.phase}:${state.pot}:${state.currentBet}:${heroIndex}`
  const [pending, setPending] = useState<{ key: string; value: number } | null>(null)
  const amount = pending && pending.key === spotKey ? pending.value : min

  if (legal.length === 0) return null

  const canFold = legal.some((a) => a.action === 'fold')
  const canCheck = legal.some((a) => a.action === 'check')
  const canCall = legal.some((a) => a.action === 'call')
  const clamped = Math.max(min, Math.min(max, Math.round(amount)))
  const setAmount = (value: number) => setPending({ key: spotKey, value })
  const isAllIn = clamped >= max && max > 0

  const quickSizes: { label: string; total: number }[] = betOrRaise
    ? [
        { label: '½ pot', total: state.currentBet + Math.round(state.pot * 0.5) },
        { label: '¾ pot', total: state.currentBet + Math.round(state.pot * 0.75) },
        { label: 'Pot', total: state.currentBet + state.pot },
        { label: 'All in', total: max },
      ]
        .map((q) => ({ label: q.label, total: Math.max(min, Math.min(max, q.total)) }))
        // Drop duplicates that all clamp to the same chip count (e.g. tiny stacks).
        .filter((q, i, arr) => arr.findIndex((o) => o.total === q.total) === i)
    : []

  return (
    <div className="suited-apron relative overflow-hidden rounded-2xl p-3 sm:p-3.5">
      {/* Turn timer — a slim brass bar across the top that depletes each decision.
          Hidden in the coached room (Room 1) so there is no time pressure. */}
      {showTimer && <TurnTimerBar key={spotKey} animate={animate && !disabled} />}

      {/* Top row: a clear, glanceable spot readout (helps the player track the pot). */}
      <div className="mb-2.5 flex items-center justify-between gap-3 text-[0.7rem] font-semibold">
        <span className="inline-flex items-center gap-1.5 text-white/70">
          <span className="suited-apron-dot" aria-hidden />
          <span className="uppercase tracking-[0.16em] text-gold-200/90">Your turn</span>
        </span>
        <div className="flex items-center gap-3 tabular-nums">
          <span className="text-white/60">
            Pot <span className="font-bold text-white">{state.pot.toLocaleString()}</span>
          </span>
          {toCall > 0 && (
            <span className="text-white/60">
              To call <span className="font-bold text-gold-200">{toCall.toLocaleString()}</span>
            </span>
          )}
        </div>
      </div>

      {/* Layout: sizing cluster + the action buttons. On desktop they sit on one row
          with the buttons pushed to the RIGHT; on mobile they stack into the thumb
          zone with full-width, 48px-tall buttons. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {betOrRaise ? (
          <SizingPanel
            action={betOrRaise.action}
            min={min}
            max={max}
            clamped={clamped}
            disabled={disabled}
            quickSizes={quickSizes}
            onChange={setAmount}
          />
        ) : (
          <div className="hidden sm:block" />
        )}

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-none sm:items-end sm:justify-end">
          {canFold && (
            <ActionButton
              tone="fold"
              disabled={disabled}
              onClick={() => onAct({ action: 'fold' })}
            >
              Fold
            </ActionButton>
          )}
          {canCheck && (
            <ActionButton
              tone="call"
              disabled={disabled}
              onClick={() => onAct({ action: 'check' })}
            >
              Check
            </ActionButton>
          )}
          {canCall && (
            <ActionButton
              tone="call"
              disabled={disabled}
              onClick={() => onAct({ action: 'call' })}
            >
              Call <span className="tabular-nums">{toCall.toLocaleString()}</span>
            </ActionButton>
          )}
          {betOrRaise && (
            <ActionButton
              tone="raise"
              disabled={disabled}
              className="col-span-2 sm:col-span-1"
              onClick={() => onAct({ action: betOrRaise.action, amount: clamped })}
            >
              <span className="capitalize">{isAllIn ? 'All in' : betOrRaise.action}</span>
              {!isAllIn && (
                <span className="tabular-nums"> {clamped.toLocaleString()}</span>
              )}
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  )
}

/** The bet/raise sizer: a value readout, a slider, and the preset chips. */
function SizingPanel({
  action,
  min,
  max,
  clamped,
  disabled,
  quickSizes,
  onChange,
}: {
  action: string
  min: number
  max: number
  clamped: number
  disabled: boolean
  quickSizes: { label: string; total: number }[]
  onChange: (value: number) => void
}) {
  return (
    <div className="w-full rounded-xl bg-night-950/45 p-2.5 ring-1 ring-inset ring-white/10 sm:max-w-[19rem]">
      <div className="mb-2 flex items-center justify-between text-[0.7rem] font-bold uppercase tracking-wide text-white/55">
        <span className="capitalize">{action} to</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-night-900 px-2.5 py-1 text-sm font-bold text-gold-200 ring-1 ring-inset ring-gold-300/25">
          <Chip size={14} tone="gold" />
          <span className="tabular-nums">{clamped.toLocaleString()}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={clamped}
        disabled={disabled || max <= min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="suited-bet-slider w-full"
        aria-label={`${action} amount`}
      />
      {quickSizes.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {quickSizes.map((q) => {
            const active = clamped === q.total
            return (
              <button
                key={q.label}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => onChange(q.total)}
                className={`min-h-[2.5rem] rounded-lg px-1 py-1.5 text-[0.7rem] font-bold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-1 focus-visible:ring-offset-night-950 disabled:opacity-50 ${
                  active
                    ? 'bg-gold-400 text-night-900 shadow-sm'
                    : 'bg-night-800 text-gold-100/90 ring-1 ring-inset ring-white/10 hover:bg-night-700'
                }`}
              >
                {q.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const ACTION_TONES = {
  // Three unmistakable, high-contrast tones — the online-poker convention.
  fold: 'bg-night-800 text-rose-50 ring-1 ring-inset ring-rose-400/45 hover:bg-night-700 hover:ring-rose-300/80 focus-visible:ring-rose-300',
  call: 'bg-success-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_0_var(--color-success-700)] hover:-translate-y-0.5 hover:bg-success-400 active:translate-y-0 focus-visible:ring-success-200',
  raise:
    'bg-gold-400 text-night-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_0_var(--color-gold-600)] hover:-translate-y-0.5 hover:bg-gold-300 active:translate-y-0 focus-visible:ring-gold-200',
} as const

/** A large (48px), high-contrast action button shared by Fold / Check-Call / Bet-Raise. */
function ActionButton({
  tone,
  children,
  onClick,
  disabled,
  className = '',
}: {
  tone: keyof typeof ACTION_TONES
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-12 select-none items-center justify-center gap-1.5 rounded-xl px-5 text-[15px] font-bold transition-[transform,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950 disabled:pointer-events-none disabled:opacity-50 sm:min-w-[6.5rem] ${ACTION_TONES[tone]} ${className}`}
    >
      {children}
    </button>
  )
}

/** A slim brass bar that wipes left→right over the decision. Purely cosmetic. */
function TurnTimerBar({ animate }: { animate: boolean }) {
  return (
    <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-white/5" aria-hidden>
      <motion.div
        className="h-full origin-left bg-gradient-to-r from-gold-300 to-gold-500"
        initial={animate ? { scaleX: 1 } : false}
        animate={{ scaleX: animate ? 0 : 1 }}
        transition={animate ? { duration: TURN_SECONDS, ease: 'linear' } : { duration: 0 }}
      />
    </div>
  )
}
