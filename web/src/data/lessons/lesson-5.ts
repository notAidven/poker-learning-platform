import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson 5: "Outs & Equity" (Section 3 · The Math).
 *
 * Count outs (flush draw = 9, open-ended = 8, gutshot = 4, and combined draws) then
 * convert to a rough win chance with the Rule of 2 & 4. Outs are validated by the
 * evaluator (`countOuts`) inside the `outs-odds` widget, never hard-coded. The draws
 * are deliberately varied (different suits, ranks, and a big combo draw) so learners
 * do not just memorize one board. One flush draw (A-Q of diamonds) IS carried from
 * flop to turn so they feel equity shrink street to street. Pot odds and the call/fold
 * decision live in the next lesson (Lesson 6).
 *
 * Ratio: 7 problems / 9 steps ≈ 78% interactive. Concepts never run back-to-back.
 * This is the Math section, so KaTeX is used for the formulas. Keep `id: '5'` /
 * export `lesson5`.
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

Say you hold two clubs and two more land on the board: a **flush draw**. A suit has 13 cards and you can already see 4, so the rest are still out there:

$$\\text{flush outs} = 13 - 4 = 9$$

Any one of those **9 outs** completes the flush. Counting outs turns a draw into a probability.`,
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p1',
      prompt: 'You hold the K and Q of clubs, and two more clubs land on the flop, a **flush draw**. How many cards complete your flush?',
      interaction: 'outs-odds',
      config: {
        hole: ['KC', 'QC'],
        board: ['9C', '5C', '2D'],
        drawLabel: 'a flush',
        street: 'flop',
        ask: ['outs'],
      },
      answer: { outs: 9 },
      feedback: {
        correct: 'A suit holds 13 cards and you can see 4 clubs, so **9** clubs remain. Nine outs.',
        incorrect: 'Count the clubs you can already see (4), then subtract from 13.',
        hints: [
          'A flush needs five cards of one suit.',
          'You can see four clubs: two in your hand, two on the board.',
          'A suit holds 13 cards; subtract the ones you can already see.',
        ],
        why: 'A flush draw is always **9 outs**: a suit has 13 cards; with 2 in your hand and 2 on the board you have seen 4, leaving $13 - 4 = 9$ unseen cards that complete the flush.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p2',
      prompt: 'You hold J-10 and the flop is 9-8-3, giving you J-10-9-8, an **open-ended straight draw**. How many cards complete the straight?',
      interaction: 'outs-odds',
      config: {
        hole: ['JD', '10C'],
        board: ['9H', '8S', '3C'],
        drawLabel: 'an open-ended straight',
        street: 'flop',
        ask: ['outs'],
      },
      answer: { outs: 8 },
      feedback: {
        correct:
          'Either end fills it: any **Queen** (four of them) makes Q-J-10-9-8, any **7** (four) makes J-10-9-8-7. That is $4 + 4 = 8$ outs.',
        incorrect: 'An open-ended draw fills at **both** ends, so count four Queens plus four 7s.',
        hints: [
          'You already have four in a row: J-10-9-8.',
          'A card at either end completes the straight.',
          'Count the cards that complete each end, then add the two ends together.',
        ],
        why: 'An **open-ended straight draw** (four in a row, open at both ends) has **8 outs**: four cards complete each end.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p3',
      prompt: 'You hold Q-J and the flop is 10-8-3: you have Q-J-10 and 8, an inside (**gutshot**) straight draw missing the 9. How many cards complete the straight?',
      interaction: 'outs-odds',
      config: {
        hole: ['QH', 'JS'],
        board: ['10D', '8C', '3H'],
        drawLabel: 'an inside (gutshot) straight',
        street: 'flop',
        ask: ['outs'],
      },
      answer: { outs: 4 },
      feedback: {
        correct: 'Only a **9** fills the gap (Q-J-10-9-8), and there are four of them: **4 outs**.',
        incorrect: 'A gutshot is missing one middle rank. Only that one rank completes it, so count how many remain.',
        hints: [
          'You have Q-J-10 and an 8. What single rank is missing in the middle?',
          'Only the one missing middle rank completes the straight.',
          'Count how many cards of that one rank remain.',
        ],
        why: 'A **gutshot** (inside) straight draw needs one specific middle rank, so it has just **4 outs**, half of the open-ended draw\'s 8. Same two cards in your hand; one different board card turns 8 outs into 4.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p4',
      prompt: 'Draws can combine. You hold J-10 of hearts on a 9-8-2 board with two hearts: that is BOTH a flush draw and an open-ended straight draw at once. How many cards improve you to a flush or a straight?',
      interaction: 'outs-odds',
      config: {
        hole: ['JH', '10H'],
        board: ['9H', '8C', '2H'],
        drawLabel: 'a flush plus an open-ended straight',
        street: 'flop',
        ask: ['outs'],
      },
      answer: { outs: 15 },
      feedback: {
        correct:
          'Nine hearts complete the flush, and a Queen or 7 completes the straight. Six of those (the Queens and 7s that are not hearts) are new, so $9 + 6 = 15$ outs, a huge draw.',
        incorrect:
          'Count the flush outs (9 hearts) and the straight outs (Queens and 7s), but do not double-count the Queen and 7 of hearts, which you already counted as flush outs.',
        hints: [
          'First count the flush outs: hearts you cannot see.',
          'Then the straight outs: a Queen or a 7 on either end.',
          'The Queen and 7 of hearts belong to both, so count them once.',
        ],
        why: 'A combined flush plus open-ended draw is about **15 outs**: 9 hearts for the flush, plus the 6 non-heart Queens and 7s for the straight. With this many outs you are often a favorite even with no made hand yet.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'The Rule of 2 & 4',
      content: `To turn outs into a rough win chance, use the **Rule of 2 & 4**:

$$\\text{flop: outs} \\times 4 \\qquad\\qquad \\text{turn: outs} \\times 2$$

On the **flop**, two cards are still coming, so multiply by **4**. On the **turn**, only the river is left, so multiply by **2**.

Two caveats: the $\\times 4$ figure assumes you will see **both** cards (your all-in chance), and it **overestimates** with many outs. For 9 or more outs, correct it with $(\\text{outs} \\times 4) - (\\text{outs} - 8)$.`,
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p5',
      prompt: 'You hold the A and Q of diamonds with two more diamonds on the flop: a 9-out flush draw, two cards still to come. Estimate your chance to complete the flush by the river.',
      interaction: 'outs-odds',
      config: {
        hole: ['AD', 'QD'],
        board: ['10D', '6D', '3C'],
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
          'On the **flop**, two cards are coming, so use the Rule of **4**: $9 \\times 4 \\approx 36\\%$ (about 35% after the big-draw correction).',
        hints: [
          'Two cards to come on the flop means multiply by **4**.',
          'With 9 or more outs, the Rule of 4 runs a little high.',
          'For 9+ outs, subtract $(\\text{outs} - 8)$ from the Rule-of-4 estimate.',
        ],
        why: 'On the flop two cards are coming, so Rule of 4: $9 \\times 4 = 36\\%$. That slightly overestimates, so the big-draw correction gives $36 - 1 = 35\\%$, matching the exact $1 - \\frac{38}{47}\\cdot\\frac{37}{46} \\approx 35\\%$.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p6',
      prompt: 'A **blank** hits the turn (the 8 of spades, which helps no one). You still hold the same 9-out diamond flush draw, but now only the river is left. Estimate your equity now.',
      interaction: 'outs-odds',
      config: {
        hole: ['AD', 'QD'],
        board: ['10D', '6D', '3C', '8S'],
        drawLabel: 'a flush',
        street: 'turn',
        ask: ['equity'],
        allowFractionAnswer: true,
      },
      answer: { equityPercent: 18, equityTolerance: 3 },
      feedback: {
        correct:
          'Rule of 2: $9 \\times 2 = 18\\%$ (exactly $\\frac{9}{46} \\approx 19.6\\%$). One card to come, so the same draw is worth far less than on the flop.',
        incorrect:
          'On the **turn**, only the river is left, so use the Rule of **2**: $9 \\times 2 = 18\\%$ (exact $\\frac{9}{46} \\approx 19.6\\%$).',
        hints: [
          'One card to come on the turn means multiply by **2**.',
          'Apply that Rule of 2 to your nine outs.',
          'For the exact figure, divide your outs by the unseen cards left after the turn.',
        ],
        why: 'Only the river is left, so Rule of 2: $9 \\times 2 = 18\\%$. The exact one-card chance is $\\frac{9}{46} \\approx 19.6\\%$. Same draw, much less equity once a street has passed, because you have one shot instead of two.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p7',
      prompt: 'A different draw: 10-9 on an 8-7-2 flop is an **open-ended straight draw** (8 outs), two cards to come. Estimate your equity by the river.',
      interaction: 'outs-odds',
      config: {
        hole: ['10D', '9C'],
        board: ['8H', '7S', '2C'],
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
          'Apply the Rule of 4 to your eight outs.',
          'No big-draw correction is needed below 9 outs.',
        ],
        why: 'An open-ended draw is **8 outs**; on the flop the Rule of 4 gives $8 \\times 4 = 32\\%$ (exact $\\approx 31.5\\%$). The $-(\\text{outs}-8)$ correction only kicks in above 8 outs, so 8 needs none.',
      },
    },
  ],
}
