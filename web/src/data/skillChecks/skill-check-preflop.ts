import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check "Playing Preflop" (lessonId 'preflop'). TRANSFER questions: none reuse a
 * lesson hand. (q1) classify a premium pair, (q2) classify a playable small pair,
 * (q3) classify junk as a fold, (q4) pick the stronger of a suited vs offsuit hand,
 * and (q5) fold junk to a raise. Covers all three strength buckets, suited vs offsuit,
 * and a preflop betting decision, with no EV / pot-odds math. Keep `lessonId: 'preflop'`
 * / export `skillCheckPreflop`.
 */
const STRENGTH_OPTIONS = [
  { id: 'premium', label: 'Premium', sub: 'Raise from any seat' },
  { id: 'playable', label: 'Playable', sub: 'Worth seeing a flop' },
  { id: 'fold', label: 'Fold it', sub: 'Wait for better' },
]

export const skillCheckPreflop: SkillCheckDefinition = {
  lessonId: 'preflop',
  title: 'Playing Preflop Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'You are dealt two Kings. How strong is this starting hand?',
      interaction: 'preflop-hand',
      config: {
        mode: 'classify',
        hand: ['KS', 'KD'],
        options: STRENGTH_OPTIONS,
      },
      answer: { optionId: 'premium' },
      incorrectFeedback:
        'Pocket Kings is the second-best starting hand in poker. That is a premium hand you raise from any seat.',
    },
    {
      id: 'q2',
      prompt: 'You are dealt two Eights (a small pocket pair). How strong is this starting hand?',
      interaction: 'preflop-hand',
      config: {
        mode: 'classify',
        hand: ['8S', '8D'],
        options: STRENGTH_OPTIONS,
      },
      answer: { optionId: 'playable' },
      incorrectFeedback:
        'A small pocket pair like Eights is not premium, but it is worth seeing a flop (you might flop a set). That is playable.',
    },
    {
      id: 'q3',
      prompt: 'You are dealt an Eight and a Three of different suits. How strong is this starting hand?',
      interaction: 'preflop-hand',
      config: {
        mode: 'classify',
        hand: ['8C', '3D'],
        options: STRENGTH_OPTIONS,
      },
      answer: { optionId: 'fold' },
      incorrectFeedback:
        'Low, unconnected offsuit cards like 8-3 almost never make a strong hand. Fold them and wait.',
    },
    {
      id: 'q4',
      prompt: 'Both hands are Jack-Ten. Which version is a little stronger before the flop?',
      interaction: 'preflop-hand',
      config: {
        mode: 'pick-stronger',
        handA: ['JD', '10D'],
        handB: ['JS', '10C'],
        labelA: 'J-10 suited',
        labelB: 'J-10 offsuit',
        helperText: 'Same two ranks. Only the suits differ.',
      },
      answer: { stronger: 'a' },
      incorrectFeedback:
        'Same two ranks, but the suited version can also make a flush, so J-10 suited is the stronger hand.',
    },
    {
      id: 'q5',
      prompt:
        'An early player raises to 30 before the flop. You hold a Nine and a Four of different suits. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['9C', '4D'],
        board: [],
        street: 'preflop',
        pot: 45,
        heroStack: 500,
        villainStack: 500,
        facing: { action: 'bet', amount: 30 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 207,
        task: 'choose-action',
        helperText:
          'An early player opens with a raise to 30. You hold 9-4 offsuit. You can fold, call, or raise.',
      },
      answer: { action: 'fold' },
      incorrectFeedback:
        '9-4 offsuit is junk, and someone has shown strength with a raise. There is nothing to continue with, so fold.',
    },
  ],
}
