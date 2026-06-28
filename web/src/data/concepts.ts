import type { ConceptId } from '../types/concept'
import type { SectionId } from './lessons'

/**
 * Human-facing metadata for each schedulable concept. `section` ties the concept to
 * its course section so the Strengths & Leaks view can group by section.
 */
export type ConceptMeta = {
  id: ConceptId
  label: string
  section: SectionId
  /** One-line description for the leak view. */
  blurb: string
}

export const CONCEPTS: Record<ConceptId, ConceptMeta> = {
  'deck-basics': {
    id: 'deck-basics',
    label: 'The deck',
    section: 'foundations',
    blurb: 'The 52-card deck and how the board is dealt.',
  },
  'hand-rankings': {
    id: 'hand-rankings',
    label: 'Hand rankings',
    section: 'foundations',
    blurb: 'The ten hand categories, strongest to weakest.',
  },
  showdown: {
    id: 'showdown',
    label: 'Showdowns',
    section: 'foundations',
    blurb: 'Reading the best five-card hand and who wins.',
  },
  'hand-flow': {
    id: 'hand-flow',
    label: 'Flow of a hand',
    section: 'playing',
    blurb: 'Preflop, flop, turn, and river.',
  },
  'betting-actions': {
    id: 'betting-actions',
    label: 'Betting actions',
    section: 'playing',
    blurb: 'Check, bet, call, raise, and fold.',
  },
  position: {
    id: 'position',
    label: 'Position',
    section: 'playing',
    blurb: 'Acting later is a structural advantage.',
  },
  'preflop-selection': {
    id: 'preflop-selection',
    label: 'Starting hands',
    section: 'playing',
    blurb: 'Which hands to play, and folding the rest.',
  },
  'outs-counting': {
    id: 'outs-counting',
    label: 'Counting outs',
    section: 'math',
    blurb: 'Cards that improve you to the best hand.',
  },
  equity: {
    id: 'equity',
    label: 'Equity',
    section: 'math',
    blurb: 'Turning outs into a win-percentage (Rule of 2 & 4).',
  },
  'pot-odds': {
    id: 'pot-odds',
    label: 'Pot odds',
    section: 'math',
    blurb: 'The price you are being laid on a call.',
  },
  ev: {
    id: 'ev',
    label: 'Expected value',
    section: 'math',
    blurb: 'Whether a decision wins or loses chips on average.',
  },
  'fold-equity': {
    id: 'fold-equity',
    label: 'Fold equity',
    section: 'math',
    blurb: 'Extra value from the chance an opponent folds.',
  },
  'bet-sizing': {
    id: 'bet-sizing',
    label: 'Bet sizing',
    section: 'math',
    blurb: 'Sizing value bets and bluffs to the board.',
  },
  'preflop-ranges': {
    id: 'preflop-ranges',
    label: 'Preflop ranges',
    section: 'advanced',
    blurb: 'Position-based opening ranges on the 13x13 grid.',
  },
  'board-texture': {
    id: 'board-texture',
    label: 'Board texture',
    section: 'advanced',
    blurb: 'Wet vs. dry boards and who they favor.',
  },
  'c-betting': {
    id: 'c-betting',
    label: 'Continuation betting',
    section: 'advanced',
    blurb: 'When (and how big) to c-bet the flop.',
  },
  'implied-odds': {
    id: 'implied-odds',
    label: 'Implied odds',
    section: 'advanced',
    blurb: 'Future chips you can win when you hit.',
  },
  spr: {
    id: 'spr',
    label: 'Stack-to-pot ratio',
    section: 'advanced',
    blurb: 'How deep stacks change commitment decisions.',
  },
  combinatorics: {
    id: 'combinatorics',
    label: 'Combinatorics',
    section: 'advanced',
    blurb: 'Counting the combos of a holding.',
  },
  blockers: {
    id: 'blockers',
    label: 'Blockers',
    section: 'advanced',
    blurb: 'Cards in your hand that remove opponent combos.',
  },
  icm: {
    id: 'icm',
    label: 'ICM',
    section: 'advanced',
    blurb: 'Why tournament chips are not cash.',
  },
  'push-fold': {
    id: 'push-fold',
    label: 'Push/fold',
    section: 'advanced',
    blurb: 'Short-stack shove-or-fold decisions.',
  },
}

export const CONCEPT_IDS = Object.keys(CONCEPTS) as ConceptId[]

export function conceptMeta(id: ConceptId): ConceptMeta {
  return CONCEPTS[id]
}

/**
 * Default concept tags per lesson id. The review layer uses a problem's explicit
 * `step.concepts` when present, otherwise falls back to its lesson's concepts here —
 * so existing lesson data needs no per-problem backfill to enter the review pool.
 */
export const LESSON_CONCEPTS: Record<string, ConceptId[]> = {
  '1': ['deck-basics'],
  '2': ['hand-rankings', 'showdown'],
  '3': ['hand-flow'],
  '4': ['betting-actions'],
  preflop: ['preflop-selection', 'position'],
  '5': ['outs-counting', 'equity'],
  '6': ['pot-odds', 'ev'],
  '7': ['fold-equity'],
  '8': ['bet-sizing'],
  // Advanced Play (Part A)
  'adv-ranges': ['preflop-ranges', 'position'],
  'adv-texture': ['board-texture', 'c-betting'],
  'adv-implied': ['implied-odds', 'spr'],
  'adv-combos': ['combinatorics', 'blockers'],
  'adv-icm': ['icm', 'push-fold'],
}

/** A lesson's default concepts (empty when the lesson id is unknown). */
export function conceptsForLesson(lessonId: string): ConceptId[] {
  return LESSON_CONCEPTS[lessonId] ?? []
}
