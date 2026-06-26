import { useEffect, useRef, useState } from 'react'
import {
  cardLabel,
  isRedSuit,
  parseCardId,
  type CardId,
  type HandRankingLadderAnswer,
  type HandRankingLadderConfig,
} from '../../../types/lesson'
import type { HandCategory } from '../../../types/poker'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { SuitIcon } from './cards/PlayingCardKit'

/**
 * `hand-ranking-ladder`: a non-graded "explore the ladder" display used in
 * Lesson 2. The ten poker hand categories are listed strongest to weakest, and
 * every row shows its example five-card hand (drawn as real card visuals) by
 * default, so the learner can compare all ten at a glance with zero interaction.
 *
 * - The example hands are always visible. Clicking or pressing a row only
 *   highlights it (handy when comparing two ranks); it is never required to see
 *   a hand. Each card carries an accessible label, and the row's example is
 *   announced as static content.
 * - There is nothing to grade, and every example is shown from the start, so the
 *   observational reveal-gate (`answer.minExamplesRevealed`) is auto-satisfied on
 *   mount: the step completes once with no clicking and no misleading
 *   "Check answer", mirroring `board-dealer`'s reveal-gate.
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
  /** Display name shown on the row. */
  name: string
  /** One-line descriptor shown under the name. */
  blurb: string
  /** Example five-card hand (verified against the evaluator) shown as cards. */
  example: CardId[]
}

/**
 * The ten categories, strongest to weakest. Every `example` has been checked
 * against `lib/poker/handEvaluator.evaluateFive` so the hand truly is that
 * category (e.g. the flush A-J-8-5-2 of diamonds is not accidentally a straight
 * flush, and the straight 10-9-8-7-6 is not accidentally a flush).
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
    blurb: 'None of the above, the highest card plays',
    example: ['AS', 'KD', '9C', '6H', '2S'],
  },
]

/** A compact example card face: corner rank + suit, with a centred suit pip. */
function ExampleCard({ id }: { id: CardId }) {
  const { rank, suit } = parseCardId(id)
  const color = isRedSuit(suit) ? 'text-rose-600' : 'text-slate-900'
  return (
    <span
      role="img"
      aria-label={cardLabel(id)}
      className={`relative block h-12 w-9 shrink-0 rounded-md border border-slate-200 bg-white shadow-sm ${color}`}
    >
      <span className="absolute left-0.5 top-0.5 flex flex-col items-center leading-none">
        <span className="text-[0.55rem] font-bold tabular-nums">{rank}</span>
        <SuitIcon suit={suit} className="h-1.5 w-1.5" />
      </span>
      <span className="absolute inset-0 flex items-center justify-center">
        <SuitIcon suit={suit} className="h-3.5 w-3.5" />
      </span>
      <span className="absolute bottom-0.5 right-0.5 flex rotate-180 flex-col items-center leading-none">
        <span className="text-[0.55rem] font-bold tabular-nums">{rank}</span>
        <SuitIcon suit={suit} className="h-1.5 w-1.5" />
      </span>
    </span>
  )
}

export function HandRankingLadder({
  config,
  answer,
  onCorrect,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: HandRankingLadderProps) {
  const helperText =
    config.helperText ??
    'Each rank shows an example five-card hand. Higher on the ladder always beats lower.'

  // Every example renders by default, so the observational reveal-gate ("open at
  // least `requiredExamples` examples") is met with zero interaction.
  const requiredExamples = Math.max(1, answer.minExamplesRevealed ?? 1)
  const gateSatisfied = LADDER.length >= requiredExamples
  const autoSolved = !disabled && gateSatisfied

  // A click only highlights a row (useful for side-by-side comparison); it is
  // never needed to see an example.
  const [selected, setSelected] = useState<HandCategory | null>(null)
  const [solved, setSolved] = useState(initialSolved || autoSolved)
  // One-shot guard so `onCorrect` fires exactly once.
  const completedRef = useRef(initialSolved)

  // Auto-complete the reveal-gate on mount (or once re-enabled): there is no
  // answer to check and all examples are already visible, so mark the step
  // solved exactly once and let the learner proceed with the lesson's Continue.
  useEffect(() => {
    if (completedRef.current || disabled || !gateSatisfied) return
    completedRef.current = true
    setSolved(true)
    onCorrect()
  }, [disabled, gateSatisfied, onCorrect])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{helperText}</p>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
          Strongest first
        </span>
      </div>

      <ol className="space-y-1.5" aria-label="Poker hands from strongest to weakest">
        {LADDER.map((entry, index) => {
          const isSelected = selected === entry.category
          return (
            <li key={entry.category}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() =>
                  setSelected((current) => (current === entry.category ? null : entry.category))
                }
                className={`flex w-full flex-col gap-3 rounded-xl border px-3 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:flex-row sm:items-center ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/60 shadow-sm'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <span className="flex min-w-0 items-center gap-3 sm:flex-1">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                      isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{entry.name}</span>
                    <span className="block text-xs text-slate-500">{entry.blurb}</span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                  {entry.example.map((card) => (
                    <ExampleCard key={card} id={card} />
                  ))}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <CheckPanel
        canSubmit={false}
        submitted={solved}
        solved={solved}
        onSubmit={() => {}}
        onRetry={() => {}}
        allowRetry={allowRetry}
        hideSubmit
        confirmation="✓ Example hands are shown for every rank."
      />
    </div>
  )
}
