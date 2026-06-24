import { cardsBySuit } from '../../types/lesson'
import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * SKELETON STUB — Skill Check 1 (design doc §6, Lesson 1). One valid question so the
 * registry resolves; the Lesson 1 agent expands to the full 3-question check
 * (tap all spades; reveal a full board; pick the best 5 of 7). Keep `lessonId: '1'`
 * and export name `skillCheck1`.
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
      incorrectFeedback: 'Each suit has 13 cards, so there are 13 spades.',
    },
  ],
}
