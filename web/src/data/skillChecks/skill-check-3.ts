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
      prompt: 'Deal the hand to showdown and confirm all five community cards appear.',
      interaction: 'board-dealer',
      config: {
        hole: ['JC', 'JD'],
        board: ['JS', '4C', '4D', '9H', '2S'],
        streets: ['preflop', 'flop', 'turn', 'river'],
        annotateStreets: true,
      },
      answer: { minStreetsRevealed: 4 },
      incorrectFeedback:
        'Reveal every street: the flop (3 cards), the turn (1), and the river (1) make 5 community cards.',
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
