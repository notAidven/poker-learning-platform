import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson 7: "Expected Value (EV)" (Section 3 · The Math).
 *
 * EV of a call = p·(chips won) − (1−p)·(chips called); positive → call, negative →
 * fold. This is the same break-even as pot odds (Lesson 6), now in chips. Then the
 * idea of **fold equity**: a bet can win two ways (best hand OR everyone folds),
 * which makes a semibluff profitable. Built on the `betting-round` widget:
 * `ev-of-call` grades the entered EV (the widget recovers equity from it), and
 * `choose-action` grades the action.
 *
 * Pot convention (matches the widget): `config.pot` is the pot the hero would scoop
 * if they call and win (already including the villain's bet); `facing.amount` is the
 * call. So EV = equity·pot − (1−equity)·call.
 *
 * Ratio: 5 problems / 7 steps ≈ 71% interactive. Concepts never run back-to-back.
 * Keep `id: '7'` / export `lesson7`.
 */
export const lesson7: LessonDefinition = {
  id: '7',
  title: 'Expected Value',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Expected value of a call',
      content: `**Expected value (EV)** is what a call is worth on average:

$$\\text{EV} = p \\cdot (\\text{chips you win}) - (1 - p) \\cdot (\\text{chips you call})$$

where $p$ is your equity (your chance to win). If EV is **positive**, calling makes money over the long run; if it is **negative**, fold.

This is the same break-even as **pot odds**, just measured in chips instead of a percent.`,
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p1',
      prompt:
        'Suppose you have **30% equity**. The pot already holds 100 chips and it costs you 20 to call. What is the EV of calling, in chips?',
      interaction: 'betting-round',
      config: {
        hole: ['QH', 'JH'],
        board: ['10H', '7H', '2C', '3S'],
        street: 'turn',
        pot: 100,
        heroStack: 300,
        villainStack: 300,
        facing: { action: 'bet', amount: 20 },
        seed: 77,
        task: 'ev-of-call',
      },
      answer: { evChips: 16, evTolerance: 1 },
      feedback: {
        correct: 'Yes. EV $= 0.30 \\times 100 - 0.70 \\times 20 = +16$ chips. A positive EV means calling profits over time.',
        incorrect:
          'EV = (win chance) × (chips won) − (lose chance) × (chips called). Try $0.30 \\times 100 - 0.70 \\times 20$.',
        hints: [
          'You win 100 chips 30% of the time, and lose 20 chips the other 70%.',
          'EV $= 0.30 \\times 100 - 0.70 \\times 20$.',
          '$0.30 \\times 100 = 30$ and $0.70 \\times 20 = 14$, so EV $= 30 - 14$.',
        ],
        why: 'The chips you can win are the 100 already in the pot; the chips you risk are the 20 call.\n\n$$\\text{EV} = 0.30 \\times 100 - 0.70 \\times 20 = +16$$\n\nA positive EV means a profitable call, and it matches pot odds: a 20-into-100 call needs only $\\frac{20}{120} \\approx 16.7\\%$, and 30% clears that.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p2',
      prompt:
        'Now suppose your equity is only **15%**. The pot holds 100 chips and it costs 20 to call. What is the EV of calling, in chips? (Use a negative number if it loses.)',
      interaction: 'betting-round',
      config: {
        hole: ['9D', '6C'],
        board: ['AH', 'KS', '4C', '2H'],
        street: 'turn',
        pot: 100,
        heroStack: 300,
        villainStack: 300,
        facing: { action: 'bet', amount: 20 },
        seed: 88,
        task: 'ev-of-call',
      },
      answer: { evChips: -2, evTolerance: 1 },
      feedback: {
        correct: 'Right. EV $= 0.15 \\times 100 - 0.85 \\times 20 = -2$ chips. A negative EV means you should fold.',
        incorrect: 'EV $= 0.15 \\times 100 - 0.85 \\times 20$. That comes out below zero, a losing call.',
        hints: [
          'You win 100 chips 15% of the time, and lose 20 chips 85% of the time.',
          'EV $= 0.15 \\times 100 - 0.85 \\times 20$.',
          '$0.15 \\times 100 = 15$ and $0.85 \\times 20 = 17$, so EV $= 15 - 17$.',
        ],
        why: 'You win the 100 only 15% of the time and lose your 20 call the other 85%:\n\n$$\\text{EV} = 0.15 \\times 100 - 0.85 \\times 20 = -2$$\n\nThe call loses 2 chips on average, so **fold**. In pot-odds terms you needed ~16.7%, and 15% falls short.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p3',
      prompt:
        'With **25% equity**, the pot holds 100 chips and it costs 20 to call. What is the EV of calling, in chips?',
      interaction: 'betting-round',
      config: {
        hole: ['JS', '10S'],
        board: ['9D', '4C', '2H', 'QS'],
        street: 'turn',
        pot: 100,
        heroStack: 300,
        villainStack: 300,
        facing: { action: 'bet', amount: 20 },
        seed: 73,
        task: 'ev-of-call',
      },
      answer: { evChips: 10, evTolerance: 1 },
      feedback: {
        correct: 'EV $= 0.25 \\times 100 - 0.75 \\times 20 = +10$ chips, a clearly profitable call.',
        incorrect: 'EV $= 0.25 \\times 100 - 0.75 \\times 20 = 25 - 15 = +10$ chips.',
        hints: [
          'You win 100 chips 25% of the time, and lose 20 chips 75% of the time.',
          'EV $= 0.25 \\times 100 - 0.75 \\times 20$.',
          '$25 - 15 = 10$.',
        ],
        why: 'EV $= 0.25 \\times 100 - 0.75 \\times 20 = +10$. Comfortably positive, because 25% is well above the ~16.7% break-even this price needs.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Fold equity',
      content: `So far you only win by having the best hand. But when **you** are the one betting, you can also win when **everyone folds**. That extra chance is **fold equity**.

A bet can win **two ways**: opponents fold now, **or** you go on to make the best hand. A **semibluff** (betting a strong draw) uses both: it can take the pot immediately, and if called you still have your outs.

A bluff only works when your opponent *can* fold. With no fold equity, betting a weak hand just burns chips.`,
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p4',
      prompt:
        'You have a flush draw (no made hand yet) on the flop and no one has bet. Betting can win two ways. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', '4H'],
        board: ['KH', '9H', '2C'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 71,
        task: 'choose-action',
      },
      answer: { action: 'bet' },
      feedback: {
        correct: 'Yes. **Bet** as a semibluff. You can win now if they fold, and you still have your flush outs if they call.',
        incorrect:
          'A strong draw with no bet yet is the classic **semibluff**: betting wins two ways (a fold now, or your flush later). Bet.',
        hints: [
          'No bet faces you, so your choices are check or bet.',
          'You have a strong draw, and betting can win the pot two ways.',
          'Betting a draw like this is called a semibluff.',
        ],
        why: 'A **semibluff** bet has **fold equity** (opponents may fold now) **plus** your ~35% flush equity if called: two ways to win. That combination makes betting the draw profitable, where betting pure air would not.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p5',
      prompt:
        'River. You hold Ace-high with no pair, and you know this opponent **never folds**. There is no bet yet. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AS', 'QC'],
        board: ['KD', '9H', '4C', '2S', '7D'],
        street: 'river',
        pot: 80,
        heroStack: 300,
        villainStack: 300,
        sizingOptions: [0.5, 0.75, 1],
        seed: 79,
        task: 'choose-action',
      },
      answer: { action: 'check' },
      feedback: {
        correct: 'Right. **Check**. Against someone who never folds there is no fold equity, so a bluff cannot work; and your hand is too weak to bet for value.',
        incorrect:
          'A bluff needs fold equity. If the opponent never folds, betting Ace-high only loses chips, so **check** and try to win at showdown.',
        hints: [
          'A bluff only works if the opponent can fold.',
          'This opponent never folds, so betting has no fold equity.',
          'Ace-high is too weak to bet for value, so check.',
        ],
        why: 'Betting wins two ways only when fold equity exists. Against a player who **never folds**, the "they fold" path is gone, and Ace-high is too weak to value bet. So a bet has no way to profit. **Check** and keep your showdown chance.',
      },
    },
  ],
}
