import type { LessonDefinition } from '../../types/lesson'
import { cardsBySuit } from '../../types/lesson'

/**
 * Lesson 4 — "Outs, Odds & Pot Odds" (design doc §6, Lesson 4).
 *
 * Count outs → convert with the Rule of 2 & 4 → compute pot odds → make a call/fold
 * decision, with EV tying it together. Outs are validated by the evaluator
 * (`countOuts`) inside the `outs-odds` widget, never hard-coded. One flush draw
 * (A♥K♥) is carried from flop to turn so learners feel equity shrink street to street.
 *
 * 7 problems / 9 steps = 78% interactive. Keep `id: '4'` / export `lesson4`.
 */
export const lesson4: LessonDefinition = {
  id: '4',
  title: 'Outs, Odds & Pot Odds',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Outs',
      content: `An **out** is an unseen card that improves your hand into a likely winner.

Say you hold two hearts and two more hearts are on the board — a **flush draw** (four to a flush). A suit has 13 cards and you can already see 4 of them, so the rest are still out there:

$$\\text{flush outs} = 13 - 4 = 9$$

Any one of those **9 outs** completes the flush. Counting outs is the first step to turning a draw into a probability.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'You hold two hearts and two more land on the flop — a flush draw. How many cards complete your flush?',
      interaction: 'outs-odds',
      config: {
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C'],
        drawLabel: 'a flush',
        street: 'flop',
        ask: ['outs'],
      },
      answer: { outs: 9 },
      feedback: {
        correct: 'A suit holds 13 cards and you can see 4, so **9** hearts remain. Nine outs.',
        incorrect: 'Count the hearts you can already see (4), then subtract from 13.',
        hints: [
          'A flush needs five cards of one suit.',
          'You can see four hearts: two in your hand, two on the board.',
          '$13 - 4 = 9$.',
        ],
        why: 'A flush draw is always **9 outs**: a suit has 13 cards; with 2 in your hand and 2 on the board you have seen 4, leaving $13 - 4 = 9$ unseen cards that complete the flush.',
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt: 'Your 9-8 sits on a 7-6-2 flop, giving you 9-8-7-6 — an open-ended straight draw. How many cards complete the straight?',
      interaction: 'outs-odds',
      config: {
        hole: ['9C', '8D'],
        board: ['7H', '6S', '2C'],
        drawLabel: 'an open-ended straight',
        street: 'flop',
        ask: ['outs'],
      },
      answer: { outs: 8 },
      feedback: {
        correct:
          'Either end fills it: any **10** (four of them) makes 10-9-8-7-6, any **5** (four) makes 9-8-7-6-5. That is $4 + 4 = 8$ outs.',
        incorrect: 'An open-ended draw fills at **both** ends — count four 10s plus four 5s.',
        hints: [
          'You already have four in a row: 9-8-7-6.',
          'A card at either end completes the straight.',
          'Four 10s on top + four 5s on the bottom $= 8$.',
        ],
        why: 'An **open-ended** straight draw (four in a row, open at both ends) has **8 outs** — four cards complete each end. Compare a **gutshot** (a single missing middle rank), which has only **4**.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'The Rule of 2 & 4',
      content: `To turn outs into a rough win chance, use the **Rule of 2 & 4**:

$$\\text{flop: outs} \\times 4 \\qquad\\qquad \\text{turn: outs} \\times 2$$

On the **flop**, two cards are still coming, so multiply by **4**. On the **turn**, only the river is left, so multiply by **2**.

Two caveats: the $\\times 4$ figure assumes you will see **both** cards (your all-in chance), and it **overestimates** with many outs — for 9 or more outs, correct it with $(\\text{outs} \\times 4) - (\\text{outs} - 8)$.`,
    },
    {
      type: 'problem',
      id: 'p3',
      prompt: 'Back to your flush draw — 9 outs on the flop, two cards still to come. Estimate your chance to complete the flush by the river.',
      interaction: 'outs-odds',
      config: {
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C'],
        drawLabel: 'a flush',
        street: 'flop',
        ask: ['equity'],
        empiricalTieIn: true,
        helperText: 'Use the Rule of 4, then deal it out below to watch the hit-rate settle near your estimate.',
      },
      answer: { equityPercent: 35, equityTolerance: 3 },
      feedback: {
        correct:
          'Rule of 4: $9 \\times 4 = 36\\%$. With many outs that runs a touch high, so the corrected (and exact) value is about **35%**.',
        incorrect:
          'On the **flop**, two cards are coming — use the Rule of **4**: $9 \\times 4 \\approx 36\\%$ (about 35% after the big-draw correction).',
        hints: [
          'Two cards to come on the flop means multiply by **4**.',
          '$9 \\times 4 = 36$.',
          'For 9+ outs, subtract $(\\text{outs} - 8)$: $36 - 1 = 35\\%$.',
        ],
        why: 'On the flop two cards are coming, so Rule of 4: $9 \\times 4 = 36\\%$. That slightly overestimates, so the big-draw correction gives $36 - 1 = 35\\%$, matching the exact $1 - \\frac{38}{47}\\cdot\\frac{37}{46} \\approx 35\\%$.',
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt: 'A blank hits the turn — you still hold the 9-out flush draw, but now only the river is left. Estimate your equity now.',
      interaction: 'outs-odds',
      config: {
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C', '3S'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['equity'],
      },
      answer: { equityPercent: 18, equityTolerance: 3 },
      feedback: {
        correct:
          'Rule of 2: $9 \\times 2 = 18\\%$ (exactly $\\frac{9}{46} \\approx 19.6\\%$). One card to come, so the same draw is worth far less than on the flop.',
        incorrect:
          'On the **turn**, only the river is left — use the Rule of **2**: $9 \\times 2 = 18\\%$ (exact $\\frac{9}{46} \\approx 19.6\\%$).',
        hints: [
          'One card to come on the turn means multiply by **2**.',
          '$9 \\times 2 = 18$.',
          'Exactly $\\frac{9}{46} \\approx 19.6\\%$ — 46 unseen cards remain after the turn.',
        ],
        why: 'Only the river is left, so Rule of 2: $9 \\times 2 = 18\\%$. The exact one-card chance is $\\frac{9}{46} \\approx 19.6\\%$ (six cards seen, 46 unseen). On the flop the figure uses 47 unseen — $\\frac{9}{47} \\approx 19.1\\%$ — and across **both** cards the draw is ~35%. Same draw, much less equity once a street has passed.',
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt: 'Zoom out from this hand. Draw single cards from a full deck, tally the hearts, then give the probability that any one card is a heart.',
      interaction: 'card-deck',
      config: {
        mode: 'draw-tally',
        targetEvent: cardsBySuit('H'),
        targetLabel: 'a heart',
        minDraws: 12,
        helperText:
          'Deal cards and watch the running frequency of hearts settle toward its true value.',
        probabilityLabel: 'What is P(heart) for a single card, as a reduced fraction?',
      },
      answer: { probability: { num: 1, den: 4 } },
      feedback: {
        correct:
          'About **1 in 4** cards is a heart: $\\frac{13}{52} = \\frac{1}{4}$. Your real flush-draw equity is a bit under that per card (some hearts are already out) and higher across two cards (~35%).',
        incorrect: 'There are 13 hearts in 52 cards: $\\frac{13}{52} = \\frac{1}{4}$.',
        hints: [
          'One suit holds 13 of the 52 cards.',
          '$\\frac{13}{52}$ reduces.',
          '$\\frac{13}{52} = \\frac{1}{4}$.',
        ],
        why: 'A single suit is **a quarter of the deck**: $\\frac{13}{52} = \\frac{1}{4}$ — the raw chance the next card is a heart. A flush *draw* counts only the hearts you have not seen, so its per-card equity is a little under that, while two cards to come push it toward 35%.',
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt: 'It is the turn. The pot is \\$100 and it costs you \\$20 to call. What is the minimum equity you need to call profitably?',
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
          'Required equity is the call over the pot **after** you call: $\\frac{20}{100 + 20} = \\frac{1}{6} \\approx 16.7\\%$ — round to 17%.',
        incorrect:
          'Use $\\frac{\\text{call}}{\\text{pot} + \\text{call}}$. Add your call to the pot in the denominator: $\\frac{20}{100 + 20}$.',
        hints: [
          'The price you pay is the call; the prize is the pot **after** your call goes in.',
          '$\\text{required} = \\frac{\\text{call}}{\\text{pot} + \\text{call}}$.',
          '$\\frac{20}{120} = \\frac{1}{6} \\approx 16.7\\%$, so about 17%.',
        ],
        why: 'Pot odds give the **break-even** win rate for a call: $\\frac{\\text{call}}{\\text{pot}+\\text{call}} = \\frac{20}{120} = \\frac{1}{6} \\approx 16.7\\%$. A \\$20 bet into a \\$100 pot is a quarter-pot bet, which always needs **16.7%**.',
      },
    },
    {
      type: 'problem',
      id: 'p7',
      prompt: 'Still the turn with your 9-out flush draw (equity about 18–20%). The pot is \\$100 and it is \\$20 to call. Call or fold?',
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
        correct: 'Your ~18–20% equity clears the ~16.7% you need, so calling is **profitable** — call.',
        incorrect:
          'Compare equity to price: 18% is **greater** than the 16.7% required, so this is a profitable call, not a fold.',
        hints: [
          'First find the price: $\\frac{20}{100 + 20} \\approx 16.7\\%$.',
          'Your flush draw is worth about 18% on the turn (Rule of 2).',
          'Equity 18% > price 16.7% → calling wins money over time.',
        ],
        why: `Calling is **+EV**. If you call \\$20 to win the \\$100 pot with ~19.6% equity:

$$EV = 0.196 \\times 100 - 0.804 \\times 20 = 19.60 - 16.08 = +3.52$$

A positive EV (about **+\\$3.52** per call) means you profit over the long run. It matches pot odds exactly: break-even is 16.7%, and since 19.6% > 16.7%, the call is good.`,
      },
    },
  ],
}
