import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type {
  FullHandAnswer,
  FullHandCheckpoint,
  FullHandConfig,
} from '../../../types/lesson'
import {
  cardLabel,
  fullDeck,
  isRedSuit,
  parseCardId,
  type CardId,
  type CardSuit,
} from '../../../types/lesson'
import type { BettingAction, EvaluatedHand, PokerStreet } from '../../../types/poker'
import { compareHands, evaluateHoldem } from '../../../lib/poker/handEvaluator'
import { decideAI, makeRng } from '../../../lib/poker/opponentAI'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { MathContent } from '../MathContent'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * `full-hand` capstone (design doc §5.6). Play one complete Texas Hold'em hand vs.
 * 1–3 seeded AI opponents: post blinds → deal → bet preflop/flop/turn/river via
 * decision checkpoints → showdown (`evaluateHoldem`/`compareHands`) → award the pot.
 *
 * Correctness uses authored checkpoints, not "every action must be optimal": each
 * street's first hero decision is matched against that checkpoint's `acceptableActions`
 * (intersected with the actions that are actually legal in the live spot, so the
 * learner can never be stuck failing an impossible checkpoint). The hand counts as
 * solved when it completes AND the learner made no clearly-wrong decision OR cleared
 * `answer.passThreshold` good decisions. Opponents come from `lib/poker/opponentAI.ts`
 * used AS-IS (seeded for reproducibility).
 */

type FullHandProps = InteractionProps & {
  config: FullHandConfig
  answer: FullHandAnswer
}

const MAX_BETS_PER_STREET = 4
const STREET_ORDER: PokerStreet[] = ['preflop', 'flop', 'turn', 'river']
const STREET_LABEL: Record<PokerStreet, string> = {
  preflop: 'Preflop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
}

// --- domain state ------------------------------------------------------------

type Seat = {
  index: number
  name: string
  isHero: boolean
  posLabel: string
  hole: [CardId, CardId]
  stack: number
  committed: number
  streetPut: number
  folded: boolean
  allIn: boolean
  lastAction: { action: BettingAction; chips: number; toAmount: number } | null
}

type DecisionStatus = 'pass' | 'fail' | 'auto'

type DecisionResult = {
  street: PokerStreet
  prompt: string
  why?: string
  chosen: BettingAction
  status: DecisionStatus
  acceptable: BettingAction[]
}

type PendingHero = {
  seatIndex: number
  toCall: number
  legal: BettingAction[]
  betTarget: number
  raiseTarget: number
  checkpoint: FullHandCheckpoint | null
}

type Outcome = {
  winners: number[]
  showdown: boolean
  potWon: number
  heroWon: boolean
  heroFolded: boolean
}

type Phase = 'awaiting-hero' | 'awaiting-ai' | 'complete'

type Engine = {
  seats: Seat[]
  heroIndex: number
  tier: 1 | 2 | 3
  sb: number
  bb: number
  street: PokerStreet
  fullBoard: CardId[]
  board: CardId[]
  pot: number
  toMatch: number
  lastRaiseSize: number
  numRaises: number
  order: number[]
  preflopOrder: number[]
  postflopOrder: number[]
  scanFrom: number
  acted: boolean[]
  status: Phase
  awaitingSeat: number | null
  pendingHero: PendingHero | null
  cpQueue: Record<string, FullHandCheckpoint[]>
  heroDecidedThisStreet: boolean
  results: DecisionResult[]
  passed: number
  failed: number
  reached: number
  outcome: Outcome | null
  showdownEvals: { index: number; ev: EvaluatedHand }[] | null
  revealOpponents: boolean
  announce: string
}

// --- seating -----------------------------------------------------------------

type Layout = {
  sbIndex: number
  bbIndex: number
  preflopOrder: number[]
  postflopOrder: number[]
  posLabels: string[]
}

/** Hero is always seat 0 on the button (the best seat — used to teach position). */
function seatLayout(n: number): Layout {
  const rotate = (start: number) => Array.from({ length: n }, (_, k) => (start + k) % n)
  if (n === 2) {
    // Heads-up: the button posts the small blind and acts first preflop.
    return {
      sbIndex: 0,
      bbIndex: 1,
      preflopOrder: [0, 1],
      postflopOrder: [1, 0],
      posLabels: ['BTN / SB', 'BB'],
    }
  }
  const sbIndex = 1
  const bbIndex = 2
  const labels = Array.from({ length: n }, (_, i) => {
    if (i === 0) return 'BTN'
    if (i === 1) return 'SB'
    if (i === 2) return 'BB'
    return 'UTG'
  })
  return {
    sbIndex,
    bbIndex,
    preflopOrder: rotate((bbIndex + 1) % n),
    postflopOrder: rotate(sbIndex),
    posLabels: labels,
  }
}

// --- engine construction -----------------------------------------------------

function shuffle(cards: CardId[], rng: () => number): CardId[] {
  const a = [...cards]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function groupCheckpoints(checkpoints: FullHandCheckpoint[]): Record<string, FullHandCheckpoint[]> {
  const out: Record<string, FullHandCheckpoint[]> = {}
  for (const cp of checkpoints) {
    ;(out[cp.street] ??= []).push(cp)
  }
  return out
}

function createEngine(config: FullHandConfig): Engine {
  const seed = config.seed ?? 1
  const n = Math.max(2, Math.min(4, (config.opponents ?? 1) + 1))
  const layout = seatLayout(n)

  const dealRng = makeRng(seed)
  let deck = fullDeck()
  let heroHole: [CardId, CardId] | null = null
  if (config.heroHole && config.heroHole !== 'random') {
    heroHole = config.heroHole
    const fixed = new Set(config.heroHole)
    deck = deck.filter((c) => !fixed.has(c))
  }
  deck = shuffle(deck, dealRng)

  let di = 0
  if (!heroHole) heroHole = [deck[di++], deck[di++]]

  const seats: Seat[] = []
  for (let i = 0; i < n; i++) {
    const isHero = i === 0
    const hole: [CardId, CardId] = isHero ? heroHole : [deck[di++], deck[di++]]
    seats.push({
      index: i,
      name: isHero ? 'You' : `Opponent ${i}`,
      isHero,
      posLabel: layout.posLabels[i],
      hole,
      stack: config.startingStack,
      committed: 0,
      streetPut: 0,
      folded: false,
      allIn: false,
      lastAction: null,
    })
  }
  const fullBoard = deck.slice(di, di + 5)

  const sb = config.blinds.sb
  const bb = config.blinds.bb
  const postBlind = (seat: Seat, amount: number) => {
    const pay = Math.min(amount, seat.stack)
    seat.stack -= pay
    seat.streetPut = pay
    seat.committed = pay
    return pay
  }
  const pot = postBlind(seats[layout.sbIndex], sb) + postBlind(seats[layout.bbIndex], bb)

  const engine: Engine = {
    seats,
    heroIndex: 0,
    tier: config.aiTier,
    sb,
    bb,
    street: 'preflop',
    fullBoard,
    board: [],
    pot,
    toMatch: bb,
    lastRaiseSize: bb,
    numRaises: 0,
    order: layout.preflopOrder,
    preflopOrder: layout.preflopOrder,
    postflopOrder: layout.postflopOrder,
    scanFrom: 0,
    acted: seats.map(() => false),
    status: 'awaiting-ai',
    awaitingSeat: null,
    pendingHero: null,
    cpQueue: groupCheckpoints(config.checkpoints),
    heroDecidedThisStreet: false,
    results: [],
    passed: 0,
    failed: 0,
    reached: 0,
    outcome: null,
    showdownEvals: null,
    revealOpponents: false,
    announce: 'A new hand begins — blinds are posted.',
  }

  advance(engine)
  return engine
}

/**
 * Seeded per-seat RNG streams (one `decideAI` stream per seat). Kept outside the
 * engine state — they are stateful closures, used only inside effects/handlers, never
 * during render — so the engine itself stays a plain, cloneable value.
 */
function makeSeatRngs(config: FullHandConfig): (() => number)[] {
  const seed = config.seed ?? 1
  const n = Math.max(2, Math.min(4, (config.opponents ?? 1) + 1))
  return Array.from({ length: n }, (_, i) => makeRng(seed * 2654435761 + (i + 1) * 40503))
}

// --- engine transitions ------------------------------------------------------

function findNextActor(s: Engine): { pos: number; idx: number } | null {
  const n = s.order.length
  for (let k = 0; k < n; k++) {
    const pos = (s.scanFrom + k) % n
    const idx = s.order[pos]
    const seat = s.seats[idx]
    if (!seat.folded && !seat.allIn && (!s.acted[idx] || seat.streetPut < s.toMatch)) {
      return { pos, idx }
    }
  }
  return null
}

function positionFor(s: Engine, idx: number): 'ip' | 'oop' {
  return s.order[s.order.length - 1] === idx ? 'ip' : 'oop'
}

function nextStreet(street: PokerStreet): PokerStreet {
  return STREET_ORDER[STREET_ORDER.indexOf(street) + 1]
}

function boardCountFor(street: PokerStreet): number {
  return street === 'flop' ? 3 : street === 'turn' ? 4 : street === 'river' ? 5 : 0
}

function advanceStreet(s: Engine): void {
  s.street = nextStreet(s.street)
  s.board = s.fullBoard.slice(0, boardCountFor(s.street))
  s.toMatch = 0
  s.lastRaiseSize = s.bb
  s.numRaises = 0
  s.acted = s.seats.map(() => false)
  for (const seat of s.seats) seat.streetPut = 0
  s.order = s.postflopOrder
  s.scanFrom = 0
  s.heroDecidedThisStreet = false
}

function makePendingHero(s: Engine, idx: number): PendingHero {
  const seat = s.seats[idx]
  const toCall = Math.max(0, s.toMatch - seat.streetPut)
  const canRaiseMore = s.numRaises < MAX_BETS_PER_STREET
  const legal: BettingAction[] = []
  if (toCall <= 0) {
    legal.push('check')
    if (canRaiseMore && seat.stack > 0) legal.push('bet')
  } else {
    legal.push('fold')
    if (seat.stack > 0) legal.push('call')
    if (canRaiseMore && seat.stack > toCall) legal.push('raise')
  }

  const minBet = Math.max(s.bb, 1)
  const betTarget = clamp(
    seat.streetPut + Math.max(minBet, Math.round(0.66 * s.pot)),
    seat.streetPut + minBet,
    seat.streetPut + seat.stack,
  )
  const minRaiseTo = s.toMatch + Math.max(s.lastRaiseSize, s.bb)
  const raiseTarget = clamp(
    Math.max(minRaiseTo, s.toMatch + Math.round(0.75 * (s.pot + toCall))),
    minRaiseTo,
    seat.streetPut + seat.stack,
  )

  const queue = s.cpQueue[s.street]
  const checkpoint = !s.heroDecidedThisStreet && queue && queue.length > 0 ? queue[0] : null

  return { seatIndex: idx, toCall, legal, betTarget, raiseTarget, checkpoint }
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value))
}

/** Move a seat's street contribution up to `target` chips (a call/bet/raise). */
function contribute(s: Engine, idx: number, target: number, isRaise: boolean): { chips: number } {
  const seat = s.seats[idx]
  const pay = Math.min(Math.max(0, target - seat.streetPut), seat.stack)
  seat.stack -= pay
  seat.streetPut += pay
  seat.committed += pay
  s.pot += pay
  if (seat.streetPut > s.toMatch) {
    s.lastRaiseSize = seat.streetPut - s.toMatch
    s.toMatch = seat.streetPut
    if (isRaise) s.numRaises += 1
  }
  if (seat.stack === 0) seat.allIn = true
  return { chips: pay }
}

function applyAction(s: Engine, idx: number, action: BettingAction, target: number): void {
  const seat = s.seats[idx]
  s.acted[idx] = true
  let chips = 0
  let toAmount = seat.streetPut
  if (action === 'fold') {
    seat.folded = true
  } else if (action === 'check') {
    // nothing changes
  } else if (action === 'call') {
    chips = contribute(s, idx, Math.min(s.toMatch, seat.streetPut + seat.stack), false).chips
    toAmount = seat.streetPut
  } else {
    // bet or raise
    chips = contribute(s, idx, target, true).chips
    toAmount = seat.streetPut
  }
  seat.lastAction = { action, chips, toAmount }
  s.announce = `${seat.name} ${describeAction(action, chips, toAmount)}.`
}

function describeAction(action: BettingAction, chips: number, toAmount: number): string {
  switch (action) {
    case 'fold':
      return 'folds'
    case 'check':
      return 'checks'
    case 'call':
      return `calls $${chips}`
    case 'bet':
      return `bets $${chips}`
    case 'raise':
      return `raises to $${toAmount}`
  }
}

function advance(s: Engine): void {
  for (let guard = 0; guard < 12; guard++) {
    const active = s.seats.filter((x) => !x.folded)
    if (active.length <= 1) {
      resolve(s)
      return
    }
    const next = findNextActor(s)
    if (next) {
      s.scanFrom = next.pos + 1
      const seat = s.seats[next.idx]
      if (seat.isHero) {
        s.status = 'awaiting-hero'
        s.awaitingSeat = null
        s.pendingHero = makePendingHero(s, next.idx)
      } else {
        s.status = 'awaiting-ai'
        s.awaitingSeat = next.idx
        s.pendingHero = null
      }
      return
    }
    // Betting round closed.
    if (s.street === 'river') {
      resolve(s)
      return
    }
    advanceStreet(s)
  }
  resolve(s)
}

/** Resolve the hand: award the pot to the best remaining hand (or the last player). */
function resolve(s: Engine): void {
  const active = s.seats.filter((x) => !x.folded)
  let winners: Seat[]
  let showdown: boolean

  if (active.length <= 1) {
    winners = active.length === 1 ? [active[0]] : [s.seats[s.heroIndex]]
    showdown = false
  } else {
    s.board = s.fullBoard.slice(0, 5)
    const scored = active.map((seat) => ({ index: seat.index, ev: evaluateHoldem(seat.hole, s.board) }))
    s.showdownEvals = scored
    let best = scored[0]
    for (const sc of scored) if (compareHands(sc.ev, best.ev) > 0) best = sc
    const winnerIndexes = scored.filter((sc) => compareHands(sc.ev, best.ev) === 0).map((sc) => sc.index)
    winners = s.seats.filter((seat) => winnerIndexes.includes(seat.index))
    showdown = true
  }

  const share = Math.floor(s.pot / winners.length)
  let remainder = s.pot - share * winners.length
  for (const w of winners) {
    w.stack += share + (remainder > 0 ? 1 : 0)
    if (remainder > 0) remainder -= 1
  }

  const heroFolded = s.seats[s.heroIndex].folded
  s.outcome = {
    winners: winners.map((w) => w.index),
    showdown,
    potWon: s.pot,
    heroWon: !heroFolded && winners.some((w) => w.index === s.heroIndex),
    heroFolded,
  }
  s.revealOpponents = showdown
  s.status = 'complete'
  s.pendingHero = null
  s.awaitingSeat = null
}

/** Advance one AI seat using the shared, seeded `decideAI`. */
function stepAi(s: Engine, rngs: (() => number)[]): void {
  const idx = s.awaitingSeat
  if (idx === null) return
  const seat = s.seats[idx]
  const toCall = Math.max(0, s.toMatch - seat.streetPut)
  const decision = decideAI({
    tier: s.tier,
    hole: seat.hole,
    board: s.board,
    pot: s.pot,
    toCall,
    position: positionFor(s, idx),
    rng: rngs[idx],
  })

  let action = decision.action
  const canRaiseMore = s.numRaises < MAX_BETS_PER_STREET
  if (toCall <= 0) {
    if (action === 'call' || action === 'fold') action = 'check'
    if (action === 'bet' && (!canRaiseMore || seat.stack <= 0)) action = 'check'
    if (action === 'raise') action = canRaiseMore && seat.stack > 0 ? 'bet' : 'check'
  } else {
    if (action === 'check') action = 'call'
    if (action === 'bet') action = 'raise'
    if (action === 'raise' && (!canRaiseMore || seat.stack <= toCall)) action = 'call'
    if (action === 'call' && seat.stack <= 0) action = 'fold'
  }

  let target = seat.streetPut
  if (action === 'call') {
    target = Math.min(s.toMatch, seat.streetPut + seat.stack)
  } else if (action === 'bet') {
    const raw = decision.amount ?? Math.round(0.66 * s.pot)
    target = clamp(Math.max(raw, s.bb), s.bb, seat.streetPut + seat.stack)
  } else if (action === 'raise') {
    const rawAdd = decision.amount ?? Math.round(0.66 * (s.pot + toCall))
    const minRaiseTo = s.toMatch + Math.max(s.lastRaiseSize, s.bb)
    target = clamp(
      Math.max(seat.streetPut + rawAdd, minRaiseTo),
      minRaiseTo,
      seat.streetPut + seat.stack,
    )
  }

  s.awaitingSeat = null
  applyAction(s, idx, action, target)
  advance(s)
}

/** Apply the learner's chosen action, scoring the street's checkpoint if present. */
function applyHeroAction(s: Engine, action: BettingAction): void {
  const ph = s.pendingHero
  if (!ph) return
  const idx = ph.seatIndex

  let target = s.seats[idx].streetPut
  if (action === 'call') target = Math.min(s.toMatch, s.seats[idx].streetPut + s.seats[idx].stack)
  else if (action === 'bet') target = ph.betTarget
  else if (action === 'raise') target = ph.raiseTarget

  if (ph.checkpoint) {
    const cp = ph.checkpoint
    s.reached += 1
    const legalSet = new Set(ph.legal)
    const effective = cp.acceptableActions.filter((a) => legalSet.has(a))
    let status: DecisionStatus
    if (effective.length === 0) {
      status = 'auto'
      s.passed += 1
    } else if (effective.includes(action)) {
      status = 'pass'
      s.passed += 1
    } else {
      status = 'fail'
      s.failed += 1
    }
    s.results.push({
      street: s.street,
      prompt: cp.prompt,
      why: cp.why,
      chosen: action,
      status,
      acceptable: cp.acceptableActions,
    })
    s.cpQueue[s.street]?.shift()
  }

  s.heroDecidedThisStreet = true
  s.pendingHero = null
  applyAction(s, idx, action, target)

  // Folding ends the hand from the learner's point of view: run the board out so the
  // remaining players can reach a showdown, then award the pot.
  if (action === 'fold') {
    s.board = s.fullBoard.slice(0, 5)
    resolve(s)
    return
  }
  advance(s)
}

// --- card visuals ------------------------------------------------------------

const FH_STYLES = `
.fh-scene { perspective: 1100px; }
.fh-card { transform-style: preserve-3d; will-change: transform; }
.fh-deal { animation: fh-deal 0.46s cubic-bezier(0.34, 1.4, 0.64, 1) backwards; }
@keyframes fh-deal {
  from { opacity: 0; transform: translateY(-18px) rotateY(-38deg) scale(0.84); }
  to { opacity: 1; transform: none; }
}
.fh-flip { animation: fh-flip 0.5s cubic-bezier(0.34, 1.3, 0.64, 1) backwards; }
@keyframes fh-flip {
  from { opacity: 0; transform: rotateY(82deg) scale(0.92); }
  to { opacity: 1; transform: none; }
}
.fh-pot-pulse { animation: fh-pulse 0.5s ease; }
@keyframes fh-pulse {
  0% { transform: scale(1); }
  45% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
.fh-win { animation: fh-win 1.6s ease-in-out infinite; }
@keyframes fh-win {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.0); }
  50% { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.45); }
}
`

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

function CardFace({
  id,
  className = '',
  compact = false,
  animate,
}: {
  id: CardId
  className?: string
  compact?: boolean
  animate?: 'deal' | 'flip' | null
}) {
  const { rank, suit } = parseCardId(id)
  const color = isRedSuit(suit) ? 'text-rose-600' : 'text-slate-900'
  const rankText = compact ? 'text-[0.6rem]' : 'text-xs'
  const cornerSuit = compact ? 'h-1.5 w-1.5' : 'h-2 w-2'
  const centerSuit = compact ? 'h-4 w-4' : 'h-6 w-6'
  const animCls = animate === 'deal' ? 'fh-deal' : animate === 'flip' ? 'fh-flip' : ''
  return (
    <span
      role="img"
      aria-label={cardLabel(id)}
      className={`fh-card relative block rounded-md border-2 border-white bg-white shadow-sm ${animCls} ${className}`}
    >
      <span className={`absolute left-0.5 top-0.5 flex flex-col items-center leading-none ${color}`}>
        <span className={`${rankText} font-bold tabular-nums`}>{rank}</span>
        <SuitGlyph suit={suit} className={cornerSuit} />
      </span>
      <span className={`absolute inset-0 flex items-center justify-center ${color}`}>
        <SuitGlyph suit={suit} className={centerSuit} />
      </span>
      <span
        className={`absolute bottom-0.5 right-0.5 flex rotate-180 flex-col items-center leading-none ${color}`}
      >
        <span className={`${rankText} font-bold tabular-nums`}>{rank}</span>
        <SuitGlyph suit={suit} className={cornerSuit} />
      </span>
    </span>
  )
}

function CardBack({ className = '', dimmed = false }: { className?: string; dimmed?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block rounded-md border-2 border-white bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm ${
        dimmed ? 'opacity-40 grayscale' : ''
      } ${className}`}
    >
      <span className="dot-field absolute inset-1 rounded-sm" style={{ '--dot-size': '6px' } as CSSProperties} />
    </span>
  )
}

// --- responsible-play note (resolves design Q9) ------------------------------

const RESPONSIBLE_PLAY_MD = [
  '**You just played real poker — for zero real money, which is exactly the point.**',
  "Poker is a game of skill and odds, but real-money gambling carries genuine financial risk: the house's rake and stronger players mean most people lose over time, and chasing losses can become a problem.",
  'Keep it fun and play-money here — and if gambling ever stops feeling like a game, free, confidential help is available 24/7 at [1-800-GAMBLER](tel:18004262537) (US).',
].join('\n\n')

function ResponsiblePlayNote() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Before you go
      </p>
      <MathContent className="text-sm text-slate-700">{RESPONSIBLE_PLAY_MD}</MathContent>
    </div>
  )
}

// --- component ---------------------------------------------------------------

const ACTION_BTN: Record<BettingAction, string> = {
  fold: 'border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:text-rose-600',
  check: 'border-slate-200 bg-white text-slate-700 hover:border-brand-300',
  call: 'border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-400',
  bet: 'border-transparent bg-brand-600 text-white hover:bg-brand-700',
  raise: 'border-transparent bg-brand-600 text-white hover:bg-brand-700',
}

export function FullHand({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: FullHandProps) {
  const reduceMotion = usePrefersReducedMotion()
  const resolvedRef = useRef(false)
  // Seeded RNG streams live in a ref (used only in effects/handlers, never read during
  // render), so the engine in state stays a plain, structured-cloneable value.
  const rngRef = useRef<(() => number)[]>([])

  // Keep the latest result callbacks without re-subscribing the driver effect.
  const cbRef = useRef({ onCorrect, onIncorrect })
  useEffect(() => {
    cbRef.current = { onCorrect, onIncorrect }
  })

  const passThreshold = Math.max(1, answer.passThreshold ?? Math.max(1, config.checkpoints.length - 1))

  // The whole hand lives in state. It is built once from the seed, so it is fully
  // deterministic. Review mode (the step was already solved) starts with no engine and
  // shows a static summary instead of replaying — which keeps `disabled` honored.
  const [eng, setEng] = useState<Engine | null>(() => (initialSolved ? null : createEngine(config)))

  // Drive automatic (AI) actions and fire the result callback once on completion.
  useEffect(() => {
    if (!eng) return
    if (rngRef.current.length === 0) rngRef.current = makeSeatRngs(config)
    if (eng.status === 'awaiting-ai' && eng.awaitingSeat !== null) {
      const delay = reduceMotion ? 0 : 620
      const timer = window.setTimeout(() => {
        const next = structuredClone(eng)
        stepAi(next, rngRef.current)
        setEng(next)
      }, delay)
      return () => window.clearTimeout(timer)
    }
    if (eng.status === 'complete' && !resolvedRef.current) {
      resolvedRef.current = true
      const success = eng.failed === 0 || eng.passed >= passThreshold
      if (success) cbRef.current.onCorrect()
      else cbRef.current.onIncorrect?.()
    }
  }, [eng, reduceMotion, passThreshold, config])

  function heroAct(action: BettingAction) {
    if (!eng || eng.status !== 'awaiting-hero' || disabled) return
    const next = structuredClone(eng)
    applyHeroAction(next, action)
    setEng(next)
  }

  function replay() {
    onAttemptReset?.()
    resolvedRef.current = false
    rngRef.current = makeSeatRngs(config)
    setEng(createEngine(config))
  }

  // Review mode: the step was already solved (disabled), so show a static summary
  // rather than a fresh, playable hand.
  if (!eng) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <p className="text-sm font-semibold text-emerald-800">
            You completed this hand — nicely played.
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            {config.opponents} opponent{config.opponents === 1 ? '' : 's'} · played to showdown.
          </p>
        </div>
        {config.showResponsiblePlayNote && <ResponsiblePlayNote />}
      </div>
    )
  }

  const hero = eng.seats[eng.heroIndex]
  const opponents = eng.seats.filter((s) => !s.isHero)
  const complete = eng.status === 'complete'
  const success = complete && (eng.failed === 0 || eng.passed >= passThreshold)
  const heroBest =
    eng.board.length >= 3 && !hero.folded ? evaluateHoldem(hero.hole, eng.board) : null
  const evalByIndex = new Map((eng.showdownEvals ?? []).map((e) => [e.index, e.ev]))

  return (
    <div className="space-y-4">
      <style>{FH_STYLES}</style>

      {/* Street + pot banner */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-night-900 px-3 py-1 text-xs font-semibold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
          {complete ? (eng.outcome?.showdown ? 'Showdown' : 'Hand over') : STREET_LABEL[eng.street]}
        </span>
        <span
          key={eng.pot}
          className={`inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-sm font-bold tabular-nums text-gold-700 ${
            reduceMotion ? '' : 'fh-pot-pulse'
          }`}
        >
          <ChipDot /> Pot ${eng.pot}
        </span>
      </div>

      {/* The table */}
      <div className="fh-scene relative overflow-hidden rounded-[1.75rem] border border-night-700 bg-gradient-to-b from-night-800 to-night-950 p-4 shadow-inner">
        <span
          className="dot-field pointer-events-none absolute inset-0 opacity-60"
          style={{ '--dot-color': 'rgba(255,255,255,0.05)', '--dot-size': '20px' } as CSSProperties}
          aria-hidden="true"
        />

        {/* Opponents */}
        <div className="relative flex flex-wrap items-start justify-center gap-3">
          {opponents.map((seat) => {
            const isWinner = eng.outcome?.winners.includes(seat.index) ?? false
            const ev = evalByIndex.get(seat.index)
            return (
              <div
                key={seat.index}
                className={`min-w-[7.5rem] rounded-xl border px-2.5 py-2 text-center transition ${
                  isWinner
                    ? `border-gold-400 bg-night-700 ${reduceMotion ? '' : 'fh-win'}`
                    : 'border-night-600 bg-night-800'
                } ${seat.folded ? 'opacity-50' : ''}`}
              >
                <p className="text-xs font-semibold text-slate-200">
                  {seat.name} <span className="text-slate-400">· {seat.posLabel}</span>
                </p>
                <div className="my-1.5 flex justify-center gap-1">
                  {eng.revealOpponents && !seat.folded ? (
                    seat.hole.map((c) => <CardFace key={c} id={c} compact className="h-12 w-9" />)
                  ) : (
                    <>
                      <CardBack className="h-12 w-9" dimmed={seat.folded} />
                      <CardBack className="h-12 w-9" dimmed={seat.folded} />
                    </>
                  )}
                </div>
                <p className="text-[0.7rem] font-semibold tabular-nums text-slate-300">
                  Stack ${seat.stack}
                </p>
                <p className="mt-0.5 min-h-[1.1rem] text-[0.7rem] font-medium leading-tight text-gold-300">
                  {ev && eng.revealOpponents && !seat.folded
                    ? ev.label
                    : seat.folded
                      ? 'Folded'
                      : seat.lastAction
                        ? actionBadge(seat.lastAction)
                        : ''}
                </p>
              </div>
            )
          })}
        </div>

        {/* Board */}
        <div className="relative my-4 flex items-center justify-center gap-1.5" aria-label="Community cards">
          {[0, 1, 2, 3, 4].map((i) => {
            const card = eng.board[i]
            return card ? (
              <CardFace key={`${i}-${card}`} id={card} className="h-16 w-12" animate={reduceMotion ? null : 'flip'} />
            ) : (
              <span
                key={`empty-${i}`}
                aria-hidden="true"
                className="h-16 w-12 rounded-md border-2 border-dashed border-night-600/70"
              />
            )
          })}
        </div>

        {/* Hero */}
        <div className="relative flex flex-col items-center gap-1.5">
          <div className="flex gap-1.5">
            {hero.hole.map((c) => (
              <CardFace key={c} id={c} className={`h-16 w-12 ${hero.folded ? 'opacity-50' : ''}`} animate={reduceMotion ? null : 'deal'} />
            ))}
          </div>
          <p className="text-xs font-semibold text-slate-100">
            You <span className="text-slate-400">· {hero.posLabel}</span>
            <span className="ml-2 tabular-nums text-slate-300">Stack ${hero.stack}</span>
          </p>
          <p className="min-h-[1.1rem] text-xs font-medium leading-tight text-gold-300">
            {hero.folded ? 'You folded' : heroBest ? `Best now: ${heroBest.label}` : ''}
          </p>
        </div>
      </div>

      {/* Screen-reader live commentary */}
      <p className="sr-only" role="status" aria-live="polite">
        {eng.announce}
      </p>

      {/* Action area */}
      {eng.status === 'awaiting-hero' && eng.pendingHero && !disabled && (
        <ActionArea pending={eng.pendingHero} pot={eng.pot} onAct={heroAct} reduceMotion={reduceMotion} />
      )}

      {eng.status === 'awaiting-ai' && (
        <p className="py-2 text-center text-sm text-slate-500" aria-live="polite">
          {eng.announce}
        </p>
      )}

      {/* Result */}
      {complete && eng.outcome && (
        <div className="space-y-4">
          <ResultBanner outcome={eng.outcome} heroBest={!hero.folded ? evaluateHoldem(hero.hole, eng.fullBoard) : null} />

          {eng.results.length > 0 && <DecisionRecap results={eng.results} success={success} />}

          {/* The responsible-play note closes the capstone on a genuine completion,
              not on a failed attempt the learner will replay. */}
          {config.showResponsiblePlayNote && success && <ResponsiblePlayNote />}

          {/* Standard submit/retry affordance: on a solved hand nothing shows (the
              lesson's Continue takes over); on a missed hand, "Try again" replays it. */}
          <CheckPanel
            canSubmit={false}
            submitted
            solved={success}
            onSubmit={() => {}}
            onRetry={replay}
            allowRetry={allowRetry}
            submitLabel="Play the hand"
          />
        </div>
      )}
    </div>
  )
}

function ChipDot() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3 w-3 rounded-full border-2 border-dashed border-gold-500 bg-gold-300"
    />
  )
}

function actionBadge(a: { action: BettingAction; chips: number; toAmount: number }): string {
  switch (a.action) {
    case 'fold':
      return 'Folded'
    case 'check':
      return 'Checked'
    case 'call':
      return `Called $${a.chips}`
    case 'bet':
      return `Bet $${a.chips}`
    case 'raise':
      return `Raised to $${a.toAmount}`
  }
}

function ActionArea({
  pending,
  pot,
  onAct,
  reduceMotion,
}: {
  pending: PendingHero
  pot: number
  onAct: (action: BettingAction) => void
  reduceMotion: boolean
}) {
  const labelFor = (action: BettingAction): string => {
    switch (action) {
      case 'fold':
        return 'Fold'
      case 'check':
        return 'Check'
      case 'call':
        return `Call $${pending.toCall}`
      case 'bet':
        return `Bet $${pending.betTarget}`
      case 'raise':
        return `Raise to $${pending.raiseTarget}`
    }
  }
  return (
    <div className={`space-y-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 ${reduceMotion ? '' : 'anim-pop'}`}>
      {pending.checkpoint ? (
        <MathContent className="text-sm font-semibold text-slate-800">
          {pending.checkpoint.prompt}
        </MathContent>
      ) : (
        <p className="text-sm font-semibold text-slate-800">The action is on you — what&apos;s your play?</p>
      )}
      {pending.toCall > 0 && (
        <p className="text-xs text-slate-500">
          It costs <span className="font-semibold tabular-nums text-slate-700">${pending.toCall}</span> to call into
          the <span className="font-semibold tabular-nums text-slate-700">${pot}</span> pot.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {pending.legal.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onAct(action)}
            className={`min-h-11 flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition ${ACTION_BTN[action]}`}
          >
            {labelFor(action)}
          </button>
        ))}
      </div>
    </div>
  )
}

function ResultBanner({ outcome, heroBest }: { outcome: Outcome; heroBest: EvaluatedHand | null }) {
  let tone = 'border-slate-200 bg-slate-50 text-slate-800'
  let headline: string
  if (outcome.heroFolded) {
    headline = `You folded — the $${outcome.potWon} pot goes to the table.`
  } else if (outcome.heroWon && outcome.winners.length > 1) {
    tone = 'border-gold-300 bg-gold-50 text-gold-800'
    headline = `You split the $${outcome.potWon} pot${heroBest ? ` with ${heroBest.label.toLowerCase()}` : ''}.`
  } else if (outcome.heroWon) {
    tone = 'border-emerald-300 bg-emerald-50 text-emerald-800'
    headline = outcome.showdown
      ? `You win the $${outcome.potWon} pot${heroBest ? ` with ${heroBest.label.toLowerCase()}` : ''}!`
      : `Everyone folded — you win the $${outcome.potWon} pot!`
  } else {
    tone = 'border-rose-200 bg-rose-50 text-rose-800'
    headline = `You lost the $${outcome.potWon} pot${heroBest ? ` — you held ${heroBest.label.toLowerCase()}` : ''}.`
  }
  return (
    <div className={`rounded-2xl border p-4 text-center ${tone}`} role="status">
      <p className="text-sm font-bold">{headline}</p>
    </div>
  )
}

function DecisionRecap({ results, success }: { results: DecisionResult[]; success: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Your decisions {success ? '· well played' : '· review and replay'}
      </p>
      <ul className="space-y-2.5">
        {results.map((r, i) => (
          <li key={i} className="flex gap-2.5">
            <span
              className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                r.status === 'fail'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
              aria-hidden="true"
            >
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                {r.status === 'fail' ? <path d="M4 4l8 8M12 4l-8 8" /> : <path d="M3.5 8.5l3 3 6-7" />}
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700">
                {STREET_LABEL[r.street]}: you chose to {r.chosen}.
              </p>
              {r.why && <MathContent className="mt-0.5 text-xs text-slate-500">{r.why}</MathContent>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
