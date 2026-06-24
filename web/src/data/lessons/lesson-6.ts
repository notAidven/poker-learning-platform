import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson 6: "Pot Odds" (Section 3 · The Math).
 *
 * Price a call as required equity = call / (pot + call) (a bigger bet = a worse
 * price), then make the call/fold decision by comparing your equity (from Lesson 5)
 * to that price. All problems reuse the `outs-odds` widget: the required equity is
 * computed by the widget from pot/betToCall, and the decision is graded by comparing
 * the Rule-of-2/4 equity estimate to that price, never hard-coded.
 *
 * Ratio: 6 problems / 8 steps = 75% interactive. Concepts never run back-to-back.
 * Keep `id: '6'` / export `lesson6`.
 */
export const lesson6: LessonDefinition = {
  id: '6',
  title: 'Pot Odds',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Pot odds: the price of a call',
      content: `**Pot odds** compare the price of a call to the pot you can win. They give the **break-even win rate** you need to call:

$$\\text{required equity} = \\frac{\\text{call}}{\\text{pot} + \\text{call}}$$

The pot here already includes the bet you face. The bigger the bet relative to the pot, the **worse** the price. So a pot-sized bet asks for far more equity than a small one.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'It is the turn. The pot is \\$100 and it costs you \\$20 to call (a small, quarter-pot bet). What is the minimum equity you need to call profitably?',
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
      feedback: {
        correct:
          'Required equity is the call over the pot **after** you call: $\\frac{20}{100 + 20} = \\frac{1}{6} \\approx 16.7\\%$, so round to 17%.',
        incorrect:
          'Use $\\frac{\\text{call}}{\\text{pot} + \\text{call}}$. Add your call to the pot in the denominator: $\\frac{20}{100 + 20}$.',
        hints: [
          'The price you pay is the call; the prize is the pot **after** your call goes in.',
          '$\\text{required} = \\frac{\\text{call}}{\\text{pot} + \\text{call}}$.',
          '$\\frac{20}{120} = \\frac{1}{6} \\approx 16.7\\%$, so about 17%.',
        ],
        why: 'A \\$20 call into a \\$100 pot is a quarter-pot bet, which always needs about **16.7%**: $\\frac{20}{120} = \\frac{1}{6}$.',
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt: 'Same turn, bigger bet: the pot is \\$90 and it costs \\$30 to call (a half-pot bet). What equity do you need now?',
      interaction: 'outs-odds',
      config: {
        hole: ['AS', 'KS'],
        board: ['QS', '7S', '2C', '3D'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['potOdds'],
        pot: 90,
        betToCall: 30,
      },
      answer: { potOddsPercent: 25 },
      feedback: {
        correct: 'A half-pot bet needs **25%**: $\\frac{30}{90 + 30} = \\frac{30}{120} = \\frac14$.',
        incorrect: 'Same formula: $\\frac{30}{90 + 30} = \\frac{30}{120} = 25\\%$.',
        hints: [
          'Use $\\frac{\\text{call}}{\\text{pot} + \\text{call}}$ again.',
          '$\\frac{30}{90 + 30} = \\frac{30}{120}$.',
          '$\\frac{30}{120} = \\frac14 = 25\\%$.',
        ],
        why: 'A half-pot bet always needs **25%** equity to call. Compare to the quarter-pot bet (16.7%): the bigger the bet, the more equity the price demands.',
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt: 'Now a pot-sized bet: the pot is \\$120 and it costs \\$60 to call. What equity do you need?',
      interaction: 'outs-odds',
      config: {
        hole: ['AD', 'KD'],
        board: ['QD', '7D', '2C', '3S'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['potOdds'],
        pot: 120,
        betToCall: 60,
      },
      answer: { potOddsPercent: 33 },
      feedback: {
        correct: 'A pot-sized bet needs **33%**: $\\frac{60}{120 + 60} = \\frac{60}{180} = \\frac13$.',
        incorrect: 'Same formula: $\\frac{60}{120 + 60} = \\frac{60}{180} \\approx 33\\%$.',
        hints: [
          'The bet is as big as the pot, so expect a steep price.',
          '$\\frac{60}{120 + 60} = \\frac{60}{180}$.',
          '$\\frac{60}{180} = \\frac13 \\approx 33\\%$.',
        ],
        why: 'A pot-sized bet always needs about **33.3%** ($\\frac13$). Quarter-pot → 16.7%, half-pot → 25%, pot → 33%: each step up in size raises the equity you must have to call.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'The decision: equity vs price',
      content: `Now put the two halves together. You know your **equity** (your chance to win, from the Rule of 2 & 4) and the **required equity** (the price of the call).

- **Equity ≥ price → call.** The call wins money over the long run.
- **Equity < price → fold.** The call loses money over the long run.

That single comparison is the whole decision.`,
    },
    {
      type: 'problem',
      id: 'p4',
      prompt: 'Turn, 9-out flush draw (equity about 18–20%). The pot is \\$100 and it is \\$20 to call. Call or fold?',
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
      feedback: {
        correct: 'Your ~18% equity clears the ~16.7% you need, so calling is **profitable**. Call.',
        incorrect:
          'Compare equity to price: 18% is **greater** than the 16.7% required, so this is a profitable call, not a fold.',
        hints: [
          'First find the price: $\\frac{20}{100 + 20} \\approx 16.7\\%$.',
          'Your flush draw is worth about 18% on the turn (Rule of 2).',
          'Equity 18% > price 16.7% → calling wins money over time.',
        ],
        why: 'Price $= \\frac{20}{120} \\approx 16.7\\%$; your equity $\\approx 18\\%$ (exactly $\\frac{9}{46} \\approx 19.6\\%$). Since equity > price, the call is **profitable**. Call.',
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt: 'Same 9-out flush draw on the turn, but a bigger bet: the pot is \\$150 and it costs \\$50 to call. Call or fold?',
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
      feedback: {
        correct: 'Price $= \\frac{50}{150 + 50} = 25\\%$. Your ~18% equity falls short, so **fold**.',
        incorrect:
          'The bigger bet raises the price to $\\frac{50}{200} = 25\\%$. Your ~18% equity is **below** that, so fold.',
        hints: [
          'Price first: $\\frac{50}{150 + 50} = 25\\%$.',
          'Your draw is still only about 18% on the turn.',
          'Equity 18% < price 25% → folding loses the least.',
        ],
        why: 'Same draw, worse price: $\\frac{50}{200} = 25\\%$ required vs only ~18% equity. Equity < price, so calling is **−EV**. Fold. The draw did not change; the price did.',
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt: 'Put it all together. You hold a flush draw on the turn. The pot is \\$120 and it is \\$20 to call. Find your outs, the price, then decide.',
      interaction: 'outs-odds',
      config: {
        hole: ['AD', 'KD'],
        board: ['QD', '7D', '2C', '3S'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['outs', 'potOdds', 'decision'],
        pot: 120,
        betToCall: 20,
      },
      answer: { outs: 9, potOddsPercent: 14, decision: 'call' },
      feedback: {
        correct:
          '9 outs → ~18% equity. Price $= \\frac{20}{140} \\approx 14\\%$. Equity 18% > price 14% → **call**.',
        incorrect:
          'Outs: $13 - 4 = 9$. Price: $\\frac{20}{120 + 20} \\approx 14\\%$. Your ~18% equity beats 14%, so call.',
        hints: [
          'A flush draw is 9 outs → about 18% on the turn (Rule of 2).',
          'Price $= \\frac{20}{120 + 20} \\approx 14\\%$.',
          'Equity 18% > price 14% → call.',
        ],
        why: 'The full read: **9 outs** → ~18% equity; the price is $\\frac{20}{140} \\approx 14\\%$; since 18% > 14%, the call is **+EV**. Outs → equity → price → decide: that is the whole pot-odds workflow.',
      },
    },
  ],
}
