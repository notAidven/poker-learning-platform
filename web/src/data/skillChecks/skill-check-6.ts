import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 6 (Lesson 6 · Pot Odds): price a call (required equity), then make
 * the call/fold decision: once profitable (equity > price) and once not. All three
 * reuse the `outs-odds` widget, whose price and decision are computed by the widget
 * from pot/betToCall, not hard-coded. Keep `lessonId: '6'` / export `skillCheck6`.
 */
export const skillCheck6: SkillCheckDefinition = {
  lessonId: '6',
  title: 'Pot Odds Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'The pot is \\$100 and it costs \\$20 to call. What is the minimum equity you need to call profitably? (whole percent)',
      interaction: 'outs-odds',
      config: {
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C', '3S'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['potOdds'],
        pot: 100,
        betToCall: 20,
      },
      answer: { potOddsPercent: 17 },
      incorrectFeedback: 'Required equity $= \\frac{20}{100 + 20} = \\frac{1}{6} \\approx 16.7\\%$, so round to 17%.',
    },
    {
      id: 'q2',
      prompt: 'Turn with a 9-out flush draw (~18% equity). The pot is \\$100 and it is \\$20 to call. Call or fold?',
      interaction: 'outs-odds',
      config: {
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C', '3S'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['decision'],
        pot: 100,
        betToCall: 20,
      },
      answer: { decision: 'call' },
      incorrectFeedback:
        'Price $= \\frac{20}{120} \\approx 16.7\\%$. Your ~18% equity is higher, so calling is profitable. Call.',
    },
    {
      id: 'q3',
      prompt: 'Turn with a 9-out flush draw (~18% equity). The pot is \\$150 and it costs \\$50 to call. Call or fold?',
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
        'Price $= \\frac{50}{150 + 50} = 25\\%$. Your ~18% equity is **less** than 25%, so fold.',
    },
  ],
}
