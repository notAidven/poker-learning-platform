import type { ComponentType } from 'react'
import type { IconProps } from '../components/icons'
import {
  BearIcon,
  CatIcon,
  DogIcon,
  FoxIcon,
  FrogIcon,
  OwlIcon,
  PandaIcon,
  PawIcon,
  RabbitIcon,
} from '../components/icons'

export type ProfileAnimalId =
  | 'fox'
  | 'owl'
  | 'bear'
  | 'cat'
  | 'dog'
  | 'rabbit'
  | 'panda'
  | 'frog'

export type ProfileAnimal = {
  id: ProfileAnimalId
  label: string
  /** Accent hex used to tint the avatar chip and color the icon. */
  accent: string
  Icon: ComponentType<IconProps>
}

export const profileAnimals: ProfileAnimal[] = [
  { id: 'fox', label: 'Fox', accent: '#f97316', Icon: FoxIcon },
  { id: 'owl', label: 'Owl', accent: '#6366f1', Icon: OwlIcon },
  { id: 'bear', label: 'Bear', accent: '#a16207', Icon: BearIcon },
  { id: 'cat', label: 'Cat', accent: '#f43f5e', Icon: CatIcon },
  { id: 'dog', label: 'Dog', accent: '#0ea5e9', Icon: DogIcon },
  { id: 'rabbit', label: 'Rabbit', accent: '#ec4899', Icon: RabbitIcon },
  { id: 'panda', label: 'Panda', accent: '#64748b', Icon: PandaIcon },
  { id: 'frog', label: 'Frog', accent: '#22c55e', Icon: FrogIcon },
]

export type AnimalVisual = { accent: string; Icon: ComponentType<IconProps> }

const fallbackVisual: AnimalVisual = { accent: '#64748b', Icon: PawIcon }

/** Resolve the accent color + icon for an animal id, with a paw fallback. */
export function getAnimalVisual(id: ProfileAnimalId | string | null | undefined): AnimalVisual {
  return profileAnimals.find((a) => a.id === id) ?? fallbackVisual
}
