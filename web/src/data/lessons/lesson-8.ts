import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson 8: "Bet Sizing & Value Betting" (Section 3 · The Math).
 *
 * Why we bet: value (a strong hand wants worse hands to call) vs a bluff (a weak
 * hand wants better hands to fold), plus thin value, and how big to size to the
 * board and purpose (small on dry, default ½, big on wet). This is the sole home of
 * sizing TACTICS, building on Lesson 4's mechanic (a bet is a fraction of the pot),
 * Lesson 6's pot odds (a bigger bet lays a worse price), and Lesson 7's bluffs /
 * fold equity. Built entirely on the `betting-round` widget: `choose-action` for the
 * value/check decisions, and `choose-size` for picking the right fraction of the pot.
 *
 * Ratio: 6 problems / 8 steps = 75% interactive. Concepts never run back-to-back.
 * Keep `id: '8'` / export `lesson8`.
 */
export const lesson8: LessonDefinition = {
  id: '8',
  title: 'Bet Sizing & Value Betting',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Value bets and bluffs',
      content: `Every bet has a purpose. You already met one in Lesson 7: a **bluff** bets a weak hand hoping a **better** hand folds (it only works when you have fold equity).

This lesson is about the other purpose:

- A **value bet** is a bet with a strong hand, hoping a **worse** hand calls and pays you off.

The key test for value: *will worse hands call?* If nothing worse can call (worse hands fold, better hands keep going), a value bet earns nothing, so you check instead.`,
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p1',
      prompt:
        'You flop top set (three Kings) on K-8-3 and no one has bet. Plenty of worse hands (a King, a pair, a draw) can call. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['KS', 'KD'],
        board: ['KC', '8D', '3S'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 81,
        task: 'choose-action',
      },
      answer: { action: 'bet' },
      feedback: {
        correct: 'Yes. **Bet for value**. Worse hands can call, so betting charges them and grows the pot you will usually win.',
        incorrect:
          'With a monster and worse hands able to call, **bet for value**. Checking just lets them off the hook.',
        hints: [
          'No bet faces you, so it is check or bet.',
          'You have a huge hand and worse hands can call.',
          'When worse hands can pay you off, there is value to collect.',
        ],
        why: 'A **value bet** wants worse hands to call. With top set and many worse hands (a King, a pair, a draw) able to continue, betting earns chips every time they call. Checking wins only the small pot already there.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p2',
      prompt:
        'You hold top pair, good kicker (A-J on J-8-3) and no one has bet. Many worse hands (a weaker Jack, a pair of 8s, a draw) would call a bet. What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', 'JC'],
        board: ['JS', '8D', '3S'],
        street: 'flop',
        pot: 50,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 82,
        task: 'choose-action',
      },
      answer: { action: 'bet' },
      feedback: {
        correct: 'Right. A **thin value bet**. Top pair is not a monster, but enough worse hands call to make betting profitable.',
        incorrect:
          'Top pair good kicker still beats many hands that will call. That is **thin value**, so bet, do not check it down.',
        hints: [
          'No bet faces you: check or bet.',
          'Top pair beats weaker Jacks, smaller pairs, and draws that will call.',
          'Betting a good-but-not-great hand for value is called thin value.',
        ],
        why: '**Thin value** means betting a medium-strength hand because *enough* worse hands still call. Top pair good kicker on J-8-3 beats weaker Jacks, smaller pairs and draws, so a value bet profits on average, even though you are not always ahead.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p3',
      prompt:
        'You hold pocket Fives (a weak pair) on A-K-9 and no one has bet. You are thinking of a value bet. Would worse hands call? What is the best action?',
      interaction: 'betting-round',
      config: {
        hole: ['5C', '5D'],
        board: ['AH', 'KS', '9C'],
        street: 'flop',
        pot: 50,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 83,
        task: 'choose-action',
      },
      answer: { action: 'check' },
      feedback: {
        correct: 'Right. **Check**. Nothing worse calls (worse hands fold, better hands continue), so there is no value in betting.',
        incorrect:
          'A value bet needs worse hands that call. On A-K-9 your pair of Fives is only called by better, so betting for value earns nothing. **Check**.',
        hints: [
          'A value bet only profits if worse hands call.',
          'On A-K-9, what worse hand would call a bet from you?',
          'Worse hands fold and better hands call, so a value bet earns nothing here.',
        ],
        why: 'The value test fails here: a pair of Fives on A-K-9 is called only by **better** hands (any Ace, King, Nine, or bigger pair) while worse hands fold. With no worse hands to pay you off, a value bet loses on average, so **check**.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Sizing to the board',
      content: `In Lesson 4 you saw that a bet is a **fraction of the pot**. Now you choose **which** fraction. Size it to the **board and purpose, not your hand's strength** (always betting big with big hands gives you away).

- **Small (about ⅓ pot):** dry, disconnected boards where little can call.
- **Medium (½ pot):** the everyday default.
- **Large (¾ pot):** wet, draw-heavy boards, to make draws pay.

A bigger bet lays a worse price (the **pot odds** from Lesson 6), so sizing up on a wet board makes draws pay too much to chase. Use the **same** sizes for value bets and bluffs so opponents can never read your hand from your bet.`,
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p4',
      prompt:
        'Top pair on a K-7-2 board, and you want the everyday default value bet, half the pot. The pot is 60. Which sizing is half the pot?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', 'KD'],
        board: ['KC', '7D', '2S'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 84,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.5, sizeTolerance: 0.05 },
      feedback: {
        correct: 'Half of a 60-chip pot is 30, the everyday default value size.',
        incorrect: 'Half-pot is the middle option: half of the 60 already in the middle (30).',
        hints: ['The pot is 60.', 'Half-pot means half of the chips already in the middle.', 'Half-pot is the default value size.'],
        why: '**Half-pot** is the reliable default: into 60 you bet 30. It gets called by worse hands and charges draws, without over-committing.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p5',
      prompt:
        'Overpair (two Aces) on a wet 9-8-7 board full of draws. You want to charge those draws. The pot is 80. Which is the large, draw-charging bet?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', 'AS'],
        board: ['9H', '8H', '7C'],
        street: 'flop',
        pot: 80,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 85,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.75, sizeTolerance: 0.05 },
      feedback: {
        correct: 'Right. A large ¾-pot bet makes the draws pay the maximum to chase you.',
        incorrect: 'On a wet, draw-heavy board, size up so draws pay a bad price. Pick the largest option (¾ pot).',
        hints: [
          'Wet boards are full of draws you want to charge.',
          'Bigger bets make draws pay more.',
          'The wetter the board, the larger you size to charge the draws.',
        ],
        why: 'On a soaked 9-8-7 board, a **large (¾-pot)** bet makes straight and flush draws pay a bad price and builds the pot with your strong hand. Small on dry boards, **big on wet boards**.',
      },
    },
    {
      type: 'problem',
      showCalculator: true,
      id: 'p6',
      prompt:
        'Top pair on a very dry, disconnected Q-8-3 rainbow board where little can call, so a small bet does the job. The pot is 60. Which is the small, ⅓-pot bet?',
      interaction: 'betting-round',
      config: {
        hole: ['AH', 'QD'],
        board: ['QC', '8D', '3S'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        seed: 86,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.33, sizeTolerance: 0.05 },
      feedback: {
        correct: 'Right. About ⅓ of the pot (20 into 60). On a dry board a small bet is plenty.',
        incorrect: 'On a dry, disconnected board a small bet is enough. Pick the smallest option (about ⅓ pot).',
        hints: [
          'Dry boards have few draws and few hands that can call.',
          'Here a small bet is enough to do the job.',
          'A small bet keeps your risk low while still getting thin value.',
        ],
        why: 'On a **dry, disconnected** board there is little for opponents to call with, so a **small (⅓-pot)** bet gets thin value and keeps your risk low. Size to the board: small here, big on wet boards.',
      },
    },
  ],
}
