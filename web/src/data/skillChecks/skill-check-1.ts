import { cardsBySuit } from '../../types/lesson'
import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 1 (design doc §6, Lesson 1): (q1) tap a full suit and count it;
 * (q2) deal a full hand so all 7 cards show; (q3) pick the best 5 of 7. All three
 * are interactive. Keep `lessonId: '1'` / export `skillCheck1`.
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
      incorrectFeedback: 'Deal every street — flop, turn, and river — so all 7 cards are out.',
    },
    {
      id: 'q3',
      prompt: 'From these 7 cards, tap the best 5-card hand you can make.',
      interaction: 'hand-ranker',
      config: {
        mode: 'pick-best-five',
        cards: ['AD', 'KD', 'QD', '8D', '3D', '7C', '2S'],
        helperText: 'You may use any five of the seven cards.',
      },
      answer: { cards: ['AD', 'KD', 'QD', '8D', '3D'] },
      incorrectFeedback: 'Five diamonds make a flush — the best five of these seven.',
    },
  ],
}
