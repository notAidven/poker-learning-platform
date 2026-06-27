import { useMemo, useState } from 'react'
import {
  legalActions,
  toCallFor,
  type AppliedAction,
  type HandState,
} from '../../lib/poker/handEngine'
import { buttonVariants } from '../ui/Button'
import { Chip } from '../lesson/interactions/cards/PlayingCardKit'

type ActionControlsProps = {
  state: HandState
  heroIndex: number
  onAct: (action: AppliedAction) => void
  disabled?: boolean
}

/**
 * The hero's betting controls, built entirely from `legalActions(state)` so they
 * always match the engine: fold / check / call (with the live `toCall`), plus a
 * bet/raise sizer clamped to that action's `[min, max]` "to" amount. Submitting
 * hands the chosen `AppliedAction` back to <PokerTable>, which calls `applyAction`.
 */
export function ActionControls({ state, heroIndex, onAct, disabled = false }: ActionControlsProps) {
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

  const quickSizes: { label: string; total: number }[] = betOrRaise
    ? [
        { label: '½ pot', total: state.currentBet + Math.round(state.pot * 0.5) },
        { label: '¾ pot', total: state.currentBet + Math.round(state.pot * 0.75) },
        { label: 'Pot', total: state.currentBet + state.pot },
        { label: 'Max', total: max },
      ]
        .map((q) => ({ label: q.label, total: Math.max(min, Math.min(max, q.total)) }))
        // Drop duplicates that all clamp to the same chip count (e.g. tiny stacks).
        .filter((q, i, arr) => arr.findIndex((o) => o.total === q.total) === i)
    : []

  return (
    <div className="space-y-3">
      {/* Primary actions — big, thumb-friendly targets sized for the bottom of the table */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {canFold && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAct({ action: 'fold' })}
            className={buttonVariants({
              variant: 'secondary',
              size: 'lg',
              className: 'text-base hover:border-danger-300 hover:text-danger-700',
            })}
          >
            Fold
          </button>
        )}
        {canCheck && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAct({ action: 'check' })}
            className={buttonVariants({ variant: 'primary', size: 'lg', className: 'text-base' })}
          >
            Check
          </button>
        )}
        {canCall && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAct({ action: 'call' })}
            className={buttonVariants({ variant: 'primary', size: 'lg', className: 'text-base' })}
          >
            Call <span className="tabular-nums">{toCall.toLocaleString()}</span>
          </button>
        )}
      </div>

      {betOrRaise && (
        <div className="space-y-2.5 rounded-xl border border-night-900/10 bg-night-900/[0.035] p-3">
          <div className="flex items-center justify-between text-sm font-bold text-ink">
            <span className="capitalize text-night-700">{betOrRaise.action} to</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-base shadow-sm ring-1 ring-inset ring-night-900/10">
              <Chip size={16} tone="gold" />
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
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full accent-brand-600"
            aria-label={`${betOrRaise.action} amount`}
          />
          {quickSizes.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5">
              {quickSizes.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  disabled={disabled}
                  onClick={() => setAmount(q.total)}
                  className={`rounded-lg px-2 py-1.5 text-xs font-bold transition ${
                    clamped === q.total
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white text-night-700 ring-1 ring-inset ring-night-900/10 hover:bg-night-900/5'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAct({ action: betOrRaise.action, amount: clamped })}
            className={buttonVariants({ variant: 'gold', size: 'lg', className: 'w-full text-base' })}
          >
            <span className="capitalize">{betOrRaise.action}</span> to{' '}
            <span className="tabular-nums">{clamped.toLocaleString()}</span>
          </button>
        </div>
      )}
    </div>
  )
}
