import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * SKELETON STUB — Skill Check 3 (design doc §6, Lesson 3). The Lesson 3 agent expands
 * to the full 3-question check (order the streets; best hand at a street; who acts
 * last postflop). Keep `lessonId: '3'` / export `skillCheck3`.
 */
export const skillCheck3: SkillCheckDefinition = {
  lessonId: '3',
  title: 'Flow of a Hand Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'Deal the hand to showdown and confirm all five community cards appear.',
      interaction: 'board-dealer',
      config: {
        hole: ['JC', 'JD'],
        board: ['JS', '4C', '4D', '9H', '2S'],
        streets: ['preflop', 'flop', 'turn', 'river'],
        annotateStreets: true,
      },
      answer: { minStreetsRevealed: 4 },
      incorrectFeedback: 'Reveal every street: flop (3), turn (1), river (1) = 5 community cards.',
    },
  ],
}
