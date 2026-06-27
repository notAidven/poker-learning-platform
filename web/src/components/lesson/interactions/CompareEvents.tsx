import { useState } from 'react'
import type {
  CardId,
  CompareEventsAnswer,
  CompareEventsChoice,
  CompareEventsConfig,
  CompareEventsSide,
  FractionProbability,
} from '../../../types/lesson'
import { cardLabel } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { reduceFraction } from './fractionAnswer'
import { CardFace } from './cards/PlayingCardKit'

type CompareEventsProps = InteractionProps & {
  config: CompareEventsConfig
  answer: CompareEventsAnswer
}

type SideDisplay = {
  value: number | null
  fractionText: string | null
  percentText: string | null
}

/** Derive a 0–1 value and labels from a side's favorable/total or explicit probability. */
function describeSide(side: CompareEventsSide): SideDisplay {
  let frac: FractionProbability | null = null
  if (side.favorable !== undefined && side.total) {
    frac = reduceFraction(side.favorable, side.total)
  } else if (side.probability) {
    frac = reduceFraction(side.probability.num, side.probability.den)
  }
  if (!frac) return { value: null, fractionText: null, percentText: null }
  const value = frac.num / frac.den
  return {
    value,
    fractionText: `${frac.num}/${frac.den}`,
    percentText: `${(value * 100).toFixed(1)}%`,
  }
}

function BalanceGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 3v18M5 6h14M12 5l-5 9a3 3 0 0 0 6 0L12 5zm0 0l5 9a3 3 0 0 1-6 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Corner status pill for a card (flop) option. Over the busy card art a faint
 * background tint alone reads weakly, so the chosen / correct / wrong state also
 * gets an unmistakable badge: a brand tick while picking, a success tick on the
 * right board, a danger cross on a wrong pick. Decorative — the button's
 * aria-pressed + the surrounding copy carry the state for assistive tech.
 */
function StatusBadge({ tone }: { tone: 'brand' | 'success' | 'danger' }) {
  const bg =
    tone === 'success' ? 'bg-success-500' : tone === 'danger' ? 'bg-danger-500' : 'bg-brand-500'
  return (
    <span
      className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm ${bg}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        {tone === 'danger' ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M5 13l4 4L19 7" />}
      </svg>
    </span>
  )
}

/**
 * A flop rendered as three real card faces (the option's primary content) with the
 * texture name demoted to a quiet caption. `md` matches the community-card size used
 * by the board / betting widgets, so the flop reads identically to boards elsewhere
 * and three cards still fit a full-width option down to a 320px phone.
 */
function FlopOption({ cards, caption }: { cards: CardId[]; caption: string }) {
  return (
    <>
      <span className="flex items-center justify-center gap-1.5 sm:gap-2">
        {cards.map((id) => (
          <CardFace key={id} id={id} size="md" />
        ))}
      </span>
      <span className="block text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
        {caption}
      </span>
    </>
  )
}

export function CompareEvents({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: CompareEventsProps) {
  const allowEqual = config.allowEqual ?? answer.more === 'equal'

  const [choice, setChoice] = useState<CompareEventsChoice | null>(
    initialSolved ? answer.more : null,
  )
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted

  const dispA = describeSide(config.eventA)
  const dispB = describeSide(config.eventB)

  const helperText =
    config.helperText ??
    'Compare the two events below, then tap the one that is more likely.'
  const chooseLabel = config.chooseLabel ?? 'Which event is more likely?'

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    if (choice === answer.more) {
      setSolved(true)
      onCorrect()
    } else {
      onIncorrect?.()
    }
  }

  function handleRetry() {
    // Keep the chosen side and any entered probabilities so a wrong attempt only
    // re-enables editing — the learner corrects just the wrong part and resubmits.
    onAttemptReset?.()
    setSubmitted(false)
    setSolved(false)
  }

  const canSubmit = choice !== null && !locked

  function panelClass(side: 'a' | 'b', hasCards: boolean) {
    const active = choice === side
    const isCorrectSide = answer.more === side || answer.more === 'equal'
    // Card options center their flop + caption; text options stay left-aligned.
    const layout = hasCards
      ? 'flex flex-col items-center justify-center gap-3 text-center'
      : 'text-left'
    const base = `relative flex-1 rounded-2xl border-2 p-4 transition disabled:cursor-not-allowed ${layout}`
    if (submitted) {
      if (isCorrectSide) return `${base} border-success-500 bg-success-50`
      if (active) return `${base} border-danger-400 bg-danger-50`
      return `${base} border-slate-200 bg-white opacity-70`
    }
    if (active) return `${base} border-brand-500 bg-brand-50 shadow-sm`
    return `${base} border-slate-200 bg-white hover:border-brand-300${hasCards ? ' hover:shadow-pop' : ''}`
  }

  function renderPanel(side: 'a' | 'b', event: CompareEventsSide) {
    const active = choice === side
    const isCorrectSide = answer.more === side || answer.more === 'equal'
    const hasCards = Array.isArray(event.cards) && event.cards.length > 0

    // The selection / result badge only shows on card options, where the tint alone
    // reads weakly over the card art. Text options keep their original look.
    let badgeTone: 'brand' | 'success' | 'danger' | null = null
    if (hasCards) {
      if (submitted) badgeTone = isCorrectSide ? 'success' : active ? 'danger' : null
      else if (active) badgeTone = 'brand'
    }

    // In card mode the cards carry the read, so name the option by its cards (not the
    // answer-hinting `detail`). Keeping `label` in the name preserves existing
    // by-name lookups (e.g. gate tests) and screen-reader parity.
    const ariaLabel = hasCards
      ? `${event.label}: ${event.cards!.map(cardLabel).join(', ')}`
      : `${event.label}${event.detail ? `. ${event.detail}` : ''}`

    return (
      <button
        type="button"
        disabled={locked}
        onClick={() => setChoice(side)}
        aria-pressed={active}
        aria-label={ariaLabel}
        className={panelClass(side, hasCards)}
      >
        {badgeTone && <StatusBadge tone={badgeTone} />}
        {hasCards ? (
          <FlopOption cards={event.cards!} caption={event.label} />
        ) : (
          <>
            <span className="block text-base font-bold text-slate-900">{event.label}</span>
            {event.detail && (
              <span className="mt-1 block text-xs text-slate-500">{event.detail}</span>
            )}
            {event.favorable !== undefined && event.total && (
              <span className="mt-2 inline-block rounded-lg bg-slate-100 px-2 py-0.5 text-sm font-bold tabular-nums text-slate-700">
                {event.favorable} / {event.total}
              </span>
            )}
          </>
        )}
      </button>
    )
  }

  function renderRevealBar(disp: SideDisplay, label: string, highlight: boolean) {
    if (disp.value === null) return null
    return (
      <div>
        <div className="mb-1 flex items-baseline justify-between text-sm">
          <span className="font-semibold text-slate-700">{label}</span>
          <span
            className={`font-bold tabular-nums ${highlight ? 'text-success-700' : 'text-slate-500'}`}
          >
            {disp.fractionText} ≈ {disp.percentText}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`cmp-bar h-full rounded-full ${
              highlight
                ? 'bg-gradient-to-r from-success-400 to-success-600'
                : 'bg-gradient-to-r from-slate-300 to-slate-400'
            }`}
            style={{ width: `${disp.value * 100}%` }}
          />
        </div>
      </div>
    )
  }

  const aMoreLikely = answer.more === 'a'
  const bMoreLikely = answer.more === 'b'
  const equalLikely = answer.more === 'equal'

  // "More likely" only fits probabilistic comparisons — those where a side carries
  // favorable/total or an explicit probability (so a reveal bar can render), or where
  // the learner must enter probabilities. Deterministic comparisons ("which hand
  // wins?", "who acts last?", kicker tiebreaks) have no probabilities, so use neutral
  // wording instead.
  const isProbabilistic = dispA.value !== null || dispB.value !== null
  const correctLabel = aMoreLikely ? config.eventA.label : config.eventB.label
  const revealText = equalLikely
    ? isProbabilistic
      ? 'Both events have the same probability.'
      : 'They are equal.'
    : isProbabilistic
      ? `${correctLabel} is more likely.`
      : `${correctLabel}: correct.`

  return (
    <div className="space-y-5">
      <style>{`.cmp-bar { transition: width 0.45s cubic-bezier(0.34, 1.2, 0.64, 1); }`}</style>

      <p className="text-center text-sm text-slate-600">{helperText}</p>

      <p className="flex items-center justify-center gap-2 text-center text-sm font-semibold text-slate-700">
        <span className="text-brand-500">
          <BalanceGlyph />
        </span>
        {chooseLabel}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {renderPanel('a', config.eventA)}
        <div className="flex items-center justify-center text-xs font-bold uppercase tracking-wide text-slate-400">
          vs
        </div>
        {renderPanel('b', config.eventB)}
      </div>

      {allowEqual && (
        <button
          type="button"
          disabled={locked}
          onClick={() => setChoice('equal')}
          aria-pressed={choice === 'equal'}
          className={`min-h-11 w-full rounded-xl border-2 px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${
            submitted && equalLikely
              ? 'border-success-500 bg-success-50 text-success-800'
              : submitted && choice === 'equal'
                ? 'border-danger-400 bg-danger-50 text-danger-700'
                : choice === 'equal'
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'
          }`}
        >
          They are equally likely
        </button>
      )}

      {submitted && (
        <div
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-slate-700">{revealText}</p>
          {renderRevealBar(dispA, `P(${config.eventA.label})`, aMoreLikely || equalLikely)}
          {renderRevealBar(dispB, `P(${config.eventB.label})`, bMoreLikely || equalLikely)}
        </div>
      )}

      <CheckPanel
        canSubmit={canSubmit}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        allowRetry={allowRetry}
        disabledReason={choice === null ? 'Pick an option' : undefined}
      />
    </div>
  )
}
