import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson 6: "Pot Odds" (Section 3 · The Math).
 *
 * This is the single home of the whole call/fold decision. First, price a call as
 * required equity = call / (pot + call) (a bigger bet = a worse price). Then make the
 * call/fold decision by comparing your equity (from Lesson 5) to that price. Finally,
 * the SAME decision measured in chips: **expected value (EV)**. EV of a call used to
 * sit in Lesson 7, but it is the same call decision, so it now lives here; Lesson 7 is
 * free to focus on the genuinely new idea (fold equity).
 *
 * The outs-odds problems compute outs/price/decision from the live evaluator
 * (`countOuts`) + pot/betToCall, never hard-coded; the betting-round `ev-of-call`
 * problems grade the entered EV. Draws are varied (flush, straight, gutshot) so the
 * lesson is not one repeated board.
 *
 * Ratio: 8 problems / 11 steps ≈ 73% interactive. Concepts never run back-to-back.
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
      showCalculator: true,
      id: 'p1',
      prompt: 'It is the turn with an open-ended straight draw. The pot is \\$80 and it costs you \\$20 to call (a small, quarter-pot bet). What is the minimum equity you need to call profitably?',
      interaction: 'outs-odds',
      config: {
        hole: ['10D', '9C'],
        board: ['8H', '7S', '2C', '3D'],
        drawLabel: 'an open-ended straight',
        street: 'turn',
        ask: ['potOdds'],
        pot: 80,
        betToCall: 20,
        allowFractionAnswer: true,
      },
      answer: { potOddsPercent: 20 },
      feedback: {
        correct:
          'Required equity is the call over the pot **after** you call: $\\frac{20}{80 + 20} = \\frac{20}{100} = 20\\%$.',
        incorrect:
          'Use $\\frac{\\text{call}}{\\text{pot} + \\text{call}}$. Add your call to the pot in the denominator: $\\frac{20}{80 + 20}$.',
        hints: [
          'The price you pay is the call; the prize is the pot **after** your call goes in.',
          '$\\text{required} = \\frac{\\text{call}}{\\text{pot} + \\text{call}}$.',
          'Put your numbers into the formula: $\\frac{20}{80 + 20}$.',
        ],
        why: 'A \\$20 call into an \\$80 pot is a quarter-pot bet, which needs $\\frac{20}{100} = 20\\%$ to break even.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p2',
      prompt: 'Turn, flush draw, bigger bet: the pot is \\$90 and it costs \\$30 to call (a half-pot bet). What equity do you need now?',
      interaction: 'outs-odds',
      config: {
        hole: ['AC', 'JC'],
        board: ['KC', '7C', '3D', '5S'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['potOdds'],
        pot: 90,
        betToCall: 30,
        allowFractionAnswer: true,
      },
      answer: { potOddsPercent: 25 },
      feedback: {
        correct: 'A half-pot bet needs **25%**: $\\frac{30}{90 + 30} = \\frac{30}{120} = \\frac14$.',
        incorrect: 'Same formula: $\\frac{30}{90 + 30} = \\frac{30}{120} = 25\\%$.',
        hints: [
          'Use $\\frac{\\text{call}}{\\text{pot} + \\text{call}}$ again.',
          '$\\frac{30}{90 + 30} = \\frac{30}{120}$.',
          'Reduce that fraction, then turn it into a percent.',
        ],
        why: 'A half-pot bet always needs **25%** equity to call. Compare to the quarter-pot bet (20%): the bigger the bet, the more equity the price demands.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p3',
      prompt: 'Now a pot-sized bet on the turn: the pot is \\$120 and it costs \\$60 to call. What equity do you need?',
      interaction: 'outs-odds',
      config: {
        hole: ['QD', 'JD'],
        board: ['10D', '4D', '2C', '8S'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['potOdds'],
        pot: 120,
        betToCall: 60,
        allowFractionAnswer: true,
      },
      answer: { potOddsPercent: 33 },
      feedback: {
        correct: 'A pot-sized bet needs **33%**: $\\frac{60}{120 + 60} = \\frac{60}{180} = \\frac13$.',
        incorrect: 'Same formula: $\\frac{60}{120 + 60} = \\frac{60}{180} \\approx 33\\%$.',
        hints: [
          'The bet is as big as the pot, so expect a steep price.',
          '$\\frac{60}{120 + 60} = \\frac{60}{180}$.',
          'Reduce that fraction, then turn it into a percent.',
        ],
        why: 'A pot-sized bet always needs about **33.3%** ($\\frac13$). Quarter-pot needs 20%, half-pot 25%, pot 33%: each step up in size raises the equity you must have to call.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'The decision: equity vs price',
      content: `Now put the two halves together. You know your **equity** (your chance to win, from the Rule of 2 & 4) and the **required equity** (the price of the call).

- **Equity at least the price means call.** The call wins money over the long run.
- **Equity below the price means fold.** The call loses money over the long run.

That single comparison is the whole decision.`,
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p4',
      prompt: 'Flop, open-ended straight draw (8 outs, about 32% equity). The pot is \\$100 and it is \\$20 to call. Call or fold?',
      interaction: 'outs-odds',
      config: {
        hole: ['10D', '9C'],
        board: ['8H', '7S', '2C'],
        drawLabel: 'an open-ended straight',
        street: 'flop',
        ask: ['decision'],
        pot: 100,
        betToCall: 20,
      },
      answer: { decision: 'call' },
      feedback: {
        correct: 'Your ~32% equity clears the ~16.7% you need, so calling is **profitable**. Call.',
        incorrect:
          'Compare equity to price: 32% is well **above** the ~16.7% required, so this is a profitable call, not a fold.',
        hints: [
          'First find the price with $\\frac{\\text{call}}{\\text{pot} + \\text{call}}$.',
          'Your open-ended draw is worth about 32% on the flop (Rule of 4).',
          'Compare your equity to the price: call when your equity is at least the price.',
        ],
        why: 'Price $= \\frac{20}{120} \\approx 16.7\\%$; your equity $\\approx 32\\%$ (8 outs, Rule of 4). Since equity > price, the call is **profitable**. Call.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p5',
      prompt: 'Turn, gutshot straight draw (4 outs, about 8% equity). The pot is \\$100 and it costs \\$30 to call. Call or fold?',
      interaction: 'outs-odds',
      config: {
        hole: ['QH', 'JS'],
        board: ['10D', '8C', '3H', '5C'],
        drawLabel: 'an inside (gutshot) straight',
        street: 'turn',
        ask: ['decision'],
        pot: 100,
        betToCall: 30,
      },
      answer: { decision: 'fold' },
      feedback: {
        correct: 'Price $= \\frac{30}{100 + 30} \\approx 23\\%$. Your ~8% equity falls well short, so **fold**.',
        incorrect:
          'The price is $\\frac{30}{130} \\approx 23\\%$. A gutshot on the turn is worth only about 8%, far below that, so fold.',
        hints: [
          'Price first: $\\frac{\\text{call}}{\\text{pot} + \\text{call}}$.',
          'A gutshot is 4 outs; on the turn the Rule of 2 gives about 8%.',
          'Compare your equity to the price: fold when your equity is below the price.',
        ],
        why: 'Price $= \\frac{30}{130} \\approx 23\\%$ required vs only ~8% equity (4 outs on the turn). Equity < price, so calling is **−EV**. Fold.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p6',
      prompt: 'Put it all together. You hold the A and J of spades on a K-7-2 board with a spade turn: a flush draw on the turn. The pot is \\$120 and it is \\$20 to call. Find your outs, the price, then decide.',
      interaction: 'outs-odds',
      config: {
        hole: ['AS', 'JS'],
        board: ['KS', '7S', '2D', '4H'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['outs', 'potOdds', 'decision'],
        pot: 120,
        betToCall: 20,
        allowFractionAnswer: true,
      },
      answer: { outs: 9, potOddsPercent: 14, decision: 'call' },
      feedback: {
        correct:
          '9 outs → ~18% equity. Price $= \\frac{20}{140} \\approx 14\\%$. Equity 18% > price 14% → **call**.',
        incorrect:
          'Outs: $13 - 4 = 9$. Price: $\\frac{20}{120 + 20} \\approx 14\\%$. Your ~18% equity beats 14%, so call.',
        hints: [
          'Count your flush outs (the spades you cannot see), then use the Rule of 2 for turn equity.',
          'Find the price with $\\frac{\\text{call}}{\\text{pot} + \\text{call}}$.',
          'Compare your equity to the price: call when your equity is at least the price.',
        ],
        why: 'The full read: **9 outs** → ~18% equity; the price is $\\frac{20}{140} \\approx 14\\%$; since 18% > 14%, the call is **+EV**. Outs → equity → price → decide: that is the whole pot-odds workflow.',
      },
    },
    {
      type: 'concept',
      id: 'c3',
      title: 'The same call, in chips: EV',
      content: `Pot odds answer "call or fold?" as a percent. **Expected value (EV)** answers the very same question in **chips**, the average chips a call wins or loses over the long run:

$$\\text{EV} = p \\cdot (\\text{chips you win}) - (1 - p) \\cdot (\\text{chips you call})$$

where $p$ is your equity. **Positive EV means call; negative EV means fold.** It is the same break-even as pot odds, just counted in chips instead of a percent.`,
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p7',
      prompt:
        'Suppose you have **30% equity**. The pot already holds 100 chips and it costs you 20 to call. What is the EV of calling, in chips?',
      interaction: 'betting-round',
      config: {
        hole: ['QH', 'JH'],
        board: ['10H', '7H', '2C', '3S'],
        street: 'turn',
        pot: 100,
        heroStack: 300,
        villainStack: 300,
        facing: { action: 'bet', amount: 20 },
        seed: 77,
        task: 'ev-of-call',
      },
      answer: { evChips: 16, evTolerance: 1 },
      feedback: {
        correct: 'Yes. EV $= 0.30 \\times 100 - 0.70 \\times 20 = +16$ chips. A positive EV means calling profits over time.',
        incorrect:
          'EV = (win chance) × (chips won) − (lose chance) × (chips called). Try $0.30 \\times 100 - 0.70 \\times 20$.',
        hints: [
          'You win 100 chips 30% of the time, and lose 20 chips the other 70%.',
          'EV $= 0.30 \\times 100 - 0.70 \\times 20$.',
          'Work out each part, then subtract the loss side from the win side.',
        ],
        why: 'The chips you can win are the 100 already in the pot; the chips you risk are the 20 call.\n\n$$\\text{EV} = 0.30 \\times 100 - 0.70 \\times 20 = +16$$\n\nA positive EV means a profitable call, and it matches pot odds: a 20-into-100 call needs only $\\frac{20}{120} \\approx 16.7\\%$, and 30% clears that.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p8',
      prompt:
        'Now suppose your equity is only **15%**. The pot holds 100 chips and it costs 20 to call. What is the EV of calling, in chips? (Use a negative number if it loses.)',
      interaction: 'betting-round',
      config: {
        hole: ['9D', '6C'],
        board: ['AH', 'KS', '4C', '2H'],
        street: 'turn',
        pot: 100,
        heroStack: 300,
        villainStack: 300,
        facing: { action: 'bet', amount: 20 },
        seed: 88,
        task: 'ev-of-call',
      },
      answer: { evChips: -2, evTolerance: 1 },
      feedback: {
        correct: 'Right. EV $= 0.15 \\times 100 - 0.85 \\times 20 = -2$ chips. A negative EV means you should fold.',
        incorrect: 'EV $= 0.15 \\times 100 - 0.85 \\times 20$. That comes out below zero, a losing call.',
        hints: [
          'You win 100 chips 15% of the time, and lose 20 chips 85% of the time.',
          'EV $= 0.15 \\times 100 - 0.85 \\times 20$.',
          'Work out each part, then subtract; a negative result means a losing call.',
        ],
        why: 'You win the 100 only 15% of the time and lose your 20 call the other 85%:\n\n$$\\text{EV} = 0.15 \\times 100 - 0.85 \\times 20 = -2$$\n\nThe call loses 2 chips on average, so **fold**. In pot-odds terms you needed ~16.7%, and 15% falls short.',
      },
    },
  ],
}
