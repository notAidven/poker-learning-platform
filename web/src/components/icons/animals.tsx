import type { ReactNode } from 'react'
import type { IconProps } from './index'

/**
 * Profile avatars (poker themed).
 *
 * A small, cohesive set of poker glyphs: the four suits, a poker chip, a pair of
 * cards, the dealer button, and an ace. They share the same language as the rest
 * of the icon set: a 24x24 grid, `currentColor`, and a 1.8px round-capped outline
 * with a few solid accents. Pair them with a tinted chip (see `AnimalAvatar`) for
 * a per-avatar color identity.
 *
 * The exported names keep the icon set's `...Icon` suffix. The data + storage
 * layer (`data/animals.ts`, the `profileAnimal` Firestore field) keeps its
 * historical names on purpose so `firestore.rules` is untouched; only the option
 * ids and art changed from the old animal set.
 */

type AvatarIconBaseProps = IconProps & { children: ReactNode }

function AvatarBase({ className = 'h-5 w-5', children, ...props }: AvatarIconBaseProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

const SOLID = { fill: 'currentColor', stroke: 'none' } as const

/** Spade suit — the default avatar. */
export function SpadeSuitIcon(props: IconProps) {
  return (
    <AvatarBase {...props}>
      <path
        {...SOLID}
        d="M12 3C12 3 5 8.7 5 13.4c0 2.4 1.85 4.3 4.25 4.3 1 0 1.85-.32 2.5-.86-.2 2.05-1.2 3.6-2.85 4.46h6.2c-1.65-.86-2.65-2.41-2.85-4.46.65.54 1.5.86 2.5.86 2.4 0 4.25-1.9 4.25-4.3C19 8.7 12 3 12 3Z"
      />
    </AvatarBase>
  )
}

/** Heart suit. */
export function HeartSuitIcon(props: IconProps) {
  return (
    <AvatarBase {...props}>
      <path
        {...SOLID}
        d="M12 20.6C12 20.6 3.4 14.7 3.4 8.7 3.4 5.9 5.6 3.7 8.4 3.7 10.05 3.7 11.5 4.65 12 5.95 12.5 4.65 13.95 3.7 15.6 3.7 18.4 3.7 20.6 5.9 20.6 8.7 20.6 14.7 12 20.6 12 20.6Z"
      />
    </AvatarBase>
  )
}

/** Diamond suit. */
export function DiamondSuitIcon(props: IconProps) {
  return (
    <AvatarBase {...props}>
      <path {...SOLID} d="M12 2.5 20 12 12 21.5 4 12Z" />
    </AvatarBase>
  )
}

/** Club suit. */
export function ClubSuitIcon(props: IconProps) {
  return (
    <AvatarBase {...props}>
      <g {...SOLID}>
        <circle cx="12" cy="7.4" r="3.4" />
        <circle cx="7.6" cy="13" r="3.4" />
        <circle cx="16.4" cy="13" r="3.4" />
        <path d="M10.5 12.4C10.5 15.4 9.9 18.7 8.1 21h7.8c-1.8-2.3-2.4-5.6-2.4-8.6Z" />
      </g>
    </AvatarBase>
  )
}

/** Poker chip. */
export function PokerChipIcon(props: IconProps) {
  return (
    <AvatarBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3v3.4M12 17.6V21M3 12h3.4M17.6 12H21" />
      <path d="M5.64 5.64 8.04 8.04M18.36 5.64 15.96 8.04M5.64 18.36 8.04 15.96M18.36 18.36 15.96 15.96" />
    </AvatarBase>
  )
}

/** A pair of cards: a front card with a second peeking behind it. */
export function CardPairIcon(props: IconProps) {
  return (
    <AvatarBase {...props}>
      <path d="M9 4.6h7.6a1.8 1.8 0 0 1 1.8 1.8V15" />
      <rect x="5.5" y="7" width="9.5" height="12.6" rx="1.9" />
      <path
        {...SOLID}
        d="M10.25 10.9C10.25 10.9 8.35 12.5 8.35 13.85c0 .66.5 1.18 1.16 1.18.27 0 .5-.09.69-.24-.06.56-.34.98-.79 1.22h1.68c-.45-.24-.73-.66-.79-1.22.19.15.42.24.69.24.66 0 1.16-.52 1.16-1.18C12.15 12.5 10.25 10.9 10.25 10.9Z"
      />
    </AvatarBase>
  )
}

/** Dealer button. */
export function DealerButtonIcon(props: IconProps) {
  return (
    <AvatarBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="6.6" strokeWidth={1.2} />
      <text
        x="12"
        y="12.4"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="8"
        fontWeight={800}
        fill="currentColor"
        stroke="none"
      >
        D
      </text>
    </AvatarBase>
  )
}

/** Ace (of spades). */
export function AceCardIcon(props: IconProps) {
  return (
    <AvatarBase {...props}>
      <rect x="5" y="3.4" width="14" height="17.2" rx="2.4" />
      <path
        {...SOLID}
        d="M12 7.6C12 7.6 8.4 10.5 8.4 12.9c0 1.25.96 2.24 2.2 2.24.5 0 .96-.16 1.28-.44-.1 1.05-.62 1.85-1.46 2.3h3.16c-.84-.45-1.36-1.25-1.46-2.3.32.28.78.44 1.28.44 1.24 0 2.2-.99 2.2-2.24C15.6 10.5 12 7.6 12 7.6Z"
      />
      <text
        x="7.4"
        y="7.6"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="4.6"
        fontWeight={800}
        fill="currentColor"
        stroke="none"
      >
        A
      </text>
    </AvatarBase>
  )
}
