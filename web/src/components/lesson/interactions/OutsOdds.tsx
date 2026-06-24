import { useMemo, useState } from 'react'
import {
  cardLabel,
  fullDeck,
  isRedSuit,
  parseCardId,
  type CardId,
  type CardSuit,
  type OutsOddsAnswer,
  type OutsOddsAsk,
  type OutsOddsConfig,
} from '../../../types/lesson'
import type { HandCategory } from '../../../types/poker'
import { countOuts } from '../../../lib/poker/handEvaluator'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { NumericAnswerInput } from './NumericAnswerInput'
import { countMatches, hasValidCountInput, percentMatches } from './numericAnswer'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

type OutsOddsProps = InteractionProps & {
  config: OutsOddsConfig
  answer: OutsOddsAnswer
}

/** Pot odds is an exact price, so only round-off slack is allowed. */
const POT_ODDS_TOLERANCE = 1
/** Rule of 2 & 4 is an estimate — accept a band around it (the rule *or* the exact value). */
const DEFAULT_EQUITY_TOLERANCE = 3

/**
 * Map a draw's plain-language label to the hand category it completes, so outs can
 * be validated by the evaluator (`countOuts`) instead of a hard-coded number. A
 * flush+straight combo maps to `straight` because that's the lower category — every
 * card that makes either draw lifts the hand to at least a straight.
 */
function deriveTarget(drawLabel: string): HandCategory | undefined {
  const s = drawLabel.toLowerCase()
  if (s.includes('straight')) return 'straight'
  if (s.includes('flush')) return 'flush'
  if (s.includes('full')) return 'full-house'
  if (s.includes('quad') || s.includes('four of a kind')) return 'quads'
  if (s.includes('trip') || s.includes('set') || s.includes('three of a kind')) return 'trips'
  if (s.includes('two pair')) return 'two-pair'
  if (s.includes('pair') || s.includes('overcard')) return 'pair'
  return undefined
}

/** Rule of 2 & 4 estimate, with the big-draw correction `(outs×4) − (outs−8)` for ≥9 outs. */
function ruleEstimate(outs: number, street: 'flop' | 'turn'): number {
  if (street === 'turn') return outs * 2
  const raw = outs * 4
  return outs > 8 ? raw - (outs - 8) : raw
}

/** Exact chance ≥1 out lands across `cardsToCome` cards drawn from `unseen` unseen cards. */
function exactEquityPercent(outs: number, unseen: number, cardsToCome: number): number {
  if (unseen <= 0) return 0
  let miss = 1
  for (let i = 0; i < cardsToCome; i++) miss *= Math.max(0, unseen - outs - i) / (unseen - i)
  return (1 - miss) * 100
}

/** Crisp vector suit symbols (no emoji); color is supplied by the parent via currentColor. */
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

/** A full hand/board card. */
function HandCard({ id, dimmed = false }: { id: CardId; dimmed?: boolean }) {
  const { rank, suit } = parseCardId(id)
  const color = isRedSuit(suit) ? 'text-rose-600' : 'text-slate-900'
  return (
    <span
      role="img"
      aria-label={cardLabel(id)}
      className={`relative block h-16 w-11 shrink-0 rounded-md border-2 border-slate-200 bg-white shadow-sm ${
        dimmed ? 'opacity-60' : ''
      }`}
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

/** Small rank+suit chip used for the out-cards reveal. */
function OutChip({ id }: { id: CardId }) {
  const { rank, suit } = parseCardId(id)
  const color = isRedSuit(suit) ? 'text-rose-600' : 'text-slate-900'
  return (
    <span
      className="inline-flex h-7 items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 text-sm font-bold tabular-nums shadow-sm"
      aria-label={cardLabel(id)}
    >
      <span className={color}>{rank}</span>
      <SuitIcon suit={suit} className={`h-3 w-3 ${color}`} />
    </span>
  )
}

export function OutsOdds({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: OutsOddsProps) {
  const reduceMotion = usePrefersReducedMotion()

  const target = useMemo(() => deriveTarget(config.drawLabel), [config.drawLabel])
  const outsResult = useMemo(() => {
    try {
      return countOuts(config.hole, config.board, target)
    } catch {
      return null
    }
  }, [config.hole, config.board, target])

  // Outs are validated by the evaluator, never hard-coded; the authored answer.outs
  // is only a fallback if the spot can't be evaluated.
  const expectedOuts = outsResult?.count ?? answer.outs ?? 0
  const outCards = outsResult?.outs ?? []

  const cardsToCome = config.street === 'flop' ? 2 : 1
  const unseenCount = 52 - config.hole.length - config.board.length

  const requiredEquity =
    config.pot != null && config.betToCall != null
      ? (config.betToCall / (config.pot + config.betToCall)) * 100
      : (answer.potOddsPercent ?? null)

  const decisionEquity = ruleEstimate(expectedOuts, config.street)
  const expectedDecision: 'call' | 'fold' | null =
    requiredEquity != null
      ? decisionEquity >= requiredEquity
        ? 'call'
        : 'fold'
      : (answer.decision ?? null)

  const equityCenter = answer.equityPercent ?? ruleEstimate(expectedOuts, config.street)

  const [outsInput, setOutsInput] = useState(initialSolved ? String(expectedOuts) : '')
  const [equityInput, setEquityInput] = useState(initialSolved ? String(equityCenter) : '')
  const [potOddsInput, setPotOddsInput] = useState(
    initialSolved && requiredEquity != null ? String(Math.round(requiredEquity)) : '',
  )
  const [decisionChoice, setDecisionChoice] = useState<'call' | 'fold' | null>(
    initialSolved ? expectedDecision : null,
  )
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  // Empirical tie-in (optional, exploratory — never gates the answer).
  const [trials, setTrials] = useState(0)
  const [hits, setHits] = useState(0)

  const unseenCards = useMemo(() => {
    const seen = new Set<CardId>([...config.hole, ...config.board])
    return fullDeck().filter((c) => !seen.has(c))
  }, [config.hole, config.board])
  const outsSet = useMemo(() => new Set(outsResult?.outs ?? []), [outsResult])

  const locked = disabled || submitted
  const asks = config.ask

  function asked(a: OutsOddsAsk) {
    return asks.includes(a)
  }

  function outsOk() {
    return !asked('outs') || countMatches(outsInput, expectedOuts)
  }
  function equityOk() {
    if (!asked('equity')) return true
    const tol = answer.equityTolerance ?? DEFAULT_EQUITY_TOLERANCE
    return percentMatches(equityInput, equityCenter, tol)
  }
  function potOddsOk() {
    if (!asked('potOdds')) return true
    if (requiredEquity == null) return true
    return percentMatches(potOddsInput, requiredEquity, POT_ODDS_TOLERANCE)
  }
  function decisionOk() {
    return !asked('decision') || (decisionChoice != null && decisionChoice === expectedDecision)
  }

  const outsReady = !asked('outs') || hasValidCountInput(outsInput)
  const equityReady = !asked('equity') || hasValidCountInput(equityInput)
  const potOddsReady = !asked('potOdds') || hasValidCountInput(potOddsInput)
  const decisionReady = !asked('decision') || decisionChoice != null
  const canSubmit = outsReady && equityReady && potOddsReady && decisionReady && !locked

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    if (outsOk() && equityOk() && potOddsOk() && decisionOk()) {
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
    setOutsInput('')
    setEquityInput('')
    setPotOddsInput('')
    setDecisionChoice(null)
    setTrials(0)
    setHits(0)
  }

  function runTrials(n: number) {
    if (unseenCards.length === 0 || outsSet.size === 0) return
    let newHits = 0
    for (let t = 0; t < n; t++) {
      const pool = unseenCards.slice()
      let hit = false
      for (let i = 0; i < cardsToCome && i < pool.length; i++) {
        const j = i + Math.floor(Math.random() * (pool.length - i))
        ;[pool[i], pool[j]] = [pool[j], pool[i]]
        if (outsSet.has(pool[i])) hit = true
      }
      if (hit) newHits += 1
    }
    setHits((h) => h + newHits)
    setTrials((tt) => tt + n)
  }

  const empiricalPct = trials > 0 ? (hits / trials) * 100 : 0
  const theoreticalPct = exactEquityPercent(expectedOuts, unseenCount, cardsToCome)

  const streetLabel =
    config.street === 'flop' ? 'Flop · two cards to come' : 'Turn · one card to come'
  const showPotContext =
    (asked('potOdds') || asked('decision')) && config.pot != null && config.betToCall != null
  const showOutsReveal = solved && asked('outs') && outCards.length > 0

  function decisionButtonClass(side: 'call' | 'fold') {
    const active = decisionChoice === side
    const base =
      'min-h-11 flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed'
    if (submitted) {
      if (expectedDecision === side) return `${base} border-emerald-500 bg-emerald-50 text-emerald-800`
      if (active) return `${base} border-rose-400 bg-rose-50 text-rose-700`
      return `${base} border-slate-200 bg-white text-slate-500 opacity-70`
    }
    if (active) return `${base} border-brand-500 bg-brand-50 text-brand-800 shadow-sm`
    return `${base} border-slate-200 bg-white text-slate-700 hover:border-brand-300`
  }

  return (
    <div className="space-y-5">
      {/* Scenario: your hand + the board */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-inner">
        <div className="flex flex-wrap items-end justify-center gap-x-6 gap-y-3">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">You</p>
            <div className="flex gap-1.5">
              {config.hole.map((card) => (
                <HandCard key={card} id={card} />
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Board</p>
            <div className="flex gap-1.5">
              {config.board.map((card) => (
                <HandCard key={card} id={card} />
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-xs font-medium text-slate-500">
          Chasing {config.drawLabel} · {streetLabel}
          {showPotContext && (
            <>
              {' · '}
              <span className="font-semibold text-slate-700">
                Pot ${config.pot} · to call ${config.betToCall}
              </span>
            </>
          )}
        </p>
      </div>

      {config.helperText && <p className="text-center text-sm text-slate-600">{config.helperText}</p>}

      {/* Sub-questions, rendered in the configured order */}
      <div className="space-y-4">
        {asks.map((a) => {
          if (a === 'outs') {
            return (
              <div key="outs">
                <NumericAnswerInput
                  id="outs-odds-outs"
                  label="How many outs do you have? (cards that complete the draw)"
                  value={outsInput}
                  onChange={setOutsInput}
                  disabled={locked}
                />
                {showOutsReveal && (
                  <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                    <p className="mb-1 text-xs font-semibold text-emerald-700">
                      Your {outCards.length} outs:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {outCards.map((card) => (
                        <OutChip key={card} id={card} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          }
          if (a === 'equity') {
            return (
              <NumericAnswerInput
                key="equity"
                id="outs-odds-equity"
                label="Estimate your equity with the Rule of 2 & 4 (whole percent)."
                value={equityInput}
                onChange={setEquityInput}
                disabled={locked}
              />
            )
          }
          if (a === 'potOdds') {
            return (
              <NumericAnswerInput
                key="potOdds"
                id="outs-odds-pot-odds"
                label="What equity do you need to call? (whole percent)"
                value={potOddsInput}
                onChange={setPotOddsInput}
                disabled={locked}
              />
            )
          }
          // decision
          return (
            <div key="decision">
              <p className="mb-2 text-sm font-semibold text-slate-800">
                Compare your equity to the price — call or fold?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => setDecisionChoice('call')}
                  aria-pressed={decisionChoice === 'call'}
                  className={decisionButtonClass('call')}
                >
                  Call
                </button>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => setDecisionChoice('fold')}
                  aria-pressed={decisionChoice === 'fold'}
                  className={decisionButtonClass('fold')}
                >
                  Fold
                </button>
              </div>
              {submitted && requiredEquity != null && (
                <p
                  className="mt-2 text-xs text-slate-600"
                  role="status"
                  aria-live="polite"
                >
                  Equity ≈ {decisionEquity}% vs price {requiredEquity.toFixed(1)}% →{' '}
                  <span className="font-semibold text-slate-800">
                    {expectedDecision === 'call' ? 'call' : 'fold'}
                  </span>
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Optional empirical tie-in: deal this hand's remaining street(s) and watch
          the hit-rate settle toward the theoretical equity. Purely exploratory. */}
      {config.empiricalTieIn && expectedOuts > 0 && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            Deal it out
            <span className="ml-1 font-normal text-slate-500">
              — run the {cardsToCome === 2 ? 'turn & river' : 'river'} to feel how often you hit.
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runTrials(1)}
              className="min-h-11 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
            >
              Deal once
            </button>
            <button
              type="button"
              onClick={() => runTrials(50)}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Deal ×50
            </button>
          </div>
          <div>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-semibold text-slate-700">Hit rate</span>
              <span className="font-bold tabular-nums text-brand-700">
                {trials > 0 ? `${hits}/${trials} = ${empiricalPct.toFixed(1)}%` : '—'}
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                style={{
                  width: `${Math.min(100, empiricalPct)}%`,
                  transition: reduceMotion ? undefined : 'width 0.4s cubic-bezier(0.34,1.2,0.64,1)',
                }}
              />
              <span
                className="absolute top-0 h-full border-l-2 border-dashed border-emerald-600"
                style={{ left: `${Math.min(100, theoreticalPct)}%` }}
                aria-hidden="true"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500" role="status" aria-live="polite">
              Theoretical equity ≈ {theoreticalPct.toFixed(1)}% (dashed line). Keep dealing — the bar
              settles toward it.
            </p>
          </div>
        </div>
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
