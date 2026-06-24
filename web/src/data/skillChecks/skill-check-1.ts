import { cardsBySuit } from '../../types/lesson'
import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 1 (design doc §6, Lesson 1): (q1) tap a full suit and count it;
 * (q2) deal a full hand so all 7 cards show; (q3) build a five-card hand by tapping
 * five cards that share a suit. All three are interactive and rank-agnostic. Hand
 * rankings ("which hand is best") are not taught until Lesson 2, so q3 is framed by a
 * suit *pattern* rather than judging the best hand. Keep `lessonId: '1'` / export
 * `skillCheck1`.
 */
export const skillCheck1: SkillCheckDefinition = {
  lessonId: '1',
  title: 'Poker & the Deck Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'Tap every **spade** in the deck, then enter how many there are.',
      interaction: 'card-deck',
      config: {
        helperText: 'Spades are one of the four suits.',
        selectionLabel: 'Your selection (the spades)',
        countLabel: 'How many spades are there?',
      },
      answer: { cards: cardsBySuit('S'), count: 13 },
      incorrectFeedback: 'Each suit has 13 cards (2 through Ace), so there are 13 spades.',
    },
    {
      id: 'q2',
      prompt:
        'Deal a full hand: reveal your 2 hole cards, then the flop, turn, and river so all 7 cards are showing.',
      interaction: 'board-dealer',
      config: {
        hole: ['JH', 'JC'],
        board: ['7D', '2S', '9H', 'KC', '4D'],
        streets: ['preflop', 'flop', 'turn', 'river'],
        annotateStreets: true,
        helperText: 'Tap to deal each stage.',
      },
      answer: { minStreetsRevealed: 4 },
      incorrectFeedback: 'Deal every street (flop, turn, and river) so all 7 cards are out.',
    },
    {
      id: 'q3',
      prompt: 'From these 7 cards, build a five-card hand by tapping five cards that all share one suit.',
      interaction: 'hand-ranker',
      config: {
        mode: 'build-hand',
        targetCategory: 'flush',
        pool: ['AS', 'KC', '7C', '2C', '9H', '10C', '4C'],
        helperText: 'Find the one suit you can collect five of, then tap exactly those five.',
      },
      answer: { cards: ['KC', '10C', '7C', '2C', '4C'], category: 'flush' },
      incorrectFeedback:
        'All five cards must share a suit. Only one suit reaches five cards here, so tap those five (that pattern is a flush).',
    },
  ],
}
