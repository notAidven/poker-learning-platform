/** Canonical course path: 8 lessons in 3 sections for "Suited", a Texas Hold'em poker course. */

/** The three visually-distinct sections of the learning path. */
export type SectionId = 'foundations' | 'playing' | 'math'

export type SectionMeta = {
  id: SectionId
  title: string
  /** One-line banner subtitle shown under the section title on the path. */
  subtitle: string
  /** Theme token family for this section's tint (felt-green / oxblood / brass).
   *  Concrete Tailwind class strings live in CoursePath's SECTION_THEME (Tailwind
   *  needs literal class names), so this is a documentation/lookup token only. */
  accent: 'emerald' | 'brand' | 'gold'
}

export const sections: SectionMeta[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    subtitle: 'The 52-card deck and how hands rank',
    accent: 'emerald',
  },
  {
    id: 'playing',
    title: 'Playing a Hand',
    subtitle: 'How a hand plays out, and the betting actions',
    accent: 'brand',
  },
  {
    id: 'math',
    title: 'The Math',
    subtitle: 'Outs, pot odds, EV, and bet sizing',
    accent: 'gold',
  },
]

export function getSection(id: SectionId): SectionMeta {
  return sections.find((s) => s.id === id) ?? sections[0]
}

export type LessonMeta = {
  id: string
  title: string
  section: SectionId
  unit: string
  primaryInteraction: string
}

export const lessons: LessonMeta[] = [
  {
    id: '1',
    title: 'Poker & the Deck',
    section: 'foundations',
    unit: 'Foundations · The deck',
    primaryInteraction: 'Card deck; deal the board',
  },
  {
    id: '2',
    title: 'Hand Rankings',
    section: 'foundations',
    unit: 'Foundations · Hand strength',
    primaryInteraction: 'Rank hands; compare showdowns',
  },
  {
    id: '3',
    title: 'Flow of a Hand',
    section: 'playing',
    unit: 'Playing a Hand · The streets',
    primaryInteraction: 'Deal streets; best hand by street',
  },
  {
    id: '4',
    title: 'Betting Basics',
    section: 'playing',
    unit: 'Playing a Hand · Betting',
    primaryInteraction: 'Check, bet, call, raise, fold; sizing',
  },
  {
    id: '5',
    title: 'Outs & Equity',
    section: 'math',
    unit: 'The Math · Outs & equity',
    primaryInteraction: 'Count outs; outs → equity %',
  },
  {
    id: '6',
    title: 'Pot Odds',
    section: 'math',
    unit: 'The Math · Pot odds',
    primaryInteraction: 'Price a call; call or fold',
  },
  {
    id: '7',
    title: 'Expected Value',
    section: 'math',
    unit: 'The Math · EV',
    primaryInteraction: 'EV of a call; fold equity',
  },
  {
    id: '8',
    title: 'Bet Sizing & Value Betting',
    section: 'math',
    unit: 'The Math · Bet sizing',
    primaryInteraction: 'Value bets; size to the board',
  },
]
