import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 5 (design doc §6, Lesson 5): best action facing a bet, size a half-pot
 * bet, and the sign/value of an EV-of-call. All three reuse the `betting-round`
 * interaction. Keep `lessonId: '5'` / export `skillCheck5`.
 */
export const skillCheck5: SkillCheckDefinition = {
  lessonId: '5',
  title: 'Betting Skill Check',
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
        aiTier: 2,
        seed: 105,
        task: 'choose-action',
      },
      answer: { action: 'raise' },
      incorrectFeedback:
        'You hold the best possible hand (the nut flush) facing a bet — raise for value rather than only calling.',
    },
    {
      id: 'q2',
      prompt:
        'You want to make a half-pot value bet into an 80-chip pot. Which sizing is half the pot?',
      interaction: 'betting-round',
      config: {
        hole: ['KD', 'KS'],
        board: ['KC', '8D', '3S'],
        street: 'flop',
        pot: 80,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        aiTier: 1,
        seed: 112,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.5, sizeTolerance: 0.05 },
      incorrectFeedback:
        'Half-pot is the middle option — half of the chips already in the pot (40 into 80).',
    },
    {
      id: 'q3',
      prompt:
        'With 25% equity, the pot holds 100 chips and it costs 20 to call. What is the EV of calling, in chips?',
      interaction: 'betting-round',
      config: {
        hole: ['JS', '10S'],
        board: ['9D', '4C', '2H', 'QS'],
        street: 'turn',
        pot: 100,
        heroStack: 300,
        villainStack: 300,
        facing: { action: 'bet', amount: 20 },
        aiTier: 2,
        seed: 121,
        task: 'ev-of-call',
      },
      answer: { evChips: 10, evTolerance: 1 },
      incorrectFeedback:
        'EV = 0.25 × 100 − 0.75 × 20 = 25 − 15 = +10 chips, a profitable call.',
    },
  ],
}
