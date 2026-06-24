import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  CARD_SUITS,
  cardLabel,
  cardsBySuit,
  DECK_SIZE,
  fullDeck,
  isRedSuit,
  parseCardId,
  type CardDeckAnswer,
  type CardDeckConfig,
  type CardId,
  type CardSuit,
} from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { FractionAnswerInput } from './FractionAnswerInput'
import { NumericAnswerInput } from './NumericAnswerInput'
import { fractionMatches, hasValidFractionInput } from './fractionAnswer'
import { countMatches, hasValidCountInput } from './numericAnswer'

type CardDeckProps = InteractionProps & {
  config: CardDeckConfig
  answer: CardDeckAnswer
}

/** Crisp vector suit symbols (no emoji) — color comes from the parent via `currentColor`. */
function SuitIcon({ suit, className }: { suit: CardSuit; className?: string }) {
  const common = {
    viewBox: '0 0 24 24',
    className,
    fill: 'currentColor',
    'aria-hidden': true as const,
    focusable: 'false' as const,
  }
  switch (suit) {
    case 'H':
      return (
        <svg {...common}>
          <path d="M12 21.35 10.55 20.03 C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3 c1.74 0 3.41 .81 4.5 2.09 C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5 c0 3.78-3.4 6.86-8.55 11.53 L12 21.35 Z" />
        </svg>
      )
    case 'D':
      return (
        <svg {...common}>
          <polygon points="12,1.5 21,12 12,22.5 3,12" />
        </svg>
      )
    case 'S':
      return (
        <svg {...common}>
          <path d="M12 2 C12 2 5 8.5 5 13.5 c0 2.5 2 4.5 4.5 4.5 1 0 1.9 -.3 2.6 -.9 -.2 2.2 -1.3 3.9 -3.1 4.9 h6 c-1.8 -1 -2.9 -2.7 -3.1 -4.9 .7 .6 1.6 .9 2.6 .9 2.5 0 4.5 -2 4.5 -4.5 C19 8.5 12 2 12 2 Z" />
        </svg>
      )
    case 'C':
      return (
        <svg {...common}>
          <circle cx="12" cy="6.6" r="3.7" />
          <circle cx="7.3" cy="13.1" r="3.7" />
          <circle cx="16.7" cy="13.1" r="3.7" />
          <path d="M10.6 10 C10.5 14.5 9.3 19 7.4 22 L16.6 22 C14.7 19 13.5 14.5 13.4 10 Z" />
        </svg>
      )
  }
}

const CARD_STYLES = `
.cd-scene { perspective: 1000px; }
.cd-card {
  position: relative;
  border-radius: 0.4rem;
  transform-style: preserve-3d;
  will-change: transform;
  transition:
    transform 0.18s cubic-bezier(0.34, 1.4, 0.64, 1),
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    opacity 0.18s ease;
}
.cd-card--dealing { animation: cd-deal 0.42s cubic-bezier(0.34, 1.4, 0.64, 1) backwards; }
@keyframes cd-deal {
  from { opacity: 0; transform: translateY(-22px) rotateY(-42deg) scale(0.85); }
  to { opacity: 1; transform: none; }
}
@media (hover: hover) and (pointer: fine) {
  .cd-card:not(:disabled):hover {
    transform: translateY(-4px);
    box-shadow: 0 9px 18px rgba(15, 23, 42, 0.18);
  }
  .cd-card--active:not(:disabled):hover { transform: translateY(-8px) scale(1.07); }
}
.cd-card:not(:disabled):active { transform: translateY(-1px) scale(0.96); }
.cd-card--active {
  transform: translateY(-7px) scale(1.06);
  box-shadow: 0 11px 22px rgba(29, 78, 216, 0.3);
  z-index: 2;
}
.cd-card--ok { box-shadow: 0 9px 18px rgba(16, 185, 129, 0.3); }
.cd-card--bad { opacity: 0.5; }
.cd-pile-card {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    0 2px 6px rgba(15, 23, 42, 0.22);
}
`

function PlayingCard({
  id,
  className,
  big = false,
}: {
  id: CardId
  className?: string
  big?: boolean
}) {
  const { rank, suit } = parseCardId(id)
  const color = isRedSuit(suit) ? 'text-rose-600' : 'text-slate-900'
  const rankText = big ? 'text-sm' : 'text-[0.62rem]'
  const cornerSuit = big ? 'h-2.5 w-2.5' : 'h-2 w-2'
  const centerSuit = big ? 'h-6 w-6' : 'h-4 w-4'
  return (
    <span className={`relative block ${className ?? ''}`}>
      <span className={`absolute left-1 top-0.5 flex flex-col items-center leading-none ${color}`}>
        <span className={`${rankText} font-bold tabular-nums`}>{rank}</span>
        <SuitIcon suit={suit} className={cornerSuit} />
      </span>
      <span className={`absolute inset-0 flex items-center justify-center ${color}`}>
        <SuitIcon suit={suit} className={centerSuit} />
      </span>
      <span
        className={`absolute bottom-0.5 right-1 flex rotate-180 flex-col items-center leading-none ${color}`}
      >
        <span className={`${rankText} font-bold tabular-nums`}>{rank}</span>
        <SuitIcon suit={suit} className={cornerSuit} />
      </span>
    </span>
  )
}

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const onChange = () => setReduce(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return reduce
}

export function CardDeck({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: CardDeckProps) {
  const [selected, setSelected] = useState<Set<CardId>>(new Set())
  const [countInput, setCountInput] = useState('')
  const [fractionNum, setFractionNum] = useState('')
  const [fractionDen, setFractionDen] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const reduceMotion = usePrefersReducedMotion()
  const wantsDeal = (config.deal ?? true) && !initialSolved
  const [dealt, setDealt] = useState(!wantsDeal)

  const locked = disabled || submitted
  const helperText =
    config.helperText ??
    'Tap every card that belongs to the event. The whole deck is the sample space (|Ω| = 52).'
  const selectionLabel = config.selectionLabel ?? 'Your selection (event A)'
  const countLabel = config.countLabel ?? 'How many cards are in this event? Enter |A|.'
  const probabilityLabel =
    config.probabilityLabel ?? 'What is P(A) = |A| / 52 as a reduced fraction?'

  const requiresCount = answer.count !== undefined
  const requiresProbability = answer.probability !== undefined

  const rows = useMemo(() => CARD_SUITS.map((suit) => ({ suit, cards: cardsBySuit(suit) })), [])
  const answerSet = useMemo(() => new Set(answer.cards), [answer.cards])
  const selectedList = useMemo(() => fullDeck().filter((card) => selected.has(card)), [selected])

  useEffect(() => {
    if (dealt) return
    if (reduceMotion) {
      setDealt(true)
      return
    }
    const timer = window.setTimeout(() => setDealt(true), 1000)
    return () => window.clearTimeout(timer)
  }, [dealt, reduceMotion])

  function toggle(card: CardId) {
    if (locked) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(card)) next.delete(card)
      else next.add(card)
      return next
    })
  }

  function clearSelection() {
    if (locked) return
    setSelected(new Set())
  }

  function selectionValid() {
    if (selected.size !== answerSet.size) return false
    for (const card of answerSet) if (!selected.has(card)) return false
    return true
  }

  function probabilityValid() {
    if (!requiresProbability || !answer.probability) return true
    return fractionMatches(fractionNum, fractionDen, answer.probability)
  }

  function countValid() {
    if (!requiresCount || answer.count === undefined) return true
    return countMatches(countInput, answer.count)
  }

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    if (selectionValid() && countValid() && probabilityValid()) {
      setSolved(true)
      onCorrect()
    } else {
      onIncorrect?.()
    }
  }

  function handleRetry() {
    onAttemptReset?.()
    setSubmitted(false)
    setSolved(false)
    setSelected(new Set())
    setCountInput('')
    setFractionNum('')
    setFractionDen('')
  }

  const manipulableReady = selected.size > 0
  const countReady = !requiresCount || hasValidCountInput(countInput)
  const fractionReady = !requiresProbability || hasValidFractionInput(fractionNum, fractionDen)
  const canSubmit = manipulableReady && countReady && fractionReady && !locked

  const showCount = requiresCount && manipulableReady
  const showProbability = requiresProbability && manipulableReady && countReady

  return (
    <div className="space-y-5">
      <style>{CARD_STYLES}</style>

      <div className="flex items-center justify-center gap-3">
        <div className="relative h-14 w-10 shrink-0" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="cd-pile-card absolute h-14 w-10 rounded-md border-2 border-white bg-gradient-to-br from-brand-500 to-brand-700"
              style={{ transform: `translate(${i * 2}px, ${-i * 2}px)` }}
            >
              <span
                className="dot-field absolute inset-1 rounded-sm"
                style={{ '--dot-size': '7px' } as CSSProperties}
              />
            </div>
          ))}
        </div>
        <p className="text-sm font-semibold text-slate-700">
          Standard 52-card deck
          <span className="block text-xs font-normal text-slate-500">
            Sample space Ω — {DECK_SIZE} equally likely cards
          </span>
        </p>
      </div>

      <p className="text-center text-sm text-slate-600">{helperText}</p>

      <div className="cd-scene overflow-x-auto rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-3 shadow-inner">
        <div className="mx-auto flex w-max flex-col gap-2">
          {rows.map(({ suit, cards }) => (
            <div key={suit} className="flex items-center gap-1.5">
              <span
                className={`w-4 shrink-0 ${isRedSuit(suit) ? 'text-rose-300' : 'text-slate-300'}`}
                aria-hidden="true"
              >
                <SuitIcon suit={suit} className="h-3.5 w-3.5" />
              </span>
              {cards.map((card, ri) => {
                const active = selected.has(card)
                const inEvent = answerSet.has(card)
                const showOk = submitted && inEvent
                const showBad = submitted && active && !inEvent
                const index = CARD_SUITS.indexOf(suit) * 13 + ri

                let stateCls = 'border-slate-200'
                if (showOk) stateCls = 'border-emerald-500 cd-card--ok'
                else if (showBad) stateCls = 'border-rose-400 cd-card--bad'
                else if (active) stateCls = 'border-brand-500 cd-card--active'
                else stateCls = 'border-slate-200 hover:border-brand-300'

                return (
                  <button
                    key={card}
                    type="button"
                    disabled={locked}
                    onClick={() => toggle(card)}
                    aria-pressed={active}
                    aria-label={cardLabel(card)}
                    className={`cd-card h-14 w-10 shrink-0 border-2 bg-white shadow-sm disabled:cursor-not-allowed ${stateCls} ${
                      dealt ? '' : 'cd-card--dealing'
                    }`}
                    style={dealt ? undefined : { animationDelay: `${index * 9}ms` }}
                  >
                    <PlayingCard id={card} className="h-full w-full" />
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {selectionLabel}
          </p>
          {manipulableReady && !locked && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Clear all
            </button>
          )}
        </div>
        {selectedList.length === 0 ? (
          <p className="text-sm text-slate-400">No cards selected yet — tap cards above.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selectedList.map((card) => (
              <span
                key={card}
                className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-sm font-bold tabular-nums shadow-sm"
              >
                <span className={isRedSuit(parseCardId(card).suit) ? 'text-rose-600' : 'text-slate-900'}>
                  {parseCardId(card).rank}
                </span>
                <SuitIcon
                  suit={parseCardId(card).suit}
                  className={`h-3 w-3 ${
                    isRedSuit(parseCardId(card).suit) ? 'text-rose-600' : 'text-slate-900'
                  }`}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {showCount && (
        <NumericAnswerInput
          id="card-deck-count"
          label={countLabel}
          value={countInput}
          onChange={setCountInput}
          disabled={locked}
        />
      )}

      {showProbability && (
        <FractionAnswerInput
          id="card-deck-probability"
          label={probabilityLabel}
          numerator={fractionNum}
          denominator={fractionDen}
          onNumeratorChange={setFractionNum}
          onDenominatorChange={setFractionDen}
          disabled={locked}
        />
      )}

      <CheckPanel
        canSubmit={canSubmit}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        allowRetry={allowRetry}
      />
    </div>
  )
}
