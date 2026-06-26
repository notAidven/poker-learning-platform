/** Canonical course path: 9 lessons in 3 sections for "Suited", a Texas Hold'em poker course. */

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
    id: 'preflop',
    title: 'Playing Preflop',
    section: 'playing',
    unit: 'Playing a Hand · Preflop',
    primaryInteraction: 'Open, call, raise, fold; suited vs offsuit; hand strength',
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
    primaryInteraction: 'Price a call; call or fold; EV in chips',
  },
  {
    id: '7',
    title: 'Fold Equity & Bluffing',
    section: 'math',
    unit: 'The Math · Fold equity',
    primaryInteraction: 'Semibluffs, bluffs, and fold equity',
  },
  {
    id: '8',
    title: 'Bet Sizing & Value Betting',
    section: 'math',
    unit: 'The Math · Bet sizing',
    primaryInteraction: 'Value bets; size to the board',
  },

  // --- Casino Floor (Phase 2): exactly TWO rooms — ids match data/tables.ts ----
  {
    id: 'room-1',
    title: 'The Coaching Room',
    section: 'casino',
    unit: 'Casino Floor · Room 1',
    primaryInteraction: 'Play full hands with a coach reacting to every move',
    kind: 'ai-table',
  },
  {
    id: 'room-2',
    title: 'The AI Lounge',
    section: 'casino',
    unit: 'Casino Floor · Room 2',
    primaryInteraction: 'Play AI opponents with a rule-based hint bar',
    kind: 'ai-table',
  },
]

/**
 * 1-based position of a lesson within the interactive course (casino tables are
 * excluded). Used by the path / home / modal so the displayed number always follows
 * the course order, regardless of a node's string id (e.g. the inserted 'preflop'
 * lesson shows as "5"). Returns null for non-lesson nodes (the AI tables).
 */
const LESSON_NUMBER_BY_ID: Record<string, number> = (() => {
  const map: Record<string, number> = {}
  let n = 0
  for (const l of lessons) {
    if (l.kind === 'ai-table') continue
    n += 1
    map[l.id] = n
  }
  return map
})()

export function lessonNumber(id: string): number | null {
  return LESSON_NUMBER_BY_ID[id] ?? null
}
