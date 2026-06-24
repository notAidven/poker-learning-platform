import type { LessonDefinition } from '../../types/lesson'

/**
 * SKELETON STUB — Lesson 5 "Betting" (design doc §6, Lesson 5).
 * The Lesson 5 agent fleshes out the five actions, bet sizing, and EV of a call using
 * `betting-round` against the Tier 1→2 opponent (`lib/poker/opponentAI.ts`).
 * Keep `id: '5'` / export `lesson5`.
 */
export const lesson5: LessonDefinition = {
  id: '5',
  title: 'Betting',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'The five actions',
      content: `On your turn you can **check** (pass when there is no bet), **bet** (put chips in first), **call** (match a bet), **raise** (increase it), or **fold** (give up the hand). Sizing a bet as a fraction of the pot is the key skill.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'You flop top set (three Aces) and no one has bet. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AS', 'AD'],
        board: ['AH', '7C', '2D'],
        street: 'flop',
        pot: 100,
        heroStack: 500,
        villainStack: 500,
        sizingOptions: [0.5, 0.75, 1],
        aiTier: 1,
        task: 'choose-action',
      },
      answer: { action: 'bet' },
      feedback: {
        correct: 'With a monster you want to build the pot — **bet** for value.',
        incorrect: 'A very strong hand should bet to grow the pot, not check it.',
        hints: ['Three of a kind is a huge favorite here.'],
      },
    },
  ],
}
