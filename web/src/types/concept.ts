/**
 * Stable concept ids — the unit the spaced-repetition Review system schedules and
 * the leak tracker reports on. A `ProblemStep` may tag the concept(s) it trains via
 * `concepts?: ConceptId[]`; when a problem is untagged, the review layer falls back
 * to its lesson's concepts (see `LESSON_CONCEPTS` in `data/concepts.ts`).
 *
 * Type-only module (no imports) so `types/lesson.ts` can import `ConceptId` without
 * any risk of a runtime import cycle.
 */
export type ConceptId =
  // Foundations
  | 'deck-basics'
  | 'hand-rankings'
  | 'showdown'
  // Playing a hand
  | 'hand-flow'
  | 'betting-actions'
  | 'position'
  | 'preflop-selection'
  // The math
  | 'outs-counting'
  | 'equity'
  | 'pot-odds'
  | 'ev'
  | 'fold-equity'
  | 'bet-sizing'
  // Advanced play
  | 'preflop-ranges'
  | 'board-texture'
  | 'c-betting'
  | 'implied-odds'
  | 'spr'
  | 'icm'
  | 'push-fold'
