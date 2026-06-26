import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 3 (Lesson 3 · Flow of a Hand). TRANSFER questions: none reuse a Lesson 3
 * hand. (q1) play a new showdown and call the winner (graded live by the evaluator),
 * (q2) name the best hand as it climbs across the streets, (q3) who acts first pre-flop,
 * and (q4) whether a hand with one player left goes to showdown. Keep `lessonId: '3'` /
 * export `skillCheck3`.
 */
export const skillCheck3: SkillCheckDefinition = {
  lessonId: '3',
  title: 'Flow of a Hand Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'You hold A♠ K♦. Deal the hand to showdown against one opponent, then call who won the pot.',
      interaction: 'board-dealer',
      config: {
        hole: ['AS', 'KD'],
        villain: ['5H', '5D'],
        board: ['AC', '9S', '5C', '4D', '2H'],
        opponents: 1,
        streets: ['preflop', 'flop', 'turn', 'river'],
        annotateStreets: true,
        helperText: "Deal each street. At the river your opponent's cards flip up, then call the winner.",
      },
      answer: { minStreetsRevealed: 4, winner: 'opponent' },
      incorrectFeedback:
        "Your pair of Aces loses to your opponent's three of a kind. The 5♥ 5♦ pair the 5♣ on the board for a set of fives, which beats one pair.",
    },
    {
      id: 'q2',
      prompt: 'You hold K♠ K♦. Deal each street and name your best hand as it changes.',
      interaction: 'board-dealer',
      config: {
        hole: ['KS', 'KD'],
        board: ['QC', '7H', '3D', 'QS', 'KC'],
        streets: ['preflop', 'flop', 'turn', 'river'],
        askBestHandAt: ['flop', 'turn', 'river'],
        annotateStreets: true,
        helperText: 'Deal the flop, turn, and river, naming your best hand at each.',
      },
      answer: {
        minStreetsRevealed: 4,
        bestHandByStreet: { flop: 'pair', turn: 'two-pair', river: 'full-house' },
      },
      incorrectFeedback:
        'Pair of Kings on the flop; the board pairs Queens on the turn for two pair; the river King gives three Kings and a full house.',
    },
    {
      id: 'q3',
      prompt: 'Pre-flop, which player must act first?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Pre-flop, who acts first?',
        helperText: 'The blinds are already in, so everyone else must answer the big blind.',
        eventA: { label: 'Under the gun', detail: 'The seat just left of the big blind' },
        eventB: { label: 'The big blind', detail: 'Posted the big forced bet' },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'Pre-flop, the big blind is a live bet and acts last, so action starts to its left, at under the gun.',
    },
    {
      id: 'q4',
      prompt: 'Everyone else folds, leaving just one player. Does the hand go to showdown?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Is there a showdown?',
        helperText: 'A showdown compares hands, but only if there are hands to compare.',
        eventA: { label: 'Yes, a showdown happens', detail: 'Cards are revealed and compared' },
        eventB: { label: 'No showdown', detail: 'The last player wins the pot, no cards shown' },
      },
      answer: { more: 'b' },
      incorrectFeedback:
        'A showdown needs two or more players after the river. With everyone else folded, the last player simply wins the pot, no cards shown.',
    },
  ],
}
