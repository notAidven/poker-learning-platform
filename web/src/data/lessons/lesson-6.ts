import type { LessonDefinition } from '../../types/lesson'

/**
 * SKELETON STUB — Lesson 6 "Play a Full Hand" capstone (design doc §6, Lesson 6).
 * The Lesson 6 agent fleshes out starting-hand intuition and the multiway `full-hand`
 * capstone vs. Tier 3 opponents (`lib/poker/opponentAI.ts`), ending with the
 * responsible-play note. Keep `id: '6'` / export `lesson6`.
 */
export const lesson6: LessonDefinition = {
  id: '6',
  title: 'Play a Full Hand',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Putting it together',
      content: `Time to play a complete hand: post the blinds, get your hole cards, then bet on every street — preflop, flop, turn, river — until showdown, where the best 5-card hand wins the pot.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'Play a full hand against the table. Make a reasonable decision at each checkpoint.',
      interaction: 'full-hand',
      config: {
        opponents: 2,
        aiTier: 3,
        heroHole: ['AS', 'KS'],
        seed: 42,
        blinds: { sb: 1, bb: 2 },
        startingStack: 200,
        checkpoints: [
          {
            street: 'preflop',
            prompt: 'A♠K♠ under the gun — raise or fold?',
            acceptableActions: ['raise', 'bet'],
            why: 'A♠K♠ is a premium suited-broadway hand worth raising.',
          },
        ],
        passThreshold: 1,
        showResponsiblePlayNote: true,
      },
      answer: { passThreshold: 1 },
      feedback: {
        correct: 'Nicely played — you took the hand to showdown and made sound decisions.',
        incorrect: 'Review the checkpoints and try the hand again.',
        hints: ['Strong starting hands want to build the pot.'],
      },
    },
  ],
}
