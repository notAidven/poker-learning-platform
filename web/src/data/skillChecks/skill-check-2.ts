import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * SKELETON STUB — Skill Check 2 (design doc §6, Lesson 2). The Lesson 2 agent expands
 * to the full 3-question check (identify a category; order categories; which hand
 * wins on a kicker). Keep `lessonId: '2'` / export `skillCheck2`.
 */
export const skillCheck2: SkillCheckDefinition = {
  lessonId: '2',
  title: 'Hand Rankings Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'What does this 5-card hand make?',
      interaction: 'hand-ranker',
      config: {
        mode: 'identify-category',
        cards: ['9C', '8D', '7H', '6S', '5C'],
      },
      answer: { category: 'straight' },
      incorrectFeedback: 'Five consecutive ranks of mixed suits is a straight.',
    },
  ],
}
