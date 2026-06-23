export type ProfileAnimalId =
  | 'fox'
  | 'owl'
  | 'bear'
  | 'cat'
  | 'dog'
  | 'rabbit'
  | 'panda'
  | 'frog'

export const profileAnimals: {
  id: ProfileAnimalId
  label: string
  emoji: string
}[] = [
  { id: 'fox', label: 'Fox', emoji: '🦊' },
  { id: 'owl', label: 'Owl', emoji: '🦉' },
  { id: 'bear', label: 'Bear', emoji: '🐻' },
  { id: 'cat', label: 'Cat', emoji: '🐱' },
  { id: 'dog', label: 'Dog', emoji: '🐶' },
  { id: 'rabbit', label: 'Rabbit', emoji: '🐰' },
  { id: 'panda', label: 'Panda', emoji: '🐼' },
  { id: 'frog', label: 'Frog', emoji: '🐸' },
]

export function getAnimalEmoji(id: ProfileAnimalId | string | null | undefined) {
  return profileAnimals.find((a) => a.id === id)?.emoji ?? '🐾'
}
