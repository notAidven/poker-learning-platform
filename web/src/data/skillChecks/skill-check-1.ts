import { cardsBySuit, cardsByRank } from '../../types/lesson'
import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 1 (Lesson 1 · Poker & the Deck). TRANSFER questions: none reuse a
 * Lesson 1 hand. The deck questions switch suit and rank (diamonds, Queens), the
 * board is freshly dealt, and the two build-hand spots use new pools, one where both
 * hole cards belong to the flush and one where neither does (playing the board). All
 * five are interactive and rank-agnostic (hand rankings start in Lesson 2), so the
 * build steps are framed by a suit pattern, not "best hand". Keep `lessonId: '1'` /
 * export `skillCheck1`.
 */
export const skillCheck1: SkillCheckDefinition = {
  lessonId: '1',
  title: 'Poker & the Deck Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'Tap every **diamond** in the deck, then enter how many there are.',
      interaction: 'card-deck',
      config: {
        helperText: 'Diamonds are one of the four suits.',
        selectionLabel: 'Your selection (the diamonds)',
        countLabel: 'How many diamonds are there?',
      },
      answer: { cards: cardsBySuit('D'), count: 13 },
      incorrectFeedback: 'Each suit has 13 cards (2 through Ace), so there are 13 diamonds.',
    },
    {
      id: 'q2',
      prompt: 'Now tap **all the Queens**, then enter how many there are.',
      interaction: 'card-deck',
      config: {
        helperText: 'The same rank appears once in each suit.',
        selectionLabel: 'Your selection (the Queens)',
        countLabel: 'How many Queens are there?',
      },
      answer: { cards: cardsByRank('Q'), count: 4 },
      incorrectFeedback: 'There is one Queen in each of the 4 suits, so there are 4 Queens.',
    },
    {
      id: 'q3',
      prompt:
        'Deal a full hand: reveal your 2 hole cards, then the flop, turn, and river so all 7 cards are showing.',
      interaction: 'board-dealer',
      config: {
        hole: ['10S', '8H'],
        board: ['QC', '4D', '6S', 'AH', '3C'],
        streets: ['preflop', 'flop', 'turn', 'river'],
        annotateStreets: true,
        helperText: 'Tap to deal each stage.',
      },
      answer: { minStreetsRevealed: 4 },
      incorrectFeedback: 'Deal every street (flop, turn, and river) so all 7 cards are out.',
    },
    {
      id: 'q4',
      prompt:
        'Your hole cards are the 9 and Queen of spades. From these 7 cards, build a five-card hand by tapping five cards that all share one suit.',
      interaction: 'hand-ranker',
      config: {
        mode: 'build-hand',
        targetCategory: 'flush',
        pool: ['9S', 'QS', 'KS', '3S', '5S', 'AD', '7C'],
        helperText: 'Find the one suit you can collect five of, then tap exactly those five.',
      },
      answer: { cards: ['9S', 'QS', 'KS', '3S', '5S'], category: 'flush' },
      incorrectFeedback:
        'All five cards must share a suit. Here both your spades join three more spades, so tap those five (that pattern is a flush).',
    },
    {
      id: 'q5',
      prompt:
        'New hand. Your hole cards are the 7 of clubs and 2 of diamonds. Again, tap five cards that all share one suit.',
      interaction: 'hand-ranker',
      config: {
        mode: 'build-hand',
        targetCategory: 'flush',
        pool: ['7C', '2D', 'AH', 'KH', '9H', '5H', '3H'],
        helperText: 'Find the suit with five cards, then notice whether your hole cards belong to it.',
      },
      answer: { cards: ['AH', 'KH', '9H', '5H', '3H'], category: 'flush' },
      incorrectFeedback:
        'The five matching cards are all hearts on the board, and neither hole card is a heart, so you play the board with those five.',
    },
  ],
}
