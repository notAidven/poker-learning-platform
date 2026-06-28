import { useMemo, useState } from 'react'
import {
  cardLabel,
  fullDeck,
  isRedSuit,
  parseCardId,
  type CardId,
  type OutsOddsAnswer,
  type OutsOddsAsk,
  type OutsOddsConfig,
} from '../../../types/lesson'
import { countOuts } from '../../../lib/poker/handEvaluator'
import { exactEquityPct } from '../../../lib/poker/spotStrength'
import type { InteractionProps } from './types'
import { deriveOutsOdds, deriveTarget, gradeOutsOdds, type OutsOddsSubmission } from './outsOdds'
import { CheckPanel } from './CheckPanel'
import { Button } from '../../ui/Button'
import { NumericAnswerInput } from './NumericAnswerInput'
import { hasValidCountInput } from './numericAnswer'
import { hasValidFractionInput } from './fractionAnswer'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { SuitIcon } from './cards/PlayingCardKit'

type OutsOddsProps = InteractionProps & {
  config: OutsOddsConfig
  answer: OutsOddsAnswer
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
      className="inline-flex h-7 items-center gap-1 rounded-lg border border-success-200 bg-white px-2 text-sm font-bold tabular-nums shadow-sm"
      aria-label={cardLabel(id)}
    >
      <span className={color}>{rank}</span>
      <SuitIcon suit={suit} className={`h-3 w-3 ${color}`} />
    </span>
  )
}

/** How the learner is entering a ratio answer: a whole percent, or a fraction. */
type AnswerFormat = 'percent' | 'fraction'

/** Segmented Percent / Fraction switch for the ratio sub-questions. */
function FormatToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: AnswerFormat
  onChange: (next: AnswerFormat) => void
  disabled?: boolean
}) {
  return (
    <div
      role="group"
      aria-label="Answer format"
      className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5"
    >
      {(['percent', 'fraction'] as const).map((fmt) => {
        const active = value === fmt
        return (
          <button
            key={fmt}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(fmt)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed ${
              active ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {fmt === 'percent' ? 'Percent' : 'Fraction'}
          </button>
        )
      })}
    </div>
  )
}

/**
 * A single ratio sub-question that can be answered as a whole percent OR as a fraction.
 * Mirrors the styling of `NumericAnswerInput` / `FractionAnswerInput`; the parent owns all
 * state and grading, so this stays purely presentational.
 */
function PercentOrFractionField({
  id,
  label,
  format,
  onFormatChange,
  percentValue,
  onPercentChange,
  numerator,
  denominator,
  onNumeratorChange,
  onDenominatorChange,
  numeratorPlaceholder,
  denominatorPlaceholder,
  fractionHint,
  disabled = false,
}: {
  id: string
  label: string
  format: AnswerFormat
  onFormatChange: (next: AnswerFormat) => void
  percentValue: string
  onPercentChange: (value: string) => void
  numerator: string
  denominator: string
  onNumeratorChange: (value: string) => void
  onDenominatorChange: (value: string) => void
  numeratorPlaceholder: string
  denominatorPlaceholder: string
  fractionHint: string
  disabled?: boolean
}) {
  const inputClass =
    'w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold tabular-nums text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50'
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={format === 'percent' ? id : `${id}-num`}
          className="text-sm font-semibold text-slate-800"
        >
          {label}
        </label>
        <FormatToggle value={format} onChange={onFormatChange} disabled={disabled} />
      </div>
      {format === 'percent' ? (
        <>
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={percentValue}
            onChange={(e) => onPercentChange(e.target.value)}
            disabled={disabled}
            placeholder="Enter a whole percent"
            className={inputClass}
          />
          <p className="mt-2 text-xs text-slate-500">Enter a whole percent, or switch to Fraction.</p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <input
              id={`${id}-num`}
              type="text"
              inputMode="numeric"
              value={numerator}
              onChange={(e) => onNumeratorChange(e.target.value)}
              disabled={disabled}
              placeholder={numeratorPlaceholder}
              aria-label="Numerator"
              className={inputClass}
            />
            <span className="text-2xl font-bold text-slate-400" aria-hidden="true">
              /
            </span>
            <input
              id={`${id}-den`}
              type="text"
              inputMode="numeric"
              value={denominator}
              onChange={(e) => onDenominatorChange(e.target.value)}
              disabled={disabled}
              placeholder={denominatorPlaceholder}
              aria-label="Denominator"
              className={inputClass}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">{fractionHint}</p>
        </>
      )}
    </div>
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

  // Out cards (for the reveal) still come from the evaluator here, but every EXPECTED
  // answer — outs, equity, the pot-odds price, the decision — comes from the one pure
  // grader (`./outsOdds`), which reads the spot-strength module. The widget never
  // re-derives the math, so it can never drift from the coach or the bots.
  const outCards = outsResult?.outs ?? []
  const expected = useMemo(() => deriveOutsOdds(config, answer), [config, answer])
  const expectedOuts = expected.outs
  const cardsToCome = expected.cardsToCome
  const unseenCount = 52 - config.hole.length - config.board.length
  const requiredEquity = expected.requiredEquityPct
  const decisionEquity = expected.ruleEquity
  const expectedDecision = expected.decision
  const equityCenter = expected.equityCenter

  const [outsInput, setOutsInput] = useState(initialSolved ? String(expectedOuts) : '')
  const [equityInput, setEquityInput] = useState(initialSolved ? String(equityCenter) : '')
  const [potOddsInput, setPotOddsInput] = useState(
    initialSolved && requiredEquity != null ? String(Math.round(requiredEquity)) : '',
  )
  // The ratio sub-questions (potOdds, and equity on the turn) can also be answered as a
  // fraction when config.allowFractionAnswer is set. Percent stays the default format, so a
  // revisited/solved step still seeds and shows exactly as before.
  const [equityFormat, setEquityFormat] = useState<AnswerFormat>('percent')
  const [equityNum, setEquityNum] = useState('')
  const [equityDen, setEquityDen] = useState('')
  const [potOddsFormat, setPotOddsFormat] = useState<AnswerFormat>('percent')
  const [potOddsNum, setPotOddsNum] = useState('')
  const [potOddsDen, setPotOddsDen] = useState('')
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

  // Fraction entry is opt-in per question and only offered where the answer is genuinely a
  // ratio: pot odds (call / (pot + call)) always, and equity (outs / cards left) only on the
  // turn, where one card to come makes it a clean single fraction.
  const allowFraction = config.allowFractionAnswer === true
  const fractionPotOdds = allowFraction && asked('potOdds')
  const fractionEquity = allowFraction && asked('equity') && config.street === 'turn'
  const equityAsFraction = fractionEquity && equityFormat === 'fraction'
  const potOddsAsFraction = fractionPotOdds && potOddsFormat === 'fraction'

  const outsReady = !asked('outs') || hasValidCountInput(outsInput)
  const equityReady =
    !asked('equity') ||
    (equityAsFraction ? hasValidFractionInput(equityNum, equityDen) : hasValidCountInput(equityInput))
  const potOddsReady =
    !asked('potOdds') ||
    (potOddsAsFraction
      ? hasValidFractionInput(potOddsNum, potOddsDen)
      : hasValidCountInput(potOddsInput))
  const decisionReady = !asked('decision') || decisionChoice != null
  const canSubmit = outsReady && equityReady && potOddsReady && decisionReady && !locked

  const disabledReason =
    asked('outs') && !outsReady
      ? 'Enter the number of outs'
      : asked('equity') && !equityReady
        ? 'Enter your equity estimate'
        : asked('potOdds') && !potOddsReady
          ? 'Enter the equity you need to call'
          : asked('decision') && !decisionReady
            ? 'Choose call or fold'
            : undefined

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    const submission: OutsOddsSubmission = {
      outsInput,
      equity: equityAsFraction
        ? { kind: 'fraction', num: equityNum, den: equityDen }
        : { kind: 'percent', value: equityInput },
      potOdds: potOddsAsFraction
        ? { kind: 'fraction', num: potOddsNum, den: potOddsDen }
        : { kind: 'percent', value: potOddsInput },
      decision: decisionChoice,
    }
    if (gradeOutsOdds(config, answer, submission).correct) {
      setSolved(true)
      onCorrect()
    } else {
      onIncorrect?.()
    }
  }

  function handleRetry() {
    // Preserve every entered value (outs, equity, pot odds, the call/fold choice)
    // and the empirical tally so a wrong attempt only re-enables editing — the
    // learner corrects just the wrong field and resubmits.
    onAttemptReset?.()
    setSubmitted(false)
    setSolved(false)
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
  const theoreticalPct = exactEquityPct(expectedOuts, unseenCount, cardsToCome)

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
      if (expectedDecision === side) return `${base} border-success-500 bg-success-50 text-success-800`
      if (active) return `${base} border-danger-400 bg-danger-50 text-danger-700`
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
                  <div className="mt-2 rounded-xl border border-success-100 bg-success-50/60 px-3 py-2">
                    <p className="mb-1 text-xs font-semibold text-success-700">
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
            if (fractionEquity) {
              return (
                <PercentOrFractionField
                  key="equity"
                  id="outs-odds-equity"
                  label="Estimate your equity (Rule of 2 & 4)."
                  format={equityFormat}
                  onFormatChange={setEquityFormat}
                  percentValue={equityInput}
                  onPercentChange={setEquityInput}
                  numerator={equityNum}
                  denominator={equityDen}
                  onNumeratorChange={setEquityNum}
                  onDenominatorChange={setEquityDen}
                  numeratorPlaceholder="outs"
                  denominatorPlaceholder="cards left"
                  fractionHint="On the turn, equity is outs / cards left, e.g. 9/46."
                  disabled={locked}
                />
              )
            }
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
            if (fractionPotOdds) {
              return (
                <PercentOrFractionField
                  key="potOdds"
                  id="outs-odds-pot-odds"
                  label="What equity do you need to call?"
                  format={potOddsFormat}
                  onFormatChange={setPotOddsFormat}
                  percentValue={potOddsInput}
                  onPercentChange={setPotOddsInput}
                  numerator={potOddsNum}
                  denominator={potOddsDen}
                  onNumeratorChange={setPotOddsNum}
                  onDenominatorChange={setPotOddsDen}
                  numeratorPlaceholder="call"
                  denominatorPlaceholder="pot + call"
                  fractionHint="Pot odds are call / (pot + call), e.g. 20/120 or 1/6."
                  disabled={locked}
                />
              )
            }
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
                Compare your equity to the price: call or fold?
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
            Deal it out.
            <span className="ml-1 font-normal text-slate-500">
              Run the {cardsToCome === 2 ? 'turn & river' : 'river'} to feel how often you hit.
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => runTrials(1)}>
              Deal once
            </Button>
            <Button type="button" variant="secondary" onClick={() => runTrials(50)}>
              Deal ×50
            </Button>
          </div>
          <div>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-semibold text-slate-700">Hit rate</span>
              <span className="font-bold tabular-nums text-brand-700">
                {trials > 0 ? `${hits}/${trials} = ${empiricalPct.toFixed(1)}%` : '–'}
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
                className="absolute top-0 h-full border-l-2 border-dashed border-success-600"
                style={{ left: `${Math.min(100, theoreticalPct)}%` }}
                aria-hidden="true"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500" role="status" aria-live="polite">
              Theoretical equity ≈ {theoreticalPct.toFixed(1)}% (dashed line). Keep dealing, and the bar
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
        disabledReason={disabledReason}
      />
    </div>
  )
}
