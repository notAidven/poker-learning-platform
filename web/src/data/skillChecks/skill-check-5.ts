import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * SKELETON STUB — Skill Check 5 (design doc §6, Lesson 5). The Lesson 5 agent expands
 * to the full 3-question check (best action facing a bet; size a half-pot bet; sign
 * of an EV-of-call). Keep `lessonId: '5'` / export `skillCheck5`.
 */
export const skillCheck5: SkillCheckDefinition = {
  lessonId: '5',
  title: 'Betting Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'No one has bet and you hold the nuts. Pick the best action.',
      interaction: 'betting-round',
      config: {
        hole: ['AS', 'KS'],
        board: ['QS', 'JS', '10S'],
        street: 'flop',
        pot: 80,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        task: 'choose-action',
      },
      answer: { action: 'bet' },
      incorrectFeedback: 'With a royal flush you bet to build the pot.',
    },
  ],
}
