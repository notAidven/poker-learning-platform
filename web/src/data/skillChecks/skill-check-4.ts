import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * SKELETON STUB — Skill Check 4 (design doc §6, Lesson 4). The Lesson 4 agent expands
 * to the full 3-question check (count outs; outs → equity; pot-odds call/fold).
 * Keep `lessonId: '4'` / export `skillCheck4`.
 */
export const skillCheck4: SkillCheckDefinition = {
  lessonId: '4',
  title: 'Outs, Odds & Pot Odds Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'Open-ended straight draw on the flop — how many outs do you have?',
      interaction: 'outs-odds',
      config: {
        hole: ['9C', '8D'],
        board: ['7H', '6S', '2C'],
        drawLabel: 'an open-ended straight',
        street: 'flop',
        ask: ['outs'],
      },
      answer: { outs: 8 },
      incorrectFeedback: 'Either end completes the straight: 4 + 4 = 8 outs.',
    },
  ],
}
