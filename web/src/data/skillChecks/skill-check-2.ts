import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 2 (design doc §6, Lesson 2): (q1) identify a category;
 * (q2) order four categories strongest→weakest; (q3) which of two hands wins on a
 * kicker. All three are interactive and validated by the evaluator / compare-events.
 * Keep `lessonId: '2'` / export `skillCheck2`.
 */
export const skillCheck2: SkillCheckDefinition = {
  lessonId: '2',
  title: 'Hand Rankings Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'What hand does this make?',
      interaction: 'hand-ranker',
      config: {
        mode: 'identify-category',
        cards: ['9C', '8D', '7H', '6S', '5C'],
        categories: ['straight', 'flush', 'trips', 'two-pair', 'high-card'],
      },
      answer: { category: 'straight' },
      incorrectFeedback: 'Five consecutive ranks of mixed suits is a straight.',
    },
    {
      id: 'q2',
      prompt: 'Put these categories in order, strongest at the top.',
      interaction: 'hand-ranker',
      config: {
        mode: 'order-categories',
        categories: ['two-pair', 'flush', 'full-house', 'straight'],
        helperText: 'Drag the rows to reorder, strongest at the top.',
      },
      answer: { categoryOrder: ['full-house', 'flush', 'straight', 'two-pair'] },
      incorrectFeedback:
        'Full house beats flush, flush beats straight, and a straight beats two pair.',
    },
    {
      id: 'q3',
      prompt: 'Both players hold a pair of Kings. Which hand wins?',
      interaction: 'compare-events',
      config: {
        helperText: 'Same pair, so the kicker decides.',
        chooseLabel: 'Which hand wins?',
        eventA: { label: 'Pair of Kings, Ace kicker', detail: 'K-K-A-7-4' },
        eventB: { label: 'Pair of Kings, Queen kicker', detail: 'K-K-Q-9-5' },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'The pairs tie, so the highest side card decides: an Ace kicker beats a Queen kicker.',
    },
  ],
}
