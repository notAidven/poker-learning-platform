import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check 3 (design doc §6, Lesson 3): experience the streets, name the best
 * hand at a street, and identify who acts last post-flop. Three interactive
 * questions, 2/3 to pass, free retries, no hints. Keep `lessonId: '3'` /
 * export `skillCheck3`.
 */
export const skillCheck3: SkillCheckDefinition = {
  lessonId: '3',
  title: 'Flow of a Hand Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'You hold A♠ J♣. Deal the hand to showdown against one opponent, then call who won the pot.',
      interaction: 'board-dealer',
      config: {
        hole: ['AS', 'JC'],
        villain: ['7H', '7D'],
        board: ['7S', '2C', '9D', 'JH', '4S'],
        opponents: 1,
        streets: ['preflop', 'flop', 'turn', 'river'],
        annotateStreets: true,
        helperText: "Deal each street; at the river your opponent's cards flip up — then call the winner.",
      },
      answer: { minStreetsRevealed: 4, winner: 'opponent' },
      incorrectFeedback:
        "Your pair of Jacks loses to your opponent's three of a kind — the 7♥ 7♦ pair the 7♠ on the board for a set of sevens, which beats one pair.",
    },
    {
      id: 'q2',
      prompt: 'You hold A♠ A♦. Deal to the river, then name your best hand.',
      interaction: 'board-dealer',
      config: {
        hole: ['AS', 'AD'],
        board: ['KH', 'KD', '7C', '2S', '9H'],
        streets: ['preflop', 'flop', 'turn', 'river'],
        askBestHandAt: ['river'],
        annotateStreets: true,
      },
      answer: { minStreetsRevealed: 4, bestHandByStreet: { river: 'two-pair' } },
      incorrectFeedback:
        'Your pair of Aces plus the pair of Kings on the board makes two pair (Aces and Kings).',
    },
    {
      id: 'q3',
      prompt: 'Post-flop, which player acts last on every street?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Who acts last after the flop?',
        eventA: { label: 'The button', detail: 'The dealer position' },
        eventB: { label: 'The small blind', detail: 'First to act after the flop' },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'The button acts last on every post-flop street — that positional edge is why it’s the best seat.',
    },
  ],
}
