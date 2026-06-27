import { cardsByRank } from '../../types/lesson'
import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check "Combinatorics & Blockers" (lessonId 'adv-combos'). TRANSFER questions:
 * (q1) compare pair vs offsuit combos, (q2) count a rank, and (q3) which pair a King
 * blocks. Reuses `compare-events` + `card-deck`. Keep `lessonId: 'adv-combos'` /
 * export `skillCheckAdvCombos`.
 */
export const skillCheckAdvCombos: SkillCheckDefinition = {
  lessonId: 'adv-combos',
  title: 'Combinatorics & Blockers Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'Which specific starting hand can be dealt MORE ways?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Which has more combos?',
        helperText: 'Count the combinations of each exact hand.',
        eventA: {
          label: 'Pocket Queens (QQ)',
          detail: '6 combos: choose 2 of the 4 Queens.',
        },
        eventB: {
          label: 'Q-J offsuit (QJo)',
          detail: '12 combos: 4 x 4 minus the 4 suited.',
        },
      },
      answer: { more: 'b' },
      incorrectFeedback:
        'A specific offsuit hand is 12 combos, double the 6 of a pocket pair. Q-J offsuit can be dealt more ways than pocket Queens.',
    },
    {
      id: 'q2',
      prompt: 'Tap all four Kings in the deck, then enter how many there are.',
      interaction: 'card-deck',
      config: {
        helperText: 'Each rank has one card per suit.',
        selectionLabel: 'Your selection (the Kings)',
        countLabel: 'How many Kings are in the deck?',
      },
      answer: { cards: cardsByRank('K'), count: 4 },
      incorrectFeedback: 'There is one King in each suit, so there are 4 Kings in the deck.',
    },
    {
      id: 'q3',
      prompt: 'You hold the King of spades. Which premium pair do you block for your opponent?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Which hand does your King block?',
        helperText: 'A blocker only removes hands that use the card you hold.',
        eventA: {
          label: 'Pocket Kings (KK)',
          detail: 'You hold a King, so KK drops from 6 combos to 3.',
        },
        eventB: {
          label: 'Pocket Aces (AA)',
          detail: 'You hold no Ace, so AA still has all 6 combos.',
        },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'A blocker only affects hands containing your card. Your King cuts KK from 6 combos to 3; it does nothing to AA.',
    },
  ],
}
