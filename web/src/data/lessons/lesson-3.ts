import type { LessonDefinition } from '../../types/lesson'

/**
 * SKELETON STUB — Lesson 3 "Flow of a Hand" (design doc §6, Lesson 3).
 * The Lesson 3 agent fleshes out blinds, the four streets, position/action order,
 * and showdown using `board-dealer` and `compare-events`. Keep `id: '3'` / export
 * `lesson3`.
 */
export const lesson3: LessonDefinition = {
  id: '3',
  title: 'Flow of a Hand',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'The four streets',
      content: `A hand plays out over four betting rounds: **preflop** (after hole cards), the **flop** (3 community cards), the **turn** (4th card), and the **river** (5th card). If two or more players remain, the best 5-card hand wins at **showdown**.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'Deal the hand street by street, then tell us your best hand on the flop and river.',
      interaction: 'board-dealer',
      config: {
        hole: ['AH', 'KD'],
        board: ['AS', '7C', '2D', 'KH', '5S'],
        streets: ['preflop', 'flop', 'turn', 'river'],
        askBestHandAt: ['flop', 'river'],
        annotateStreets: true,
      },
      answer: {
        minStreetsRevealed: 4,
        bestHandByStreet: { flop: 'pair', river: 'two-pair' },
      },
      feedback: {
        correct: 'On the flop you held a pair of Aces; by the river you made two pair (Aces and Kings).',
        incorrect: 'Re-check each street: your best hand can improve as new cards arrive.',
        hints: ['Evaluate the best 5 cards available at each street.'],
      },
    },
  ],
}
