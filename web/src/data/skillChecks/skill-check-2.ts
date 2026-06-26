import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 2 (Lesson 2 · Hand Rankings). TRANSFER questions: none reuse a Lesson 2
 * hand. (q1) identify a full house, (q2) identify a straight, (q3) order four
 * categories strongest to weakest, (q4) a kicker decision with a new pair, and (q5)
 * pick the best five from seven. Every hand-ranker question is validated by the
 * evaluator; compare-events grades the chosen side. Keep `lessonId: '2'` / export
 * `skillCheck2`.
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
        cards: ['QS', 'QH', 'QD', '5C', '5S'],
        categories: ['full-house', 'trips', 'two-pair', 'flush', 'straight'],
      },
      answer: { category: 'full-house' },
      incorrectFeedback:
        'Three Queens plus a pair of Fives is three of a kind PLUS a pair, which is a full house.',
    },
    {
      id: 'q2',
      prompt: 'What hand does this make?',
      interaction: 'hand-ranker',
      config: {
        mode: 'identify-category',
        cards: ['10H', '9C', '8D', '7S', '6H'],
        categories: ['straight', 'flush', 'trips', 'two-pair', 'high-card'],
      },
      answer: { category: 'straight' },
      incorrectFeedback: 'Five consecutive ranks (10-9-8-7-6) of mixed suits is a straight.',
    },
    {
      id: 'q3',
      prompt: 'Put these categories in order, strongest at the top.',
      interaction: 'hand-ranker',
      config: {
        mode: 'order-categories',
        categories: ['trips', 'straight', 'flush', 'pair'],
        helperText: 'Drag the rows to reorder, strongest at the top.',
      },
      answer: { categoryOrder: ['flush', 'straight', 'trips', 'pair'] },
      incorrectFeedback:
        'Flush beats straight, straight beats three of a kind, and three of a kind beats one pair.',
    },
    {
      id: 'q4',
      prompt: 'Both players hold a pair of Queens. Which hand wins?',
      interaction: 'compare-events',
      config: {
        helperText: 'Same pair, so the kicker decides.',
        chooseLabel: 'Which hand wins?',
        eventA: { label: 'Pair of Queens, Ace kicker', detail: 'Q-Q-A-7-3' },
        eventB: { label: 'Pair of Queens, King kicker', detail: 'Q-Q-K-8-4' },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'The pairs tie, so the highest side card decides: an Ace kicker beats a King kicker.',
    },
    {
      id: 'q5',
      prompt: 'From these seven cards, tap the five that make your best hand.',
      interaction: 'hand-ranker',
      config: {
        mode: 'pick-best-five',
        cards: ['KD', 'QD', '8D', '5D', '2D', 'AC', 'AS'],
        helperText: 'You may use any five of the seven cards.',
      },
      answer: { cards: ['KD', 'QD', '8D', '5D', '2D'] },
      incorrectFeedback:
        'Five diamonds make a flush, which beats the pair of Aces. Tap the five diamonds.',
    },
  ],
}
