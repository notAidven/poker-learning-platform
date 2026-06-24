import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 7 (Lesson 7 · Expected Value): compute the EV of a call (once
 * profitable, once losing), then apply fold equity by semibluffing a draw. All three
 * reuse the `betting-round` widget. Pot convention: `config.pot` is the pot the hero
 * scoops on a win (incl. the villain's bet); `facing.amount` is the call. Keep
 * `lessonId: '7'` / export `skillCheck7`.
 */
export const skillCheck7: SkillCheckDefinition = {
  lessonId: '7',
  title: 'Expected Value Skill Check',
  questions: [
    {
      id: 'q1',
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
        seed: 121,
        task: 'ev-of-call',
      },
      answer: { evChips: 10, evTolerance: 1 },
      incorrectFeedback: 'EV $= 0.25 \\times 100 - 0.75 \\times 20 = 25 - 15 = +10$ chips, a profitable call.',
    },
    {
      id: 'q2',
      prompt:
        'With only 15% equity, the pot holds 100 chips and it costs 20 to call. What is the EV of calling, in chips? (Use a negative number if it loses.)',
      interaction: 'betting-round',
      config: {
        hole: ['9D', '6C'],
        board: ['AH', 'KS', '4C', '2H'],
        street: 'turn',
        pot: 100,
        heroStack: 300,
        villainStack: 300,
        facing: { action: 'bet', amount: 20 },
        seed: 131,
        task: 'ev-of-call',
      },
      answer: { evChips: -2, evTolerance: 1 },
      incorrectFeedback: 'EV $= 0.15 \\times 100 - 0.85 \\times 20 = 15 - 17 = -2$ chips, a losing call.',
    },
    {
      id: 'q3',
      prompt:
        'You have a flush draw (no made hand yet) on the flop and no one has bet. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['QH', 'JH'],
        board: ['AH', '9H', '3C'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 141,
        task: 'choose-action',
      },
      answer: { action: 'bet' },
      incorrectFeedback:
        'Betting a strong draw is a semibluff: fold equity now plus your flush outs if called. Bet.',
    },
  ],
}
