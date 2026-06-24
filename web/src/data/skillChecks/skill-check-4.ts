import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 4 (Lesson 4 · Betting Basics): pick the best action facing a bet,
 * size a half-pot bet, and fold a busted hand to a big bet. All three reuse the
 * `betting-round` interaction, mechanics only, no EV/pot-odds math (that lives in
 * the Math section). Keep `lessonId: '4'` / export `skillCheck4`.
 */
export const skillCheck4: SkillCheckDefinition = {
  lessonId: '4',
  title: 'Betting Basics Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'You flop the nut flush. The villain bets 30 into a pot of 60. Pick the best action.',
      interaction: 'betting-round',
      config: {
        hole: ['AH', '5H'],
        board: ['KH', '9H', '2H'],
        street: 'flop',
        pot: 90,
        heroStack: 400,
        villainStack: 400,
        facing: { action: 'bet', amount: 30 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 105,
        task: 'choose-action',
      },
      answer: { action: 'raise' },
      incorrectFeedback:
        'You hold the best possible hand (the nut flush) facing a bet, so raise for value rather than only calling.',
    },
    {
      id: 'q2',
      prompt:
        'You decide to bet half the pot. The pot is 80 chips. Which sizing is half the pot?',
      interaction: 'betting-round',
      config: {
        hole: ['KD', 'KS'],
        board: ['KC', '8D', '3S'],
        street: 'flop',
        pot: 80,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 112,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.5, sizeTolerance: 0.05 },
      incorrectFeedback:
        'Half-pot is the middle option: half of the chips already in the pot (40 into 80).',
    },
    {
      id: 'q3',
      prompt:
        'You hold 9-4 offsuit (no pair, no draw) on A-K-7. The villain bets a pot-sized 80 into 80. Pick the best action.',
      interaction: 'betting-round',
      config: {
        hole: ['9D', '4C'],
        board: ['AH', 'KS', '7C'],
        street: 'flop',
        pot: 160,
        heroStack: 300,
        villainStack: 300,
        facing: { action: 'bet', amount: 80 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 118,
        task: 'choose-action',
      },
      answer: { action: 'fold' },
      incorrectFeedback:
        'With no pair and no draw against a pot-sized bet, you have nothing to continue with, so fold.',
    },
  ],
}
