import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 7 (Lesson 7 · Fold Equity & Bluffing). TRANSFER questions: none reuse a
 * Lesson 7 hand. (q1) semibluff a draw, (q2) do not bluff an opponent who never folds,
 * (q3) turn a busted hand into a bluff when there is fold equity, and (q4) semibluff
 * raise a monster draw. All reuse the `betting-round` widget with `choose-action`, so
 * nothing re-tests the Lesson 6 call decision. Keep `lessonId: '7'` / export
 * `skillCheck7`.
 */
export const skillCheck7: SkillCheckDefinition = {
  lessonId: '7',
  title: 'Fold Equity & Bluffing Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        'You hold the A and 5 of hearts on a K-8 flop with two hearts: a flush draw, no made hand yet. No one has bet. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', '5H'],
        board: ['KH', '8H', '2C'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 141,
        task: 'choose-action',
        helperText: 'No bet faces you, so your choices are check or bet.',
      },
      answer: { action: 'bet' },
      incorrectFeedback:
        'Betting a strong draw is a semibluff: fold equity now plus your flush outs if called. Bet.',
    },
    {
      id: 'q2',
      prompt:
        'River. You hold Ace-high with no pair, and this opponent never folds. There is no bet yet. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AD', 'JC'],
        board: ['QS', '9H', '6C', '4D', '2S'],
        street: 'river',
        pot: 80,
        heroStack: 300,
        villainStack: 300,
        sizingOptions: [0.5, 0.75, 1],
        seed: 151,
        task: 'choose-action',
        helperText: 'No bet faces you, so your choices are check or bet.',
      },
      answer: { action: 'check' },
      incorrectFeedback:
        'A bluff needs fold equity. Against someone who never folds, betting Ace-high only loses chips, so check and try to win at showdown.',
    },
    {
      id: 'q3',
      prompt:
        'River. Your straight draw missed, so you have 10-high and cannot win at showdown. This opponent has shown weakness and will usually fold. There is no bet yet. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['10S', '9S'],
        board: ['8C', '7D', '4H', '3D', '2C'],
        street: 'river',
        pot: 70,
        heroStack: 300,
        villainStack: 300,
        sizingOptions: [0.5, 0.75, 1],
        villainAction: 'fold',
        seed: 161,
        task: 'choose-action',
        helperText: 'No bet faces you, so your choices are check or bet.',
      },
      answer: { action: 'bet' },
      incorrectFeedback:
        'Ten-high cannot win at showdown, so checking gives up. Because this opponent folds often, a bluff has the fold equity to win. Bet.',
    },
    {
      id: 'q4',
      prompt:
        'You hold the K and Q of diamonds on a J-10 flop with two diamonds: a flush draw plus an open-ended straight draw, a monster draw. A small bet comes to you. To win now AND keep your draw if called, what is the most aggressive action?',
      interaction: 'betting-round',
      config: {
        hole: ['KD', 'QD'],
        board: ['JD', '10S', '3D'],
        street: 'flop',
        pot: 80,
        heroStack: 400,
        villainStack: 400,
        facing: { action: 'bet', amount: 20 },
        sizingOptions: [0.5, 0.75, 1],
        villainAction: 'fold',
        seed: 171,
        task: 'choose-action',
        helperText: 'The Opponent bets 20 into a pot of 60. You can call, raise, or fold.',
      },
      answer: { action: 'raise' },
      incorrectFeedback:
        'A monster draw is the perfect semibluff raise: fold equity now plus a huge draw if called. Raise.',
    },
  ],
}
