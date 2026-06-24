import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 5 (Lesson 5 · Outs & Equity): count outs, then convert outs → equity
 * with the Rule of 4 (flop) and Rule of 2 (turn). All three reuse the `outs-odds`
 * widget, whose outs/equity are validated by the evaluator, not hard-coded. No pot
 * odds or decision here. That is Lesson 6. Keep `lessonId: '5'` / export `skillCheck5`.
 */
export const skillCheck5: SkillCheckDefinition = {
  lessonId: '5',
  title: 'Outs & Equity Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'You hold two spades and two more are on the flop, a flush draw. How many outs do you have?',
      interaction: 'outs-odds',
      config: {
        hole: ['JS', '9S'],
        board: ['AS', '4S', '2H'],
        drawLabel: 'a flush',
        street: 'flop',
        ask: ['outs'],
      },
      answer: { outs: 9 },
      incorrectFeedback: 'A suit has 13 cards and you can see four spades, so $13 - 4 = 9$ outs.',
    },
    {
      id: 'q2',
      prompt: 'Open-ended straight draw on the flop, two cards to come. Estimate your equity by the river (whole percent).',
      interaction: 'outs-odds',
      config: {
        hole: ['10D', '9C'],
        board: ['8H', '7S', '2C'],
        drawLabel: 'an open-ended straight',
        street: 'flop',
        ask: ['equity'],
      },
      answer: { equityPercent: 32, equityTolerance: 3 },
      incorrectFeedback:
        'Open-ended = 8 outs. On the flop use the Rule of 4: $8 \\times 4 = 32\\%$ (exact $\\approx 31.5\\%$).',
    },
    {
      id: 'q3',
      prompt: 'You have a 9-out flush draw on the turn, with only the river left. Estimate your equity (whole percent).',
      interaction: 'outs-odds',
      config: {
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C', '3S'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['equity'],
      },
      answer: { equityPercent: 18, equityTolerance: 3 },
      incorrectFeedback:
        'One card to come, so use the Rule of 2: $9 \\times 2 = 18\\%$ (exact $\\frac{9}{46} \\approx 19.6\\%$).',
    },
  ],
}
