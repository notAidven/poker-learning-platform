import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson 4: "Betting Basics" (Section 2 · Playing a Hand).
 *
 * The five actions and when each is legal, how a round opens and closes, and the
 * basic mechanic that a bet is sized as a fraction of the pot. Built on the
 * `betting-round` interaction vs. a scripted, deterministic computer opponent.
 * Mechanics only: the sizing TACTICS (which fraction to choose, and why) are
 * deferred to Lesson 8, and the EV-of-a-call math lives in the Math section
 * (Lesson 7), so this lesson never teaches sizing strategy or forward-references
 * pot odds.
 *
 * Ratio: 6 problems / 8 steps = 75% interactive. Concepts never run back-to-back.
 * Money is written as plain chip counts so prose can reserve `$…$` for KaTeX.
 * Keep `id: '4'` / export `lesson4`.
 */
export const lesson4: LessonDefinition = {
  id: '4',
  title: 'Betting Basics',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Your turn: the five actions',
      content: `On your turn, first ask: **is there a bet to me?**

- **No bet yet?** You may **check** (pass for free) or **bet**.
- **Facing a bet?** You may **call** (match it), **raise** (increase it), or **fold**.

A round **opens** on the first bet and **closes** once everyone still in has matched the top bet or folded, or everyone checks. One rule you will never regret: if you can check for free, **never fold**.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt:
        'You flop three Aces (top set) on a dry board and no one has bet yet. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AS', 'AD'],
        board: ['AH', '7C', '2D'],
        street: 'flop',
        pot: 60,
        heroStack: 480,
        villainStack: 480,
        sizingOptions: [0.5, 0.75, 1],
        seed: 11,
        task: 'choose-action',
      },
      answer: { action: 'bet' },
      feedback: {
        correct: 'Yes. With a monster you **bet** to build the pot while you are far ahead.',
        incorrect:
          'Checking a monster wins only the tiny pot already there. With the best hand by a mile, bet to grow it.',
        hints: [
          'Is there a bet to you? No, so your choices are check or bet.',
          'You hold the near-nuts; you want chips in the pot.',
          'Betting for value builds the pot you are very likely to win.',
        ],
        why: 'Top set on 7-2 has almost no way to lose here. Checking gives a free card and wins only what is already in the middle. **Betting for value** charges worse hands (a pair, a draw) to continue, growing the pot you will usually win.',
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt:
        'You flop top set (three Kings). The villain bets 20 into a pot of 40. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['KS', 'KD'],
        board: ['KH', '9C', '4D'],
        street: 'flop',
        pot: 60,
        heroStack: 480,
        villainStack: 480,
        facing: { action: 'bet', amount: 20 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 22,
        task: 'choose-action',
      },
      answer: { action: 'raise' },
      feedback: {
        correct: 'Right. **Raise** for value. A set is crushing this board, so build the pot now.',
        incorrect:
          'Calling keeps the pot small with the best hand; folding a monster is a disaster. **Raise** to get value.',
        hints: [
          'A bet faces you, so you can call, raise, or fold.',
          'Three Kings is almost certainly the best hand here.',
          'When you are far ahead, raise to put more chips in while you can.',
        ],
        why: 'Top set on K-9-4 is a huge favorite. Just calling lets the villain see cheap cards. **Raising for value** swells the pot you will usually win. (The minimum legal raise is the current bet plus the last raise increment, not simply "double it.")',
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        'You hold two hearts and two more land on the flop, a flush draw, but no made hand yet. The villain bets 15 into a pot of 60. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', 'KH'],
        board: ['QH', '7H', '2C'],
        street: 'flop',
        pot: 75,
        heroStack: 400,
        villainStack: 400,
        facing: { action: 'bet', amount: 15 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 31,
        task: 'choose-action',
      },
      answer: { action: 'call' },
      feedback: {
        correct:
          'Good. **Call**. A strong draw is worth continuing, and the price is small, so you stay in cheaply to try to complete it.',
        incorrect:
          'You have a strong draw but no made hand. Folding throws it away; raising commits a lot with a hand that has not made anything yet. **Call** and see the next card.',
        hints: [
          'A bet faces you: call, raise, or fold.',
          'You have a flush draw, strong but not a made hand yet.',
          'Calling keeps you in cheaply to try to hit; it is too good to fold and too unmade to raise big.',
        ],
        why: 'A **call** simply matches the bet to stay in. With a strong draw and a small price, calling lets you continue toward your flush without bloating the pot. Folding gives up a great draw, and raising risks chips with a hand that still has to improve. (Exactly *when* a draw is worth the price is the pot-odds math coming up in The Math.)',
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt:
        'You hold 8-7 with no pair and no draw. On A-K-Q the villain fires a pot-sized bet of 90 into 90. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['8S', '7S'],
        board: ['AH', 'KD', 'QC'],
        street: 'flop',
        pot: 180,
        heroStack: 300,
        villainStack: 300,
        facing: { action: 'bet', amount: 90 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 33,
        task: 'choose-action',
      },
      answer: { action: 'fold' },
      feedback: {
        correct: 'Correct. **Fold**. You have nothing, the price is steep, and calling just burns chips.',
        incorrect:
          'With no pair and no draw against a big bet, calling or raising only loses chips. **Fold**.',
        hints: [
          'You can call, raise, or fold, but what do you actually have?',
          '8-high has no pair and no draw on A-K-Q.',
          'There is nothing to continue with against a big bet.',
        ],
        why: 'You hold 8-high with **no pair and no draw** on A-K-Q, so almost nothing can come to save this hand. Calling a big bet just to "see what happens" bleeds chips, and you cannot raise a busted hand profitably. **Fold** and wait for a better spot. (This only applies because there is a bet. If it were checked to you, you would never fold a free look.)',
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt: 'You have Ace-high (no pair) on K-9-2 and no one has bet. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AS', '5C'],
        board: ['KD', '9H', '2S'],
        street: 'flop',
        pot: 50,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 44,
        task: 'choose-action',
      },
      answer: { action: 'check' },
      feedback: {
        correct:
          'Good. **Check**. A weak hand takes a free card; there is no need to bet (and never fold for free).',
        incorrect:
          'Betting a weak hand bloats the pot with little to gain, and folding for free is the classic mistake. Just **check**.',
        hints: [
          'No bet faces you, so your only choices are check or bet.',
          'Ace-high is weak, so what would betting actually accomplish?',
          'You can see the next card for free; there is no reason to fold or bloat the pot.',
        ],
        why: 'Ace-high is too weak to bet for value (worse hands fold, better hands keep going). **Checking** keeps the pot small and buys a free card. Crucially, when you can check for free you should **never fold**. Folding throws away a hand that might still improve.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Bets come in different sizes',
      content: `A bet is not one fixed amount. You choose how much to put in, and we measure it as a **fraction of the pot**.

- Into a 100 pot, a **half-pot** bet is 50, a quarter-pot bet is 25, and a pot-sized bet is 100.
- A bet can be small or large, and the chips you risk scale with the fraction you pick.

For now, just get comfortable that a bet has a size. **Which** fraction to choose, and why, is its own skill, and that is all of Lesson 8.`,
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        'A bet is entered as a fraction of the pot. The pot is 80 and you have decided to bet. Which option puts in half the pot?',
      interaction: 'betting-round',
      config: {
        hole: ['QS', 'QD'],
        board: ['8C', '5D', '2H'],
        street: 'flop',
        pot: 80,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 55,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.5, sizeTolerance: 0.05 },
      feedback: {
        correct: 'Half of an 80-chip pot is 40, the middle option.',
        incorrect: 'Half-pot means half of the chips already in the middle: 40 into 80.',
        hints: [
          'The pot is 80 chips.',
          'Half of the pot is the middle option.',
          'Half of 80 is 40.',
        ],
        why: 'A bet is sized as a **fraction of the pot**, so into an 80 pot a half-pot bet is 40. This is just the mechanic of entering a size. **Which** fraction to pick, and why (for value, for bluffs, for board texture), is the whole of Lesson 8.',
      },
    },
  ],
}
