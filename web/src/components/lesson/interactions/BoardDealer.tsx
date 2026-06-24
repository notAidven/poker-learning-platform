import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  cardLabel,
  fullDeck,
  isRedSuit,
  parseCardId,
  type BoardDealerAnswer,
  type BoardDealerConfig,
  type CardId,
  type CardSuit,
} from '../../../types/lesson'
import type { HandCategory, PokerStreet } from '../../../types/poker'
import { evaluateHoldem } from '../../../lib/poker/handEvaluator'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * `board-dealer` (design doc §5.3). Deals the hole + community cards street by
 * street and covers two uses:
 *
 *  1. **Experiential reveal-gate** (Lessons 1 & 6): step through the streets.
 *     This is a no-input "watch it happen" gate, so there is no "Check answer"
 *     to press — it auto-completes (showing a small "✓ All cards dealt"
 *     confirmation) once `answer.minStreetsRevealed` streets are revealed.
 *     Mirrors `CardDeck`'s `draw-tally` `minDraws`.
 *  2. **`askBestHandAt`** (Lesson 3): at each listed street the learner names their
 *     best made hand; the pick is validated against `evaluateHoldem(hole, boardSoFar)`.
 *
 * Random/`'deal'` configs are reproducible via `config.seed`.
 */
type BoardDealerProps = InteractionProps & {
  config: BoardDealerConfig
  answer: BoardDealerAnswer
}

const DEFAULT_STREETS: PokerStreet[] = ['preflop', 'flop', 'turn', 'river']
const COMMUNITY_PER_STREET: Record<PokerStreet, number> = { preflop: 0, flop: 3, turn: 1, river: 1 }
const STREET_NAME: Record<PokerStreet, string> = {
  preflop: 'Pre-flop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
}
const DEAL_LABEL: Record<PokerStreet, string> = {
  preflop: 'Deal hole cards',
  flop: 'Deal the flop',
  turn: 'Deal the turn',
  river: 'Deal the river',
}

const CATEGORY_ORDER: HandCategory[] = [
  'high-card',
  'pair',
  'two-pair',
  'trips',
  'straight',
  'flush',
  'full-house',
  'quads',
  'straight-flush',
  'royal-flush',
]
const CATEGORY_LABEL: Record<HandCategory, string> = {
  'high-card': 'High card',
  pair: 'One pair',
  'two-pair': 'Two pair',
  trips: 'Three of a kind',
  straight: 'Straight',
  flush: 'Flush',
  'full-house': 'Full house',
  quads: 'Four of a kind',
  'straight-flush': 'Straight flush',
  'royal-flush': 'Royal flush',
}

/** Seeded RNG (mulberry32) + Fisher–Yates so 'random'/'deal' deals are reproducible. */
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(cards: CardId[], rng: () => number): CardId[] {
  const a = [...cards]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const STYLES = `
.bd-scene { perspective: 1000px; }
.bd-deal { animation: bd-deal 0.44s cubic-bezier(0.34, 1.4, 0.64, 1) backwards; }
@keyframes bd-deal {
  from { opacity: 0; transform: translateY(-26px) rotateY(-46deg) scale(0.82); }
  to { opacity: 1; transform: none; }
}
`

/** Crisp vector suit symbol — color comes from the parent via currentColor. */
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

function CardFace({ id, animate, delay }: { id: CardId; animate: boolean; delay: number }) {
  const { rank, suit } = parseCardId(id)
  const color = isRedSuit(suit) ? 'text-rose-600' : 'text-slate-900'
  return (
    <span
      className={`relative block h-16 w-11 rounded-md border-2 border-slate-200 bg-white shadow-sm ${
        animate ? 'bd-deal' : ''
      }`}
      style={animate ? { animationDelay: `${delay}ms` } : undefined}
      role="img"
      aria-label={cardLabel(id)}
    >
      <span className={`absolute left-1 top-0.5 flex flex-col items-center leading-none ${color}`}>
        <span className="text-[0.7rem] font-bold tabular-nums">{rank}</span>
        <SuitIcon suit={suit} className="h-2 w-2" />
      </span>
      <span className={`absolute inset-0 flex items-center justify-center ${color}`}>
        <SuitIcon suit={suit} className="h-5 w-5" />
      </span>
      <span
        className={`absolute bottom-0.5 right-1 flex rotate-180 flex-col items-center leading-none ${color}`}
      >
        <span className="text-[0.7rem] font-bold tabular-nums">{rank}</span>
        <SuitIcon suit={suit} className="h-2 w-2" />
      </span>
    </span>
  )
}

function CardBack({
  small = false,
  animate = false,
  delay = 0,
}: {
  small?: boolean
  animate?: boolean
  delay?: number
}) {
  return (
    <span
      className={`block rounded-md border-2 border-white bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm ${
        small ? 'h-12 w-8' : 'h-16 w-11'
      } ${animate ? 'bd-deal' : ''}`}
      style={animate ? { animationDelay: `${delay}ms` } : undefined}
      aria-hidden="true"
    >
      <span
        className="dot-field block h-full w-full rounded-sm"
        style={{ '--dot-size': '6px' } as CSSProperties}
      />
    </span>
  )
}

function EmptySlot({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`block rounded-md border-2 border-dashed border-slate-300/80 bg-slate-50 ${
        small ? 'h-12 w-8' : 'h-16 w-11'
      }`}
      aria-hidden="true"
    />
  )
}

export function BoardDealer({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: BoardDealerProps) {
  const reduceMotion = usePrefersReducedMotion()

  const streets = useMemo<PokerStreet[]>(() => config.streets ?? DEFAULT_STREETS, [config.streets])
  const askedStreets = useMemo<PokerStreet[]>(
    () => (config.askBestHandAt ?? []).filter((s) => streets.includes(s)),
    [config.askBestHandAt, streets],
  )

  // One stable seed: honor config.seed, otherwise pick once so the deal is fixed
  // across re-renders (revealing a street must not re-shuffle the deck).
  const effectiveSeed = useMemo(
    () => config.seed ?? Math.floor(Math.random() * 1_000_000_000),
    [config.seed],
  )

  const maxCommunity = useMemo(
    () => streets.reduce((n, s) => n + COMMUNITY_PER_STREET[s], 0),
    [streets],
  )

  const deal = useMemo(() => {
    const fixedHole = config.hole && config.hole !== 'random' ? config.hole : null
    const fixedBoard = Array.isArray(config.board) ? config.board : null
    const used = new Set<CardId>([...(fixedHole ?? []), ...(fixedBoard ?? [])])
    const deck = shuffle(
      fullDeck().filter((c) => !used.has(c)),
      makeRng(effectiveSeed),
    )
    let di = 0
    const hole: [CardId, CardId] = fixedHole ?? [deck[di++], deck[di++]]
    const community: CardId[] = [...(fixedBoard ?? [])].slice(0, maxCommunity)
    while (community.length < maxCommunity) community.push(deck[di++])
    return { hole, community }
  }, [config.hole, config.board, effectiveSeed, maxCommunity])

  /** Community cards on the board once `revealedCount` streets are showing. */
  const communityCountUpTo = (revealedCount: number) => {
    let n = 0
    for (let i = 0; i < revealedCount; i++) n += COMMUNITY_PER_STREET[streets[i]]
    return n
  }

  /** The true best-hand category at each asked street (the evaluator is the source of truth). */
  const expectedByStreet = useMemo(() => {
    const out = {} as Record<PokerStreet, HandCategory>
    const commUpTo = (rc: number) => {
      let n = 0
      for (let i = 0; i < rc; i++) n += COMMUNITY_PER_STREET[streets[i]]
      return n
    }
    for (const s of askedStreets) {
      const authored = answer.bestHandByStreet?.[s]
      if (authored) {
        out[s] = authored
        continue
      }
      const board = deal.community.slice(0, commUpTo(streets.indexOf(s) + 1))
      out[s] =
        board.length + 2 >= 5
          ? evaluateHoldem(deal.hole, board).category
          : parseCardId(deal.hole[0]).rank === parseCardId(deal.hole[1]).rank
            ? 'pair'
            : 'high-card'
    }
    return out
  }, [askedStreets, streets, answer.bestHandByStreet, deal])

  const preflopIndex = streets.indexOf('preflop')
  const maxAskedIdx = askedStreets.length
    ? Math.max(...askedStreets.map((s) => streets.indexOf(s)))
    : -1
  const requiredReveals =
    answer.minStreetsRevealed ?? (askedStreets.length ? maxAskedIdx + 1 : streets.length)

  // Pure reveal-gate: a no-input / observational step (no `askBestHandAt` picks),
  // e.g. "deal a full hand and watch the cards appear." There is nothing to
  // "check", so it auto-completes (below) instead of showing a "Check answer".
  const isRevealGate = askedStreets.length === 0

  const [revealed, setRevealed] = useState(initialSolved ? streets.length : 0)
  const [picks, setPicks] = useState<Partial<Record<PokerStreet, HandCategory>>>(
    initialSolved ? { ...expectedByStreet } : {},
  )
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const holeShown = preflopIndex === -1 ? true : revealed > preflopIndex
  const animate = !reduceMotion && !initialSolved
  const opponents = config.opponents ?? 0

  // Auto-complete the reveal-gate: once the required streets are showing, mark
  // the step solved exactly once so the learner just proceeds with the lesson's
  // own Continue button — no "Check answer" for a step with no answer.
  useEffect(() => {
    if (!isRevealGate || submitted || disabled) return
    if (revealed < requiredReveals) return
    setSubmitted(true)
    setSolved(true)
    onCorrect()
  }, [isRevealGate, submitted, disabled, revealed, requiredReveals, onCorrect])

  const communityGroups = streets
    .filter((s) => COMMUNITY_PER_STREET[s] > 0)
    .map((s) => {
      const idx = streets.indexOf(s)
      const before = communityCountUpTo(idx)
      const count = COMMUNITY_PER_STREET[s]
      return {
        street: s,
        idx,
        cards: deal.community.slice(before, before + count),
        revealedHere: revealed > idx,
      }
    })

  function dealNext() {
    if (locked || revealed >= streets.length) return
    setRevealed((r) => Math.min(r + 1, streets.length))
  }

  const askedRevealed = askedStreets.every((s) => revealed > streets.indexOf(s))
  const askedFilled = askedStreets.every((s) => picks[s] != null)
  const canSubmit = !locked && revealed >= requiredReveals && askedRevealed && askedFilled

  function handleSubmit() {
    if (!canSubmit) return
    setSubmitted(true)
    const allCorrect = askedStreets.every((s) => picks[s] === expectedByStreet[s])
    if (allCorrect) {
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

  // Announce the most recently revealed street for screen readers.
  const lastStreet = revealed > 0 ? streets[revealed - 1] : null
  let announcement = 'No cards dealt yet.'
  if (lastStreet === 'preflop') {
    announcement = `Your hole cards: ${deal.hole.map(cardLabel).join(', ')}.`
  } else if (lastStreet) {
    const group = communityGroups.find((g) => g.street === lastStreet)
    if (group) announcement = `${STREET_NAME[lastStreet]}: ${group.cards.map(cardLabel).join(', ')}.`
  }

  const annotate = config.annotateStreets ?? true
  const nextStreet = revealed < streets.length ? streets[revealed] : null

  return (
    <div className="space-y-4">
      <style>{STYLES}</style>

      {config.helperText && <p className="text-center text-sm text-slate-600">{config.helperText}</p>}

      <div className="bd-scene space-y-4 rounded-2xl border border-emerald-900/10 bg-gradient-to-b from-emerald-50 to-white p-4 shadow-inner">
        {opponents > 0 ? (
          <div className="flex flex-wrap items-end justify-center gap-4">
            {Array.from({ length: opponents }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="flex gap-1">
                  {holeShown ? (
                    <>
                      <CardBack small animate={animate} />
                      <CardBack small animate={animate} delay={70} />
                    </>
                  ) : (
                    <>
                      <EmptySlot small />
                      <EmptySlot small />
                    </>
                  )}
                </div>
                <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                  {opponents > 1 ? `Opponent ${i + 1}` : 'Opponent'}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-end justify-center gap-3">
          {communityGroups.map((group) => (
            <div key={group.street} className="flex flex-col items-center gap-1">
              <div className="flex gap-1.5">
                {group.cards.map((c, i) =>
                  group.revealedHere ? (
                    <CardFace key={c} id={c} animate={animate} delay={i * 90} />
                  ) : (
                    <EmptySlot key={`${group.street}-${i}`} />
                  ),
                )}
              </div>
              {annotate && (
                <span
                  className={`text-[0.65rem] font-semibold uppercase tracking-wide ${
                    group.revealedHere ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {STREET_NAME[group.street]}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-1.5">
            {holeShown ? (
              deal.hole.map((c, i) => <CardFace key={c} id={c} animate={animate} delay={i * 90} />)
            ) : (
              <>
                <EmptySlot />
                <EmptySlot />
              </>
            )}
          </div>
          <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-600">
            You
          </span>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {nextStreet && !locked && (
        <button
          type="button"
          onClick={dealNext}
          className="chip-3d min-h-11 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          {DEAL_LABEL[nextStreet]}
        </button>
      )}

      {askedStreets.length > 0 && (
        <div className="space-y-3">
          {askedStreets.map((s) => {
            if (revealed <= streets.indexOf(s)) return null
            const state = submitted ? (picks[s] === expectedByStreet[s] ? 'ok' : 'bad') : 'idle'
            const border =
              state === 'ok'
                ? 'border-emerald-500'
                : state === 'bad'
                  ? 'border-rose-400'
                  : 'border-slate-200'
            return (
              <div key={s}>
                <label
                  htmlFor={`bd-pick-${s}`}
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Your best hand on the {STREET_NAME[s].toLowerCase()}?
                </label>
                <select
                  id={`bd-pick-${s}`}
                  value={picks[s] ?? ''}
                  disabled={locked}
                  onChange={(e) => setPicks((p) => ({ ...p, [s]: e.target.value as HandCategory }))}
                  className={`min-h-11 w-full rounded-xl border-2 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none disabled:opacity-70 ${border}`}
                >
                  <option value="" disabled>
                    Choose a hand category…
                  </option>
                  {CATEGORY_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
                {state === 'ok' && (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    Correct — {CATEGORY_LABEL[expectedByStreet[s]].toLowerCase()}.
                  </p>
                )}
                {state === 'bad' && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">
                    Best hand here: {CATEGORY_LABEL[expectedByStreet[s]].toLowerCase()}.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <CheckPanel
        canSubmit={canSubmit}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        allowRetry={allowRetry}
        hideSubmit={isRevealGate}
        confirmation={isRevealGate ? '✓ All cards dealt' : undefined}
      />
    </div>
  )
}
