import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check for "Playing Preflop" (lessonId 'preflop'): classify a premium hand,
 * pick the stronger of a suited vs offsuit pair, and open-raise a premium hand on
 * the button. Covers the lesson's three ideas (hand strength, suited vs offsuit,
 * preflop betting) with no EV / pot-odds math. Keep `lessonId: 'preflop'` / export
 * `skillCheckPreflop`.
 */
export const skillCheckPreflop: SkillCheckDefinition = {
  lessonId: 'preflop',
  title: 'Playing Preflop Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'You are dealt two Aces. How strong is this starting hand?',
      interaction: 'preflop-hand',
      config: {
        mode: 'classify',
        hand: ['AS', 'AH'],
        options: [
          { id: 'premium', label: 'Premium', sub: 'Raise from any seat' },
          { id: 'playable', label: 'Playable', sub: 'Worth seeing a flop' },
          { id: 'fold', label: 'Fold it', sub: 'Wait for better' },
        ],
      },
      answer: { optionId: 'premium' },
      incorrectFeedback:
        'Pocket Aces is the best starting hand in poker. That is a premium hand you raise from any seat.',
    },
    {
      id: 'q2',
      prompt: 'Both hands are King-Queen. Which version is a little stronger before the flop?',
      interaction: 'preflop-hand',
      config: {
        mode: 'pick-stronger',
        handA: ['KS', 'QS'],
        handB: ['KD', 'QC'],
        labelA: 'K-Q suited',
        labelB: 'K-Q offsuit',
        helperText: 'Same two ranks. Only the suits differ.',
      },
      answer: { stronger: 'a' },
      incorrectFeedback:
        'Same two ranks, but the suited version can also make a flush, so K-Q suited is the stronger hand.',
    },
    {
      id: 'q3',
      prompt:
        'It folds to you on the button with the Ace and King of spades. The blinds are 5 and 10. Pick the best action.',
      interaction: 'betting-round',
      config: {
        hole: ['AS', 'KS'],
        board: [],
        street: 'preflop',
        pot: 15,
        heroStack: 500,
        villainStack: 500,
        facing: { action: 'bet', amount: 10 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 207,
        task: 'choose-action',
        helperText:
          'It folds to you on the button. The blinds are 5 and 10, so there is 10 to call. You can fold, call, or raise.',
      },
      answer: { action: 'raise' },
      incorrectFeedback:
        'A-K suited is a premium hand. Open with a raise to build the pot rather than limping or folding.',
    },
  ],
}
