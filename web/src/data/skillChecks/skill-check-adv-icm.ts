import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check "Tournaments & ICM" (lessonId 'adv-icm'). TRANSFER questions: (q1) ICM
 * tightens bubble calls, (q2) a wide short-stack jam off the bubble, and (q3) a hand
 * that is NOT a tight bubble shove. Reuses `compare-events` + `range-grid`. Keep
 * `lessonId: 'adv-icm'` / export `skillCheckAdvIcm`.
 */
const SHOVE_WIDE = [
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  'KQo', 'KJo', 'KTo', 'K9o', 'K8o',
  'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'QJo', 'QTo',
  'JTs', 'J9s', 'J8s', 'JTo', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s', '54s',
]

const BUBBLE_TIGHT = ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']

export const skillCheckAdvIcm: SkillCheckDefinition = {
  lessonId: 'adv-icm',
  title: 'Tournaments & ICM Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'It is the money bubble. Compared with a deep-stacked cash game, how should you treat your chips?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Which is true on the bubble?',
        helperText: 'Remember how tournament payouts work near a pay jump.',
        eventA: {
          label: 'Guard them, busting is costly',
          detail: 'ICM makes survival valuable, so you avoid marginal all-ins.',
        },
        eventB: {
          label: 'Treat them like cash',
          detail: 'That ignores the pay jump and the cost of busting.',
        },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'On the bubble, ICM makes busting especially costly, so you protect your stack and avoid marginal all-ins. Chips are not cash.',
    },
    {
      id: 'q2',
      prompt:
        'No pay jump near. You have about 10 big blinds and it folds to you on the button. Is K-8 suited a profitable shove?',
      interaction: 'range-grid',
      config: {
        mode: 'is-hand-in-range',
        rangeName: 'a 10bb button jam',
        range: SHOVE_WIDE,
        hand: 'K8s',
        helperText: 'Short-stacked in late position with no ICM pressure, you can jam wide.',
      },
      answer: { inRange: true },
      incorrectFeedback:
        'At 10bb on the button with no bubble pressure, you jam a wide range. K-8 suited is comfortably in it.',
    },
    {
      id: 'q3',
      prompt: 'It is a tense money bubble (premiums only). Is A-9 offsuit part of a tight bubble shoving range?',
      interaction: 'range-grid',
      config: {
        mode: 'is-hand-in-range',
        rangeName: 'a tight bubble jam',
        range: BUBBLE_TIGHT,
        hand: 'A9o',
        helperText: 'High ICM pressure trims the shoving range to premium hands.',
      },
      answer: { inRange: false },
      incorrectFeedback:
        'A-9 offsuit is not premium. Under heavy ICM pressure on the bubble, it is a fold, not a shove.',
    },
  ],
}
