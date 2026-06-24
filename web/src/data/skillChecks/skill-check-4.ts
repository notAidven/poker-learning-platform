import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 4 (design doc §6, Lesson 4): count outs → outs-to-equity →
 * pot-odds call/fold decision. All three reuse the `outs-odds` widget, whose
 * outs/equity/price are validated by the evaluator, not hard-coded. The decision
 * spot is a deliberate **fold** (price 25% > ~19% equity) to contrast the lesson's
 * profitable call. Keep `lessonId: '4'` / export `skillCheck4`.
 */
export const skillCheck4: SkillCheckDefinition = {
  lessonId: '4',
  title: 'Outs, Odds & Pot Odds Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'You hold two spades and two more are on the flop — a flush draw. How many outs do you have?',
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
      prompt: 'Turn with a 9-out flush draw. The pot is \\$150 and it costs \\$50 to call. Call or fold?',
      interaction: 'outs-odds',
      config: {
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C', '3S'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['decision'],
        pot: 150,
        betToCall: 50,
      },
      answer: { decision: 'fold' },
      incorrectFeedback:
        'Price $= \\frac{50}{150 + 50} = 25\\%$. Your draw is only ~18–20%, which is **less** than 25%, so fold.',
    },
  ],
}
