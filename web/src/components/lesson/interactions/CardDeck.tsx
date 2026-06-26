import { useEffect, useMemo, useRef, useState } from 'react'
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
import { fractionMatches, hasValidFractionInput, reduceFraction } from './fractionAnswer'
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
/* draw-tally: the freshly dealt card flips up out of the deck */
.cd-flip--in { animation: cd-flip-in 0.46s cubic-bezier(0.34, 1.3, 0.64, 1) backwards; }
@keyframes cd-flip-in {
  from { opacity: 0; transform: translateX(-14px) rotateY(88deg) scale(0.92); }
  to { opacity: 1; transform: none; }
}
.cd-recent--in { animation: cd-pop 0.3s ease backwards; }
@keyframes cd-pop {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: scale(1); }
}
.cd-freq-bar { transition: width 0.4s cubic-bezier(0.34, 1.2, 0.64, 1); }

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
  const mode = props.config.mode ?? 'select-all'
  if (mode === 'draw-tally') return <DrawTallyMode {...props} />
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
    'Tap every card that belongs to the event. The whole deck is the sample space (|Ω| = 52).'
  const selectionLabel = config.selectionLabel ?? 'Your selection (event A)'
  const countLabel = config.countLabel ?? 'How many cards are in this event? Enter |A|.'
  const probabilityLabel =
    config.probabilityLabel ?? 'What is P(A) = |A| / 52 as a reduced fraction?'

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
            Sample space Ω: {DECK_SIZE} equally likely cards
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
                    if (showOk) stateCls = 'border-emerald-500 cd-card--ok'
                    else if (showBad) stateCls = 'border-rose-400 cd-card--bad'
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

// --- draw-tally mode: draw random cards & watch frequency approach P(event) -----

const RECENT_LIMIT = 14

function shuffled(): CardId[] {
  const deck = fullDeck()
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function DrawTallyMode({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: CardDeckProps) {
  const reduceMotion = usePrefersReducedMotion()

  const targetEvent = useMemo(() => config.targetEvent ?? [], [config.targetEvent])
  const targetSet = useMemo(() => new Set(targetEvent), [targetEvent])
  const targetLabel = config.targetLabel ?? 'the target event'
  const minDraws = config.minDraws ?? 12
  const withReplacement = config.withReplacement ?? true
  const predictFirst = config.predictFirst ?? false

  const theoretical = useMemo(
    () => reduceFraction(targetEvent.length, DECK_SIZE) ?? { num: 0, den: 1 },
    [targetEvent.length],
  )
  const theoreticalValue = targetEvent.length / DECK_SIZE

  const requiresCount = answer.count !== undefined
  const requiresProbability = answer.probability !== undefined

  // cumulative tallies (never truncated) + a short visual history of recent draws
  const [hits, setHits] = useState(0)
  const [total, setTotal] = useState(0)
  const [recent, setRecent] = useState<CardId[]>([])
  const [current, setCurrent] = useState<CardId | null>(null)
  const [flipping, setFlipping] = useState(false)
  const remainingRef = useRef<CardId[]>([])
  const flipTimer = useRef<number | null>(null)

  const [predictNum, setPredictNum] = useState('')
  const [predictDen, setPredictDen] = useState('')
  const [predicted, setPredicted] = useState(!predictFirst || initialSolved)

  const [countInput, setCountInput] = useState('')
  const [fractionNum, setFractionNum] = useState('')
  const [fractionDen, setFractionDen] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted

  useEffect(
    () => () => {
      if (flipTimer.current) window.clearTimeout(flipTimer.current)
    },
    [],
  )

  function nextCard(): CardId {
    if (withReplacement) {
      const deck = fullDeck()
      return deck[Math.floor(Math.random() * deck.length)]
    }
    if (remainingRef.current.length === 0) remainingRef.current = shuffled()
    return remainingRef.current.shift() as CardId
  }

  function applyDraws(cards: CardId[]) {
    if (cards.length === 0) return
    const newHits = cards.reduce((acc, c) => acc + (targetSet.has(c) ? 1 : 0), 0)
    setHits((h) => h + newHits)
    setTotal((t) => t + cards.length)
    setRecent((prev) => [...prev, ...cards].slice(-RECENT_LIMIT))
    setCurrent(cards[cards.length - 1])
  }

  function drawOne() {
    if (locked || flipping || !predicted) return
    applyDraws([nextCard()])
    if (reduceMotion) return
    setFlipping(true)
    if (flipTimer.current) window.clearTimeout(flipTimer.current)
    flipTimer.current = window.setTimeout(() => setFlipping(false), 470)
  }

  function drawMany(n: number) {
    if (locked || flipping || !predicted) return
    const batch: CardId[] = []
    for (let i = 0; i < n; i++) batch.push(nextCard())
    applyDraws(batch)
  }

  function lockPrediction() {
    if (locked || !hasValidFractionInput(predictNum, predictDen)) return
    setPredicted(true)
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
    if (countValid() && probabilityValid()) {
      setSolved(true)
      onCorrect()
    } else {
      onIncorrect?.()
    }
  }

  function handleRetry() {
    // Keep the accumulated draws, the locked-in prediction, and the entered count /
    // fraction so a wrong attempt only re-enables editing. The learner fixes the
    // wrong field and resubmits rather than re-drawing the whole sample.
    onAttemptReset?.()
    setSubmitted(false)
    setSolved(false)
  }

  const empiricalValue = total > 0 ? hits / total : 0
  const reachedMin = total >= minDraws
  const drawsLeft = Math.max(0, minDraws - total)
  const countReady = !requiresCount || hasValidCountInput(countInput)
  const fractionReady = !requiresProbability || hasValidFractionInput(fractionNum, fractionDen)
  const canSubmit = reachedMin && predicted && countReady && fractionReady && !locked

  const helperText =
    config.helperText ??
    `Draw cards one at a time and tally how many are ${targetLabel}. Watch the running frequency settle toward the theoretical probability.`
  const drawLabel = config.drawLabel ?? 'Draw a card'
  const predictLabel =
    config.predictLabel ?? `Predict P(${targetLabel}) as a reduced fraction, then draw to test it.`
  const countLabel = config.countLabel ?? `How many cards are ${targetLabel}? Enter |A|.`
  const probabilityLabel =
    config.probabilityLabel ?? `Confirm P(${targetLabel}) = |A| / 52 as a reduced fraction.`

  const isHit = current ? targetSet.has(current) : false

  return (
    <div className="space-y-5">
      <style>{CARD_STYLES}</style>
      <CardKitStyles />

      <div className="flex items-center justify-center gap-3">
        <DeckPile size="sm" />
        <p className="text-sm font-semibold text-slate-700">
          Standard 52-card deck
          <span className="block text-xs font-normal text-slate-500">
            {withReplacement ? 'Each draw is replaced — independent trials' : 'Drawn without replacement'}
          </span>
        </p>
      </div>

      <p className="text-center text-sm text-slate-600">{helperText}</p>

      {predictFirst && !predicted ? (
        <div className="space-y-3">
          <FractionAnswerInput
            id="card-draw-predict"
            label={predictLabel}
            numerator={predictNum}
            denominator={predictDen}
            onNumeratorChange={setPredictNum}
            onDenominatorChange={setPredictDen}
            disabled={locked}
          />
          <button
            type="button"
            onClick={lockPrediction}
            disabled={!hasValidFractionInput(predictNum, predictDen) || locked}
            className="min-h-11 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-40"
          >
            Lock in prediction &amp; start drawing
          </button>
        </div>
      ) : (
        <>
          {/* deal stage: deck pile + the most recent card flipping up */}
          <div className="cd-scene flex items-center justify-center gap-4 rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4 shadow-inner">
            <DeckPile size="sm" />
            <div className="flex min-h-[7rem] w-20 items-center justify-center">
              {current ? (
                <span
                  key={total}
                  className={`block h-28 w-20 rounded-lg border-2 bg-white shadow-sm ${
                    isHit ? 'border-emerald-500' : 'border-slate-200'
                  } ${reduceMotion ? '' : 'cd-flip--in'}`}
                >
                  <PlayingCard id={current} big className="h-full w-full" />
                </span>
              ) : (
                <span
                  className="flex h-28 w-20 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white text-2xl font-bold text-slate-300"
                  aria-hidden="true"
                >
                  ?
                </span>
              )}
            </div>
          </div>

          {/* live announcement of the latest draw for screen readers */}
          <p className="sr-only" role="status" aria-live="polite">
            {current
              ? `Drew the ${cardLabel(current)} — ${isHit ? `${targetLabel}, a hit` : `not ${targetLabel}, a miss`}. ${hits} of ${total} draws are ${targetLabel}.`
              : 'No cards drawn yet.'}
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={drawOne}
              disabled={locked || flipping}
              className="chip-3d min-h-11 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {drawLabel}
            </button>
            <button
              type="button"
              onClick={() => drawMany(10)}
              disabled={locked || flipping}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Deal ×10
            </button>
          </div>

          {/* recent-draw history strip */}
          {recent.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5" aria-hidden="true">
              {recent.map((card, i) => {
                const hit = targetSet.has(card)
                return (
                  <span
                    key={`${i}-${card}`}
                    className={`block h-11 w-8 rounded border-2 bg-white ${
                      hit ? 'border-emerald-400' : 'border-slate-200 opacity-60'
                    } ${reduceMotion ? '' : 'cd-recent--in'}`}
                  >
                    <PlayingCard id={card} className="h-full w-full" />
                  </span>
                )
              })}
            </div>
          )}

          {/* tallies */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-2 py-3">
              <p className="text-2xl font-bold tabular-nums text-emerald-700">{hits}</p>
              <p className="text-xs font-semibold text-emerald-700">{targetLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-2 py-3">
              <p className="text-2xl font-bold tabular-nums text-slate-700">{total - hits}</p>
              <p className="text-xs font-semibold text-slate-500">not {targetLabel}</p>
            </div>
            <div className="rounded-2xl border border-brand-200 bg-brand-50 px-2 py-3">
              <p className="text-2xl font-bold tabular-nums text-brand-700">{total}</p>
              <p className="text-xs font-semibold text-brand-700">total draws</p>
            </div>
          </div>

          {/* empirical vs theoretical comparison */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-semibold text-slate-700">Empirical frequency</span>
                <span className="font-bold tabular-nums text-brand-700">
                  {total > 0 ? `${hits}/${total} = ${pct(empiricalValue)}` : '—'}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="cd-freq-bar h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                  style={{ width: `${empiricalValue * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-semibold text-slate-700">
                  Theoretical P({targetLabel})
                </span>
                <span className="font-bold tabular-nums text-emerald-700">
                  {theoretical.num}/{theoretical.den} ≈ {pct(theoreticalValue)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                  style={{ width: `${theoreticalValue * 100}%` }}
                />
              </div>
            </div>
            {predictFirst && (predictNum || predictDen) && (
              <p className="text-xs text-slate-500">
                Your prediction:{' '}
                <span className="font-semibold text-slate-700">
                  {predictNum}
                  {predictDen ? `/${predictDen}` : ''}
                </span>
              </p>
            )}
            <p className="text-center text-xs text-slate-500" role="status" aria-live="polite">
              {reachedMin
                ? 'Notice how the empirical bar hugs the theoretical one as draws pile up.'
                : `Draw ${drawsLeft} more ${drawsLeft === 1 ? 'time' : 'times'} to check (need ${minDraws}).`}
            </p>
          </div>

          {reachedMin && requiresCount && (
            <NumericAnswerInput
              id="card-draw-count"
              label={countLabel}
              value={countInput}
              onChange={setCountInput}
              disabled={locked}
            />
          )}

          {reachedMin && requiresProbability && (
            <FractionAnswerInput
              id="card-draw-probability"
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
        </>
      )}
    </div>
  )
}
