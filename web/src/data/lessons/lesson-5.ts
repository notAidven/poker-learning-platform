import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson 5 — "Betting" (design doc §6, Lesson 5). Teaches the five actions and when
 * each is legal, how a round opens and closes, sizing a bet as a fraction of the pot
 * (to board texture & purpose, not hand strength), and the EV of a call. Built on the
 * `betting-round` interaction vs. the Tier 1→2 heads-up opponent (`lib/poker/opponentAI`).
 *
 * Ratio: 9 problems / 12 steps = 75% interactive. Concepts never run back-to-back.
 * Money is written as plain chip counts so prose can reserve `$…$` for KaTeX.
 */
export const lesson5: LessonDefinition = {
  id: '5',
  title: 'Betting',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Your turn: the five actions',
      content: `On your turn, first ask: **is there a bet to me?**

- **No bet yet?** You may **check** (stay in for free) or **bet** (put the first chips in).
- **Facing a bet?** You may **call** (match it), **raise** (increase it), or **fold** (give up the hand).

A second raise in the same round is a **re-raise**. Betting or raising every chip you have is going **all-in**. A round **opens** on the first bet and **closes** once everyone still in has matched the top bet or folded — or everyone checks. One rule you will never regret: if you can check for free, **never fold**.`,
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
        aiTier: 1,
        seed: 11,
        task: 'choose-action',
      },
      answer: { action: 'bet' },
      feedback: {
        correct: 'Yes — with a monster you **bet** to build the pot while you are far ahead.',
        incorrect:
          'Checking a monster wins only the tiny pot already there. With the best hand by a mile, bet to grow it.',
        hints: [
          'Is there a bet to you? No — so your choices are check or bet.',
          'You hold the near-nuts; you want chips in the pot.',
          'Betting for value builds the pot you are very likely to win.',
        ],
        why: 'Top set on 7-2 has almost no way to lose here. Checking gives a free card and wins only what is already in the middle. **Betting for value** charges worse hands (a pair, a draw) to continue, growing the pot you will usually win. Size to the board, not to your hand — but here any bet beats checking.',
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
        aiTier: 1,
        seed: 22,
        task: 'choose-action',
      },
      answer: { action: 'raise' },
      feedback: {
        correct: 'Right — **raise** for value. A set is crushing this board, so build the pot now.',
        incorrect:
          'Calling keeps the pot small with the best hand; folding a monster is a disaster. **Raise** to get value.',
        hints: [
          'A bet faces you, so you can call, raise, or fold.',
          'Three Kings is almost certainly the best hand here.',
          'When you are far ahead, raise to put more chips in while you can.',
        ],
        why: 'Top set on K-9-4 is a huge favorite. Just calling lets the villain see cheap cards, and it hides nothing. **Raising for value** swells the pot you will usually win. (The minimum legal raise is the current bet plus the last raise increment — not simply "double it.")',
      },
    },
    {
      type: 'problem',
      id: 'p3',
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
        aiTier: 2,
        seed: 33,
        task: 'choose-action',
      },
      answer: { action: 'fold' },
      feedback: {
        correct: 'Correct — **fold**. You have nothing, the price is steep, and calling just burns chips.',
        incorrect:
          'With no pair and no draw against a big bet, calling or raising only loses chips. **Fold**.',
        hints: [
          'You can call, raise, or fold — but what do you actually have?',
          '8-high has no pair and no draw on A-K-Q.',
          'A pot-sized bet needs about 33% equity to call; you have almost none.',
        ],
        why: 'Against a pot-sized bet you need about $\\frac{90}{270} = 33.3\\%$ equity to call. With 8-high and no draw on A-K-Q your equity is near zero, so calling is clearly **−EV**. Folding costs nothing more. This only applies because there is a bet — if it were checked to you, you would never fold a free look.',
      },
    },
    {
      type: 'problem',
      id: 'p4',
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
        aiTier: 1,
        seed: 44,
        task: 'choose-action',
      },
      answer: { action: 'check' },
      feedback: {
        correct:
          'Good — **check**. A weak hand takes a free card; there is no need to bet (and never fold for free).',
        incorrect:
          'Betting a weak hand bloats the pot with little to gain, and folding for free is the classic mistake. Just **check**.',
        hints: [
          'No bet faces you, so your only choices are check or bet.',
          'Ace-high is weak — what would betting actually accomplish?',
          'You can see the next card for free; there is no reason to fold or bloat the pot.',
        ],
        why: 'Ace-high is too weak to bet for value (worse hands fold, better hands keep going) and you have no bluff plan. **Checking** keeps the pot small and buys a free card. Crucially, when you can check for free you should **never fold** — folding throws away a hand that might still improve.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Sizing a bet',
      content: `You size a bet as a **fraction of the pot**, and you size it to the **board and your purpose — not to how strong your hand is** (betting big only with big hands tells opponents exactly what you have).

- **Small (about ⅓ pot):** dry, unconnected boards.
- **Medium (½–⅔ pot):** the everyday default — good for value and for charging draws.
- **Large (¾–pot):** wet, draw-heavy boards, to make draws pay.

When you raise, the minimum is **the current bet plus the last raise increment** — not simply "double it."`,
    },
    {
      type: 'problem',
      id: 'p5',
      prompt:
        'You have top pair, top kicker on a dry K-7-2 board and want to make a half-pot value bet. Which sizing is half the pot?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', 'KD'],
        board: ['KC', '7D', '2S'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        aiTier: 1,
        seed: 55,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.5, sizeTolerance: 0.05 },
      feedback: {
        correct: 'Half of a 60-chip pot is 30 — a solid default value bet.',
        incorrect: 'Half-pot means betting half of what is already in the middle (30 into 60).',
        hints: [
          'The pot is 60 chips.',
          'Half of the pot is the middle option.',
          'A half-pot bet lays your opponent 25% pot odds.',
        ],
        why: '**Half-pot is the safe default**: into a 60-chip pot you bet 30. It charges draws and gets called by worse hands while laying your opponent only $\\frac{30}{120} = 25\\%$ pot odds. Size to the board and your purpose, and use the same size for value bets and bluffs so you never give your hand away.',
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        'You hold an overpair (two Aces) on a wet 9-8-7 board full of straight and flush draws. To charge those draws you size up. Which of these is the large, draw-charging bet?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', 'AS'],
        board: ['9H', '8H', '7C'],
        street: 'flop',
        pot: 80,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        aiTier: 2,
        seed: 66,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.75, sizeTolerance: 0.05 },
      feedback: {
        correct: 'Right — a large ¾-pot bet makes draws pay the maximum to chase you.',
        incorrect: 'On a wet, draw-heavy board a small bet lets draws continue cheaply. Size up.',
        hints: [
          'Wet boards have many draws; you want them to pay to continue.',
          'Bigger bets charge draws more.',
          'Pick the largest of the three sizings here (¾ pot).',
        ],
        why: 'On a soaked 9-8-7 board, opponents often hold straight and flush draws. A **large (¾-pot)** bet makes those draws pay a bad price to chase and builds the pot with your strong hand; a small bet lets them continue cheaply. The principle: small on dry boards, **big on wet boards** — sizing to the board, not announcing your exact hand.',
      },
    },
    {
      type: 'concept',
      id: 'c3',
      title: 'The EV of a call',
      content: `**Expected value (EV)** is what a call is worth on average:

$$\\text{EV} = p \\cdot (\\text{chips you win}) - (1 - p) \\cdot (\\text{chips you call})$$

where $p$ is your chance of winning (your equity). If EV is **positive**, calling makes money over the long run; if it is **negative**, fold.

This is the same idea as **pot odds**: a call breaks even when your equity equals the price. A caller needs about **16.7%** equity versus a ¼-pot bet, **25%** versus a half-pot bet, and **33.3%** versus a pot-sized bet.`,
    },
    {
      type: 'problem',
      id: 'p7',
      prompt:
        'Suppose you have **30% equity** (a 30% chance to win). The pot already holds 100 chips and it costs you 20 to call. What is the EV of calling, in chips?',
      interaction: 'betting-round',
      config: {
        hole: ['QH', 'JH'],
        board: ['10H', '7H', '2C', '3S'],
        street: 'turn',
        pot: 100,
        heroStack: 300,
        villainStack: 300,
        facing: { action: 'bet', amount: 20 },
        aiTier: 2,
        seed: 77,
        task: 'ev-of-call',
      },
      answer: { evChips: 16, evTolerance: 1 },
      feedback: {
        correct: 'Yes — EV $= 0.30 \\times 100 - 0.70 \\times 20 = +16$ chips. A positive EV means calling profits over time.',
        incorrect:
          'EV = (win chance) × (chips won) − (lose chance) × (chips called). Try $0.30 \\times 100 - 0.70 \\times 20$.',
        hints: [
          'You win 100 chips 30% of the time, and lose 20 chips the other 70%.',
          'EV $= 0.30 \\times 100 - 0.70 \\times 20$.',
          '$0.30 \\times 100 = 30$ and $0.70 \\times 20 = 14$, so EV $= 30 - 14$.',
        ],
        why: 'The chips you can win are the 100 already in the pot; the chips you risk are the 20 call.\n\n$$\\text{EV} = p \\cdot (\\text{won}) - (1-p) \\cdot (\\text{called}) = 0.30 \\times 100 - 0.70 \\times 20 = +16$$\n\nA positive EV means a profitable call. This matches **pot odds**: a 20-into-100 call needs only $\\frac{20}{120} \\approx 16.7\\%$ equity to break even, and 30% clears that bar.',
      },
    },
    {
      type: 'problem',
      id: 'p8',
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
        aiTier: 2,
        seed: 88,
        task: 'ev-of-call',
      },
      answer: { evChips: -2, evTolerance: 1 },
      feedback: {
        correct: 'Right — EV $= 0.15 \\times 100 - 0.85 \\times 20 = -2$ chips. A negative EV means you should fold.',
        incorrect: 'EV $= 0.15 \\times 100 - 0.85 \\times 20$. That comes out below zero — a losing call.',
        hints: [
          'You win 100 chips 15% of the time, and lose 20 chips 85% of the time.',
          'EV $= 0.15 \\times 100 - 0.85 \\times 20$.',
          '$0.15 \\times 100 = 15$ and $0.85 \\times 20 = 17$, so EV $= 15 - 17$.',
        ],
        why: 'You win the 100 in the pot only 15% of the time, and lose your 20 call the other 85%.\n\n$$\\text{EV} = 0.15 \\times 100 - 0.85 \\times 20 = 15 - 17 = -2$$\n\nThe call loses 2 chips on average, so **fold**. In pot-odds terms a 20-into-100 call needs about $16.7\\%$ equity; 15% falls short, so calling is −EV.',
      },
    },
    {
      type: 'problem',
      id: 'p9',
      prompt:
        'You have the nut flush draw (nine hearts give you the best hand) on the turn. The villain bets 20 into a pot of 80. With about 19.6% equity, what is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', '7H'],
        board: ['KH', '9H', '2C', '3S'],
        street: 'turn',
        pot: 100,
        heroStack: 300,
        villainStack: 300,
        facing: { action: 'bet', amount: 20 },
        sizingOptions: [0.5, 0.75, 1],
        aiTier: 2,
        seed: 99,
        task: 'choose-action',
      },
      answer: { action: 'call' },
      feedback: {
        correct:
          'Correct — **call**. You are paid a better price than your odds: 19.6% equity beats the 16.7% you need.',
        incorrect:
          'Folding a draw that is getting the right price gives up a profitable call; raising bloats the pot with a hand that still must improve. **Call**.',
        hints: [
          'A bet faces you: call, raise, or fold.',
          'A 20-into-100 call needs only about 16.7% equity.',
          'Your draw has about 19.6% equity — more than the price you are paid.',
        ],
        why: 'Calling needs equity of at least $\\frac{20}{120} \\approx 16.7\\%$. Your nut flush draw is about $19.6\\%$, so the call is **+EV** — you are paid a better price than your chance of hitting. Folding surrenders a profitable spot; raising risks too much with a hand that still has to improve.',
      },
    },
  ],
}
