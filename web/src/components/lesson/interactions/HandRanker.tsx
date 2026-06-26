import { useMemo, useState } from 'react'
import {
  CARD_SUITS,
  cardLabel,
  cardsBySuit,
  fullDeck,
  isRedSuit,
  parseCardId,
  type CardId,
  type HandRankerAnswer,
  type HandRankerConfig,
  type HandRankerHand,
} from '../../../types/lesson'
import {
  HAND_CATEGORIES_STRONGEST_FIRST,
  HAND_CATEGORY_RANK,
  type EvaluatedHand,
  type HandCategory,
} from '../../../types/poker'
import { compareHands, evaluateBest, evaluateFive } from '../../../lib/poker/handEvaluator'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { SuitIcon } from './cards/PlayingCardKit'

type HandRankerProps = InteractionProps & {
  config: HandRankerConfig
  answer: HandRankerAnswer
}

// ---------------------------------------------------------------------------
// Category vocabulary. The plain-language name + one-line "shape" double as the
// beginner scaffolding the lesson leans on (so authors never repeat it inline).
// ---------------------------------------------------------------------------
const CATEGORY_LABEL: Record<HandCategory, string> = {
  'royal-flush': 'Royal flush',
  'straight-flush': 'Straight flush',
  quads: 'Four of a kind',
  'full-house': 'Full house',
  flush: 'Flush',
  straight: 'Straight',
  trips: 'Three of a kind',
  'two-pair': 'Two pair',
  pair: 'One pair',
  'high-card': 'High card',
}

const CATEGORY_SHAPE: Record<HandCategory, string> = {
  'royal-flush': 'A-K-Q-J-10, one suit',
  'straight-flush': 'Five in a row, one suit',
  quads: 'Four of one rank',
  'full-house': 'Three of a kind + a pair',
  flush: 'Five of one suit',
  straight: 'Five in a row, any suits',
  trips: 'Three of one rank',
  'two-pair': 'Two pairs',
  pair: 'One pair',
  'high-card': 'No pair, top card plays',
}

type Size = 'sm' | 'md' | 'lg'

const BOX: Record<Size, string> = {
  sm: 'h-12 w-9',
  md: 'h-14 w-10',
  lg: 'h-[4.75rem] w-14',
}

const FONT: Record<Size, { rank: string; corner: string; center: string }> = {
  sm: { rank: 'text-[0.6rem]', corner: 'h-1.5 w-1.5', center: 'h-4 w-4' },
  md: { rank: 'text-[0.7rem]', corner: 'h-2 w-2', center: 'h-5 w-5' },
  lg: { rank: 'text-base', corner: 'h-3 w-3', center: 'h-7 w-7' },
}

const STYLES = `
.hr-card {
  transition:
    transform 0.16s cubic-bezier(0.34, 1.4, 0.64, 1),
    box-shadow 0.16s ease,
    border-color 0.16s ease,
    opacity 0.16s ease;
}
.hr-deal { animation: hr-deal 0.4s cubic-bezier(0.34, 1.4, 0.64, 1) backwards; }
@keyframes hr-deal {
  from { opacity: 0; transform: translateY(-16px) scale(0.9); }
  to { opacity: 1; transform: none; }
}
@media (hover: hover) and (pointer: fine) {
  .hr-card:not(:disabled):hover { transform: translateY(-4px); box-shadow: 0 9px 18px rgba(15, 23, 42, 0.18); }
  .hr-card--active:not(:disabled):hover { transform: translateY(-7px) scale(1.05); }
}
.hr-card:not(:disabled):active { transform: translateY(-1px) scale(0.96); }
.hr-card--active { transform: translateY(-6px) scale(1.05); box-shadow: 0 11px 22px rgba(155, 44, 68, 0.3); z-index: 2; }
.hr-card--ok { box-shadow: 0 9px 18px rgba(31, 141, 87, 0.3); }
.hr-card--bad { opacity: 0.5; }
.hr-reveal { animation: hr-reveal 0.28s ease backwards; }
@keyframes hr-reveal {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}
`

function CardFace({ id, size = 'md', className }: { id: CardId; size?: Size; className?: string }) {
  const { rank, suit } = parseCardId(id)
  const color = isRedSuit(suit) ? 'text-rose-600' : 'text-slate-900'
  const f = FONT[size]
  return (
    <span className={`relative block ${className ?? ''}`}>
      <span className={`absolute left-1 top-0.5 flex flex-col items-center leading-none ${color}`}>
        <span className={`${f.rank} font-bold tabular-nums`}>{rank}</span>
        <SuitIcon suit={suit} className={f.corner} />
      </span>
      <span className={`absolute inset-0 flex items-center justify-center ${color}`}>
        <SuitIcon suit={suit} className={f.center} />
      </span>
      <span
        className={`absolute bottom-0.5 right-1 flex rotate-180 flex-col items-center leading-none ${color}`}
      >
        <span className={`${f.rank} font-bold tabular-nums`}>{rank}</span>
        <SuitIcon suit={suit} className={f.corner} />
      </span>
    </span>
  )
}

/** A non-interactive card used to present a hand. */
function DisplayCard({
  id,
  size = 'md',
  dealIndex,
  reduceMotion = false,
}: {
  id: CardId
  size?: Size
  dealIndex?: number
  reduceMotion?: boolean
}) {
  const dealing = !reduceMotion && dealIndex !== undefined
  return (
    <span
      className={`${BOX[size]} block shrink-0 rounded-md border-2 border-slate-200 bg-white shadow-sm ${
        dealing ? 'hr-deal' : ''
      }`}
      style={dealing ? { animationDelay: `${(dealIndex ?? 0) * 45}ms` } : undefined}
      role="img"
      aria-label={cardLabel(id)}
    >
      <CardFace id={id} size={size} className="h-full w-full" />
    </span>
  )
}

type CardState = 'idle' | 'active' | 'ok' | 'bad'

function SelectCard({
  id,
  size = 'md',
  state,
  disabled,
  dealIndex,
  reduceMotion,
  onClick,
}: {
  id: CardId
  size?: Size
  state: CardState
  disabled: boolean
  dealIndex?: number
  reduceMotion: boolean
  onClick: () => void
}) {
  let stateCls = 'border-slate-200 hover:border-brand-300'
  if (state === 'ok') stateCls = 'border-success-500 hr-card--ok'
  else if (state === 'bad') stateCls = 'border-danger-400 hr-card--bad'
  else if (state === 'active') stateCls = 'border-brand-500 hr-card--active'

  const dealing = !reduceMotion && dealIndex !== undefined
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={state === 'active' || state === 'ok'}
      aria-label={cardLabel(id)}
      className={`hr-card ${BOX[size]} shrink-0 rounded-md border-2 bg-white shadow-sm disabled:cursor-not-allowed ${stateCls} ${
        dealing ? 'hr-deal' : ''
      }`}
      style={dealing ? { animationDelay: `${(dealIndex ?? 0) * 45}ms` } : undefined}
    >
      <CardFace id={id} size={size} className="h-full w-full" />
    </button>
  )
}

/** Six-dot grab affordance shown on the drag handle. */
function GripIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <circle cx="9" cy="5" r="1.6" />
      <circle cx="15" cy="5" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="19" r="1.6" />
      <circle cx="15" cy="19" r="1.6" />
    </svg>
  )
}

/**
 * One reorderable row. The drag is initiated from the grip handle only, so the
 * rest of the row stays scrollable on touch. The handle is a real <button>, so
 * keyboard users tab to it and use space/enter + arrow keys (dnd-kit's keyboard
 * sensor) to pick up, move, and drop, with no up/down arrow buttons needed.
 */
function SortableRow({
  id,
  handleLabel,
  rowClassName,
  disabled,
  reduceMotion,
  children,
}: {
  id: string
  handleLabel: string
  rowClassName: string
  disabled: boolean
  reduceMotion: boolean
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    // Skip the reflow tween for users who ask for reduced motion.
    transition: reduceMotion ? undefined : transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 ${rowClassName} ${
        isDragging ? 'relative z-10 shadow-xl ring-2 ring-brand-300' : 'shadow-sm'
      }`}
    >
      {children}
      <button
        type="button"
        ref={setActivatorNodeRef}
        disabled={disabled}
        aria-label={`Drag to reorder ${handleLabel}`}
        className={`flex h-11 w-9 shrink-0 touch-none items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-brand-300 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-30 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        {...attributes}
        {...listeners}
      >
        <GripIcon className="h-5 w-5" />
      </button>
    </li>
  )
}

/**
 * Drag-and-drop wrapper shared by both ordering modes. Pointer + touch reordering
 * comes from PointerSensor (an 8px activation threshold keeps taps/scrolls intact);
 * full keyboard reordering comes from KeyboardSensor + sortableKeyboardCoordinates.
 * `labelFor` powers human-friendly screen-reader announcements.
 */
function SortableList({
  ids,
  labelFor,
  onReorder,
  children,
}: {
  ids: string[]
  labelFor: (id: string) => string
  onReorder: (next: string[]) => void
  children: React.ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function positionOf(id: string) {
    return ids.indexOf(id) + 1
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Picked up ${labelFor(String(active.id))}. Use the arrow keys to move it, space or enter to drop, escape to cancel.`
    },
    onDragOver({ active, over }) {
      if (!over) return undefined
      return `${labelFor(String(active.id))} is now at position ${positionOf(String(over.id))} of ${ids.length}.`
    },
    onDragEnd({ active, over }) {
      if (!over) return `${labelFor(String(active.id))} was dropped.`
      return `${labelFor(String(active.id))} was dropped at position ${positionOf(String(over.id))} of ${ids.length}.`
    },
    onDragCancel({ active }) {
      return `Reordering cancelled. ${labelFor(String(active.id))} returned to its original position.`
    },
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    onReorder(arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">{children}</ul>
      </SortableContext>
    </DndContext>
  )
}

function OrientationLabel({ text }: { text: string }) {
  return (
    <p className="text-center text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">{text}</p>
  )
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

/** Reorderable list state shared by the two ordering modes. */
function useOrder(initial: string[]) {
  const [order, setOrder] = useState<string[]>(initial)
  return { order, setOrder }
}

// ===========================================================================
// Mode: identify-category — read a 5–7 card hand, pick the category it makes.
// ===========================================================================
function IdentifyCategory({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
  reduceMotion,
}: HandRankerProps & { reduceMotion: boolean }) {
  const cards = useMemo(() => config.cards ?? [], [config.cards])
  // The evaluator is the source of truth; fall back to the authored answer only
  // when no cards are supplied.
  const evaluated = useMemo<EvaluatedHand | null>(
    () => (cards.length >= 5 ? evaluateBest(cards) : null),
    [cards],
  )
  const expected = evaluated?.category ?? answer.category ?? null

  const options = useMemo<HandCategory[]>(
    () =>
      config.categories && config.categories.length > 0
        ? config.categories
        : HAND_CATEGORIES_STRONGEST_FIRST,
    [config.categories],
  )

  const [choice, setChoice] = useState<HandCategory | null>(initialSolved ? expected : null)
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)
  const locked = disabled || submitted

  function handleSubmit() {
    if (locked || choice === null) return
    setSubmitted(true)
    if (choice === expected) {
      setSolved(true)
      onCorrect()
    } else {
      onIncorrect?.()
    }
  }

  function handleRetry() {
    // Keep the learner's chosen category so a wrong attempt only re-enables editing.
    onAttemptReset?.()
    setSubmitted(false)
    setSolved(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4 shadow-inner">
        {cards.map((card, i) => (
          <DisplayCard key={card} id={card} size="lg" dealIndex={i} reduceMotion={reduceMotion} />
        ))}
      </div>

      {config.helperText && <p className="text-center text-sm text-slate-600">{config.helperText}</p>}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((cat) => {
          const active = choice === cat
          const isAnswer = cat === expected
          let cls = 'border-slate-200 bg-white hover:border-brand-300'
          if (submitted && isAnswer) cls = 'border-success-500 bg-success-50'
          else if (submitted && active) cls = 'border-danger-400 bg-danger-50'
          else if (active) cls = 'border-brand-500 bg-brand-50 shadow-sm'
          return (
            <button
              key={cat}
              type="button"
              disabled={locked}
              onClick={() => setChoice(cat)}
              aria-pressed={active}
              className={`min-h-11 rounded-xl border-2 px-3 py-2 text-left transition disabled:cursor-not-allowed ${cls}`}
            >
              <span className="block text-sm font-bold text-slate-900">{CATEGORY_LABEL[cat]}</span>
              <span className="block text-xs text-slate-500">{CATEGORY_SHAPE[cat]}</span>
            </button>
          )
        })}
      </div>

      {submitted && evaluated && (
        <p
          className="hr-reveal rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
          role="status"
          aria-live="polite"
        >
          This hand is a <span className="text-success-700">{evaluated.label}</span>.
        </p>
      )}

      <CheckPanel
        canSubmit={choice !== null && !locked}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        allowRetry={allowRetry}
      />
    </div>
  )
}

// ===========================================================================
// Mode: order-categories — arrange category chips strongest → weakest.
// Correct order is derived from HAND_CATEGORY_RANK, never hardcoded.
// ===========================================================================
function OrderCategories({
  config,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
  reduceMotion,
}: HandRankerProps & { reduceMotion: boolean }) {
  const categories = useMemo(() => config.categories ?? [], [config.categories])
  const expected = useMemo(
    () => [...categories].sort((a, b) => HAND_CATEGORY_RANK[b] - HAND_CATEGORY_RANK[a]),
    [categories],
  )
  const { order, setOrder } = useOrder(initialSolved ? expected : categories)
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)
  const locked = disabled || submitted

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    if (arraysEqual(order, expected)) {
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
  }

  return (
    <div className="space-y-3">
      {config.helperText && <p className="text-center text-sm text-slate-600">{config.helperText}</p>}
      <OrientationLabel text="Strongest" />
      <SortableList
        ids={order}
        labelFor={(id) => CATEGORY_LABEL[id as HandCategory]}
        onReorder={setOrder}
      >
        {order.map((cat, i) => {
          const rowOk = submitted ? order[i] === expected[i] : null
          let cls = 'border-slate-200 bg-white'
          if (rowOk === true) cls = 'border-success-400 bg-success-50'
          else if (rowOk === false) cls = 'border-danger-300 bg-danger-50'
          return (
            <SortableRow
              key={cat}
              id={cat}
              handleLabel={CATEGORY_LABEL[cat as HandCategory]}
              rowClassName={cls}
              disabled={locked}
              reduceMotion={reduceMotion}
            >
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-900">
                  {CATEGORY_LABEL[cat as HandCategory]}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {CATEGORY_SHAPE[cat as HandCategory]}
                </span>
              </div>
            </SortableRow>
          )
        })}
      </SortableList>
      <OrientationLabel text="Weakest" />

      <CheckPanel
        canSubmit={!locked}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        allowRetry={allowRetry}
      />
    </div>
  )
}

// ===========================================================================
// Mode: order-hands — arrange concrete 5-card hands strongest → weakest.
// Validation uses compareHands so any ordering of tied hands also passes.
// ===========================================================================
function OrderHands({
  config,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
  reduceMotion,
}: HandRankerProps & { reduceMotion: boolean }) {
  const hands = useMemo(() => config.hands ?? [], [config.hands])
  const evalById = useMemo(() => {
    const map = new Map<string, EvaluatedHand>()
    for (const h of hands) {
      if (h.cards.length === 5) map.set(h.id, evaluateFive(h.cards))
    }
    return map
  }, [hands])
  // Stable, answer-neutral handle/announcement label per hand (does not reveal
  // the category before the learner submits).
  const handNumber = useMemo(() => new Map(hands.map((h, i) => [h.id, i + 1])), [hands])

  const canonical = useMemo(
    () =>
      [...hands]
        .sort((a, b) => {
          const ea = evalById.get(a.id)
          const eb = evalById.get(b.id)
          if (!ea || !eb) return 0
          return compareHands(eb, ea) // strongest first
        })
        .map((h) => h.id),
    [hands, evalById],
  )

  const handById = useMemo(() => new Map(hands.map((h) => [h.id, h])), [hands])
  const { order, setOrder } = useOrder(initialSolved ? canonical : hands.map((h) => h.id))
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)
  const locked = disabled || submitted

  /** Each adjacent pair must be non-increasing in strength. */
  function isMonotonic(seq: string[]): boolean {
    for (let i = 1; i < seq.length; i++) {
      const prev = evalById.get(seq[i - 1])
      const cur = evalById.get(seq[i])
      if (prev && cur && compareHands(prev, cur) < 0) return false
    }
    return true
  }

  function rowOk(i: number): boolean {
    if (i === 0) return true
    const prev = evalById.get(order[i - 1])
    const cur = evalById.get(order[i])
    if (!prev || !cur) return true
    return compareHands(prev, cur) >= 0
  }

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    if (isMonotonic(order)) {
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
  }

  return (
    <div className="space-y-3">
      {config.helperText && <p className="text-center text-sm text-slate-600">{config.helperText}</p>}
      <OrientationLabel text="Strongest" />
      <SortableList
        ids={order}
        labelFor={(id) => `hand ${handNumber.get(id) ?? 0}`}
        onReorder={setOrder}
      >
        {order.map((id, i) => {
          const hand = handById.get(id) as HandRankerHand
          const ok = submitted ? rowOk(i) : null
          let cls = 'border-slate-200 bg-white'
          if (ok === true) cls = 'border-success-400 bg-success-50'
          else if (ok === false) cls = 'border-danger-300 bg-danger-50'
          return (
            <SortableRow
              key={id}
              id={id}
              handleLabel={`hand ${handNumber.get(id) ?? i + 1}`}
              rowClassName={cls}
              disabled={locked}
              reduceMotion={reduceMotion}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap gap-1">
                  {hand.cards.map((card) => (
                    <DisplayCard key={card} id={card} size="sm" />
                  ))}
                </div>
                {submitted && evalById.get(id) && (
                  <span className="text-xs font-semibold text-slate-500">{evalById.get(id)!.label}</span>
                )}
              </div>
            </SortableRow>
          )
        })}
      </SortableList>
      <OrientationLabel text="Weakest" />

      <CheckPanel
        canSubmit={!locked}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        allowRetry={allowRetry}
      />
    </div>
  )
}

// ===========================================================================
// Selection modes: build-hand & pick-best-five. Tap up to 5 cards; the
// evaluator decides correctness (category match / ties the best 5-of-7).
// ===========================================================================
function CardSelectMode({
  cards,
  bySuit,
  helperText,
  initialSelected,
  validate,
  describe,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled,
  initialSolved,
  allowRetry,
  reduceMotion,
}: {
  cards: CardId[]
  bySuit: boolean
  helperText?: string
  initialSelected: CardId[]
  validate: (selected: CardId[]) => boolean
  describe: (selected: CardId[]) => string | null
  onCorrect: () => void
  onIncorrect?: () => void
  onAttemptReset?: () => void
  disabled: boolean
  initialSolved: boolean
  allowRetry: boolean
  reduceMotion: boolean
}) {
  const [selected, setSelected] = useState<CardId[]>(initialSolved ? initialSelected : [])
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)
  const locked = disabled || submitted
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const atMax = selected.length >= 5

  function toggle(card: CardId) {
    if (locked) return
    setSelected((prev) => {
      if (prev.includes(card)) return prev.filter((c) => c !== card)
      if (prev.length >= 5) return prev
      return [...prev, card]
    })
  }

  function handleSubmit() {
    if (locked || selected.length !== 5) return
    setSubmitted(true)
    if (validate(selected)) {
      setSolved(true)
      onCorrect()
    } else {
      onIncorrect?.()
    }
  }

  function handleRetry() {
    // Keep the selected cards so the learner can swap only the wrong card(s)
    // instead of re-picking the whole five-card hand.
    onAttemptReset?.()
    setSubmitted(false)
    setSolved(false)
  }

  function cardStateFor(card: CardId): CardState {
    const isSel = selectedSet.has(card)
    if (!isSel) return 'idle'
    if (submitted) return solved ? 'ok' : 'bad'
    return 'active'
  }

  function renderCard(card: CardId, index: number) {
    const isSel = selectedSet.has(card)
    return (
      <SelectCard
        key={card}
        id={card}
        size="md"
        state={cardStateFor(card)}
        disabled={locked || (!isSel && atMax)}
        dealIndex={index}
        reduceMotion={reduceMotion}
        onClick={() => toggle(card)}
      />
    )
  }

  const description = submitted ? describe(selected) : null

  return (
    <div className="space-y-4">
      {helperText && <p className="text-center text-sm text-slate-600">{helperText}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-3 shadow-inner">
        {bySuit ? (
          <div className="mx-auto flex w-max flex-col gap-2">
            {CARD_SUITS.map((suit) => (
              <div key={suit} className="flex items-center gap-1.5">
                <span
                  className={`w-4 shrink-0 ${isRedSuit(suit) ? 'text-rose-300' : 'text-slate-300'}`}
                  aria-hidden="true"
                >
                  <SuitIcon suit={suit} className="h-3.5 w-3.5" />
                </span>
                {cardsBySuit(suit)
                  .filter((card) => cards.includes(card))
                  .map((card, ri) => renderCard(card, CARD_SUITS.indexOf(suit) * 13 + ri))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            {cards.map((card, i) => renderCard(card, i))}
          </div>
        )}
      </div>

      {description && (
        <p
          className="hr-reveal rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
          role="status"
          aria-live="polite"
        >
          {description}
        </p>
      )}

      <CheckPanel
        canSubmit={selected.length === 5 && !locked}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        allowRetry={allowRetry}
      />
    </div>
  )
}

function BuildHand({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
  reduceMotion,
}: HandRankerProps & { reduceMotion: boolean }) {
  const pool = useMemo(() => config.pool ?? fullDeck(), [config.pool])
  const target = config.targetCategory ?? answer.category ?? 'flush'
  const bySuit = pool.length > 16

  function validate(selected: CardId[]): boolean {
    if (selected.length !== 5) return false
    return evaluateFive(selected).category === target
  }

  function describe(selected: CardId[]): string | null {
    if (selected.length !== 5) return null
    return `You made: ${evaluateFive(selected).label}.`
  }

  const helper = config.helperText ?? `Tap five cards that make a ${CATEGORY_LABEL[target].toLowerCase()}.`

  return (
    <CardSelectMode
      cards={pool}
      bySuit={bySuit}
      helperText={helper}
      initialSelected={answer.cards ?? []}
      validate={validate}
      describe={describe}
      onCorrect={onCorrect}
      onIncorrect={onIncorrect}
      onAttemptReset={onAttemptReset}
      disabled={disabled}
      initialSolved={initialSolved}
      allowRetry={allowRetry}
      reduceMotion={reduceMotion}
    />
  )
}

function PickBestFive({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
  reduceMotion,
}: HandRankerProps & { reduceMotion: boolean }) {
  const cards = useMemo(() => config.cards ?? [], [config.cards])
  const best = useMemo<EvaluatedHand | null>(
    () => (cards.length >= 5 ? evaluateBest(cards) : null),
    [cards],
  )

  function validate(selected: CardId[]): boolean {
    if (selected.length !== 5 || !best) return false
    return compareHands(evaluateFive(selected), best) === 0
  }

  function describe(selected: CardId[]): string | null {
    if (selected.length !== 5) return null
    return `Your five: ${evaluateFive(selected).label}.`
  }

  const helper = config.helperText ?? 'Tap the five cards that make your best possible hand.'
  // Default solved selection = the evaluator's best five (used only for initialSolved).
  const initialSelected = answer.cards ?? best?.cards ?? []

  return (
    <CardSelectMode
      cards={cards}
      bySuit={false}
      helperText={helper}
      initialSelected={initialSelected}
      validate={validate}
      describe={describe}
      onCorrect={onCorrect}
      onIncorrect={onIncorrect}
      onAttemptReset={onAttemptReset}
      disabled={disabled}
      initialSolved={initialSolved}
      allowRetry={allowRetry}
      reduceMotion={reduceMotion}
    />
  )
}

/**
 * `hand-ranker` (design doc §5.2) — five modes for learning Texas Hold'em hand
 * strength. Every mode validates against the pure evaluator in
 * `lib/poker/handEvaluator.ts` rather than hardcoded answers:
 *   identify-category → pick === evaluateBest(cards).category
 *   order-categories  → order matches HAND_CATEGORY_RANK (strongest→weakest)
 *   order-hands       → each adjacent pair non-increasing via compareHands
 *   build-hand        → evaluateFive(selected).category === targetCategory
 *   pick-best-five    → compareHands(evaluateFive(selected), evaluateBest(cards)) === 0
 * Calls onCorrect() only on a valid submission; onIncorrect() otherwise.
 */
export function HandRanker(props: HandRankerProps) {
  const reduceMotion = usePrefersReducedMotion()
  let body: React.ReactNode
  switch (props.config.mode) {
    case 'identify-category':
      body = <IdentifyCategory {...props} reduceMotion={reduceMotion} />
      break
    case 'order-categories':
      body = <OrderCategories {...props} reduceMotion={reduceMotion} />
      break
    case 'order-hands':
      body = <OrderHands {...props} reduceMotion={reduceMotion} />
      break
    case 'build-hand':
      body = <BuildHand {...props} reduceMotion={reduceMotion} />
      break
    case 'pick-best-five':
      body = <PickBestFive {...props} reduceMotion={reduceMotion} />
      break
    default:
      body = null
  }

  return (
    <>
      <style>{STYLES}</style>
      {body}
    </>
  )
}
