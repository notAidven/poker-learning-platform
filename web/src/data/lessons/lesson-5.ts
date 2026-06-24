import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson 5 — "Outs & Equity" (Section 3 · The Math).
 *
 * Count outs (flush draw = 9, open-ended = 8, gutshot = 4) → convert to a rough win
 * chance with the Rule of 2 & 4. Outs are validated by the evaluator (`countOuts`)
 * inside the `outs-odds` widget, never hard-coded. One flush draw (A♥K♥) is carried
 * from flop to turn so learners feel equity shrink street to street. Pot odds and the
 * call/fold decision live in the next lesson (Lesson 6).
 *
 * Ratio: 6 problems / 8 steps = 75% interactive. Concepts never run back-to-back.
 * Keep `id: '5'` / export `lesson5`.
 */
export const lesson5: LessonDefinition = {
  id: '5',
  title: 'Outs & Equity',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Outs',
      content: `An **out** is an unseen card that improves your hand.

Say you hold two hearts and two more land on the board — a **flush draw**. A suit has 13 cards and you can already see 4, so the rest are still out there:

$$\\text{flush outs} = 13 - 4 = 9$$

Any one of those **9 outs** completes the flush. Counting outs turns a draw into a probability.`,
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
        why: 'An **open-ended** straight draw (four in a row, open at both ends) has **8 outs** — four cards complete each end.',
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt: 'Same 9-8, but now the flop is 7-5-2: you hold 9-8-7 and 5 — an inside (gutshot) straight draw missing the 6. How many cards complete the straight?',
      interaction: 'outs-odds',
      config: {
        hole: ['9C', '8D'],
        board: ['7H', '5S', '2C'],
        drawLabel: 'an inside (gutshot) straight',
        street: 'flop',
        ask: ['outs'],
      },
      answer: { outs: 4 },
      feedback: {
        correct: 'Only a **6** fills the gap (9-8-7-6-5), and there are four of them — **4 outs**.',
        incorrect: 'A gutshot is missing one middle rank. Only that one rank completes it — count how many of it remain.',
        hints: [
          'You have 9-8-7 and a 5 — what single rank is missing in the middle?',
          'Only a 6 makes 9-8-7-6-5.',
          'There are four 6s in the deck.',
        ],
        why: 'A **gutshot** (inside) straight draw needs one specific middle rank, so it has just **4 outs** — half of the open-ended draw\'s 8. Same two cards in your hand; one different board card turns 8 outs into 4.',
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
      id: 'p4',
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
      id: 'p5',
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
        why: 'Only the river is left, so Rule of 2: $9 \\times 2 = 18\\%$. The exact one-card chance is $\\frac{9}{46} \\approx 19.6\\%$. Same draw, much less equity once a street has passed — because you have one shot instead of two.',
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt: 'Back to the open-ended straight draw (8 outs) on the flop, two cards to come. Estimate your equity by the river.',
      interaction: 'outs-odds',
      config: {
        hole: ['9C', '8D'],
        board: ['7H', '6S', '2C'],
        drawLabel: 'an open-ended straight',
        street: 'flop',
        ask: ['equity'],
      },
      answer: { equityPercent: 32, equityTolerance: 3 },
      feedback: {
        correct: 'Rule of 4: $8 \\times 4 = 32\\%$ (exact $\\approx 31.5\\%$). Eight outs is a strong flop draw.',
        incorrect: 'On the **flop** use the Rule of **4**: $8 \\times 4 = 32\\%$ (exact $\\approx 31.5\\%$).',
        hints: [
          'Two cards to come on the flop means multiply by **4**.',
          '$8 \\times 4 = 32$.',
          'No big-draw correction is needed below 9 outs.',
        ],
        why: 'An open-ended draw is **8 outs**; on the flop the Rule of 4 gives $8 \\times 4 = 32\\%$ (exact $\\approx 31.5\\%$). The $-(\\text{outs}-8)$ correction only kicks in above 8 outs, so 8 needs none.',
      },
    },
  ],
}
