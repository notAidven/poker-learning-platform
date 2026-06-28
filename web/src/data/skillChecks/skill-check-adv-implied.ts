import type { SkillCheckDefinition } from '../../types/skillCheck'

/**
 * Skill Check "Implied Odds & SPR" (lessonId 'adv-implied'). TRANSFER questions, fresh
 * spots: (q1) a deep set-mine call, (q2) where implied odds matter more, and (q3) the EV
 * of a cheap draw call. Reuses `betting-round` + `compare-events`. Keep
 * `lessonId: 'adv-implied'` / export `skillCheckAdvImplied`.
 */
export const skillCheckAdvImplied: SkillCheckDefinition = {
  lessonId: 'adv-implied',
  title: 'Implied Odds & SPR Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        'Stacks are deep (1000 each). An early player raises to 30 and you hold pocket Sevens. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['7S', '7D'],
        board: [],
        street: 'preflop',
        pot: 45,
        heroStack: 1000,
        villainStack: 1000,
        facing: { action: 'bet', amount: 30 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 461,
        task: 'choose-action',
        helperText: 'Stacks are deep (1000 each). A player raised to 30. Fold, call 30, or raise.',
      },
      answer: { action: 'call' },
      incorrectFeedback:
        'A small pair with deep stacks is a set-mine: call hoping to flop a set and win a big pot. The implied odds justify the call.',
    },
    {
      id: 'q2',
      prompt: 'You hold a speculative drawing hand. In which spot are your implied odds LARGER?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Where are implied odds larger?',
        helperText: 'Implied odds are the chips still left to win after you hit.',
        eventA: {
          label: 'Deep stacks behind',
          detail: 'Lots of chips left to win on later streets.',
        },
        eventB: {
          label: 'Nearly all-in already',
          detail: 'Almost no chips left to win after this street.',
        },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'Implied odds are future chips. With deep stacks there is far more to win after you hit, so that is where they are largest.',
    },
    {
      id: 'q3',
      showCalculator: true,
      prompt:
        'Flop flush draw, about 35% to hit by the river. The pot is 100 and it costs 20 to call. Using EV = (win chance) x (pot) - (lose chance) x (call), what is the EV of calling, in chips?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C'],
        street: 'flop',
        pot: 100,
        heroStack: 400,
        villainStack: 400,
        facing: { action: 'bet', amount: 20 },
        seed: 462,
        task: 'ev-of-call',
        helperText: 'There is 100 in the pot and it costs 20 to call. Your flush draw is about 35% to hit.',
      },
      answer: { evChips: 22, evTolerance: 1 },
      incorrectFeedback:
        'EV = 0.35 x 100 - 0.65 x 20 = 35 - 13 = +22 chips, a profitable call even before implied odds.',
    },
  ],
}
