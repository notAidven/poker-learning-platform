import type { LessonDefinition } from '../../types/lesson'
import { cardsBySuit } from '../../types/lesson'

/**
 * SKELETON STUB — Lesson 1 "Poker & the Deck" (design doc §6, Lesson 1).
 * Minimal valid content so the registry resolves and the app builds/renders.
 * The Lesson 1 agent replaces `steps` with the full sequence (the deck, goal of
 * poker, hole vs community, best 5 of 7) using `card-deck`, `board-dealer`, and
 * `hand-ranker` (pick-best-five). Keep `id: '1'` and the export name `lesson1`.
 */
export const lesson1: LessonDefinition = {
  id: '1',
  title: 'Poker & the Deck',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'The 52-card deck',
      content: `A standard deck is **52 cards**: 13 ranks (2–10, J, Q, K, A) in each of 4 suits (♠ ♥ ♦ ♣).

In **Texas Hold'em** you get 2 private **hole cards** and share 5 **community cards** — your hand is the best **5-card** combination out of those 7.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'Warm-up: tap all **13 hearts**, then enter how many there are.',
      interaction: 'card-deck',
      config: {
        helperText: 'Tap every heart — one full suit of the 52-card deck.',
        selectionLabel: 'Your selection (the hearts)',
        countLabel: 'How many hearts are in the deck?',
      },
      answer: { cards: cardsBySuit('H'), count: 13 },
      feedback: {
        correct: 'One suit holds 13 cards, so there are **13 hearts**.',
        incorrect: 'Each suit has 13 cards (2–10, J, Q, K, A), so there are 13 hearts.',
        hints: ['A suit runs from 2 up to Ace.', 'That is 13 cards in every suit.'],
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt:
        'Deal a full hand: reveal your 2 hole cards, then the flop, turn, and river — watch 2 + 5 cards appear.',
      interaction: 'board-dealer',
      config: {
        hole: ['AS', 'KS'],
        board: ['QS', 'JS', '9D', '4H', '2C'],
        streets: ['preflop', 'flop', 'turn', 'river'],
        annotateStreets: true,
        helperText: 'Step through each street to see all 7 cards.',
      },
      answer: { minStreetsRevealed: 4 },
      feedback: {
        correct: 'You saw all 7 cards: 2 hole + 5 community. Your hand is the best 5 of those 7.',
        incorrect: 'Reveal every street so all 7 cards are showing.',
        hints: ['Deal the flop, then the turn, then the river.'],
      },
    },
  ],
}
