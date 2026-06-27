import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check "Preflop Ranges & Position" (lessonId 'adv-ranges'). TRANSFER questions,
 * none reuse a lesson hand: (q1) a hand that is too weak to open early, (q2) build the
 * big-pairs core, and (q3) a hand that opens on the button. Reuses the `range-grid`
 * widget. Keep `lessonId: 'adv-ranges'` / export `skillCheckAdvRanges`.
 */
const UTG_OPEN = [
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs',
  'AKo', 'AQo',
]

const BTN_OPEN = [
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
  'QJs', 'QTs', 'Q9s', 'Q8s',
  'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s', '54s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
]

const BIG_PAIRS = ['AA', 'KK', 'QQ']

export const skillCheckAdvRanges: SkillCheckDefinition = {
  lessonId: 'adv-ranges',
  title: 'Preflop Ranges & Position Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'You are under the gun (first to act). Is Q-J offsuit in a sensible early-position opening range?',
      interaction: 'range-grid',
      config: {
        mode: 'is-hand-in-range',
        rangeName: 'an early-position open',
        range: UTG_OPEN,
        hand: 'QJo',
        helperText: 'Early position should be tight.',
      },
      answer: { inRange: false },
      incorrectFeedback:
        'Q-J offsuit is too weak to open from under the gun. The suited version is closer, but offsuit Q-J is a fold from early position.',
    },
    {
      id: 'q2',
      prompt: 'Build the core of every opening range by tapping the three biggest pairs: AA, KK, QQ.',
      interaction: 'range-grid',
      config: {
        mode: 'build-range',
        rangeName: 'the big pairs',
        range: BIG_PAIRS,
        helperText: 'The biggest pocket pairs sit at the top-left of the diagonal.',
      },
      answer: { hands: BIG_PAIRS },
      incorrectFeedback: 'Tap exactly AA, KK, and QQ, the three cells at the top-left of the diagonal.',
    },
    {
      id: 'q3',
      prompt: 'It folds to you on the button. Is A-2 suited in a button opening range?',
      interaction: 'range-grid',
      config: {
        mode: 'is-hand-in-range',
        rangeName: 'a button open',
        range: BTN_OPEN,
        hand: 'A2s',
        helperText: 'The button opens a wide range, including the suited Aces.',
      },
      answer: { inRange: true },
      incorrectFeedback:
        'On the button you open wide, and a suited Ace like A-2 suited makes the nut flush. It is in a button range.',
    },
  ],
}
