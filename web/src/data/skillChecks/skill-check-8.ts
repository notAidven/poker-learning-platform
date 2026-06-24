import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 8 (Lesson 8 · Bet Sizing & Value Betting): size a default half-pot
 * bet, size up on a wet board, and pick the value bet with a strong hand. All three
 * reuse the `betting-round` widget. Keep `lessonId: '8'` / export `skillCheck8`.
 */
export const skillCheck8: SkillCheckDefinition = {
  lessonId: '8',
  title: 'Bet Sizing & Value Betting Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'You want the default half-pot value bet into an 80-chip pot. Which sizing is half the pot?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', 'KD'],
        board: ['KC', '9D', '4S'],
        street: 'flop',
        pot: 80,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 151,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.5, sizeTolerance: 0.05 },
      incorrectFeedback: 'Half-pot is the middle option: half of the 80 already in the pot (40).',
    },
    {
      id: 'q2',
      prompt:
        'You have an overpair on a wet 9-8-7 board full of draws and want to charge them. Which is the large, draw-charging bet?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', 'AS'],
        board: ['9H', '8H', '7C'],
        street: 'flop',
        pot: 80,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 158,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.75, sizeTolerance: 0.05 },
      incorrectFeedback: 'On a wet, draw-heavy board, size up to ¾ pot so draws pay a bad price to chase.',
    },
    {
      id: 'q3',
      prompt:
        'You flop top set on K-8-3 and no one has bet. Worse hands can call. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['KS', 'KD'],
        board: ['KC', '8D', '3S'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 161,
        task: 'choose-action',
      },
      answer: { action: 'bet' },
      incorrectFeedback:
        'With a monster and worse hands able to call, bet for value. Checking lets them off the hook.',
    },
  ],
}
