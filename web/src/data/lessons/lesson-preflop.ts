import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson "Playing Preflop" (Section 2 · Playing a Hand), placed AFTER Betting
 * Basics and BEFORE the Casino Floor. It teaches the three things a beginner needs
 * before the flop:
 *   1. Preflop betting basics — the blinds and position, plus your three options
 *      (fold / call-or-limp / raise-or-open). Built on the `betting-round` widget
 *      with `street: 'preflop'` (empty board).
 *   2. Suited vs offsuit — same-suit hole cards can make a flush, so suited is a
 *      little stronger. Taught with the new `preflop-hand` "pick the stronger" mode.
 *   3. Reading starting-hand strength — premium pairs, big broadways, suited play,
 *      and junk, with position context. Taught with `preflop-hand` "classify".
 *
 * 6 problems / 9 steps = 67% interactive; concepts never run back-to-back. No EV /
 * pot-odds math (that is the Math section). No em dashes. Keep `id: 'preflop'` /
 * export `lessonPreflop`. The 3 classify problems share one strength scale:
 * Premium / Playable / Fold it.
 */

const STRENGTH_OPTIONS = [
  { id: 'premium', label: 'Premium', sub: 'Raise from any seat' },
  { id: 'playable', label: 'Playable', sub: 'Worth seeing a flop' },
  { id: 'fold', label: 'Fold it', sub: 'Wait for better' },
]

export const lessonPreflop: LessonDefinition = {
  id: 'preflop',
  title: 'Playing Preflop',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Before the flop',
      content: `Every hand starts before the flop, when the only cards you know are your two **hole cards**. First, two players post forced bets: the **small blind** and the **big blind**, so there is always something to play for.

When the action reaches you, you have three choices:

- **Fold**: give up the hand for free.
- **Call**: match the **big blind**. Doing this when no one has raised is a **limp**.
- **Raise**: put in more than the **big blind**. Being first to raise is an **open**.

Your **position** matters too. Acting later is an advantage, so you can play more hands from a late seat like the **button** and fewer from an early seat like **under the gun**.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'It folds to you on the button and you find two black Aces. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AS', 'AC'],
        board: [],
        street: 'preflop',
        pot: 15,
        heroStack: 500,
        villainStack: 500,
        facing: { action: 'bet', amount: 10 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 71,
        task: 'choose-action',
        helperText:
          'It folds to you on the button. The blinds are 5 and 10, so there is 15 in the middle and 10 to call. You can fold, call the 10 (a limp), or raise.',
      },
      answer: { action: 'raise' },
      feedback: {
        correct: 'Yes. With a **premium hand**, **raise** to build the pot and take control.',
        incorrect:
          'Aces is the best starting hand. Just calling, a **limp**, is far too passive. **Raise** to build the pot.',
        hints: [
          'There is a bet to you (the big blind), so you can fold, call, or raise.',
          'You hold the strongest hand in poker.',
          'Limping along wastes a huge edge. What grows the pot while you are ahead?',
        ],
        why: 'Pocket Aces is the best **starting hand**, so you want chips in the pot while you are the favorite. **Raising**, also called an **open**, builds the pot and makes weaker hands pay to see a flop. Calling the **big blind** (a **limp**) is too passive with such a strong hand.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Suited or offsuit',
      content: `Look at the two suits of your **hole cards**.

- If they match, your hand is **suited** (for example, the Ace and King of spades).
- If they do not, your hand is **offsuit**.

A **suited** hand can make a **flush**, so it is a little stronger than the same two ranks **offsuit**. The edge is small, not huge, but it is real. We write suited hands with an "s" (AKs) and offsuit hands with an "o" (AKo).`,
    },
    {
      type: 'problem',
      id: 'p2',
      prompt:
        'Both hands are Ace-King. One is suited, one is offsuit. Which is a little stronger before the flop?',
      interaction: 'preflop-hand',
      config: {
        mode: 'pick-stronger',
        handA: ['AS', 'KS'],
        handB: ['AD', 'KC'],
        labelA: 'A-K suited',
        labelB: 'A-K offsuit',
        helperText: 'Same two ranks. Only the suits differ.',
      },
      answer: { stronger: 'a' },
      feedback: {
        correct: 'Right. **A-K suited** can also make a **flush**, so it edges out the **offsuit** version.',
        incorrect:
          'Same two ranks, but only one of them can make a **flush**. The **suited** hand is the stronger one.',
        hints: [
          'Both hands have the same two ranks, A and K.',
          'Only one of them can make a flush.',
          'A flush needs five cards of one suit, so matching suits helps.',
        ],
        why: '**Suited** and **offsuit** hands with the same ranks play almost the same, but the suited version adds **flush** potential. That extra way to win makes **A-K suited** slightly stronger. The edge is small, so do not overrate it, but suited is better.',
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt: 'You are dealt two Queens. How strong is this starting hand?',
      interaction: 'preflop-hand',
      config: {
        mode: 'classify',
        hand: ['QS', 'QD'],
        options: STRENGTH_OPTIONS,
      },
      answer: { optionId: 'premium' },
      feedback: {
        correct: 'Yes. A big **pocket pair** like Queens is a **premium hand**. Raise it from any seat.',
        incorrect:
          'A pair of Queens is one of the best hands you can hold before the flop. That is a **premium hand**.',
        hints: [
          'Queens is a big pocket pair.',
          'Only Aces and Kings are bigger pairs.',
          'Would you raise this from any seat?',
        ],
        why: 'The big **pocket pair**s (AA, KK, QQ) and A-K are **premium** hands. They are strong enough to **raise** from any **position** to build the pot and narrow the field.',
      },
    },
    {
      type: 'concept',
      id: 'c3',
      title: 'Reading starting-hand strength',
      content: `You do not need a chart to start. Sort your **starting hand** into three buckets:

- **Premium**: the big **pocket pair**s (AA, KK, QQ) and A-K. Raise these from any seat.
- Playable: two high **broadway** cards (like A-Q or K-Q), smaller pairs, and **suited** hands such as a **suited connector** or a suited Ace. These are worth a flop, and they go up in value in late **position**.
- Fold: low, unconnected **offsuit** cards (like 7-2). Let them go and wait for a better spot.

Keep the small edges in mind: a **suited** hand is a touch stronger than its **offsuit** twin, and you can play more hands in late **position** than from an early seat.`,
    },
    {
      type: 'problem',
      id: 'p4',
      prompt: 'You are dealt a Seven and a Two of different suits. How strong is this starting hand?',
      interaction: 'preflop-hand',
      config: {
        mode: 'classify',
        hand: ['7S', '2D'],
        options: STRENGTH_OPTIONS,
      },
      answer: { optionId: 'fold' },
      feedback: {
        correct: 'Correct. 7-2 **offsuit** is the weakest starting hand. Fold it and wait.',
        incorrect: 'These cards are low, do not connect, and are **offsuit**. This is a fold.',
        hints: [
          'The cards are low and far apart in rank.',
          'They are offsuit, so there is no flush help.',
          'Is there any flop that makes this hand strong?',
        ],
        why: 'Low, unconnected **offsuit** cards like 7-2 almost never make a strong hand. With no pair, no straight help, and no **flush** help, the right play is to **fold** and wait for a better **starting hand**.',
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt: 'You hold the Ace and Five of spades on the button. How would you classify this hand?',
      interaction: 'preflop-hand',
      config: {
        mode: 'classify',
        hand: ['AS', '5S'],
        options: STRENGTH_OPTIONS,
        context: 'It folds to you on the button, where you act last after the flop.',
      },
      answer: { optionId: 'playable' },
      feedback: {
        correct: 'Good. A **suited** Ace is playable, and it gets better in late **position** like the button.',
        incorrect:
          'This is not a premium hand, but a **suited** Ace on the button is too good to fold. It is playable.',
        hints: [
          'The Ace and Five share a suit.',
          'You are on the button, the best position.',
          'It is not premium, but is it really a fold from the button?',
        ],
        why: 'A **suited** Ace can make the **nut flush** plus an Ace-high hand. It is not **premium**, but it is a fine playable hand, especially in late **position** where you act last. From an early seat you would be more cautious.',
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        'An early player raises to 30 before the flop. You hold a Seven and a Two of different suits. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['7S', '2D'],
        board: [],
        street: 'preflop',
        pot: 45,
        heroStack: 500,
        villainStack: 500,
        facing: { action: 'bet', amount: 30 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 73,
        task: 'choose-action',
        helperText:
          'An early player opens with a raise to 30. You hold 7-2 offsuit. You can fold, call 30, or raise.',
      },
      answer: { action: 'fold' },
      feedback: {
        correct: 'Correct. **Fold**. 7-2 **offsuit** facing a **raise** is an easy pass.',
        incorrect: '7-2 **offsuit** is the weakest hand, and someone has shown strength. Just **fold**.',
        hints: [
          'A raise faces you, so you can fold, call, or raise.',
          '7-2 offsuit is the weakest starting hand.',
          'Calling a raise with the worst hand only loses chips.',
        ],
        why: '7-2 **offsuit** almost never makes a strong hand, and a **raise** in front of you signals a better holding. There is nothing to continue with, so **fold** and save your chips for a real **starting hand**.',
      },
    },
  ],
}
