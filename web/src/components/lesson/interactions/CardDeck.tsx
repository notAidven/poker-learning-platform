import { useEffect, useMemo, useState } from 'react'
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
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { CardKitStyles, DeckPile, SuitIcon } from './cards/PlayingCardKit'

type CardDeckProps = InteractionProps & {
  config: CardDeckConfig
  answer: CardDeckAnswer
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
  box-shadow: 0 11px 22px rgba(155, 44, 68, 0.3);
  z-index: 2;
}
.cd-card--ok { box-shadow: 0 9px 18px rgba(31, 141, 87, 0.3); }
.cd-card--bad { opacity: 0.5; }
.cd-pile-card {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    0 2px 6px rgba(15, 23, 42, 0.22);
}

/* select-all deck: a responsive grid that always fits its container — never scrolls sideways.
   minmax(0, 1fr) lets every column shrink, so the row can never be wider than the container. */
.cd-deck {
  container-type: inline-size;
  container-name: cd-deck;
}
.cd-suit-grid {
  display: grid;
  grid-template-columns: repeat(13, minmax(0, 1fr));
  gap: 3px;
}
/* On phone-width containers the 13 cards wrap to two rows so each card stays a comfortable
   tap target instead of shrinking to an illegible sliver. */
@container cd-deck (width < 384px) {
  .cd-suit-grid { grid-template-columns: repeat(7, minmax(0, 1fr)); }
}
.cd-cell {
  container-type: inline-size;
  position: relative;
  width: 100%;
  min-width: 0;
  padding: 0;
  aspect-ratio: 5 / 7;
  overflow: hidden;
}
/* Card face scales with the card itself via container-query units, capped for legibility. */
.cd-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4cqw;
  line-height: 1;
}
.cd-face__rank {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-size: clamp(7px, 44cqw, 15px);
  letter-spacing: -0.03em;
}
.cd-face__suit {
  width: clamp(7px, 40cqw, 15px);
  height: clamp(7px, 40cqw, 15px);
}
`

const SUIT_NAMES: Record<CardSuit, string> = {
  S: 'Spades',
  H: 'Hearts',
  D: 'Diamonds',
  C: 'Clubs',
}

/**
 * Compact card face for the responsive deck grid: a centred rank over its suit.
 * Stays legible at small sizes (rank + suit) and absolutely positioned so it never
 * affects the cell's width — colour is inherited from the cell via `currentColor`.
 */
function GridCardFace({ id }: { id: CardId }) {
  const { rank, suit } = parseCardId(id)
  return (
    <span className="cd-face" aria-hidden="true">
      <span className="cd-face__rank">{rank}</span>
      <SuitIcon suit={suit} className="cd-face__suit" />
    </span>
  )
}

export function CardDeck(props: CardDeckProps) {
  return <SelectAllMode {...props} />
}

// --- select-all mode: tap every card in event A (the original mechanic) --------

function SelectAllMode({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: CardDeckProps) {
  // When a solved lesson is revisited (initialSolved), seed every input from the answer
  // so the completed state shows consistently: the "Your selection" panel lists the
  // correct cards (instead of "No cards selected yet"), and the count/fraction fields
  // appear pre-filled rather than hidden. First play and skill checks (which never pass
  // initialSolved) start empty as before.
  const [selected, setSelected] = useState<Set<CardId>>(() =>
    initialSolved ? new Set(answer.cards ?? []) : new Set(),
  )
  const [countInput, setCountInput] = useState(() =>
    initialSolved && answer.count !== undefined ? String(answer.count) : '',
  )
  const [fractionNum, setFractionNum] = useState(() =>
    initialSolved && answer.probability ? String(answer.probability.num) : '',
  )
  const [fractionDen, setFractionDen] = useState(() =>
    initialSolved && answer.probability ? String(answer.probability.den) : '',
  )
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const reduceMotion = usePrefersReducedMotion()
  const wantsDeal = (config.deal ?? true) && !initialSolved
  const [dealt, setDealt] = useState(!wantsDeal)

  const locked = disabled || submitted
  const helperText =
    config.helperText ??
    'Tap every card that fits the prompt. The full deck is 52 cards (4 suits of 13).'
  const selectionLabel = config.selectionLabel ?? 'Your selection'
  const countLabel = config.countLabel ?? 'How many cards did you tap?'
  const probabilityLabel =
    config.probabilityLabel ?? 'What fraction of the 52-card deck is that? Enter it as a reduced fraction.'

  const requiresCount = answer.count !== undefined
  const requiresProbability = answer.probability !== undefined

  const rows = useMemo(() => CARD_SUITS.map((suit) => ({ suit, cards: cardsBySuit(suit) })), [])
  const answerSet = useMemo(() => new Set(answer.cards ?? []), [answer.cards])
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
    // Retain the learner's card selection and entered values so a wrong attempt
    // only re-enables editing — they fix the part that was wrong and resubmit
    // instead of rebuilding the whole answer from scratch.
    onAttemptReset?.()
    setSubmitted(false)
    setSolved(false)
  }

  const manipulableReady = selected.size > 0
  const countReady = !requiresCount || hasValidCountInput(countInput)
  const fractionReady = !requiresProbability || hasValidFractionInput(fractionNum, fractionDen)
  const canSubmit = manipulableReady && countReady && fractionReady && !locked

  const showCount = requiresCount && manipulableReady
  // Show the required fraction field as soon as the learner has a selection — never
  // gate it behind a valid count. Combined with canSubmit (which still requires both a
  // valid count and fraction), this makes it impossible for Check to be enabled while a
  // validated field is hidden, so a prompt/answer mismatch can't deadlock the step.
  const showProbability = requiresProbability && manipulableReady

  return (
    <div className="space-y-5">
      <style>{CARD_STYLES}</style>
      <CardKitStyles />

      <div className="flex items-center justify-center gap-3">
        <DeckPile size="sm" />
        <p className="text-sm font-semibold text-slate-700">
          Standard 52-card deck
          <span className="block text-xs font-normal text-slate-500">
            {DECK_SIZE} cards · 4 suits of 13
          </span>
        </p>
      </div>

      <p className="text-center text-sm text-slate-600">{helperText}</p>

      {/* Responsive deck: grouped by suit, every row fits the container width (no sideways scroll). */}
      <div className="cd-scene rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-2 shadow-inner sm:p-3">
        <div className="cd-deck space-y-2.5">
          {rows.map(({ suit, cards }) => {
            const red = isRedSuit(suit)
            return (
              <div key={suit}>
                <p
                  className={`mb-1 flex items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-wide ${
                    red ? 'text-rose-500' : 'text-slate-500'
                  }`}
                >
                  <SuitIcon suit={suit} className="h-3 w-3" />
                  <span>{SUIT_NAMES[suit]}</span>
                </p>
                <div className="cd-suit-grid">
                  {cards.map((card, ri) => {
                    const active = selected.has(card)
                    const inEvent = answerSet.has(card)
                    const showOk = submitted && inEvent
                    const showBad = submitted && active && !inEvent
                    const index = CARD_SUITS.indexOf(suit) * 13 + ri

                    let stateCls = 'border-slate-200 hover:border-brand-300'
                    if (showOk) stateCls = 'border-success-500 cd-card--ok'
                    else if (showBad) stateCls = 'border-danger-400 cd-card--bad'
                    else if (active) stateCls = 'border-brand-500 cd-card--active'

                    return (
                      <button
                        key={card}
                        type="button"
                        disabled={locked}
                        onClick={() => toggle(card)}
                        aria-pressed={active}
                        aria-label={cardLabel(card)}
                        className={`cd-cell cd-card border-2 bg-white shadow-sm disabled:cursor-not-allowed ${
                          red ? 'text-rose-600' : 'text-slate-900'
                        } ${stateCls} ${dealt ? '' : 'cd-card--dealing'}`}
                        style={dealt ? undefined : { animationDelay: `${index * 9}ms` }}
                      >
                        <GridCardFace id={card} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
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
          <p className="text-sm text-slate-400">No cards selected yet. Tap cards above.</p>
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
