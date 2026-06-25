/** Canonical course path: 8 lessons in 3 sections for "Suited", a Texas Hold'em poker course. */

/** The visually-distinct sections of the learning path. */
export type SectionId = 'foundations' | 'playing' | 'math' | 'casino'

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
  {
    id: 'casino',
    title: 'Casino Floor',
    subtitle: 'Play vs. AI at the felt',
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
  /**
   * Path-node kind. Omitted/`'lesson'` is a normal interactive lesson (XP + skill
   * check). `'ai-table'` is a Phase 2 casino table: it navigates to `/table/:id`,
   * unlocks via its `TableConfig.prereqId`, and is kept OUT of the lesson XP /
   * completion math (see CoursePage / HomePage).
   */
  kind?: 'lesson' | 'ai-table'
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

  // --- Casino Floor (Phase 2 AI tables) — ids match data/tables.ts -------------
  {
    id: 'tbl-coached-1',
    title: 'The Kitchen Table',
    section: 'casino',
    unit: 'Casino Floor · Coached',
    primaryInteraction: 'Play a full hand with an AI coach',
    kind: 'ai-table',
  },
  {
    id: 'tbl-coached-2',
    title: 'The Card Room',
    section: 'casino',
    unit: 'Casino Floor · Coached',
    primaryInteraction: 'Coached play vs. solid opponents',
    kind: 'ai-table',
  },
  {
    id: 'tbl-coached-3',
    title: 'The High Limit Room',
    section: 'casino',
    unit: 'Casino Floor · Coached',
    primaryInteraction: 'Coached play vs. sharp opponents',
    kind: 'ai-table',
  },
  {
    id: 'tbl-ai-1',
    title: 'Heads-Up Arena',
    section: 'casino',
    unit: 'Casino Floor · AI opponents',
    primaryInteraction: 'Heads-up duel vs. an AI player',
    kind: 'ai-table',
  },
  {
    id: 'tbl-ai-2',
    title: 'The Main Event',
    section: 'casino',
    unit: 'Casino Floor · AI opponents',
    primaryInteraction: 'Four-handed table vs. AI players',
    kind: 'ai-table',
  },
]
