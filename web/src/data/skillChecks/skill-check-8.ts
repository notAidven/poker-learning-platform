import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 8 (Lesson 8 · Bet Sizing & Value Betting). TRANSFER questions: none reuse
 * a Lesson 8 hand. (q1) bet a monster for value, (q2) bet top pair for thin value,
 * (q3) check a weak pair that only better hands call, (q4) size a default half-pot bet,
 * and (q5) size up on a wet board. All reuse the `betting-round` widget. Keep
 * `lessonId: '8'` / export `skillCheck8`.
 */
export const skillCheck8: SkillCheckDefinition = {
  lessonId: '8',
  title: 'Bet Sizing & Value Betting Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        'You flop top set (three Queens) on Q-7-2 and no one has bet. Worse hands can call. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['QS', 'QD'],
        board: ['QH', '7C', '2D'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 151,
        task: 'choose-action',
      },
      answer: { action: 'bet' },
      incorrectFeedback:
        'With a monster and worse hands able to call, bet for value. Checking lets them off the hook.',
    },
    {
      id: 'q2',
      prompt:
        'You hold top pair, top kicker (A-K on K-9-4) and no one has bet. Many worse hands (a weaker King, smaller pairs, draws) would call. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AD', 'KC'],
        board: ['KS', '9D', '4C'],
        street: 'flop',
        pot: 50,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 158,
        task: 'choose-action',
      },
      answer: { action: 'bet' },
      incorrectFeedback:
        'Top pair top kicker beats many hands that will call. That is thin value, so bet rather than checking it down.',
    },
    {
      id: 'q3',
      prompt:
        'You hold pocket Sixes (a weak pair) on A-K-Q and no one has bet. Would worse hands call? What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['6C', '6D'],
        board: ['AH', 'KS', 'QC'],
        street: 'flop',
        pot: 50,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 165,
        task: 'choose-action',
      },
      answer: { action: 'check' },
      incorrectFeedback:
        'On A-K-Q a pair of Sixes is called only by better hands, so a value bet earns nothing. Check.',
    },
    {
      id: 'q4',
      prompt: 'You want the default half-pot value bet into an 80-chip pot. Which sizing is half the pot?',
      interaction: 'betting-round',
      config: {
        hole: ['QD', 'JD'],
        board: ['JS', '8H', '3C'],
        street: 'flop',
        pot: 80,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 172,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.5, sizeTolerance: 0.05 },
      incorrectFeedback: 'Half-pot is the middle option: half of the 80 already in the pot (40).',
    },
    {
      id: 'q5',
      prompt:
        'You have an overpair (two Kings) on a wet 10-9-8 board full of draws and want to charge them. The pot is 80. Which is the large, draw-charging bet?',
      interaction: 'betting-round',
      config: {
        hole: ['KH', 'KS'],
        board: ['10H', '9H', '8C'],
        street: 'flop',
        pot: 80,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 179,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.75, sizeTolerance: 0.05 },
      incorrectFeedback: 'On a wet, draw-heavy board, size up to ¾ pot so draws pay a bad price to chase.',
    },
  ],
}
