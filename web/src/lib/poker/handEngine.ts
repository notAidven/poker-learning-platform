/**
 * Multiway no-limit Texas Hold'em hand engine — the pure, React-free state machine
 * that drives the Phase 2 "AI casino tables". It owns one *hand*: posting blinds,
 * dealing hole cards, running the four betting rounds, dealing the board, and
 * resolving showdowns with correct side pots.
 *
 * Everything here is a pure function over plain data (no React, no I/O). All
 * randomness flows through a seeded RNG (mulberry32 + Fisher–Yates) derived from
 * `config.seed`, so a given seed always produces the same deck. `applyAction`
 * never mutates its input — it returns a brand-new `HandState`.
 *
 * Card identity, the deck, and hand evaluation are reused from the existing
 * modules (`types/lesson.ts`, `lib/poker/handEvaluator.ts`); this module only adds
 * the betting / pot mechanics on top.
 */
import { fullDeck, cardLabel, type CardId } from '../../types/lesson'
import type { BettingAction, PokerStreet } from '../../types/poker'
import { compareHands, evaluateHoldem } from './handEvaluator'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SeatState = {
  id: string
  name: string
  isHero: boolean
  /** Chips behind (not yet wagered). */
  stack: number
  /** Chips put in THIS street. */
  committed: number
  /** Chips put in across the whole hand (basis for side pots). */
  totalCommitted: number
  holeCards: [CardId, CardId] | null
  folded: boolean
  allIn: boolean
  /** Has acted since the last bet/raise this street (cleared when action re-opens). */
  hasActed: boolean
}

export type HandConfig = {
  seats: { id: string; name: string; isHero: boolean; stack: number }[]
  buttonIndex: number
  smallBlind: number
  bigBlind: number
  seed: number
}

/** A legal action offered to the seat to act. `min`/`max` are the *total* street
 *  commitment for `bet`/`raise` (i.e. "bet to / raise to X"). */
export type LegalAction = { action: BettingAction; min?: number; max?: number }

/** An action to apply. `amount` is the *total* street commitment for `bet`/`raise`. */
export type AppliedAction = { action: BettingAction; amount?: number }

export type PotResult = { amount: number; eligibleSeatIds: string[]; winnerSeatIds: string[] }

export type HandPhase = PokerStreet | 'showdown' | 'complete'

export type HandState = {
  seats: SeatState[]
  buttonIndex: number
  sb: number
  bb: number
  phase: HandPhase
  board: CardId[]
  deck: CardId[]
  burns: CardId[]
  pot: number
  currentBet: number
  minRaise: number
  /** Seat index to act, or null when the betting round is closed. */
  toActIndex: number | null
  lastAggressorIndex: number | null
  seed: number
  /** Human-readable history. */
  log: string[]
}

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32) + Fisher–Yates shuffle
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function cloneSeat(s: SeatState): SeatState {
  return {
    ...s,
    holeCards: s.holeCards ? [s.holeCards[0], s.holeCards[1]] : null,
  }
}

function cloneState(s: HandState): HandState {
  return {
    ...s,
    seats: s.seats.map(cloneSeat),
    board: [...s.board],
    deck: [...s.deck],
    burns: [...s.burns],
    log: [...s.log],
  }
}

function cardList(cards: CardId[]): string {
  return cards.join(' ')
}

// ---------------------------------------------------------------------------
// createHand — post blinds, deal hole cards, set first to act
// ---------------------------------------------------------------------------

export function createHand(config: HandConfig): HandState {
  const n = config.seats.length
  if (n < 2) throw new Error('createHand requires at least 2 seats')

  const seats: SeatState[] = config.seats.map((s) => ({
    id: s.id,
    name: s.name,
    isHero: s.isHero,
    stack: Math.max(0, Math.floor(s.stack)),
    committed: 0,
    totalCommitted: 0,
    holeCards: null,
    folded: false,
    allIn: false,
    hasActed: false,
  }))

  const rng = mulberry32(config.seed)
  const deck = shuffle(fullDeck(), rng)

  // Deal two hole cards each, one at a time, starting from the small blind seat
  // (left of the button), exactly like a live deal.
  const buttonIndex = ((config.buttonIndex % n) + n) % n
  let di = 0
  const dealt: CardId[][] = seats.map(() => [])
  for (let round = 0; round < 2; round++) {
    for (let off = 1; off <= n; off++) {
      const idx = (buttonIndex + off) % n
      dealt[idx].push(deck[di++])
    }
  }
  seats.forEach((seat, idx) => {
    seat.holeCards = [dealt[idx][0], dealt[idx][1]]
  })
  const remainingDeck = deck.slice(di)

  const state: HandState = {
    seats,
    buttonIndex,
    sb: config.smallBlind,
    bb: config.bigBlind,
    phase: 'preflop',
    board: [],
    deck: remainingDeck,
    burns: [],
    pot: 0,
    currentBet: 0,
    minRaise: config.bigBlind,
    toActIndex: null,
    lastAggressorIndex: null,
    seed: config.seed,
    log: [],
  }

  // Blind positions. Heads-up: the button posts the small blind.
  const sbIndex = n === 2 ? buttonIndex : (buttonIndex + 1) % n
  const bbIndex = n === 2 ? (buttonIndex + 1) % n : (buttonIndex + 2) % n

  const sbPaid = postBlind(state, sbIndex, config.smallBlind)
  state.log.push(`${seats[sbIndex].name} posts SB ${sbPaid}`)
  const bbPaid = postBlind(state, bbIndex, config.bigBlind)
  state.log.push(`${seats[bbIndex].name} posts BB ${bbPaid}`)

  state.currentBet = Math.max(...seats.map((s) => s.committed))
  state.minRaise = config.bigBlind
  state.lastAggressorIndex = bbIndex

  for (const seat of seats) {
    if (seat.holeCards) {
      state.log.push(`Dealt ${seat.name} ${seat.isHero ? cardList(seat.holeCards) : 'two cards'}`)
    }
  }

  state.toActIndex = firstToActPreflop(state)
  return state
}

function postBlind(state: HandState, index: number, amount: number): number {
  const seat = state.seats[index]
  const pay = Math.min(amount, seat.stack)
  seat.stack -= pay
  seat.committed += pay
  seat.totalCommitted += pay
  state.pot += pay
  if (seat.stack === 0) seat.allIn = true
  return pay
}

// ---------------------------------------------------------------------------
// Seat ordering helpers
// ---------------------------------------------------------------------------

function firstToActPreflop(state: HandState): number | null {
  const n = state.seats.length
  const start = n === 2 ? state.buttonIndex : (state.buttonIndex + 3) % n
  for (let step = 0; step < n; step++) {
    const idx = (start + step) % n
    const seat = state.seats[idx]
    if (!seat.folded && !seat.allIn) return idx
  }
  return null
}

/** First active (non-folded, non-all-in) seat left of the button — postflop order. */
function firstToActPostflop(state: HandState): number | null {
  const n = state.seats.length
  for (let step = 1; step <= n; step++) {
    const idx = (state.buttonIndex + step) % n
    const seat = state.seats[idx]
    if (!seat.folded && !seat.allIn) return idx
  }
  return null
}

/**
 * Next seat (clockwise from `fromIndex`) that still owes an action: not folded,
 * not all-in, and either hasn't acted since the last raise or hasn't matched the
 * current bet. Returns null when the betting round is closed.
 */
function findNextToAct(state: HandState, fromIndex: number): number | null {
  const n = state.seats.length
  for (let step = 1; step <= n; step++) {
    const idx = (fromIndex + step) % n
    const seat = state.seats[idx]
    if (seat.folded || seat.allIn) continue
    if (!seat.hasActed || seat.committed !== state.currentBet) return idx
  }
  return null
}

function reopenAction(state: HandState, aggressorIndex: number): void {
  state.seats.forEach((seat, idx) => {
    if (idx !== aggressorIndex && !seat.folded && !seat.allIn) seat.hasActed = false
  })
}

// ---------------------------------------------------------------------------
// toCallFor / legalActions
// ---------------------------------------------------------------------------

export function toCallFor(state: HandState, seatIndex: number): number {
  const seat = state.seats[seatIndex]
  if (!seat) return 0
  return clamp(state.currentBet - seat.committed, 0, seat.stack)
}

export function legalActions(state: HandState): LegalAction[] {
  const i = state.toActIndex
  if (i === null) return []
  const seat = state.seats[i]
  if (!seat || seat.folded || seat.allIn || seat.stack <= 0) return []

  const toCall = toCallFor(state, i)
  const maxTotal = seat.committed + seat.stack // all-in "to" amount
  const out: LegalAction[] = []

  if (toCall === 0) {
    // Not facing a bet: check is always available.
    out.push({ action: 'check' })
    if (state.currentBet === 0) {
      // Opening bet (nobody has bet this street).
      out.push({ action: 'bet', min: Math.min(state.bb, seat.stack), max: seat.stack })
    } else if (maxTotal > state.currentBet) {
      // Big-blind option: may raise even though nothing is owed.
      out.push({
        action: 'raise',
        min: Math.min(state.currentBet + state.minRaise, maxTotal),
        max: maxTotal,
      })
    }
  } else {
    // Facing a bet: fold + call always available; raise when chips allow.
    out.push({ action: 'fold' })
    out.push({ action: 'call' })
    if (maxTotal > state.currentBet) {
      out.push({
        action: 'raise',
        min: Math.min(state.currentBet + state.minRaise, maxTotal),
        max: maxTotal,
      })
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// applyAction
// ---------------------------------------------------------------------------

export function applyAction(state: HandState, applied: AppliedAction): HandState {
  const i = state.toActIndex
  if (i === null) return cloneState(state)

  const next = cloneState(state)
  const seat = next.seats[i]
  const bounds = legalActions(state).find((a) => a.action === applied.action)

  switch (applied.action) {
    case 'fold': {
      seat.folded = true
      seat.hasActed = true
      next.log.push(`${seat.name} folds`)
      break
    }
    case 'check': {
      seat.hasActed = true
      next.log.push(`${seat.name} checks`)
      break
    }
    case 'call': {
      const pay = clamp(next.currentBet - seat.committed, 0, seat.stack)
      commitChips(next, seat, pay)
      seat.hasActed = true
      next.log.push(`${seat.name} calls ${pay}${seat.allIn ? ' (all-in)' : ''}`)
      break
    }
    case 'bet': {
      const lo = bounds?.min ?? Math.min(next.bb, seat.stack)
      const hi = bounds?.max ?? seat.committed + seat.stack
      const total = clamp(Math.round(applied.amount ?? lo), lo, hi)
      const pay = total - seat.committed
      commitChips(next, seat, pay)
      next.currentBet = seat.committed
      next.minRaise = seat.committed
      next.lastAggressorIndex = i
      seat.hasActed = true
      reopenAction(next, i)
      next.log.push(`${seat.name} bets ${seat.committed}${seat.allIn ? ' (all-in)' : ''}`)
      break
    }
    case 'raise': {
      const lo = bounds?.min ?? Math.min(next.currentBet + next.minRaise, seat.committed + seat.stack)
      const hi = bounds?.max ?? seat.committed + seat.stack
      const prevBet = next.currentBet
      const total = clamp(Math.round(applied.amount ?? lo), lo, hi)
      const pay = total - seat.committed
      commitChips(next, seat, pay)
      const increment = seat.committed - prevBet
      // A full-sized raise bumps the minimum; a short all-in raise does not re-set it.
      if (increment >= next.minRaise) next.minRaise = increment
      next.currentBet = Math.max(next.currentBet, seat.committed)
      next.lastAggressorIndex = i
      seat.hasActed = true
      reopenAction(next, i)
      next.log.push(`${seat.name} raises to ${seat.committed}${seat.allIn ? ' (all-in)' : ''}`)
      break
    }
  }

  advanceAfterAction(next)
  return next
}

function commitChips(state: HandState, seat: SeatState, rawPay: number): void {
  const pay = clamp(Math.round(rawPay), 0, seat.stack)
  seat.stack -= pay
  seat.committed += pay
  seat.totalCommitted += pay
  state.pot += pay
  if (seat.stack === 0) seat.allIn = true
}

function advanceAfterAction(state: HandState): void {
  const stillIn = state.seats.filter((s) => !s.folded)
  if (stillIn.length <= 1) {
    state.phase = 'complete'
    state.toActIndex = null
    return
  }
  const fromIndex = state.toActIndex ?? state.buttonIndex
  const nextIdx = findNextToAct(state, fromIndex)
  if (nextIdx === null) {
    closeRoundAndAdvance(state)
  } else {
    state.toActIndex = nextIdx
  }
}

/**
 * The current betting round is closed. Deal streets until either another round
 * of betting is required (≥2 players can still act) or we reach showdown.
 */
function closeRoundAndAdvance(state: HandState): void {
  // Guard against runaway loops; at most preflop→flop→turn→river.
  for (let guard = 0; guard < 5; guard++) {
    const stillIn = state.seats.filter((s) => !s.folded)
    if (stillIn.length <= 1) {
      state.phase = 'complete'
      state.toActIndex = null
      return
    }
    if (state.phase === 'river') {
      state.phase = 'showdown'
      state.toActIndex = null
      return
    }
    if (state.phase === 'showdown' || state.phase === 'complete') {
      state.toActIndex = null
      return
    }

    dealNextStreet(state)
    resetForNewStreet(state)

    const canAct = state.seats.filter((s) => !s.folded && !s.allIn)
    if (canAct.length >= 2) {
      state.toActIndex = firstToActPostflop(state)
      return
    }
    // ≤1 player can act → no betting this street; keep dealing toward showdown.
  }
  state.toActIndex = null
}

function dealNextStreet(state: HandState): void {
  // Burn one card before each community-card street.
  const burn = state.deck.shift()
  if (burn) state.burns.push(burn)

  if (state.phase === 'preflop') {
    const flop = [state.deck.shift(), state.deck.shift(), state.deck.shift()].filter(
      (c): c is CardId => Boolean(c),
    )
    state.board.push(...flop)
    state.phase = 'flop'
    state.log.push(`Flop: ${cardList(flop)}`)
  } else if (state.phase === 'flop') {
    const turn = state.deck.shift()
    if (turn) state.board.push(turn)
    state.phase = 'turn'
    state.log.push(`Turn: ${turn ?? '?'}`)
  } else if (state.phase === 'turn') {
    const river = state.deck.shift()
    if (river) state.board.push(river)
    state.phase = 'river'
    state.log.push(`River: ${river ?? '?'}`)
  }
}

function resetForNewStreet(state: HandState): void {
  for (const seat of state.seats) {
    seat.committed = 0
    seat.hasActed = false
  }
  state.currentBet = 0
  state.minRaise = state.bb
  state.lastAggressorIndex = null
}

// ---------------------------------------------------------------------------
// Completion / showdown / settlement
// ---------------------------------------------------------------------------

export function isHandComplete(state: HandState): boolean {
  return state.phase === 'complete'
}

/**
 * Build side pots from each seat's `totalCommitted` and decide the winner(s) of
 * every pot layer. Folded seats still contribute chips but can never be eligible
 * to win. Single-eligible layers (uncalled bets) are returned too — settling them
 * simply returns the chips to that player.
 */
export function runShowdown(state: HandState): { board: CardId[]; pots: PotResult[] } {
  const seats = state.seats
  const levels = [...new Set(seats.map((s) => s.totalCommitted).filter((c) => c > 0))].sort(
    (a, b) => a - b,
  )

  const pots: PotResult[] = []
  let prev = 0
  for (const level of levels) {
    const layer = level - prev
    let amount = 0
    const eligibleSeatIds: string[] = []
    for (const seat of seats) {
      if (seat.totalCommitted >= level) {
        amount += layer
        if (!seat.folded) eligibleSeatIds.push(seat.id)
      }
    }
    pots.push({ amount, eligibleSeatIds, winnerSeatIds: decideWinners(state, eligibleSeatIds) })
    prev = level
  }

  return { board: [...state.board], pots }
}

function decideWinners(state: HandState, eligibleSeatIds: string[]): string[] {
  if (eligibleSeatIds.length === 0) return []
  if (eligibleSeatIds.length === 1) return [...eligibleSeatIds]

  let best: ReturnType<typeof evaluateHoldem> | null = null
  let winners: string[] = []
  for (const id of eligibleSeatIds) {
    const seat = state.seats.find((s) => s.id === id)
    if (!seat || !seat.holeCards) continue
    const hand = evaluateHoldem(seat.holeCards, state.board)
    if (best === null) {
      best = hand
      winners = [id]
      continue
    }
    const cmp = compareHands(hand, best)
    if (cmp > 0) {
      best = hand
      winners = [id]
    } else if (cmp === 0) {
      winners.push(id)
    }
  }
  return winners
}

/** Winner ids ordered by seat position starting left of the button (for odd chips). */
function orderFromButton(state: HandState, ids: string[]): string[] {
  const n = state.seats.length
  const ordered: string[] = []
  for (let step = 1; step <= n; step++) {
    const idx = (state.buttonIndex + step) % n
    const id = state.seats[idx].id
    if (ids.includes(id)) ordered.push(id)
  }
  return ordered
}

/**
 * Pay the winners and complete the hand. With a single player left (everyone else
 * folded) the whole pot is awarded uncontested; otherwise we run a showdown and
 * split each pot layer between its winners (odd chips go left of the button).
 */
export function settle(state: HandState): HandState {
  const next = cloneState(state)
  const stillIn = next.seats.filter((s) => !s.folded)

  if (stillIn.length <= 1) {
    const winner = stillIn[0]
    if (winner) {
      winner.stack += next.pot
      next.log.push(`${winner.name} wins ${next.pot} (uncontested)`)
    }
    next.phase = 'complete'
    next.toActIndex = null
    return next
  }

  const { pots } = runShowdown(next)
  for (const pot of pots) {
    const winners = pot.winnerSeatIds
    if (winners.length === 0) continue
    const share = Math.floor(pot.amount / winners.length)
    const remainder = pot.amount - share * winners.length
    for (const id of winners) {
      const seat = next.seats.find((s) => s.id === id)
      if (seat) seat.stack += share
    }
    if (remainder > 0) {
      const ordered = orderFromButton(next, winners)
      for (let k = 0; k < remainder; k++) {
        const id = ordered[k % ordered.length]
        const seat = next.seats.find((s) => s.id === id)
        if (seat) seat.stack += 1
      }
    }

    const winnerNames = winners
      .map((id) => next.seats.find((s) => s.id === id)?.name ?? id)
      .join(', ')
    next.log.push(`${winnerNames} ${winners.length > 1 ? 'split' : 'wins'} ${pot.amount}`)
  }

  // Append everyone's showdown hand for readability.
  for (const seat of next.seats) {
    if (!seat.folded && seat.holeCards) {
      const hand = evaluateHoldem(seat.holeCards, next.board)
      next.log.push(`${seat.name} shows ${seat.holeCards.map(cardLabel).join(', ')} — ${hand.label}`)
    }
  }

  next.phase = 'complete'
  next.toActIndex = null
  return next
}
