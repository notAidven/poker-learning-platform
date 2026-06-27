import type { CSSProperties } from 'react'
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
  /** Whose turn it is (drives the highlight ring + the countdown timer). */
  active: boolean
  /** Opponent is "thinking" (AI table). */
  thinking: boolean
  role: SeatRole
  /** Reveal an opponent's hole cards at showdown. */
  revealHole: boolean
  /** Won (part of) the pot this hand. */
  winner: boolean
  /** Play the deal-in / flip / glow / timer animations (false under reduced motion). */
  animate: boolean
  /** Opponents render compact (smaller cards + nameplate). */
  compact?: boolean
  /** Optional in-character table-talk quip (AI tables; hidden when null). */
  talk?: string | null
}

/** Cosmetic seat clock (seconds) — paces the active glow; it never auto-acts. */
const TURN_SECONDS = 20

/** Deterministic avatar gradients (from → to) picked by seat id, so each rival is stable. */
const AVATAR_PALETTE: [string, string][] = [
  ['#38bdf8', '#0369a1'], // sky
  ['#a78bfa', '#6d28d9'], // violet
  ['#fb7185', '#9f1239'], // rose
  ['#34d399', '#047857'], // emerald
  ['#f472b6', '#a21caf'], // fuchsia
  ['#fbbf24', '#b45309'], // amber
]
const HERO_AVATAR: [string, string] = ['#f6e4ac', '#bb8f3c'] // brass — the hero stands out

function hashSeat(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
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
  const avatarSize = compact ? 30 : 40
  const [from, to] = seat.isHero ? HERO_AVATAR : AVATAR_PALETTE[hashSeat(seat.id) % AVATAR_PALETTE.length]
  const initial = (seat.name || '?').charAt(0).toUpperCase()

  // The nameplate "pod": a 2-tone plate that brightens on the active turn. The hero's
  // plate carries a brass accent so "your seat" is unmistakable.
  const plateTone = seat.isHero ? 'suited-plate--hero' : ''
  const plateState = winner ? 'suited-plate--win' : active ? 'suited-plate--active' : ''
  const plateSize = compact ? 'gap-1.5 px-2 py-1' : 'gap-2 px-2.5 py-1.5'

  return (
    <div
      className={`relative flex flex-col items-center ${compact ? 'w-[6.75rem]' : 'w-[9rem]'} ${
        seat.folded ? 'opacity-45 saturate-50' : ''
      }`}
    >
      {talk && (
        <div className="absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-2xl rounded-bl-sm bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-night-800 shadow-lg">
          {talk}
        </div>
      )}

      {/* Hole cards — held above the nameplate, dipping slightly behind its top edge. */}
      <div className="relative z-10 flex items-end justify-center gap-1">
        {renderHole(seat, revealHole, cardSize, animate)}
      </div>

      {/* The pro nameplate: avatar (+ active timer ring) · name · stack. */}
      <div className={`suited-plate relative -mt-1 flex items-center ${plateSize} ${plateTone} ${plateState}`}>
        {(winner || active) && <GlowRing tone={winner ? 'win' : 'active'} animate={animate} />}

        <div className="relative shrink-0" style={{ width: avatarSize, height: avatarSize }}>
          <span
            className="flex h-full w-full items-center justify-center rounded-full font-display font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_1px_2px_rgba(0,0,0,0.4)]"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 30%, ${from}, ${to})`,
              color: seat.isHero ? '#3a2a08' : '#fff',
              fontSize: compact ? 13 : 16,
            }}
            aria-hidden
          >
            {initial}
          </span>
          {active && <TurnTimerRing size={avatarSize} animate={animate} />}
        </div>

        <div className="relative min-w-0 flex-1 leading-tight">
          <div className="truncate text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
            {seat.isHero ? 'You' : seat.name}
          </div>
          <div className="mt-0.5">
            <ChipCount value={seat.stack} tone={heroTone} />
          </div>
        </div>

        {/* Dealer button / blind indicator — pinned to the plate's lower-right corner. */}
        {role && <PositionChip role={role} />}
      </div>

      {/* Status line: folded / all-in / thinking (committed chips show on the felt). */}
      <div className="relative mt-0.5 flex h-4 items-center gap-1.5 text-[0.65rem] font-semibold">
        {seat.folded ? (
          <span className="rounded bg-night-950/70 px-1.5 py-0.5 uppercase tracking-wide text-night-100/90">
            Folded
          </span>
        ) : thinking ? (
          <ThinkingDots animate={animate} />
        ) : seat.allIn ? (
          <span className="rounded bg-danger-500 px-1.5 py-0.5 text-[0.55rem] font-black uppercase tracking-wide text-white">
            All in
          </span>
        ) : null}
      </div>
    </div>
  )
}

/** The dealer button (white "D") or a small blind chip (SB / BB) for this seat. */
function PositionChip({ role }: { role: 'BTN' | 'SB' | 'BB' }) {
  if (role === 'BTN') {
    return (
      <span
        className="absolute -bottom-2 -right-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-white text-[0.6rem] font-black text-night-900 shadow-[0_2px_4px_rgba(0,0,0,0.45)] ring-1 ring-black/10"
        title="Dealer button"
      >
        D
      </span>
    )
  }
  const tone =
    role === 'BB'
      ? 'bg-gold-400 text-gold-900 ring-gold-200/60'
      : 'bg-night-700 text-white ring-white/20'
  return (
    <span
      className={`absolute -bottom-2 -right-1.5 z-10 grid h-6 w-6 place-items-center rounded-full text-[0.5rem] font-black uppercase shadow-[0_2px_4px_rgba(0,0,0,0.45)] ring-1 ${tone}`}
      title={role === 'SB' ? 'Small blind' : 'Big blind'}
    >
      {role}
    </span>
  )
}

/**
 * The active-turn countdown ring drawn around the avatar — the pro "it's on you"
 * cue. It wipes from a full ring to empty over `TURN_SECONDS`; under reduced motion
 * it renders as a static full ring (the glow + brightened plate still flag the turn).
 * Purely cosmetic: the timer never forces an action, so the drill + free play are
 * unaffected.
 */
function TurnTimerRing({ size, animate }: { size: number; animate: boolean }) {
  const box = size + 6
  const stroke = Math.max(2, Math.round(size * 0.09))
  const r = (box - stroke) / 2
  const c = box / 2
  return (
    <svg
      className="pointer-events-none absolute"
      style={{ left: -3, top: -3 }}
      width={box}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      aria-hidden
    >
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(7,21,15,0.55)" strokeWidth={stroke} />
      <motion.circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke="#e7cd86"
        strokeWidth={stroke}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1 1"
        transform={`rotate(-90 ${c} ${c})`}
        initial={animate ? { strokeDashoffset: 0 } : false}
        animate={{ strokeDashoffset: animate ? 1 : 0 }}
        transition={animate ? { duration: TURN_SECONDS, ease: 'linear' } : { duration: 0 }}
      />
    </svg>
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
      : '0 0 22px -2px rgba(231, 205, 134, 0.7)'
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
    <span className="inline-flex items-center gap-1 rounded bg-night-950/55 px-1.5 py-0.5 text-white/90">
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
  // The hero always sees their own cards (dealt face-up); no flip needed. A subtle
  // overlap + fan gives the "cards in hand" read of a real table.
  if (seat.isHero) {
    return seat.holeCards.map((c, i) => (
      <span
        key={c}
        className="block"
        style={heldCardStyle(i, seat.holeCards!.length)}
      >
        <CardFace id={c} size={size} animate={animate} delay={i * 80} />
      </span>
    ))
  }
  // Opponents stay face-down until showdown, then flip back → face in 3D. The real
  // card ids only enter the DOM at reveal time (privacy: no peeking via devtools).
  if (revealHole) {
    return seat.holeCards.map((c, i) => (
      <span key={c} className="block" style={heldCardStyle(i, seat.holeCards!.length)}>
        <RevealCard id={c} size={size} revealed animate={animate} delay={i * 110} />
      </span>
    ))
  }
  return (
    <>
      <span className="block" style={heldCardStyle(0, 2)}>
        <CardBack size={size} animate={animate} />
      </span>
      <span className="block" style={heldCardStyle(1, 2)}>
        <CardBack size={size} animate={animate} delay={70} />
      </span>
    </>
  )
}

/** A gentle two-card fan (slight rotate + overlap) for held hole cards. */
function heldCardStyle(i: number, count: number): CSSProperties {
  const mid = (count - 1) / 2
  const rot = (i - mid) * 6
  return {
    transform: `rotate(${rot}deg)`,
    marginLeft: i === 0 ? 0 : -6,
    transformOrigin: 'bottom center',
  }
}
