import type { LessonDefinition } from '../../types/lesson'

/**
 * SKELETON STUB — Lesson 2 "Hand Rankings" (design doc §6, Lesson 2).
 * The Lesson 2 agent fleshes out the full sequence (the 10 categories, rarer =
 * stronger, kickers, which hand wins) using `hand-ranker` and `compare-events`,
 * validating against `lib/poker/handEvaluator.ts`. Keep `id: '2'` / export `lesson2`.
 */
export const lesson2: LessonDefinition = {
  id: '2',
  title: 'Hand Rankings',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'The hand-ranking ladder',
      content: `Hands are ranked by **rarity** — the rarer the hand, the stronger. From strongest to weakest: royal flush, straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, one pair, high card.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'What does this 5-card hand make?',
      interaction: 'hand-ranker',
      config: {
        mode: 'identify-category',
        cards: ['AH', 'KH', '9H', '5H', '2H'],
        helperText: 'All five cards share a suit.',
      },
      answer: { category: 'flush' },
      feedback: {
        correct: 'Five cards of one suit (not in sequence) is a **flush**.',
        incorrect: 'All five are hearts and not consecutive — that is a flush.',
        hints: ['Look at the suits.', 'Five of the same suit makes a flush.'],
      },
    },
  ],
}
