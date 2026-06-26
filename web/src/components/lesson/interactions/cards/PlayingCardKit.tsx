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
import { cardLabel, isRedSuit, parseCardId, type CardId, type CardSuit } from '../../../../types/lesson'

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

export function Chip({ size = 18, tone = 'gold' }: { size?: number; tone?: ChipTone }) {
  return (
    <span className="pck-chip" style={{ width: size, height: size, ...CHIP_TONES[tone] }} aria-hidden="true" />
  )
}

/** A small fanned pile of chips (used for the pot). */
export function PotPile({ pop = false }: { pop?: boolean }) {
  return (
    <span className={`relative inline-block h-7 w-16 ${pop ? 'pck-pot-pop' : ''}`} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="pck-chip absolute bottom-0"
          style={{ left: i * 12, width: 28, height: 28, ...CHIP_TONES.gold }}
        />
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
