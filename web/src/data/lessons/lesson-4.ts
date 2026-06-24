import type { LessonDefinition } from '../../types/lesson'

/**
 * SKELETON STUB — Lesson 4 "Outs, Odds & Pot Odds" (design doc §6, Lesson 4).
 * The Lesson 4 agent fleshes out counting outs, the Rule of 2 & 4, pot odds, and the
 * call/fold decision using `outs-odds` (and a `card-deck` draw-tally tie-in),
 * cross-checking with `countOuts`. Keep `id: '4'` / export `lesson4`.
 */
export const lesson4: LessonDefinition = {
  id: '4',
  title: 'Outs, Odds & Pot Odds',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Outs',
      content: `An **out** is an unseen card that improves your hand to a likely winner. A **flush draw** — four cards of one suit — has **9 outs**, because a suit holds 13 cards and you can already see 4 of them.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'You hold two hearts and two more are on the flop. How many cards complete your flush?',
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
        correct: 'A suit has 13 cards; you see 4, so **9** remain to complete the flush.',
        incorrect: '13 cards in a suit − 4 you can see = 9 outs.',
        hints: ['Count the hearts you can already see.', '13 − 4 = 9.'],
      },
    },
  ],
}
