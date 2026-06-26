import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 5 (Lesson 5 · Outs & Equity). TRANSFER questions: none reuse a Lesson 5
 * board. (q1) count flush outs, (q2) count gutshot outs, (q3) open-ended equity on the
 * flop, (q4) flush equity on the turn, and (q5) count the outs of a combined draw. All
 * outs are validated by the evaluator inside the `outs-odds` widget; no pot odds or
 * decision here (that is Lesson 6). Keep `lessonId: '5'` / export `skillCheck5`.
 */
export const skillCheck5: SkillCheckDefinition = {
  lessonId: '5',
  title: 'Outs & Equity Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'You hold two hearts and two more are on the flop, a flush draw. How many outs do you have?',
      interaction: 'outs-odds',
      config: {
        hole: ['10H', '8H'],
        board: ['AH', '6H', '2C'],
        drawLabel: 'a flush',
        street: 'flop',
        ask: ['outs'],
      },
      answer: { outs: 9 },
      incorrectFeedback: 'A suit has 13 cards and you can see four hearts, so $13 - 4 = 9$ outs.',
    },
    {
      id: 'q2',
      prompt: 'You hold 9-8 on a 6-5-2 flop: 9-8 and 6-5, an inside (gutshot) straight draw missing the 7. How many outs do you have?',
      interaction: 'outs-odds',
      config: {
        hole: ['9S', '8D'],
        board: ['6C', '5H', '2S'],
        drawLabel: 'an inside (gutshot) straight',
        street: 'flop',
        ask: ['outs'],
      },
      answer: { outs: 4 },
      incorrectFeedback: 'Only a 7 fills the gap (9-8-7-6-5), and there are four 7s, so 4 outs.',
    },
    {
      id: 'q3',
      prompt: 'Open-ended straight draw on the flop, two cards to come. Estimate your equity by the river (whole percent).',
      interaction: 'outs-odds',
      config: {
        hole: ['JS', '10D'],
        board: ['9C', '8H', '2S'],
        drawLabel: 'an open-ended straight',
        street: 'flop',
        ask: ['equity'],
      },
      answer: { equityPercent: 32, equityTolerance: 3 },
      incorrectFeedback:
        'Open-ended = 8 outs. On the flop use the Rule of 4: $8 \\times 4 = 32\\%$ (exact $\\approx 31.5\\%$).',
    },
    {
      id: 'q4',
      prompt: 'You have a 9-out flush draw on the turn, with only the river left. Estimate your equity (whole percent).',
      interaction: 'outs-odds',
      config: {
        hole: ['KD', 'QD'],
        board: ['AD', '7D', '3C', '5S'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['equity'],
      },
      answer: { equityPercent: 18, equityTolerance: 3 },
      incorrectFeedback:
        'One card to come, so use the Rule of 2: $9 \\times 2 = 18\\%$ (exact $\\frac{9}{46} \\approx 19.6\\%$).',
    },
    {
      id: 'q5',
      prompt: 'You hold J-10 of hearts on an 8-7 flop with two hearts: a flush draw plus a gutshot (the 9 fills the straight). How many cards improve you to a flush or a straight?',
      interaction: 'outs-odds',
      config: {
        hole: ['JH', '10H'],
        board: ['8H', '7C', '2H'],
        drawLabel: 'a flush plus a gutshot straight',
        street: 'flop',
        ask: ['outs'],
      },
      answer: { outs: 12 },
      incorrectFeedback:
        'Nine hearts complete the flush, and a 9 completes the straight. The 9 of hearts is already counted, so $9 + 3 = 12$ outs.',
    },
  ],
}
