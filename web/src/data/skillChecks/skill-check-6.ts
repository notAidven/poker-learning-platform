import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * SKELETON STUB — Skill Check 6 (design doc §6, Lesson 6). Per the design, SC6 reuses
 * light interactions (`hand-ranker` / `compare-events`), NOT the full simulator, to
 * stay within the 3-quick-question format. The Lesson 6 agent expands to: stronger
 * starting hand; correct action at a street; award the pot. Keep `lessonId: '6'` /
 * export `skillCheck6`.
 */
export const skillCheck6: SkillCheckDefinition = {
  lessonId: '6',
  title: 'Play a Full Hand Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'At showdown, which hand wins? Pick the stronger one.',
      interaction: 'hand-ranker',
      config: {
        mode: 'order-hands',
        hands: [
          { id: 'flush', cards: ['AH', 'KH', '9H', '5H', '2H'] },
          { id: 'straight', cards: ['9C', '8D', '7H', '6S', '5C'] },
        ],
      },
      answer: { handOrder: ['flush', 'straight'] },
      incorrectFeedback: 'A flush beats a straight, so the flush wins the pot.',
    },
  ],
}
