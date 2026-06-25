import type { SeatState } from '../../lib/poker/handEngine'
import { CardBack, CardFace, ChipCount, Chip, EmptySlot } from '../lesson/interactions/cards/PlayingCardKit'

export type SeatRole = 'BTN' | 'SB' | 'BB' | null

type SeatProps = {
  seat: SeatState
  /** Whose turn it is (drives the highlight ring). */
  active: boolean
  /** Opponent is "thinking" (AI table). */
  thinking: boolean
  role: SeatRole
  /** Reveal an opponent's hole cards at showdown. */
  revealHole: boolean
  /** Won (part of) the pot this hand. */
  winner: boolean
  /** Play the deal-in animation on the hole cards. */
  animate: boolean
  /** Opponents render compact (smaller cards). */
  compact?: boolean
  /** Optional in-character table-talk quip (AI tables; hidden when null). */
  talk?: string | null
}

const ROLE_TONE: Record<'BTN' | 'SB' | 'BB', string> = {
  BTN: 'bg-white text-slate-900',
  SB: 'bg-sky-500 text-white',
  BB: 'bg-amber-400 text-amber-950',
}

export function Seat({
  seat,
  active,
  thinking,
  role,
  revealHole,
  winner,
  animate,
  compact = false,
  talk,
}: SeatProps) {
  const cardSize = compact ? 'sm' : 'md'
  const heroTone = seat.isHero ? 'gold' : 'blue'

  const ring = winner
    ? 'ring-2 ring-amber-300 shadow-[0_0_22px_-2px_rgba(252,211,77,0.7)]'
    : active
      ? 'ring-2 ring-white shadow-[0_0_18px_-2px_rgba(255,255,255,0.65)]'
      : 'ring-1 ring-white/10'

  return (
    <div
      className={`relative flex w-[7.5rem] flex-col items-center gap-1 rounded-2xl bg-black/25 px-3 py-2 backdrop-blur-sm transition ${ring} ${
        seat.folded ? 'opacity-50' : ''
      }`}
    >
      {talk && (
        <div className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-2xl rounded-bl-sm bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-slate-700 shadow-lg">
          {talk}
        </div>
      )}

      {/* Name + position badge */}
      <div className="flex max-w-full items-center gap-1.5">
        <span className="truncate text-xs font-bold text-white">
          {seat.isHero ? 'You' : seat.name}
        </span>
        {role && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[0.55rem] font-black tracking-wide shadow ${ROLE_TONE[role]}`}
          >
            {role}
          </span>
        )}
      </div>

      {/* Hole cards */}
      <div className="flex items-end gap-1">
        {renderHole(seat, revealHole, cardSize, animate)}
      </div>

      {/* Stack */}
      <div className="rounded-full bg-black/40 px-2 py-0.5 text-white">
        <ChipCount value={seat.stack} tone={heroTone} />
      </div>

      {/* Status line: committed chips / folded / all-in / thinking */}
      <div className="flex h-5 items-center gap-1.5 text-[0.65rem] font-semibold">
        {seat.folded ? (
          <span className="text-slate-300">Folded</span>
        ) : thinking ? (
          <span className="inline-flex animate-pulse items-center gap-1 text-white/90">
            Thinking…
          </span>
        ) : seat.committed > 0 ? (
          <span className="inline-flex items-center gap-1 text-amber-100">
            <Chip size={12} tone="gold" />
            <span className="tabular-nums">{seat.committed.toLocaleString()}</span>
          </span>
        ) : null}
        {seat.allIn && !seat.folded && (
          <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[0.55rem] font-black uppercase text-white">
            All in
          </span>
        )}
      </div>
    </div>
  )
}

function renderHole(
  seat: SeatState,
  revealHole: boolean,
  size: 'sm' | 'md',
  animate: boolean,
) {
  if (!seat.holeCards) {
    return (
      <>
        <EmptySlot size={size} />
        <EmptySlot size={size} />
      </>
    )
  }
  // Hero always sees their own cards; opponents stay face-down until showdown.
  if (seat.isHero || revealHole) {
    return seat.holeCards.map((c, i) => (
      <CardFace key={c} id={c} size={size} animate={animate} delay={i * 80} />
    ))
  }
  return (
    <>
      <CardBack size={size} animate={animate} />
      <CardBack size={size} animate={animate} delay={70} />
    </>
  )
}
