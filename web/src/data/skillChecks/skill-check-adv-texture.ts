import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check "Board Texture & C-Betting" (lessonId 'adv-texture'). TRANSFER questions,
 * fresh boards: (q1) tell dry from wet, (q2) c-bet a dry board with a strong hand, and
 * (q3) size up on a wet board. Reuses `compare-events` + `betting-round`. Keep
 * `lessonId: 'adv-texture'` / export `skillCheckAdvTexture`.
 */
export const skillCheckAdvTexture: SkillCheckDefinition = {
  lessonId: 'adv-texture',
  title: 'Board Texture & C-Betting Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'Which of these flops is DRIER, with fewer draws available?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Which board is drier?',
        helperText: 'A drier board has fewer straights and flushes possible.',
        eventA: {
          label: 'A-8-3 rainbow',
          detail: 'Three suits, spread-out ranks. Very few draws.',
          cards: ['AS', '8H', '3D'],
        },
        eventB: {
          label: 'J-T-9 with two diamonds',
          detail: 'Connected ranks and a flush draw. Many draws.',
          cards: ['JD', '10D', '9C'],
        },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'A-8-3 with three different suits is dry: no flush draw and almost no straights. J-T-9 two-tone is the wet one.',
    },
    {
      id: 'q2',
      prompt:
        'You raised before the flop and hold pocket Aces on a dry Q-6-2 rainbow flop. It is checked to you. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AS', 'AH'],
        board: ['QD', '6C', '2S'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        villainAction: 'call',
        seed: 451,
        task: 'choose-action',
        helperText: 'No bet faces you, so your choices are check or bet.',
      },
      answer: { action: 'bet' },
      incorrectFeedback:
        'An overpair on a dry board as the preflop raiser is a clear c-bet for value. Bet.',
    },
    {
      id: 'q3',
      prompt:
        'You hold top two pair on a wet 8-7-6 board with two hearts. The pot is 80 and it is checked to you. Which sizing fits this wet board?',
      interaction: 'betting-round',
      config: {
        hole: ['8S', '7D'],
        board: ['8H', '7H', '6C'],
        street: 'flop',
        pot: 80,
        heroStack: 500,
        villainStack: 500,
        sizingOptions: [0.5, 0.75, 1],
        villainAction: 'call',
        seed: 452,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.75, sizeTolerance: 0.05 },
      incorrectFeedback:
        'This board is soaked with straight and flush draws. With a strong hand you size up, about three-quarters pot, to charge them.',
    },
  ],
}
