import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import {
  cardLabel,
  isRedSuit,
  parseCardId,
  type CardId,
  type CardSuit,
  type HandRankingLadderAnswer,
  type HandRankingLadderConfig,
} from '../../../types/lesson'
import type { HandCategory } from '../../../types/poker'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'

/**
 * `hand-ranking-ladder` — a non-graded "explore the ladder" display used in
 * Lesson 2. The ten poker hand categories are listed strongest → weakest; each
 * row is a button that, on **click/tap** (toggle, just like a glossary-term
 * popover), reveals an example five-card hand drawn as real card visuals.
 *
 * - Click to open, click again / click outside / Escape to close (focus returns
 *   to the row). The example is rendered as **cards** (rank + crisp inline-SVG
 *   suit), never a words-only description.
 * - The popover is portalled to <body> and clamped to the viewport so it never
 *   overflows on mobile, and its entrance animation is suppressed under
 *   `prefers-reduced-motion`.
 * - There is nothing to grade, so the step auto-completes once the learner has
 *   opened at least `answer.minExamplesRevealed` examples (default 1) — no
 *   misleading "Check answer", mirroring `board-dealer`'s observational
 *   reveal-gate.
 *
 * The card visuals + suit SVGs here are intentionally self-contained (this file
 * owns them) so it never depends on `CardDeck.tsx`.
 */
type HandRankingLadderProps = InteractionProps & {
  config: HandRankingLadderConfig
  answer: HandRankingLadderAnswer
}

type LadderEntry = {
  category: HandCategory
  /** Display name shown on the row + as the popover heading. */
  name: string
  /** One-line descriptor shown under the name. */
  blurb: string
  /** Example five-card hand (verified against the evaluator) shown as cards. */
  example: CardId[]
}

/**
 * The ten categories, strongest → weakest. Every `example` has been checked
 * against `lib/poker/handEvaluator.evaluateFive` so the hand truly is that
 * category (e.g. the flush A♦J♦8♦5♦2♦ is not accidentally a straight flush,
 * and the straight 10♣9♦8♥7♠6♣ is not accidentally a flush).
 */
const LADDER: LadderEntry[] = [
  {
    category: 'royal-flush',
    name: 'Royal flush',
    blurb: 'A-K-Q-J-10, all one suit',
    example: ['AS', 'KS', 'QS', 'JS', '10S'],
  },
  {
    category: 'straight-flush',
    name: 'Straight flush',
    blurb: 'Five in a row, all one suit',
    example: ['9H', '8H', '7H', '6H', '5H'],
  },
  {
    category: 'quads',
    name: 'Four of a kind',
    blurb: 'All four cards of one rank, plus a kicker',
    example: ['QC', 'QD', 'QH', 'QS', 'KD'],
  },
  {
    category: 'full-house',
    name: 'Full house',
    blurb: 'Three of a kind plus a pair',
    example: ['KS', 'KH', 'KD', '7H', '7C'],
  },
  {
    category: 'flush',
    name: 'Flush',
    blurb: 'Five of one suit, not in sequence',
    example: ['AD', 'JD', '8D', '5D', '2D'],
  },
  {
    category: 'straight',
    name: 'Straight',
    blurb: 'Five in a row, mixed suits',
    example: ['10C', '9D', '8H', '7S', '6C'],
  },
  {
    category: 'trips',
    name: 'Three of a kind',
    blurb: 'Three cards of one rank, plus two kickers',
    example: ['8H', '8D', '8S', 'AC', 'KD'],
  },
  {
    category: 'two-pair',
    name: 'Two pair',
    blurb: 'Two different pairs, plus a kicker',
    example: ['AS', 'AH', '9D', '9C', 'KD'],
  },
  {
    category: 'pair',
    name: 'One pair',
    blurb: 'A single matched pair, plus three kickers',
    example: ['JS', 'JH', 'AD', 'QC', '5S'],
  },
  {
    category: 'high-card',
    name: 'High card',
    blurb: 'None of the above — the highest card plays',
    example: ['AS', 'KD', '9C', '6H', '2S'],
  },
]

const STYLES = `
.hrl-popover {
  position: fixed;
  z-index: 60;
  width: max-content;
  max-width: min(320px, calc(100vw - 16px));
  padding: 0.6rem 0.7rem;
  border-radius: 0.85rem;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  box-shadow:
    0 2px 6px rgba(7, 21, 15, 0.09),
    0 18px 36px -18px rgba(12, 42, 30, 0.45);
  animation: hrlPop 0.16s ease-out both;
}
.hrl-popover__arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  transform: rotate(45deg);
  background: #ffffff;
  border: 1px solid #e2e8f0;
}
.hrl-popover[data-placement='top'] .hrl-popover__arrow {
  bottom: -6px;
  border-top: 0;
  border-left: 0;
}
.hrl-popover[data-placement='bottom'] .hrl-popover__arrow {
  top: -6px;
  border-bottom: 0;
  border-right: 0;
}
.hrl-chevron { transition: transform 0.18s ease; }
.hrl-row[aria-expanded='true'] .hrl-chevron { transform: rotate(180deg); }
@keyframes hrlPop {
  from { opacity: 0; transform: translateY(2px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .hrl-popover { animation: none; }
  .hrl-chevron { transition: none; }
}
`

/** Crisp vector suit symbol (no emoji) — colour is inherited via currentColor. */
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

/** A single example card face: corner rank + suit, with a centred suit pip. */
function ExampleCard({ id }: { id: CardId }) {
  const { rank, suit } = parseCardId(id)
  const color = isRedSuit(suit) ? 'text-rose-600' : 'text-slate-900'
  return (
    <span
      role="img"
      aria-label={cardLabel(id)}
      className={`relative block h-14 w-10 shrink-0 rounded-md border border-slate-200 bg-white shadow-sm ${color}`}
    >
      <span className="absolute left-0.5 top-0.5 flex flex-col items-center leading-none">
        <span className="text-[0.6rem] font-bold tabular-nums">{rank}</span>
        <SuitIcon suit={suit} className="h-1.5 w-1.5" />
      </span>
      <span className="absolute inset-0 flex items-center justify-center">
        <SuitIcon suit={suit} className="h-4 w-4" />
      </span>
      <span className="absolute bottom-0.5 right-0.5 flex rotate-180 flex-col items-center leading-none">
        <span className="text-[0.6rem] font-bold tabular-nums">{rank}</span>
        <SuitIcon suit={suit} className="h-1.5 w-1.5" />
      </span>
    </span>
  )
}

type Placement = 'top' | 'bottom'
type Coords = { top: number; left: number; placement: Placement; arrowLeft: number }

const GAP = 8 // space between the row and the popover
const MARGIN = 8 // minimum gap from the viewport edge
const ARROW = 10 // arrow square size in px

export function HandRankingLadder({
  config,
  answer,
  onCorrect,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: HandRankingLadderProps) {
  const minExamples = Math.max(1, answer.minExamplesRevealed ?? 1)
  const helperText =
    config.helperText ??
    'Tap any hand to reveal an example. Higher on the ladder always beats lower.'

  const [openCategory, setOpenCategory] = useState<HandCategory | null>(null)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [revealed, setRevealed] = useState<Set<HandCategory>>(new Set())
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const buttonRefs = useRef<Map<HandCategory, HTMLButtonElement>>(new Map())
  const popoverRef = useRef<HTMLDivElement>(null)
  // Mirror of `revealed` (so the completion check is event-driven and never a
  // setState-in-effect) + a one-shot guard so `onCorrect` fires exactly once.
  const revealedRef = useRef<Set<HandCategory>>(new Set())
  const completedRef = useRef(initialSolved)
  const popoverId = useId()

  const openEntry = useMemo(
    () => LADDER.find((e) => e.category === openCategory) ?? null,
    [openCategory],
  )

  const setButtonRef = useCallback(
    (category: HandCategory) => (el: HTMLButtonElement | null) => {
      if (el) buttonRefs.current.set(category, el)
      else buttonRefs.current.delete(category)
    },
    [],
  )

  const close = useCallback(() => setOpenCategory(null), [])

  // Toggle a row's example popover. Opening a new example also drives the
  // no-input completion gate straight from this event handler (event-driven, so
  // there is no setState-in-effect): once `minExamples` distinct examples have
  // been opened, the step auto-completes exactly once via the one-shot guard.
  const toggle = useCallback(
    (category: HandCategory) => {
      setOpenCategory((current) => (current === category ? null : category))

      if (revealedRef.current.has(category)) return
      const next = new Set(revealedRef.current)
      next.add(category)
      revealedRef.current = next
      setRevealed(next)

      if (!completedRef.current && !disabled && next.size >= minExamples) {
        completedRef.current = true
        setSubmitted(true)
        setSolved(true)
        onCorrect()
      }
    },
    [disabled, minExamples, onCorrect],
  )

  const updatePosition = useCallback(() => {
    if (!openCategory) return
    const button = buttonRefs.current.get(openCategory)
    const popover = popoverRef.current
    if (!button || !popover) return

    const rect = button.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const popWidth = popover.offsetWidth
    const popHeight = popover.offsetHeight

    // Horizontal: centre on the row, then clamp inside the viewport.
    const center = rect.left + rect.width / 2
    const left = Math.max(
      MARGIN,
      Math.min(center - popWidth / 2, viewportWidth - popWidth - MARGIN),
    )

    // Vertical: prefer dropping below the row; flip above when there isn't room.
    const roomAbove = rect.top - GAP - MARGIN
    const roomBelow = viewportHeight - rect.bottom - GAP - MARGIN
    let placement: Placement
    let top: number
    if (popHeight <= roomBelow) {
      placement = 'bottom'
      top = rect.bottom + GAP
    } else if (popHeight <= roomAbove) {
      placement = 'top'
      top = rect.top - popHeight - GAP
    } else if (roomBelow >= roomAbove) {
      placement = 'bottom'
      top = Math.min(rect.bottom + GAP, viewportHeight - popHeight - MARGIN)
    } else {
      placement = 'top'
      top = Math.max(MARGIN, rect.top - popHeight - GAP)
    }

    const arrowCenter = Math.max(ARROW, Math.min(center - left, popWidth - ARROW))
    setCoords({ top, left, placement, arrowLeft: arrowCenter - ARROW / 2 })
  }, [openCategory])

  // Measure + place when an example opens, then keep in sync while open. The
  // popover only renders while an example is open and useLayoutEffect runs
  // before paint, so stale coords from a previous open are never visible.
  useLayoutEffect(() => {
    if (openCategory) updatePosition()
  }, [openCategory, updatePosition])

  useEffect(() => {
    if (!openCategory) return
    const handle = () => updatePosition()
    window.addEventListener('scroll', handle, true)
    window.addEventListener('resize', handle)
    return () => {
      window.removeEventListener('scroll', handle, true)
      window.removeEventListener('resize', handle)
    }
  }, [openCategory, updatePosition])

  // Dismiss on outside pointer-down or Escape (Escape returns focus to the row).
  useEffect(() => {
    if (!openCategory) return
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null
      if (!target) return
      const button = openCategory ? buttonRefs.current.get(openCategory) : null
      if (button?.contains(target) || popoverRef.current?.contains(target)) return
      close()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      const button = openCategory ? buttonRefs.current.get(openCategory) : null
      close()
      button?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openCategory, close])

  const remaining = Math.max(0, minExamples - revealed.size)

  return (
    <div className="space-y-4">
      <style>{STYLES}</style>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{helperText}</p>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
          Strongest first
        </span>
      </div>

      <ol className="space-y-1.5">
        {LADDER.map((entry, index) => {
          const isOpen = openCategory === entry.category
          const wasRevealed = revealed.has(entry.category)
          return (
            <li key={entry.category}>
              <button
                ref={setButtonRef(entry.category)}
                type="button"
                className={`hrl-row flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition hover:border-brand-300 hover:bg-brand-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  isOpen ? 'border-brand-500 bg-brand-50/60' : 'border-slate-200 bg-white'
                }`}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                aria-describedby={isOpen ? popoverId : undefined}
                aria-label={`${entry.name}. ${entry.blurb}. ${
                  isOpen ? 'Hide' : 'Show'
                } example hand.`}
                onClick={() => toggle(entry.category)}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                    isOpen ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-900">{entry.name}</span>
                    {wasRevealed && (
                      <span
                        className="text-emerald-600"
                        aria-hidden="true"
                        title="Example viewed"
                      >
                        ✓
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-slate-500">{entry.blurb}</span>
                </span>
                <span
                  className="flex shrink-0 items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-600"
                  aria-hidden="true"
                >
                  <span className="hidden sm:inline">Example</span>
                  <svg
                    className="hrl-chevron h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {!solved && (
        <p className="text-center text-xs text-slate-500" role="status" aria-live="polite">
          {remaining > 0
            ? `Tap ${remaining === 1 ? 'a hand' : `${remaining} hands`} to reveal example cards, then continue.`
            : 'Explore as many as you like, then continue.'}
        </p>
      )}

      <CheckPanel
        canSubmit={false}
        submitted={submitted}
        solved={solved}
        onSubmit={() => {}}
        onRetry={() => {}}
        allowRetry={allowRetry}
        hideSubmit
        confirmation="✓ Tap any rank to compare example hands."
      />

      {openEntry &&
        createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-label={`Example of a ${openEntry.name.toLowerCase()}`}
            className="hrl-popover"
            data-placement={coords?.placement ?? 'bottom'}
            style={{
              top: coords ? `${coords.top}px` : 0,
              left: coords ? `${coords.left}px` : 0,
              visibility: coords ? 'visible' : 'hidden',
            }}
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-xs font-bold text-slate-900">{openEntry.name}</span>
              <span className="text-[0.65rem] font-medium text-slate-400">Example hand</span>
            </div>
            <div className="flex justify-center gap-1">
              {openEntry.example.map((card) => (
                <ExampleCard key={card} id={card} />
              ))}
            </div>
            <span
              className="hrl-popover__arrow"
              aria-hidden="true"
              style={coords ? { left: `${coords.arrowLeft}px` } : undefined}
            />
          </div>,
          document.body,
        )}
    </div>
  )
}
