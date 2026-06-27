import type { SectionGateDefinition } from './types'

/**
 * The Advanced Play Section Gate — covers adv-ranges, adv-texture, adv-implied,
 * adv-combos, and adv-icm, 2 fresh questions each (10 total, mirroring gate-math's
 * 2-per-lesson coverage). Every spot is BRAND-NEW (no lesson / skill-check reuse). No
 * hints (gate rules); pass at ~70%. All questions grade against an authored answer
 * (betting-round / compare-events / range-grid), so there is no evaluator dependency.
 *
 *  adv-ranges:  (q1) a weak offsuit Ace is OUT of an early open, (q2) fold junk UTG.
 *  adv-texture: (q3) tell wet from dry, (q4) do not c-bet air into a wet board.
 *  adv-implied: (q5) high SPR favors a draw, (q6) EV of a cheap flush-draw call.
 *  adv-combos:  (q7) a pair has more combos than a suited hand, (q8) a Queen blocks QQ.
 *  adv-icm:     (q9) a wide 10bb button jam, (q10) push/fold at a very short stack.
 * Keep `sectionId: 'advanced'`.
 */
const UTG_OPEN = [
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs',
  'AKo', 'AQo',
]

const SHOVE_WIDE = [
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  'KQo', 'KJo', 'KTo', 'K9o', 'K8o',
  'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'QJo', 'QTo',
  'JTs', 'J9s', 'J8s', 'JTo', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s', '54s',
]

export const gateAdvanced: SectionGateDefinition = {
  sectionId: 'advanced',
  title: 'Advanced Play Gate',
  questions: [
    {
      id: 'a-q1',
      lessonId: 'adv-ranges',
      prompt: 'You are under the gun (first to act). Is A-5 offsuit in a sensible early-position opening range?',
      interaction: 'range-grid',
      config: {
        mode: 'is-hand-in-range',
        rangeName: 'an early-position open',
        range: UTG_OPEN,
        hand: 'A5o',
        helperText: 'Early position should be tight.',
      },
      answer: { inRange: false },
      incorrectFeedback:
        'A weak offsuit Ace like A-5 offsuit is dominated too often to open under the gun. It is out of a tight early range.',
    },
    {
      id: 'a-q2',
      lessonId: 'adv-ranges',
      prompt:
        'Under the gun, it is your turn first and you hold a Queen and a Seven of different suits. The blinds are 5 and 10. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['QS', '7D'],
        board: [],
        street: 'preflop',
        pot: 15,
        heroStack: 500,
        villainStack: 500,
        facing: { action: 'bet', amount: 10 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 471,
        task: 'choose-action',
        helperText: 'You are first to act under the gun. You can fold, call 10, or raise.',
      },
      answer: { action: 'fold' },
      incorrectFeedback:
        'Q-7 offsuit is junk, and under the gun you should be tight. There is nothing to open with here, so fold.',
    },
    {
      id: 'a-q3',
      lessonId: 'adv-texture',
      prompt: 'Which of these flops is WETTER, with more draws available?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Which board is wetter?',
        helperText: 'A wetter board allows more straights and flushes.',
        eventA: {
          label: 'A-K-4 rainbow',
          detail: 'Three suits, spread-out high cards. Almost no draws.',
        },
        eventB: {
          label: '6-5-4 with two spades',
          detail: 'Connected ranks and a flush draw. Lots of draws.',
        },
      },
      answer: { more: 'b' },
      incorrectFeedback:
        'The connected, two-spade 6-5-4 brings straights and a flush draw, so it is far wetter than the A-K-4 rainbow.',
    },
    {
      id: 'a-q4',
      lessonId: 'adv-texture',
      prompt:
        'You raised before the flop and now hold the Ace and King of spades, just ace-high, on a wet 7-6-5 board with two clubs. It is checked to you. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AS', 'KD'],
        board: ['7C', '6C', '5D'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 472,
        task: 'choose-action',
        helperText: 'No bet faces you, so your choices are check or bet.',
      },
      answer: { action: 'check' },
      incorrectFeedback:
        'Ace-high with no pair and no draw, on a board that smashes the caller, is a check. Do not auto-c-bet air into a wet board.',
    },
    {
      id: 'a-q5',
      lessonId: 'adv-implied',
      prompt: 'You hold a speculative drawing hand. Which situation makes your implied odds LARGER?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Which gives larger implied odds?',
        helperText: 'SPR is the effective stack divided by the pot.',
        eventA: {
          label: 'High SPR (deep stacks)',
          detail: 'Lots of chips left to win on later streets.',
        },
        eventB: {
          label: 'Low SPR (short stacks)',
          detail: 'Little left to win after this street.',
        },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'A high SPR means deep stacks and plenty left to win after you hit, so implied odds are largest there.',
    },
    {
      id: 'a-q6',
      lessonId: 'adv-implied',
      prompt:
        'Flop flush draw, about 35% to hit by the river. The pot is 80 and it costs 20 to call. Using EV = (win chance) x (pot) - (lose chance) x (call), what is the EV of calling, in chips?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C'],
        street: 'flop',
        pot: 80,
        heroStack: 400,
        villainStack: 400,
        facing: { action: 'bet', amount: 20 },
        seed: 473,
        task: 'ev-of-call',
        helperText: 'There is 80 in the pot and it costs 20 to call. Your flush draw is about 35% to hit.',
      },
      answer: { evChips: 15, evTolerance: 1 },
      incorrectFeedback: 'EV = 0.35 x 80 - 0.65 x 20 = 28 - 13 = +15 chips, a clearly profitable call.',
    },
    {
      id: 'a-q7',
      lessonId: 'adv-combos',
      prompt: 'Which specific starting hand can be dealt MORE ways?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Which has more combos?',
        helperText: 'Count the combinations of each exact hand.',
        eventA: {
          label: 'Pocket Jacks (JJ)',
          detail: '6 combos: choose 2 of the 4 Jacks.',
        },
        eventB: {
          label: 'A-Q suited (AQs)',
          detail: '4 combos: one per suit.',
        },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'A specific pair is 6 combos; a specific suited hand is only 4. Pocket Jacks can be dealt more ways than A-Q suited.',
    },
    {
      id: 'a-q8',
      lessonId: 'adv-combos',
      prompt: 'You hold the Queen of spades. Which premium pair do you block for your opponent?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Which hand does your Queen block?',
        helperText: 'A blocker only removes hands that use the card you hold.',
        eventA: {
          label: 'Pocket Queens (QQ)',
          detail: 'You hold a Queen, so QQ drops from 6 combos to 3.',
        },
        eventB: {
          label: 'Pocket Aces (AA)',
          detail: 'You hold no Ace, so AA still has 6 combos.',
        },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'A blocker only affects hands containing your card. Your Queen cuts QQ from 6 to 3 combos; it does nothing to AA.',
    },
    {
      id: 'a-q9',
      lessonId: 'adv-icm',
      prompt:
        'No pay jump near. You have about 10 big blinds and it folds to you on the button. Is Q-9 suited a profitable all-in shove?',
      interaction: 'range-grid',
      config: {
        mode: 'is-hand-in-range',
        rangeName: 'a 10bb button jam',
        range: SHOVE_WIDE,
        hand: 'Q9s',
        helperText: 'Short-stacked in late position with no ICM pressure, you can jam wide.',
      },
      answer: { inRange: true },
      incorrectFeedback:
        'At 10bb on the button with no bubble pressure, you jam a wide range, and Q-9 suited is comfortably in it.',
    },
    {
      id: 'a-q10',
      lessonId: 'adv-icm',
      prompt: 'You are down to about 6 big blinds. Which approach fits a stack this short?',
      interaction: 'compare-events',
      config: {
        chooseLabel: 'Which approach fits 6 big blinds?',
        helperText: 'Think about how much a normal raise commits of a 6bb stack.',
        eventA: {
          label: 'Push or fold',
          detail: 'Jam all-in or fold. A raise would commit you anyway.',
        },
        eventB: {
          label: 'Small raises, play postflop',
          detail: 'Leaves you pot-committed with an awkward stack.',
        },
      },
      answer: { more: 'a' },
      incorrectFeedback:
        'At about 6 big blinds a normal raise commits most of your chips, so the clean approach is push or fold.',
    },
  ],
}
