/** Canonical course path — 5 lessons for "Suited", a Texas Hold'em poker course. */
export type LessonMeta = {
  id: string
  title: string
  unit: string
  primaryInteraction: string
}

export const lessons: LessonMeta[] = [
  {
    id: '1',
    title: 'Poker & the Deck',
    unit: 'Unit 1 · Foundations',
    primaryInteraction: 'Card deck; deal the board',
  },
  {
    id: '2',
    title: 'Hand Rankings',
    unit: 'Unit 2 · Hand strength',
    primaryInteraction: 'Rank hands; compare showdowns',
  },
  {
    id: '3',
    title: 'Flow of a Hand',
    unit: 'Unit 3 · The streets',
    primaryInteraction: 'Deal streets; best hand by street',
  },
  {
    id: '4',
    title: 'Outs, Odds & Pot Odds',
    unit: 'Unit 4 · Poker math',
    primaryInteraction: 'Count outs; pot-odds decisions',
  },
  {
    id: '5',
    title: 'Betting',
    unit: 'Unit 5 · Wagering',
    primaryInteraction: 'Bet, raise & size; EV of a call',
  },
]
