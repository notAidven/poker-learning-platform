import { useEffect, useMemo, useState } from 'react'
import {
  cardLabel,
  fullDeck,
  parseCardId,
  type BoardDealerAnswer,
  type BoardDealerConfig,
  type CardId,
  type ShowdownWinner,
} from '../../../types/lesson'
import type { HandCategory, PokerStreet } from '../../../types/poker'
import { compareHands, evaluateHoldem } from '../../../lib/poker/handEvaluator'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { Button } from '../../ui/Button'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { BurnCard, CardBack, CardFace, CardKitStyles, DeckPile, EmptySlot } from './cards/PlayingCardKit'
import { mulberry32 } from '../../../lib/poker/rng'

/**
 * `board-dealer` (design doc §5.3). Deals the hole + community cards street by
 * street and covers three uses:
 *
 *  1. **Experiential reveal-gate** (Lessons 1 & 6): step through the streets.
 *     This is a no-input "watch it happen" gate, so there is no "Check answer"
 *     to press — it auto-completes (showing a small "✓ All cards dealt"
 *     confirmation) once `answer.minStreetsRevealed` streets are revealed.
 *  2. **`askBestHandAt`** (Lesson 3): at each listed street the learner names their
 *     best made hand; the pick is validated against `evaluateHoldem(hole, boardSoFar)`.
 *  3. **Showdown winner** (Lesson 3): with `config.villain` + `answer.winner`, the
 *     board deals to the river, flips the opponent's hole cards face-up, and asks
 *     "Who won?" (You / Opponent / Split). The pick is graded live with
 *     `compareHands(evaluateHoldem(hero,…), evaluateHoldem(villain,…))` — the authored
 *     `answer.winner` is only a cross-check, never the source of truth.
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

/** Showdown-winner choices, in the order they're shown. */
const SHOWDOWN_CHOICES: { value: ShowdownWinner; label: string }[] = [
  { value: 'hero', label: 'You' },
  { value: 'opponent', label: 'Opponent' },
  { value: 'split', label: 'Split' },
]

function shuffle(cards: CardId[], rng: () => number): CardId[] {
  const a = [...cards]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
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
  const showDeck = config.showDeck ?? true
  const showBurns = config.showBurns ?? true

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
    // Exclude the villain's known cards too so a random hole/board can never collide with them.
    const used = new Set<CardId>([
      ...(fixedHole ?? []),
      ...(fixedBoard ?? []),
      ...(config.villain ?? []),
    ])
    const deck = shuffle(
      fullDeck().filter((c) => !used.has(c)),
      mulberry32(effectiveSeed),
    )
    let di = 0
    const hole: [CardId, CardId] = fixedHole ?? [deck[di++], deck[di++]]
    const community: CardId[] = [...(fixedBoard ?? [])].slice(0, maxCommunity)
    while (community.length < maxCommunity) community.push(deck[di++])
    return { hole, community }
  }, [config.hole, config.board, config.villain, effectiveSeed, maxCommunity])

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

  // Showdown-winner mode: a known villain hand + an authored winner turns the
  // observational deal into a graded "who won?" question that opens after the river.
  const isShowdown = config.villain != null && answer.winner != null

  /**
   * Live showdown grading: build the best 5-card hand for hero and villain on the
   * full board and let `compareHands` decide the winner. This — not the authored
   * `answer.winner` — is the source of truth; the authored value is only a cross-check.
   */
  const showdown = useMemo(() => {
    if (!isShowdown || !config.villain) return null
    const hero = evaluateHoldem(deal.hole, deal.community)
    const villain = evaluateHoldem(config.villain, deal.community)
    const cmp = compareHands(hero, villain)
    const winner: ShowdownWinner = cmp > 0 ? 'hero' : cmp < 0 ? 'opponent' : 'split'
    return { hero, villain, winner }
  }, [isShowdown, config.villain, deal])

  const preflopIndex = streets.indexOf('preflop')
  const maxAskedIdx = askedStreets.length
    ? Math.max(...askedStreets.map((s) => streets.indexOf(s)))
    : -1
  const requiredReveals =
    answer.minStreetsRevealed ??
    (askedStreets.length ? maxAskedIdx + 1 : streets.length)

  // Pure reveal-gate: a no-input / observational step (no `askBestHandAt` picks and
  // no showdown question), e.g. "deal a full hand and watch the cards appear." There
  // is nothing to "check", so it auto-completes (below) instead of showing "Check answer".
  const isRevealGate = askedStreets.length === 0 && !isShowdown

  const [revealed, setRevealed] = useState(initialSolved ? streets.length : 0)
  const [picks, setPicks] = useState<Partial<Record<PokerStreet, HandCategory>>>(
    initialSolved ? { ...expectedByStreet } : {},
  )
  const [winnerPick, setWinnerPick] = useState<ShowdownWinner | null>(
    initialSolved && isShowdown ? (showdown?.winner ?? null) : null,
  )
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  // Dev-only cross-check: warn if the authored winner disagrees with the evaluator.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (showdown && answer.winner && showdown.winner !== answer.winner) {
      console.warn(
        `[board-dealer] authored winner "${answer.winner}" disagrees with the evaluator ("${showdown.winner}"); grading uses the evaluator.`,
      )
    }
  }, [showdown, answer.winner])

  const locked = disabled || submitted
  const holeShown = preflopIndex === -1 ? true : revealed > preflopIndex
  const animate = !reduceMotion && !initialSolved
  const villain = config.villain
  // A known villain counts as one opponent even if `opponents` was left unset.
  const opponents = villain ? Math.max(1, config.opponents ?? 1) : config.opponents ?? 0
  // The villain's hole cards flip face-up only once the whole board (incl. river) is out.
  const villainShown = isShowdown && revealed >= streets.length

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

  // Cards visibly off the deck, so the stock pile's count counts down realistically:
  // hole cards (hero + opponents), revealed community cards, and one burn per revealed street.
  const revealedCommunityCount = communityGroups.reduce(
    (n, g) => n + (g.revealedHere ? g.cards.length : 0),
    0,
  )
  const burnsShown = communityGroups.filter((g) => g.revealedHere).length
  const dealtToPlayers = holeShown ? 2 + opponents * 2 : 0
  const deckRemaining = Math.max(
    0,
    52 - dealtToPlayers - revealedCommunityCount - (showBurns ? burnsShown : 0),
  )

  function dealNext() {
    if (locked || revealed >= streets.length) return
    setRevealed((r) => Math.min(r + 1, streets.length))
  }

  const askedRevealed = askedStreets.every((s) => revealed > streets.indexOf(s))
  const askedFilled = askedStreets.every((s) => picks[s] != null)
  // Showdown needs the whole board out and a winner picked before Check unlocks.
  const showdownReady = !isShowdown || (revealed >= streets.length && winnerPick != null)
  const canSubmit =
    !locked && revealed >= requiredReveals && askedRevealed && askedFilled && showdownReady

  function handleSubmit() {
    if (!canSubmit) return
    setSubmitted(true)
    const streetsCorrect = askedStreets.every((s) => picks[s] === expectedByStreet[s])
    const showdownCorrect = !isShowdown || winnerPick === showdown?.winner
    if (streetsCorrect && showdownCorrect) {
      setSolved(true)
      onCorrect()
    } else {
      onIncorrect?.()
    }
  }

  function handleRetry() {
    // Keep the per-street best-hand picks and the showdown winner choice so a wrong
    // attempt only re-enables editing — the learner fixes the wrong pick and resubmits.
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

  const showdownVerdict =
    showdown == null
      ? ''
      : showdown.winner === 'hero'
        ? 'You win the pot.'
        : showdown.winner === 'opponent'
          ? 'Your opponent wins the pot.'
          : "It's a split pot. The hands tie."

  return (
    <div className="space-y-4">
      <CardKitStyles />

      {config.helperText && <p className="text-center text-sm text-slate-600">{config.helperText}</p>}

      <div className="pck-scene space-y-4 rounded-2xl border border-night-900/10 bg-gradient-to-b from-night-50 to-white p-4 shadow-inner">
        {opponents > 0 ? (
          <div className="flex flex-wrap items-end justify-center gap-4">
            {Array.from({ length: opponents }).map((_, i) => {
              // Only the first opponent is the known villain, and only after the river.
              const villainCards = villainShown && i === 0 ? villain : undefined
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="flex gap-1">
                    {villainCards ? (
                      villainCards.map((c, j) => (
                        <CardFace key={c} id={c} size="sm" animate={animate} delay={j * 90} />
                      ))
                    ) : holeShown ? (
                      <>
                        <CardBack size="sm" animate={animate} />
                        <CardBack size="sm" animate={animate} delay={70} />
                      </>
                    ) : (
                      <>
                        <EmptySlot size="sm" />
                        <EmptySlot size="sm" />
                      </>
                    )}
                  </div>
                  <span
                    className={`text-[0.65rem] font-semibold uppercase tracking-wide ${
                      villainCards ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {opponents > 1 ? `Opponent ${i + 1}` : 'Opponent'}
                  </span>
                </div>
              )
            })}
          </div>
        ) : null}

        <div className="flex flex-wrap items-end justify-center gap-3">
          {showDeck && (
            <div className="flex flex-col items-center gap-1">
              <DeckPile size="sm" count={deckRemaining} />
              <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                Deck
              </span>
            </div>
          )}
          {communityGroups.map((group) => (
            <div key={group.street} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                {showBurns && group.revealedHere && (
                  <BurnCard size="md" animate={animate} className="mr-0.5" />
                )}
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
                    group.revealedHere ? 'text-success-700' : 'text-slate-400'
                  }`}
                >
                  {group.revealedHere && showBurns ? `Burn + ${STREET_NAME[group.street]}` : STREET_NAME[group.street]}
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
        <Button type="button" fullWidth onClick={dealNext} className="chip-3d">
          {DEAL_LABEL[nextStreet]}
        </Button>
      )}

      {askedStreets.length > 0 && (
        <div className="space-y-3">
          {askedStreets.map((s) => {
            if (revealed <= streets.indexOf(s)) return null
            const state = submitted ? (picks[s] === expectedByStreet[s] ? 'ok' : 'bad') : 'idle'
            const border =
              state === 'ok'
                ? 'border-success-500'
                : state === 'bad'
                  ? 'border-danger-400'
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
                  <p className="mt-1 text-xs font-semibold text-success-700">
                    Correct: {CATEGORY_LABEL[expectedByStreet[s]].toLowerCase()}.
                  </p>
                )}
                {state === 'bad' && (
                  <p className="mt-1 text-xs font-semibold text-danger-600">
                    Best hand here: {CATEGORY_LABEL[expectedByStreet[s]].toLowerCase()}.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {isShowdown && villainShown && (
        <div className="space-y-3">
          <p className="text-center text-sm font-semibold text-slate-700">
            The opponent turns over their cards. Who won the pot?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SHOWDOWN_CHOICES.map((choice) => {
              const active = winnerPick === choice.value
              const isWinningChoice = showdown?.winner === choice.value
              let cls =
                'min-h-11 rounded-xl border-2 px-3 py-3 text-sm font-bold transition disabled:cursor-not-allowed'
              if (submitted) {
                if (isWinningChoice) cls += ' border-success-500 bg-success-50 text-success-800'
                else if (active) cls += ' border-danger-400 bg-danger-50 text-danger-700'
                else cls += ' border-slate-200 bg-white text-slate-500 opacity-70'
              } else if (active) {
                cls += ' border-brand-500 bg-brand-50 text-brand-800 shadow-sm'
              } else {
                cls += ' border-slate-200 bg-white text-slate-700 hover:border-brand-300'
              }
              return (
                <button
                  key={choice.value}
                  type="button"
                  disabled={locked}
                  aria-pressed={active}
                  onClick={() => setWinnerPick(choice.value)}
                  className={cls}
                >
                  {choice.label}
                </button>
              )
            })}
          </div>

          {submitted && showdown && (
            <div
              className="space-y-1 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
              role="status"
              aria-live="polite"
            >
              <p className="font-semibold text-slate-800">{showdownVerdict}</p>
              <p className="text-slate-600">
                <span className="font-semibold text-brand-600">You:</span> {showdown.hero.label}
              </p>
              <p className="text-slate-600">
                <span className="font-semibold text-slate-500">Opponent:</span>{' '}
                {showdown.villain.label}
              </p>
            </div>
          )}
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
