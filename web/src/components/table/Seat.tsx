import { motion } from 'motion/react'
import type { SeatState } from '../../lib/poker/handEngine'
import { DUR, EASE } from '../../lib/motion'
import {
  CardBack,
  CardFace,
  ChipCount,
  EmptySlot,
  RevealCard,
} from '../lesson/interactions/cards/PlayingCardKit'

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
  /** Play the deal-in / flip / glow animations (false under reduced motion). */
  animate: boolean
  /** Opponents render compact (smaller cards). */
  compact?: boolean
  /** Optional in-character table-talk quip (AI tables; hidden when null). */
  talk?: string | null
}

const ROLE_TONE: Record<'BTN' | 'SB' | 'BB', string> = {
  BTN: 'bg-white text-night-900',
  SB: 'bg-night-600 text-white',
  BB: 'bg-gold-400 text-gold-900',
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

  // The resting border ring; the soft, pulsing halo is the <GlowRing> overlay. The
  // active seat is pushed hardest (bright gold ring) so whose-turn is unmistakable.
  const ring = winner
    ? 'ring-2 ring-gold-300'
    : active
      ? 'ring-2 ring-gold-300/90'
      : 'ring-1 ring-white/10'

  // Opponents render narrow so several seats fit around the oval on a phone; the
  // hero seat (always at the bottom, with bigger cards) gets a little more room.
  const sizeCls = compact ? 'w-[5.75rem] gap-1 px-2 py-1.5' : 'w-[7.5rem] gap-1.5 px-3 py-2.5'

  return (
    <div
      className={`suited-seat relative flex flex-col items-center rounded-2xl backdrop-blur-sm transition ${sizeCls} ${ring} ${
        seat.folded ? 'opacity-45 saturate-50' : ''
      } ${active ? 'suited-seat--active' : ''}`}
    >
      {(winner || active) && <GlowRing tone={winner ? 'win' : 'active'} animate={animate} />}

      {talk && (
        <div className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-2xl rounded-bl-sm bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-night-800 shadow-lg">
          {talk}
        </div>
      )}

      {/* Name + position badge */}
      <div className="relative flex max-w-full items-center gap-1.5">
        <span className="truncate text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
          {seat.isHero ? 'You' : seat.name}
        </span>
        {role && (
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.55rem] font-black tracking-wide shadow ${ROLE_TONE[role]}`}
          >
            {role}
          </span>
        )}
      </div>

      {/* Hole cards */}
      <div className="relative flex items-end gap-1">{renderHole(seat, revealHole, cardSize, animate)}</div>

      {/* Stack — a chip-rail readout so the number always reads clearly on the felt */}
      <div className="relative rounded-full bg-night-950/55 px-2.5 py-0.5 text-white ring-1 ring-inset ring-white/15">
        <ChipCount value={seat.stack} tone={heroTone} />
      </div>

      {/* Status line: folded / all-in / thinking (committed chips show on the felt) */}
      <div className="relative flex h-4 items-center gap-1.5 text-[0.65rem] font-semibold">
        {seat.folded ? (
          <span className="uppercase tracking-wide text-night-100/90">Folded</span>
        ) : thinking ? (
          <ThinkingDots animate={animate} />
        ) : seat.allIn ? (
          <span className="rounded bg-danger-500 px-1.5 py-0.5 text-[0.55rem] font-black uppercase text-white">
            All in
          </span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * The soft, animated halo around an active or winning seat. The active seat breathes
 * gently (looping); a winner gets a single brass pop that then holds its glow. Under
 * reduced motion it renders as a static halo (no looping, no pop).
 */
function GlowRing({ tone, animate }: { tone: 'win' | 'active'; animate: boolean }) {
  const shadow =
    tone === 'win'
      ? '0 0 26px -2px rgba(212, 173, 87, 0.75)' // gold-400 halo
      : '0 0 20px -2px rgba(255, 255, 255, 0.6)'
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-2xl"
      style={{ boxShadow: shadow }}
      initial={false}
      animate={
        !animate
          ? { opacity: tone === 'win' ? 0.85 : 0.6, scale: 1 }
          : tone === 'win'
            ? { opacity: [0, 1, 0.9], scale: [0.85, 1.06, 1] }
            : { opacity: [0.4, 0.85, 0.4], scale: [1, 1.02, 1] }
      }
      transition={
        !animate
          ? { duration: 0 }
          : tone === 'win'
            ? { duration: DUR.celebrate, ease: EASE.chip }
            : { duration: 1.6, ease: EASE.standard, repeat: Infinity }
      }
    />
  )
}

/** A paced "Thinking…" indicator: three brass-free dots that ripple while an AI acts. */
function ThinkingDots({ animate }: { animate: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-white/90">
      Thinking
      <span className="inline-flex items-end gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block h-1 w-1 rounded-full bg-white/80"
            initial={false}
            animate={animate ? { opacity: [0.25, 1, 0.25], y: [0, -2, 0] } : { opacity: 0.8 }}
            transition={
              animate
                ? { duration: 0.9, ease: EASE.standard, repeat: Infinity, delay: i * 0.15 }
                : { duration: 0 }
            }
          />
        ))}
      </span>
    </span>
  )
}

function renderHole(seat: SeatState, revealHole: boolean, size: 'sm' | 'md', animate: boolean) {
  if (!seat.holeCards) {
    return (
      <>
        <EmptySlot size={size} />
        <EmptySlot size={size} />
      </>
    )
  }
  // The hero always sees their own cards (dealt face-up); no flip needed.
  if (seat.isHero) {
    return seat.holeCards.map((c, i) => (
      <CardFace key={c} id={c} size={size} animate={animate} delay={i * 80} />
    ))
  }
  // Opponents stay face-down until showdown, then flip back → face in 3D. The real
  // card ids only enter the DOM at reveal time (privacy: no peeking via devtools).
  if (revealHole) {
    return seat.holeCards.map((c, i) => (
      <RevealCard key={c} id={c} size={size} revealed animate={animate} delay={i * 110} />
    ))
  }
  return (
    <>
      <CardBack size={size} animate={animate} />
      <CardBack size={size} animate={animate} delay={70} />
    </>
  )
}
