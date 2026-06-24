import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  cardLabel,
  isRedSuit,
  parseCardId,
  type BettingRoundAnswer,
  type BettingRoundConfig,
  type CardId,
  type CardSuit,
} from '../../../types/lesson'
import type { BettingAction } from '../../../types/poker'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { MathContent } from '../MathContent'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * `betting-round` (design doc §5.5) — one street of betting against a scripted,
 * deterministic opponent. Three tasks:
 *   - choose-action → the chosen action must equal `answer.action`
 *   - choose-size   → the chosen fraction-of-pot must be within `answer.sizeTolerance`
 *   - ev-of-call    → the entered EV (chips, signed) must be within `answer.evTolerance`
 *
 * Pot convention (matches design doc §3.5/§3.6): `config.pot` is the pot AS THE HERO
 * SEES IT on their turn, already including any `facing.amount` the hero must call.
 * So when the hero calls and wins, they win `config.pot` chips and risk `facing.amount`.
 * Amounts are shown as plain chip counts (no "$") so prose can keep `$…$` for KaTeX.
 */
type BettingRoundProps = InteractionProps & {
  config: BettingRoundConfig
  answer: BettingRoundAnswer
}

const DEFAULT_SIZES = [0.5, 0.75, 1]

// --- suit + card rendering (self-contained; mirrors CardDeck's visual language) ---
function SuitGlyph({ suit, className }: { suit: CardSuit; className?: string }) {
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

function FaceCard({
  id,
  dealing = false,
  delay = 0,
}: {
  id: CardId
  dealing?: boolean
  delay?: number
}) {
  const { rank, suit } = parseCardId(id)
  const color = isRedSuit(suit) ? 'text-rose-600' : 'text-slate-900'
  return (
    <span
      className={`br-card relative block h-16 w-11 border-2 border-white bg-white shadow-sm ${
        dealing ? 'br-card--deal' : ''
      }`}
      style={dealing ? { animationDelay: `${delay}ms` } : undefined}
      role="img"
      aria-label={cardLabel(id)}
    >
      <span className={`absolute left-1 top-0.5 flex flex-col items-center leading-none ${color}`}>
        <span className="text-[0.66rem] font-bold tabular-nums">{rank}</span>
        <SuitGlyph suit={suit} className="h-2 w-2" />
      </span>
      <span className={`absolute inset-0 flex items-center justify-center ${color}`}>
        <SuitGlyph suit={suit} className="h-5 w-5" />
      </span>
      <span
        className={`absolute bottom-0.5 right-1 flex rotate-180 flex-col items-center leading-none ${color}`}
      >
        <span className="text-[0.66rem] font-bold tabular-nums">{rank}</span>
        <SuitGlyph suit={suit} className="h-2 w-2" />
      </span>
    </span>
  )
}

function HiddenCard() {
  return (
    <span
      className="relative block h-16 w-11 rounded-[0.4rem] border-2 border-white bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm"
      role="img"
      aria-label="Face-down card"
    >
      <span
        className="dot-field absolute inset-1 rounded-sm"
        style={{ '--dot-size': '8px' } as CSSProperties}
        aria-hidden="true"
      />
    </span>
  )
}

const CHIP_TONES: Record<'gold' | 'blue' | 'rose', CSSProperties> = {
  gold: { '--c-hi': '#fde68a', '--c-mid': '#f59e0b', '--c-lo': '#b45309' } as CSSProperties,
  blue: { '--c-hi': '#bfdbfe', '--c-mid': '#3b82f6', '--c-lo': '#1d4ed8' } as CSSProperties,
  rose: { '--c-hi': '#fecdd3', '--c-mid': '#f43f5e', '--c-lo': '#be123c' } as CSSProperties,
}

function Chip({ size = 18, tone = 'gold' }: { size?: number; tone?: 'gold' | 'blue' | 'rose' }) {
  return (
    <span
      className="br-chip"
      style={{ width: size, height: size, ...CHIP_TONES[tone] }}
      aria-hidden="true"
    />
  )
}

/** A small fanned pile of chips used for the pot. */
function PotPile({ pop }: { pop: boolean }) {
  return (
    <span
      className={`relative inline-block h-7 w-16 ${pop ? 'br-pot-pop' : ''}`}
      aria-hidden="true"
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="br-chip absolute bottom-0"
          style={{ left: i * 12, width: 28, height: 28, ...CHIP_TONES.gold }}
        />
      ))}
    </span>
  )
}

/** Compact "chips + count" label used for a player's stack. */
function ChipCount({ value, tone = 'blue' }: { value: number; tone?: 'gold' | 'blue' | 'rose' }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Chip size={15} tone={tone} />
      <span className="text-sm font-bold tabular-nums">{value.toLocaleString()}</span>
    </span>
  )
}

// --- pure helpers -----------------------------------------------------------

const STREET_LABEL: Record<BettingRoundConfig['street'], string> = {
  preflop: 'Preflop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
}

const PRETTY_FRACTION: { max: number; label: string }[] = [
  { max: 0.28, label: '¼ pot' },
  { max: 0.4, label: '⅓ pot' },
  { max: 0.58, label: '½ pot' },
  { max: 0.7, label: '⅔ pot' },
  { max: 0.85, label: '¾ pot' },
  { max: 1.05, label: 'pot-sized' },
]

function fractionLabel(f: number): string {
  for (const entry of PRETTY_FRACTION) if (f <= entry.max) return entry.label
  return `${Math.round(f * 100)}% pot`
}

function parseSignedNumber(raw: string): number | null {
  const t = raw.trim()
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function evMatches(raw: string, expected: number, tolerance: number): boolean {
  const n = parseSignedNumber(raw)
  return n !== null && Math.abs(n - expected) <= tolerance
}

function closestSizeIndex(options: number[], target: number | undefined): number | null {
  if (target === undefined || options.length === 0) return null
  let best = 0
  for (let i = 1; i < options.length; i++) {
    if (Math.abs(options[i] - target) < Math.abs(options[best] - target)) best = i
  }
  return best
}

type TableReveal = {
  potAfter: number
  heroStackAfter: number
  villainStackAfter: number
  lines: string[]
  villainAction: BettingAction | null
  priceLaidPercent: number | null
}

/**
 * Apply the hero's action to the table and play the opponent's scripted response once.
 * Fully deterministic: the opponent plays `config.villainAction` when the lesson
 * scripts one, otherwise a simple fixed rule — check behind when checked to, and call the
 * price when the hero puts chips in. The reveal is identical every time.
 */
function buildTableReveal(
  config: BettingRoundConfig,
  heroAction: BettingAction,
  heroBetTotal: number,
): TableReveal {
  const startPot = config.pot
  const facing = config.facing?.amount ?? 0
  const scripted = config.villainAction ?? null

  let pot = startPot
  let heroStack = config.heroStack
  let villainStack = config.villainStack
  const lines: string[] = []
  let villainAction: BettingAction | null = null
  let priceLaidPercent: number | null = null

  if (heroAction === 'fold') {
    lines.push('You fold and give up the hand.')
    lines.push(`Villain takes the pot of ${pot}.`)
  } else if (heroAction === 'check') {
    lines.push('You check. No chips in, action passes.')
    // Scripted: the opponent only bets back when the lesson explicitly scripts it.
    if (scripted === 'bet') {
      const amt = Math.min(config.villainAmount ?? Math.round(pot * 0.66), villainStack)
      villainStack -= amt
      pot += amt
      villainAction = 'bet'
      lines.push(`Villain bets ${amt}, so now there is a bet back to you.`)
    } else {
      villainAction = 'check'
      lines.push('Villain checks behind. The round is checked through and the next card is free.')
    }
  } else if (heroAction === 'call') {
    const amt = Math.min(facing, heroStack)
    heroStack -= amt
    pot += amt
    lines.push(`You call ${amt}.`)
    lines.push(`Both stacks have matched. The betting is settled and the pot is ${pot}.`)
  } else {
    // bet or raise: hero puts chips in, then the scripted opponent answers the price.
    const total = Math.max(0, Math.min(heroBetTotal, heroStack))
    heroStack -= total
    pot += total
    if (heroAction === 'raise') {
      lines.push(`You raise to ${total}.`)
    } else {
      lines.push(`You bet ${total}.`)
      priceLaidPercent = total > 0 ? (total / (startPot + 2 * total)) * 100 : null
    }
    const villToCall = heroAction === 'raise' ? Math.max(0, total - facing) : total
    if (scripted === 'fold') {
      villainAction = 'fold'
      lines.push(`Villain folds. You win the pot of ${pot} with no showdown.`)
    } else if (scripted === 'raise') {
      const amt = Math.min(
        config.villainAmount ?? Math.round((startPot + 2 * total) * 0.6) + villToCall,
        villainStack,
      )
      villainStack -= amt
      pot += amt
      villainAction = 'raise'
      lines.push(`Villain re-raises to ${amt}. The decision comes back to you.`)
    } else {
      // Default scripted response: the opponent calls the price laid.
      const amt = Math.min(villToCall, villainStack)
      villainStack -= amt
      pot += amt
      villainAction = 'call'
      lines.push(`Villain calls ${amt}. The pot is now ${pot}.`)
    }
  }

  return { potAfter: pot, heroStackAfter: heroStack, villainStackAfter: villainStack, lines, villainAction, priceLaidPercent }
}

type EvBreakdown = {
  equity: number
  win: number
  lose: number
  ev: number
  required: number
  decision: 'call' | 'fold'
}

/** Recover equity from the authored EV so the reveal can show the full arithmetic. */
function buildEvBreakdown(config: BettingRoundConfig, answer: BettingRoundAnswer): EvBreakdown {
  const win = config.pot
  const lose = config.facing?.amount ?? 0
  const ev = answer.evChips ?? 0
  const denom = win + lose
  const equity = denom > 0 ? (ev + lose) / denom : 0
  const required = denom > 0 ? lose / denom : 0
  return { equity, win, lose, ev, required, decision: ev > 0 ? 'call' : 'fold' }
}

/** Count up an integer toward `target`; instant when motion is reduced. */
function useCountUp(target: number, animate: boolean): number {
  const [display, setDisplay] = useState(target)
  const prev = useRef(target)
  useEffect(() => {
    const from = prev.current
    prev.current = target
    if (!animate || from === target) {
      setDisplay(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const dur = 460
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, animate])
  return display
}

const BR_STYLES = `
.br-felt {
  background:
    radial-gradient(120% 130% at 50% -10%, #12876310 0%, transparent 60%),
    linear-gradient(160deg, #0f7a5a 0%, #0b6349 48%, #084c39 100%);
}
.br-card { border-radius: 0.4rem; }
.br-card--deal { animation: br-deal 0.42s cubic-bezier(0.34, 1.4, 0.64, 1) backwards; }
@keyframes br-deal {
  from { opacity: 0; transform: translateY(-18px) rotateY(-40deg) scale(0.86); }
  to { opacity: 1; transform: none; }
}
.br-chip {
  position: relative;
  display: inline-block;
  border-radius: 9999px;
  background: radial-gradient(circle at 50% 32%, var(--c-hi), var(--c-mid) 60%, var(--c-lo));
  box-shadow: inset 0 0 0 0.16em rgba(255, 255, 255, 0.6), 0 1px 2px rgba(8, 20, 16, 0.4);
}
.br-chip::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: repeating-conic-gradient(from 0deg, rgba(255, 255, 255, 0.92) 0 13deg, transparent 13deg 36deg);
  -webkit-mask: radial-gradient(circle, transparent 58%, #000 59% 76%, transparent 77%);
  mask: radial-gradient(circle, transparent 58%, #000 59% 76%, transparent 77%);
}
.br-pot-pop { animation: br-pop 0.5s cubic-bezier(0.34, 1.5, 0.64, 1); }
@keyframes br-pop {
  0% { transform: scale(0.82); }
  60% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
.br-reveal { animation: br-fade 0.4s ease backwards; }
@keyframes br-fade {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}
`

// --- option-button styling shared by action + size pickers -----------------
function optionClass(submitted: boolean, isSelected: boolean, isCorrect: boolean): string {
  const base =
    'relative flex min-h-11 flex-col items-center justify-center rounded-xl border-2 px-3 py-2.5 text-center transition disabled:cursor-not-allowed'
  if (submitted) {
    if (isCorrect) return `${base} border-emerald-500 bg-emerald-50 text-emerald-800`
    if (isSelected) return `${base} border-rose-400 bg-rose-50 text-rose-700`
    return `${base} border-slate-200 bg-white text-slate-500 opacity-70`
  }
  if (isSelected) return `${base} border-brand-500 bg-brand-50 text-brand-800 shadow-sm`
  return `${base} border-slate-200 bg-white text-slate-700 hover:border-brand-300`
}

const ACTION_LABEL: Record<BettingAction, string> = {
  check: 'Check',
  bet: 'Bet',
  call: 'Call',
  raise: 'Raise',
  fold: 'Fold',
}

export function BettingRound({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: BettingRoundProps) {
  const reduceMotion = usePrefersReducedMotion()
  const task = config.task
  const pot = config.pot
  const facing = config.facing?.amount ?? 0
  const isFacingBet = facing > 0
  const sizingOptions = config.sizingOptions ?? DEFAULT_SIZES
  const legalActions: BettingAction[] = isFacingBet ? ['call', 'raise', 'fold'] : ['check', 'bet']
  const defaultBetFraction =
    sizingOptions[Math.min(sizingOptions.length - 1, Math.floor(sizingOptions.length / 2))] ?? 0.66

  function betTotalForAction(act: BettingAction): number {
    if (act === 'bet') return Math.round(defaultBetFraction * pot)
    if (act === 'raise') return Math.min(config.heroStack, Math.round(3 * facing))
    return 0
  }

  function correctPlay(): { action: BettingAction; betTotal: number } {
    if (task === 'choose-size') {
      const f = answer.sizeFraction ?? defaultBetFraction
      return { action: isFacingBet ? 'raise' : 'bet', betTotal: Math.round(f * pot) }
    }
    const act = answer.action ?? (isFacingBet ? 'call' : 'check')
    return { action: act, betTotal: betTotalForAction(act) }
  }

  const [action, setAction] = useState<BettingAction | null>(
    initialSolved && task === 'choose-action' ? answer.action ?? null : null,
  )
  const [sizeIdx, setSizeIdx] = useState<number | null>(
    initialSolved && task === 'choose-size' ? closestSizeIndex(sizingOptions, answer.sizeFraction) : null,
  )
  const [evInput, setEvInput] = useState(
    initialSolved && task === 'ev-of-call' && answer.evChips !== undefined ? String(answer.evChips) : '',
  )
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)
  const [reveal, setReveal] = useState<TableReveal | null>(() => {
    if (!initialSolved || task === 'ev-of-call') return null
    const play = correctPlay()
    return buildTableReveal(config, play.action, play.betTotal)
  })

  const evBreakdown = useMemo(() => buildEvBreakdown(config, answer), [config, answer])

  const locked = disabled || submitted

  const potTarget = reveal ? reveal.potAfter : pot
  const displayPot = useCountUp(potTarget, !reduceMotion)
  const heroStackNow = reveal ? reveal.heroStackAfter : config.heroStack
  const villainStackNow = reveal ? reveal.villainStackAfter : config.villainStack

  const wantsDeal = !reduceMotion && !initialSolved

  function isCorrect(): boolean {
    if (task === 'choose-action') return action !== null && action === answer.action
    if (task === 'choose-size') {
      if (sizeIdx === null || answer.sizeFraction === undefined) return false
      return Math.abs(sizingOptions[sizeIdx] - answer.sizeFraction) <= (answer.sizeTolerance ?? 0.05)
    }
    return evMatches(evInput, answer.evChips ?? 0, answer.evTolerance ?? 1)
  }

  function canSubmit(): boolean {
    if (locked) return false
    if (task === 'choose-action') return action !== null
    if (task === 'choose-size') return sizeIdx !== null
    return parseSignedNumber(evInput) !== null
  }

  function handleSubmit() {
    if (locked) return
    const correct = isCorrect()
    setSubmitted(true)
    if (task !== 'ev-of-call') {
      const play =
        task === 'choose-size'
          ? {
              action: (isFacingBet ? 'raise' : 'bet') as BettingAction,
              betTotal: sizeIdx !== null ? Math.round(sizingOptions[sizeIdx] * pot) : 0,
            }
          : { action: action as BettingAction, betTotal: betTotalForAction(action as BettingAction) }
      setReveal(buildTableReveal(config, play.action, play.betTotal))
    }
    if (correct) {
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
    setReveal(null)
    setAction(null)
    setSizeIdx(null)
    setEvInput('')
  }

  const situationText =
    config.helperText ??
    (task === 'ev-of-call'
      ? `Villain bets ${facing} into a pot of ${pot - facing}. To decide whether to call, work out the EV below.`
      : isFacingBet
        ? `Villain bets ${facing} into a pot of ${pot - facing}. You can call, raise, or fold.`
        : `No bet faces you (pot is ${pot}). You can check or bet.`)

  const showTableReveal = submitted && task !== 'ev-of-call' && reveal !== null
  const showEvReveal = submitted && task === 'ev-of-call' && (solved || !allowRetry)

  return (
    <div className="space-y-5">
      <style>{BR_STYLES}</style>

      {/* The table */}
      <div className="br-felt rounded-3xl border border-emerald-900/40 p-4 text-white shadow-inner">
        {/* Villain */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-emerald-100/80">
              Opponent
            </p>
            <div className="mt-1 text-emerald-50">
              <ChipCount value={villainStackNow} tone="rose" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {reveal?.villainAction && (
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide">
                {ACTION_LABEL[reveal.villainAction]}
              </span>
            )}
            <div className="flex gap-1">
              <HiddenCard />
              <HiddenCard />
            </div>
          </div>
        </div>

        {/* Pot */}
        <div className="my-4 flex flex-col items-center justify-center gap-1">
          <PotPile key={potTarget} pop={!reduceMotion && submitted} />
          <p className="flex items-baseline gap-1.5 text-emerald-50" role="status" aria-live="polite">
            <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-emerald-100/80">
              Pot
            </span>
            <span className="text-2xl font-bold tabular-nums">{displayPot.toLocaleString()}</span>
          </p>
        </div>

        {/* Board */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-end gap-1.5">
            {config.board.length === 0 ? (
              <span className="text-xs italic text-emerald-100/70">No community cards yet</span>
            ) : (
              config.board.map((card, i) => (
                <FaceCard key={card} id={card} dealing={wantsDeal} delay={i * 90} />
              ))
            )}
          </div>
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-emerald-100/70">
            {STREET_LABEL[config.street]}
          </span>
        </div>

        {/* Hero */}
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-emerald-100/80">
              You
            </p>
            <div className="mt-1 text-emerald-50">
              <ChipCount value={heroStackNow} tone="blue" />
            </div>
          </div>
          <div className="flex gap-1.5">
            {config.hole.map((card, i) => (
              <FaceCard key={card} id={card} dealing={wantsDeal} delay={300 + i * 90} />
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-600">{situationText}</p>

      {/* Controls */}
      {task === 'choose-action' && (
        <div
          className={`grid gap-2 ${legalActions.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
          role="group"
          aria-label="Choose an action"
        >
          {legalActions.map((act) => (
            <button
              key={act}
              type="button"
              disabled={locked}
              aria-pressed={action === act}
              onClick={() => setAction(act)}
              className={optionClass(submitted, action === act, answer.action === act)}
            >
              <span className="text-sm font-bold">{ACTION_LABEL[act]}</span>
              {act === 'call' && (
                <span className="mt-0.5 text-xs font-medium tabular-nums opacity-80">{facing} to call</span>
              )}
            </button>
          ))}
        </div>
      )}

      {task === 'choose-size' && (
        <div
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-label="Choose a bet size"
        >
          {sizingOptions.map((f, i) => {
            const correctSize =
              answer.sizeFraction !== undefined &&
              Math.abs(f - answer.sizeFraction) <= (answer.sizeTolerance ?? 0.05)
            return (
              <button
                key={`${f}-${i}`}
                type="button"
                disabled={locked}
                aria-pressed={sizeIdx === i}
                onClick={() => setSizeIdx(i)}
                className={optionClass(submitted, sizeIdx === i, correctSize)}
              >
                <span className="text-sm font-bold capitalize">{fractionLabel(f)}</span>
                <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium tabular-nums opacity-80">
                  <Chip size={12} tone="gold" />
                  {Math.round(f * pot)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {task === 'ev-of-call' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label htmlFor="br-ev-input" className="block text-sm font-semibold text-slate-800">
            What is the EV of calling, in chips? Enter a negative number if the call loses money.
          </label>
          <input
            id="br-ev-input"
            type="text"
            inputMode="text"
            autoComplete="off"
            value={evInput}
            onChange={(e) => setEvInput(e.target.value)}
            disabled={locked}
            placeholder="e.g. 16 or -8"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold tabular-nums text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50"
          />
          <p className="mt-2 text-xs text-slate-500">
            EV = (chance you win) × (chips you win) − (chance you lose) × (chips to call).
          </p>
        </div>
      )}

      {/* Reveal: table outcome */}
      {showTableReveal && reveal && (
        <div
          className="br-reveal space-y-1.5 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm"
          role="status"
          aria-live="polite"
        >
          {reveal.lines.map((line, i) => (
            <p key={i} className={i === 0 ? 'font-semibold text-slate-900' : ''}>
              {line}
            </p>
          ))}
          {task === 'choose-size' && reveal.priceLaidPercent !== null && (
            <p className="pt-1 text-xs text-slate-500">
              That bet lays your opponent {reveal.priceLaidPercent.toFixed(1)}% pot odds. They need at
              least that much equity to call profitably.
            </p>
          )}
        </div>
      )}

      {/* Reveal: EV arithmetic */}
      {showEvReveal && (
        <div
          className="br-reveal space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold text-slate-700">Your equity</span>
            <span className="font-bold tabular-nums text-brand-700">
              {(evBreakdown.equity * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
              style={{ width: `${Math.max(0, Math.min(100, evBreakdown.equity * 100))}%` }}
            />
          </div>
          <MathContent className="text-sm">
            {[
              '$$\\text{EV} = p \\cdot (\\text{win}) - (1 - p) \\cdot (\\text{call})$$',
              `$$= ${evBreakdown.equity.toFixed(3)} \\times ${evBreakdown.win} - ${(1 - evBreakdown.equity).toFixed(3)} \\times ${evBreakdown.lose} = ${evBreakdown.ev >= 0 ? '+' : ''}${evBreakdown.ev}\\ \\text{chips}$$`,
            ].join('\n\n')}
          </MathContent>
          <p className="text-sm font-semibold text-slate-900">
            {evBreakdown.decision === 'call'
              ? `EV is positive, so calling is profitable (you only needed ${(evBreakdown.required * 100).toFixed(1)}% equity).`
              : `EV is negative, so folding is correct (you needed ${(evBreakdown.required * 100).toFixed(1)}% equity).`}
          </p>
        </div>
      )}

      <CheckPanel
        canSubmit={canSubmit()}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        allowRetry={allowRetry}
      />
    </div>
  )
}
