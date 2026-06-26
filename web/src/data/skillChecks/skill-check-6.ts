import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 6 (Lesson 6 · Pot Odds). TRANSFER questions: none reuse a Lesson 6 board.
 * (q1) price a call, (q2) a profitable call, (q3) a fold, (q4) the EV of a call in chips,
 * and (q5) the full outs → price → decide workflow. The outs-odds questions compute the
 * price/decision from pot/betToCall + the evaluator; the betting-round EV question grades
 * the entered EV. Keep `lessonId: '6'` / export `skillCheck6`.
 */
export const skillCheck6: SkillCheckDefinition = {
  lessonId: '6',
  title: 'Pot Odds Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'Turn, flush draw. The pot is \\$60 and it costs \\$20 to call. What is the minimum equity you need to call profitably? (whole percent)',
      interaction: 'outs-odds',
      config: {
        hole: ['KH', 'QH'],
        board: ['JH', '4H', '2C', '7S'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['potOdds'],
        pot: 60,
        betToCall: 20,
        allowFractionAnswer: true,
      },
      answer: { potOddsPercent: 25 },
      incorrectFeedback: 'Required equity $= \\frac{20}{60 + 20} = \\frac{20}{80} = 25\\%$.',
    },
    {
      id: 'q2',
      prompt: 'Flop, open-ended straight draw (about 32% equity). The pot is \\$90 and it is \\$30 to call. Call or fold?',
      interaction: 'outs-odds',
      config: {
        hole: ['JS', '10D'],
        board: ['9C', '8H', '2S'],
        drawLabel: 'an open-ended straight',
        street: 'flop',
        ask: ['decision'],
        pot: 90,
        betToCall: 30,
      },
      answer: { decision: 'call' },
      incorrectFeedback:
        'Price $= \\frac{30}{120} = 25\\%$. Your ~32% equity is higher, so calling is profitable. Call.',
    },
    {
      id: 'q3',
      prompt: 'Turn, gutshot straight draw (about 8% equity). The pot is \\$100 and it costs \\$40 to call. Call or fold?',
      interaction: 'outs-odds',
      config: {
        hole: ['KD', 'QC'],
        board: ['JH', '9S', '4D', '2C'],
        drawLabel: 'an inside (gutshot) straight',
        street: 'turn',
        ask: ['decision'],
        pot: 100,
        betToCall: 40,
      },
      answer: { decision: 'fold' },
      incorrectFeedback:
        'Price $= \\frac{40}{140} \\approx 29\\%$. Your ~8% equity is far below that, so fold.',
    },
    {
      id: 'q4',
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
      id: 'q5',
      prompt: 'Turn, flush draw. The pot is \\$140 and it is \\$20 to call. Find your outs, the price, then decide.',
      interaction: 'outs-odds',
      config: {
        hole: ['AC', '9C'],
        board: ['KC', '6C', '3D', '8H'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['outs', 'potOdds', 'decision'],
        pot: 140,
        betToCall: 20,
        allowFractionAnswer: true,
      },
      answer: { outs: 9, potOddsPercent: 13, decision: 'call' },
      incorrectFeedback:
        '9 outs → ~18% equity. Price $= \\frac{20}{160} \\approx 13\\%$. Since 18% > 13%, call.',
    },
  ],
}
