import type { ComponentType } from 'react'
import type { IconProps } from '../components/icons'
import {
  AceCardIcon,
  CardPairIcon,
  ClubSuitIcon,
  DealerButtonIcon,
  DiamondSuitIcon,
  HeartSuitIcon,
  PokerChipIcon,
  SpadeSuitIcon,
} from '../components/icons'

/**
 * Profile avatars for "Suited".
 *
 * A cohesive poker themed set: the four suits, a poker chip, a pair of cards,
 * the dealer button, and an ace. The stored Firestore field is still named
 * `profileAnimal` (type `ProfileAnimalId`) so `firestore.rules` is untouched;
 * only the option ids and art changed from the old animal set. Unknown stored
 * ids (e.g. a legacy animal id from an existing user) fall back to the spade.
 */
export type ProfileAnimalId =
  | 'spade'
  | 'heart'
  | 'diamond'
  | 'club'
  | 'chip'
  | 'cards'
  | 'dealer'
  | 'ace'

export type ProfileAnimal = {
  id: ProfileAnimalId
  label: string
  /** Accent hex used to tint the avatar chip and color the icon. */
  accent: string
  Icon: ComponentType<IconProps>
}

export const profileAnimals: ProfileAnimal[] = [
  { id: 'spade', label: 'Spade', accent: '#334155', Icon: SpadeSuitIcon },
  { id: 'heart', label: 'Heart', accent: '#e11d48', Icon: HeartSuitIcon },
  { id: 'diamond', label: 'Diamond', accent: '#2563eb', Icon: DiamondSuitIcon },
  { id: 'club', label: 'Club', accent: '#15803d', Icon: ClubSuitIcon },
  { id: 'chip', label: 'Chip', accent: '#0d9488', Icon: PokerChipIcon },
  { id: 'cards', label: 'Cards', accent: '#7c3aed', Icon: CardPairIcon },
  { id: 'dealer', label: 'Dealer', accent: '#b45309', Icon: DealerButtonIcon },
  { id: 'ace', label: 'Ace', accent: '#db2777', Icon: AceCardIcon },
]

export type AnimalVisual = { accent: string; Icon: ComponentType<IconProps> }

const fallbackVisual: AnimalVisual = { accent: '#334155', Icon: SpadeSuitIcon }

/** Resolve the accent color + icon for an avatar id, with a spade fallback. */
export function getAnimalVisual(id: ProfileAnimalId | string | null | undefined): AnimalVisual {
  return profileAnimals.find((a) => a.id === id) ?? fallbackVisual
}
