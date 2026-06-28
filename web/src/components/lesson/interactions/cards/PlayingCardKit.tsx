/**
 * Shared playing-card kit — one source of truth for card visuals across the lesson
 * widgets (`CardDeck`, `BoardDealer`, `BettingRound`) and the new AI casino tables.
 *
 * Previously each widget redefined its own `SuitIcon` / card face / card back / chips.
 * This module consolidates them so the deck, burns, board, hole cards, and chips look
 * identical everywhere. All visuals are self-contained: render <CardKitStyles /> once
 * inside any tree that uses these components (the global `.dot-field` texture already
 * lives in index.css).
 */
import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { EASE } from '../../../../lib/motion'
import { cardLabel, isRedSuit, parseCardId, type CardId, type CardSuit } from '../../../../types/lesson'
import { denomVars, topDenom, type ChipDenom } from './chipDenoms'

export type CardSize = 'sm' | 'md' | 'lg'

const FRAME: Record<CardSize, string> = {
  sm: 'h-12 w-8',
  md: 'h-16 w-11',
  lg: 'h-20 w-14',
}
const RANK_TEXT: Record<CardSize, string> = {
  sm: 'text-[0.55rem]',
  md: 'text-[0.7rem]',
  lg: 'text-sm',
}
const CORNER_ICON: Record<CardSize, string> = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
}
const CENTER_ICON: Record<CardSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
}
const INSET: Record<CardSize, { left: string; right: string }> = {
  sm: { left: 'left-0.5', right: 'right-0.5' },
  md: { left: 'left-1', right: 'right-1' },
  lg: { left: 'left-1', right: 'right-1' },
}
const DOT: Record<CardSize, string> = { sm: '6px', md: '6px', lg: '8px' }

/** Crisp vector suit symbol — color comes from the parent via currentColor. */
export function SuitIcon({ suit, className }: { suit: CardSuit; className?: string }) {
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

/** A face-up playing card with corner pips + a center suit. */
export function CardFace({
  id,
  size = 'md',
  animate = false,
  delay = 0,
  className = '',
}: {
  id: CardId
  size?: CardSize
  animate?: boolean
  delay?: number
  className?: string
}) {
  const { rank, suit } = parseCardId(id)
  const color = isRedSuit(suit) ? 'text-rose-600' : 'text-slate-900'
  return (
    <span
      className={`relative block rounded-md border-2 border-slate-200 bg-white shadow-sm ${FRAME[size]} ${
        animate ? 'pck-deal' : ''
      } ${className}`}
      style={animate ? { animationDelay: `${delay}ms` } : undefined}
      role="img"
      aria-label={cardLabel(id)}
    >
      <span className={`absolute top-0.5 ${INSET[size].left} flex flex-col items-center leading-none ${color}`}>
        <span className={`${RANK_TEXT[size]} font-bold tabular-nums`}>{rank}</span>
        <SuitIcon suit={suit} className={CORNER_ICON[size]} />
      </span>
      <span className={`absolute inset-0 flex items-center justify-center ${color}`}>
        <SuitIcon suit={suit} className={CENTER_ICON[size]} />
      </span>
      <span
        className={`absolute bottom-0.5 ${INSET[size].right} flex rotate-180 flex-col items-center leading-none ${color}`}
      >
        <span className={`${RANK_TEXT[size]} font-bold tabular-nums`}>{rank}</span>
        <SuitIcon suit={suit} className={CORNER_ICON[size]} />
      </span>
    </span>
  )
}

/** A face-down card (brand-gradient back with the signature dot field). */
export function CardBack({
  size = 'md',
  animate = false,
  delay = 0,
  className = '',
  label = 'Face-down card',
}: {
  size?: CardSize
  animate?: boolean
  delay?: number
  className?: string
  label?: string
}) {
  return (
    <span
      className={`relative block rounded-md border-2 border-white bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm ${FRAME[size]} ${
        animate ? 'pck-deal' : ''
      } ${className}`}
      style={animate ? { animationDelay: `${delay}ms` } : undefined}
      role="img"
      aria-label={label}
    >
      <span
        className="dot-field absolute inset-1 rounded-sm"
        style={{ '--dot-size': DOT[size] } as CSSProperties}
        aria-hidden="true"
      />
    </span>
  )
}

/**
 * A card that flips from its face-down back to its face-up front in 3D — used for a
 * showdown reveal (back → face) instead of a hard back/face swap. Purely additive:
 * the static <CardBack> / <CardFace> primitives are untouched.
 *
 * The flip is self-contained: when `animate`, the card always starts on its back and
 * settles to `revealed ? face : back`, so mounting it straight into a revealed state
 * (the showdown swap) still plays the flip — and the real card `id` only needs to
 * enter the DOM at reveal time. `revealed` toggling false→true on a persisted card
 * also flips it.
 *
 * `animate` gates the motion; pass `false` (e.g. under `prefers-reduced-motion`) to
 * snap straight to the final face/back. The flip is JS-driven (motion/react), so
 * callers MUST gate `animate` on the reduced-motion preference themselves — the
 * global CSS kill-switch cannot stop it. `delay` (ms) staggers the flip.
 */
export function RevealCard({
  id,
  size = 'md',
  revealed,
  animate = false,
  delay = 0,
  className = '',
  backLabel = 'Face-down card',
}: {
  id: CardId
  size?: CardSize
  revealed: boolean
  animate?: boolean
  delay?: number
  className?: string
  backLabel?: string
}) {
  const faceStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  }
  return (
    <span
      className={`relative block ${FRAME[size]} ${className}`}
      style={{ perspective: '600px' }}
      role="img"
      aria-label={revealed ? cardLabel(id) : backLabel}
    >
      <motion.span
        className="relative block h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        initial={animate ? { rotateY: 180 } : false}
        animate={{ rotateY: revealed ? 0 : 180 }}
        transition={animate ? { duration: 0.5, delay: delay / 1000, ease: EASE.deal } : { duration: 0 }}
      >
        <span style={faceStyle} aria-hidden="true">
          <CardFace id={id} size={size} />
        </span>
        <span style={{ ...faceStyle, transform: 'rotateY(180deg)' }} aria-hidden="true">
          <CardBack size={size} label={backLabel} />
        </span>
      </motion.span>
    </span>
  )
}

/** An empty (not-yet-dealt) card placeholder. */
export function EmptySlot({ size = 'md', className = '' }: { size?: CardSize; className?: string }) {
  return (
    <span
      className={`block rounded-md border-2 border-dashed border-slate-300/80 bg-slate-50 ${FRAME[size]} ${className}`}
      aria-hidden="true"
    />
  )
}

/**
 * The stacked face-down deck / stock pile. Pass `count` to show a small remaining-card
 * badge so beginners can see the deck depleting as cards are dealt and burned.
 */
export function DeckPile({
  count,
  size = 'md',
  className = '',
  label,
}: {
  count?: number
  size?: 'sm' | 'md'
  className?: string
  label?: string
}) {
  const card = size === 'sm' ? 'h-14 w-10' : 'h-16 w-11'
  const box = size === 'sm' ? 'h-14 w-12' : 'h-16 w-[3.25rem]'
  return (
    <span
      className={`relative inline-block shrink-0 ${box} ${className}`}
      role="img"
      aria-label={label ?? (count != null ? `Deck: ${count} cards remaining` : 'Deck')}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`pck-pile-card absolute ${card} rounded-md border-2 border-white bg-gradient-to-br from-brand-500 to-brand-700`}
          style={{ transform: `translate(${i * 2}px, ${-i * 2}px)` }}
        >
          <span
            className="dot-field absolute inset-1 rounded-sm"
            style={{ '--dot-size': '7px' } as CSSProperties}
            aria-hidden="true"
          />
        </span>
      ))}
      {count != null && (
        <span className="absolute -bottom-1.5 left-1/2 z-[3] -translate-x-1/2 rounded-full bg-slate-900/85 px-1.5 py-0.5 text-[0.6rem] font-bold tabular-nums text-white shadow">
          {count}
        </span>
      )}
    </span>
  )
}

/**
 * A burn card — the card dealt face-down into the muck before the flop/turn/river.
 * Shown muted and slightly tilted next to the community cards so new players see
 * that one card is "burned" before each street.
 */
export function BurnCard({
  size = 'sm',
  animate = false,
  delay = 0,
  className = '',
}: {
  size?: CardSize
  animate?: boolean
  delay?: number
  className?: string
}) {
  return (
    <span
      className={`relative block rotate-[-8deg] opacity-60 ${FRAME[size]} ${animate ? 'pck-deal' : ''} ${className}`}
      style={animate ? { animationDelay: `${delay}ms` } : undefined}
      role="img"
      aria-label="Burn card"
    >
      <span className="block h-full w-full rounded-md border-2 border-white/90 bg-gradient-to-br from-slate-400 to-slate-600 shadow-sm">
        <span
          className="dot-field absolute inset-1 rounded-sm"
          style={{ '--dot-size': DOT[size] } as CSSProperties}
          aria-hidden="true"
        />
      </span>
    </span>
  )
}

// --- chips -------------------------------------------------------------------

export type ChipTone = 'gold' | 'blue' | 'rose' | 'green'
const CHIP_TONES: Record<ChipTone, CSSProperties> = {
  gold: { '--c-hi': '#fde68a', '--c-mid': '#f59e0b', '--c-lo': '#b45309' } as CSSProperties,
  blue: { '--c-hi': '#bfdbfe', '--c-mid': '#3b82f6', '--c-lo': '#1d4ed8' } as CSSProperties,
  rose: { '--c-hi': '#fecdd3', '--c-mid': '#f43f5e', '--c-lo': '#be123c' } as CSSProperties,
  green: { '--c-hi': '#bbf7d0', '--c-mid': '#22c55e', '--c-lo': '#15803d' } as CSSProperties,
}

/** A small, single chip glyph — the accent icon shown beside chip counts. */
export function Chip({ size = 18, tone = 'gold' }: { size?: number; tone?: ChipTone }) {
  return (
    <span className="pck-chip" style={{ width: size, height: size, ...CHIP_TONES[tone] }} aria-hidden="true" />
  )
}

// --- real, denominated poker chips ------------------------------------------
//
// The denomination data + breakdown helpers live in ./chipDenoms (so this file
// only exports React components). The visuals below render those denominations as
// a face-on disc (ChipDisc) and a stack of edge-on discs (ChipStack).

/**
 * A single, face-on poker chip — a domed disc with the classic ring of edge spots
 * and an optional center denomination. Used as the cap of a stack and for chips in
 * flight. `denom` picks the color; `label` shows the value (skipped when too small).
 */
export function ChipDisc({
  size = 28,
  denom = 100,
  label = false,
  className = '',
}: {
  size?: number
  denom?: ChipDenom
  label?: boolean
  className?: string
}) {
  return (
    <span
      className={`suited-chip ${className}`}
      style={{ width: size, height: size, ...denomVars(denom) }}
      aria-hidden="true"
    >
      {label && size >= 24 && (
        <span className="suited-chip__val" style={{ fontSize: Math.round(size * 0.3) }}>
          {denom >= 1000 ? `${denom / 1000}K` : denom}
        </span>
      )}
    </span>
  )
}

/**
 * Chip face styles for the felt's pot stack. Swap CHIP_STACK_STYLE to change the look
 * everywhere the stack is drawn — kept as a single constant so the three directions
 * stay one line apart:
 *   - 'flat'    — flat, minimal modern token: solid fill, thin ring, no gloss or spots.
 *   - 'ceramic' — matte ceramic chip: soft depth, a refined recessed ring, no spots.
 *   - 'clay'    — classic clay chip: matte body with crisp, sparse edge spots.
 */
export type ChipStyle = 'flat' | 'ceramic' | 'clay'
export const CHIP_STACK_STYLE: ChipStyle = 'ceramic'

/** Most chips drawn in one stack — capped so even a huge pot stays a tidy stack. */
const MAX_STACK = 6

/**
 * A prominent stack height for the pot: a few chips for a small pot, then one more per
 * order of magnitude, capped at MAX_STACK. The height is only an at-a-glance cue to
 * size — the precise value is always shown as a number next to the stack — so a
 * growing pot reads as a taller "big stack" without ever fanning into a noisy pile.
 */
function stackHeight(amount: number): number {
  return Math.max(3, Math.min(MAX_STACK, Math.floor(Math.log10(amount)) + 2))
}

/** A single tilted column of edge-on chips topped by a face-on cap. Purely decorative. */
function ChipColumn({
  denom,
  count,
  width,
  variant,
}: {
  denom: ChipDenom
  count: number
  width: number
  variant: ChipStyle
}) {
  const edge = Math.max(4, Math.round(width * 0.3))
  const step = Math.max(3, Math.round(width * 0.22))
  const capH = Math.max(6, Math.round(width * 0.46))
  const n = Math.min(Math.max(1, count), MAX_STACK)
  const stackTop = (n - 1) * step
  const height = stackTop + edge + capH * 0.5

  return (
    <span
      className={`suited-col suited-col--${variant}`}
      style={{ width, height, ...denomVars(denom) }}
      aria-hidden="true"
    >
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="suited-edge" style={{ bottom: i * step, height: edge, zIndex: i + 1 }} />
      ))}
      <span
        className="suited-cap"
        style={{ bottom: stackTop + edge - capH * 0.62, height: capH, zIndex: n + 2 }}
      />
    </span>
  )
}

/**
 * The felt's "physical chips" for an amount — a single, compact stack of ONE
 * denomination (coloured by the largest chip that fits the amount), tall in rough
 * proportion to the size of the pot. Deliberately NOT broken into every denomination:
 * one quiet token reads far cleaner on a busy felt than a rainbow of columns, and the
 * exact value is always shown as a number beside it (callers pair this with a count
 * label). The face style is set by `variant` (defaults to CHIP_STACK_STYLE). Decorative
 * only — pot math and bets are unchanged.
 */
export function ChipStack({
  amount,
  size = 26,
  variant = CHIP_STACK_STYLE,
  className = '',
}: {
  amount: number
  size?: number
  variant?: ChipStyle
  className?: string
}) {
  const value = Math.round(amount)
  if (value <= 0) return null
  return (
    <span className={`suited-stack ${className}`} aria-hidden="true">
      <ChipColumn denom={topDenom(value)} count={stackHeight(value)} width={size} variant={variant} />
    </span>
  )
}

/**
 * A small fanned pile of mixed chips (used as the pot glyph in betting lessons).
 * Decorative; the exact pot number is always shown beside it.
 */
export function PotPile({ pop = false }: { pop?: boolean }) {
  const pile: { denom: ChipDenom; left: number; bottom: number }[] = [
    { denom: 100, left: 0, bottom: 0 },
    { denom: 25, left: 13, bottom: 0 },
    { denom: 500, left: 6, bottom: 9 },
    { denom: 5, left: 20, bottom: 6 },
  ]
  return (
    <span className={`relative inline-block h-8 w-16 ${pop ? 'pck-pot-pop' : ''}`} aria-hidden="true">
      {pile.map((p, i) => (
        <span key={i} className="absolute" style={{ left: p.left, bottom: p.bottom }}>
          <ChipDisc denom={p.denom} size={26} />
        </span>
      ))}
    </span>
  )
}

/** Compact "chip + count" label for a player's stack. */
export function ChipCount({ value, tone = 'blue' }: { value: number; tone?: ChipTone }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Chip size={15} tone={tone} />
      <span className="text-sm font-bold tabular-nums">{value.toLocaleString()}</span>
    </span>
  )
}

// --- shared styles -----------------------------------------------------------

export const CARD_KIT_STYLES = `
.pck-scene { perspective: 1000px; }
.pck-deal { animation: pck-deal 0.44s cubic-bezier(0.34, 1.4, 0.64, 1) backwards; }
@keyframes pck-deal {
  from { opacity: 0; transform: translateY(-24px) rotateY(-44deg) scale(0.84); }
  to { opacity: 1; transform: none; }
}
.pck-pile-card {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    0 2px 6px rgba(15, 23, 42, 0.22);
}
.pck-chip {
  position: relative;
  display: inline-block;
  border-radius: 9999px;
  background: radial-gradient(circle at 50% 32%, var(--c-hi), var(--c-mid) 60%, var(--c-lo));
  box-shadow: inset 0 0 0 0.16em rgba(255, 255, 255, 0.6), 0 1px 2px rgba(8, 20, 16, 0.4);
}
.pck-chip::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: repeating-conic-gradient(from 0deg, rgba(255, 255, 255, 0.92) 0 13deg, transparent 13deg 36deg);
  -webkit-mask: radial-gradient(circle, transparent 58%, #000 59% 76%, transparent 77%);
  mask: radial-gradient(circle, transparent 58%, #000 59% 76%, transparent 77%);
}

/* --- Real, denominated chips (face-on disc, edge-on stacks) --- */
.suited-chip {
  position: relative;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  background: radial-gradient(circle at 50% 34%, var(--hi) 0%, var(--face) 56%, var(--lo) 100%);
  box-shadow:
    inset 0 0 0 0.1em var(--rim),
    inset 0 0.12em 0.16em rgba(255, 255, 255, 0.4),
    inset 0 -0.13em 0.18em rgba(0, 0, 0, 0.34),
    0 0.12em 0.26em rgba(7, 21, 15, 0.5);
}
.suited-chip::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: repeating-conic-gradient(from 0deg, var(--spot) 0 12deg, transparent 12deg 45deg);
  -webkit-mask: radial-gradient(circle, transparent 56%, #000 57% 80%, transparent 81%);
  mask: radial-gradient(circle, transparent 56%, #000 57% 80%, transparent 81%);
}
.suited-chip__val {
  position: relative;
  z-index: 1;
  font-weight: 800;
  line-height: 1;
  color: var(--txt);
  font-variant-numeric: tabular-nums;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
}
.suited-stack {
  display: inline-flex;
  align-items: flex-end;
}
.suited-col {
  position: relative;
  display: inline-block;
}
.suited-col::before {
  /* soft contact shadow grounding the stack on the felt */
  content: '';
  position: absolute;
  left: 6%;
  right: 6%;
  bottom: -0.18em;
  height: 0.3em;
  border-radius: 9999px;
  background: rgba(7, 21, 15, 0.45);
  filter: blur(2px);
}
/* Base geometry only — the face appearance is supplied by the .suited-col--* variants
   below (so the chip look is swappable via CHIP_STACK_STYLE without touching anything
   else). These classes are used ONLY by the pot stack (ChipColumn). */
.suited-edge {
  position: absolute;
  left: 0;
  right: 0;
  border-radius: 9999px;
}
.suited-cap {
  position: absolute;
  left: 0;
  right: 0;
  border-radius: 50%;
}

/* --- flat: solid fill, thin ring, no gloss or spots (minimal modern token) --- */
.suited-col--flat .suited-edge {
  background: var(--face);
  box-shadow:
    inset 0 0 0 1px var(--rim),
    inset 0 -2px 0 rgba(0, 0, 0, 0.14),
    0 1px 1px rgba(7, 21, 15, 0.4);
}
.suited-col--flat .suited-cap {
  background: var(--face);
  box-shadow:
    inset 0 0 0 1px var(--rim),
    0 1px 2px rgba(7, 21, 15, 0.42);
}
.suited-col--flat .suited-cap::after {
  content: '';
  position: absolute;
  inset: 24%;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.22);
}

/* --- ceramic: soft matte depth, a refined recessed ring, no spots --- */
.suited-col--ceramic .suited-edge {
  background: linear-gradient(to bottom, var(--hi) 0%, var(--face) 44%, var(--lo) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 0 0 1px rgba(0, 0, 0, 0.1),
    0 1px 1px rgba(7, 21, 15, 0.38);
}
.suited-col--ceramic .suited-cap {
  background: radial-gradient(circle at 50% 36%, var(--hi) 0%, var(--face) 64%, var(--lo) 100%);
  box-shadow:
    inset 0 1px 2px rgba(255, 255, 255, 0.22),
    inset 0 -2px 3px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1px var(--rim),
    0 1px 2px rgba(7, 21, 15, 0.45);
}
.suited-col--ceramic .suited-cap::after {
  content: '';
  position: absolute;
  inset: 20%;
  border-radius: 50%;
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.14);
}

/* --- clay: matte body + crisp, sparse edge spots (the classic chip, refined) --- */
.suited-col--clay .suited-edge {
  background: linear-gradient(to bottom, var(--hi) 0%, var(--face) 46%, var(--lo) 100%);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.16), 0 1px 1px rgba(7, 21, 15, 0.4);
}
.suited-col--clay .suited-edge::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: repeating-linear-gradient(90deg, var(--spot) 0 2px, transparent 2px 17px);
  -webkit-mask: linear-gradient(to bottom, transparent 28%, #000 36% 64%, transparent 72%);
  mask: linear-gradient(to bottom, transparent 28%, #000 36% 64%, transparent 72%);
  opacity: 0.72;
}
.suited-col--clay .suited-cap {
  background: radial-gradient(circle at 50% 40%, var(--hi) 0%, var(--face) 60%, var(--lo) 100%);
  box-shadow:
    inset 0 0 0 1px var(--rim),
    inset 0 1px 1px rgba(255, 255, 255, 0.2),
    0 1px 2px rgba(7, 21, 15, 0.45);
}
.suited-col--clay .suited-cap::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: repeating-conic-gradient(from 0deg, var(--spot) 0 8deg, transparent 8deg 60deg);
  -webkit-mask: radial-gradient(circle, transparent 56%, #000 58% 80%, transparent 82%);
  mask: radial-gradient(circle, transparent 56%, #000 58% 80%, transparent 82%);
}
.pck-pot-pop { animation: pck-pop 0.5s cubic-bezier(0.34, 1.5, 0.64, 1); }
@keyframes pck-pop {
  0% { transform: scale(0.82); }
  60% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
.pck-felt {
  background:
    radial-gradient(120% 130% at 50% -10%, #12876310 0%, transparent 60%),
    linear-gradient(160deg, #0f7a5a 0%, #0b6349 48%, #084c39 100%);
}
`

/** Renders the kit's shared CSS once. Safe to include multiple times. */
export function CardKitStyles() {
  return <style>{CARD_KIT_STYLES}</style>
}
