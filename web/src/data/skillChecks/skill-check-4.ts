import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 4 (Lesson 4 · Betting Basics). TRANSFER questions: none reuse a Lesson 4
 * hand. (q1) raise a strong made hand facing a bet, (q2) check a weak hand for free,
 * (q3) fold a busted hand to a big bet, (q4) size a half-pot bet, and (q5) bet a strong
 * hand when checked to. Mechanics only, no EV / pot-odds math (that is the Math
 * section). All reuse the `betting-round` interaction. Keep `lessonId: '4'` / export
 * `skillCheck4`.
 */
export const skillCheck4: SkillCheckDefinition = {
  lessonId: '4',
  title: 'Betting Basics Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'You flop the **nut flush** (the best possible flush). The Opponent bets 30 into a pot of 60. Pick the best action.',
      interaction: 'betting-round',
      config: {
        hole: ['AD', '3D'],
        board: ['KD', '8D', '2D'],
        street: 'flop',
        pot: 90,
        heroStack: 400,
        villainStack: 400,
        facing: { action: 'bet', amount: 30 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 105,
        task: 'choose-action',
        helperText: 'The Opponent bets 30 into a pot of 60. You can call, raise, or fold.',
      },
      answer: { action: 'raise' },
      incorrectFeedback:
        'You hold the best possible hand (the nut flush) facing a bet, so raise for value rather than only calling.',
    },
    {
      id: 'q2',
      prompt: 'You hold Ace-high (no pair) on Q-9-3 and no one has bet. Pick the best action.',
      interaction: 'betting-round',
      config: {
        hole: ['AD', '7C'],
        board: ['QS', '9D', '3H'],
        street: 'flop',
        pot: 50,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 112,
        task: 'choose-action',
      },
      answer: { action: 'check' },
      incorrectFeedback:
        'Ace-high is too weak to bet, and you can see the next card for free, so never fold here. Check.',
    },
    {
      id: 'q3',
      prompt:
        'You hold J-8 (no pair, no draw) on A-Q-5. The Opponent bets a pot-sized 80 into 80. Pick the best action.',
      interaction: 'betting-round',
      config: {
        hole: ['JD', '8C'],
        board: ['AS', 'QH', '5D'],
        street: 'flop',
        pot: 160,
        heroStack: 300,
        villainStack: 300,
        facing: { action: 'bet', amount: 80 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 118,
        task: 'choose-action',
        helperText: 'The Opponent bets 80 into a pot of 80. You can call, raise, or fold.',
      },
      answer: { action: 'fold' },
      incorrectFeedback:
        'With no pair and no draw against a pot-sized bet, you have nothing to continue with, so fold.',
    },
    {
      id: 'q4',
      prompt:
        'You decide to bet half the pot. The pot is 100 chips. Which sizing is half the pot?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', 'QD'],
        board: ['QC', '8H', '3S'],
        street: 'flop',
        pot: 100,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 124,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.5, sizeTolerance: 0.05 },
      incorrectFeedback:
        'Half-pot is the middle option: half of the chips already in the pot (50 into 100).',
    },
    {
      id: 'q5',
      prompt:
        'You hold two Aces (an overpair) on J-7-2 and no one has bet. Pick the best action.',
      interaction: 'betting-round',
      config: {
        hole: ['AS', 'AC'],
        board: ['JD', '7C', '2S'],
        street: 'flop',
        pot: 50,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 131,
        task: 'choose-action',
      },
      answer: { action: 'bet' },
      incorrectFeedback:
        'An overpair is well ahead on J-7-2, and worse hands can call, so bet for value rather than checking.',
    },
  ],
}
