import { cardsBySuit } from '../../types/lesson'
import type { SectionGateDefinition } from './types'

/**
 * Foundations Section Gate — covers Lesson 1 (Poker & the Deck) and Lesson 2 (Hand
 * Rankings), ~2 fresh questions each (4 total). Every hand is BRAND-NEW: none reuse a
 * lesson or skill-check spot. No hints (gate rules); pass at ~70% (3 of 4).
 *
 *  L1: (q1) count a whole suit — clubs (the skill check used diamonds/Queens), and
 *      (q2) a fresh single-draw probability comparison (spade vs. face card).
 *  L2: (q3) identify a flush from five cards (the skill check identified a full house
 *      and a straight), and (q4) order four NEW categories strongest→weakest.
 * The hand-ranker questions are graded by the evaluator; compare-events grades the
 * chosen side. Keep `sectionId: 'foundations'`.
 */
export const gateFoundations: SectionGateDefinition = {
  sectionId: 'foundations',
  title: 'Foundations Gate',
  questions: [
    {
      id: 'f-q1',
      lessonId: '1',
      prompt: 'Tap every **club** in the deck, then enter how many there are.',
      interaction: 'card-deck',
      config: {
        helperText: 'Clubs are one of the four suits.',
        selectionLabel: 'Your selection (the clubs)',
        countLabel: 'How many clubs are there?',
      },
      answer: { cards: cardsBySuit('C'), count: 13 },
      incorrectFeedback: 'Every suit has 13 cards (2 through Ace), so there are 13 clubs.',
    },
    {
      id: 'f-q2',
      lessonId: '1',
      prompt:
        'You draw one card from a full 52-card deck. Which outcome is more likely?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Which is more likely?',
        helperText: 'Count how many cards fit each event out of all 52.',
        eventA: { label: 'A spade', detail: '13 spades in the deck', favorable: 13, total: 52 },
        eventB: {
          label: 'A face card',
          detail: 'Jacks, Queens, Kings — 12 of them',
          favorable: 12,
          total: 52,
        },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'There are 13 spades but only 12 face cards (4 Jacks, 4 Queens, 4 Kings), so a spade is a little more likely.',
    },
    {
      id: 'f-q3',
      lessonId: '2',
      prompt: 'These five cards are all spades. Which hand do they make?',
      interaction: 'hand-ranker',
      config: {
        mode: 'identify-category',
        cards: ['AS', 'JS', '8S', '5S', '2S'],
        categories: ['flush', 'straight', 'trips', 'two-pair', 'high-card'],
      },
      answer: { category: 'flush' },
      incorrectFeedback:
        'All five cards are spades, and five cards of one suit make a flush (the ranks need not be in a row).',
    },
    {
      id: 'f-q4',
      lessonId: '2',
      prompt: 'Rank these four hand types from strongest (top) to weakest (bottom).',
      interaction: 'hand-ranker',
      config: {
        mode: 'order-categories',
        categories: ['two-pair', 'quads', 'high-card', 'full-house'],
        helperText: 'Drag the rows so the strongest hand type is on top.',
      },
      answer: { categoryOrder: ['quads', 'full-house', 'two-pair', 'high-card'] },
      incorrectFeedback:
        'Four of a kind beats a full house, a full house beats two pair, and two pair beats high card.',
    },
  ],
}
