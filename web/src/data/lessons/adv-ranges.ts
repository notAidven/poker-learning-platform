import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson "Preflop Ranges & Position" (Section 4 · Advanced Play), the first Advanced
 * lesson, placed after The Math gate and before Board Texture. It teaches the two ideas
 * a beginner needs to think in RANGES instead of single hands:
 *   1. Position + RFI (raise-first-in): act later, play wider; act early, play tight.
 *      A solid tight-aggressive (TAG) player opens roughly 15-20% of hands overall, far
 *      tighter under the gun than on the button (research 04 §2.4: UTG ~13-15%, BTN ~45%).
 *   2. The 13x13 starting-hand grid: pairs on the diagonal, suited above it, offsuit below.
 *
 * Built mostly on the new `range-grid` widget (is-hand-in-range + build/select an exact
 * range) plus one preflop `betting-round` to tie a range to the open. 6 problems / 8 steps
 * = 75% interactive; concepts never run back-to-back. ASCII only. Keep `id: 'adv-ranges'`.
 */

/** A tight early-position (under the gun) opening range, ~13-15% of hands. */
const UTG_OPEN = [
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs',
  'AKo', 'AQo',
]

/** A wide button opening range (late position plays many more hands). */
const BTN_OPEN = [
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
  'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
  'QJs', 'QTs', 'Q9s', 'Q8s',
  'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s', '54s',
  'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
]

const PAIRS = ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22']

const EARLY_PREMIUM = ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs']

export const advRanges: LessonDefinition = {
  id: 'adv-ranges',
  title: 'Preflop Ranges & Position',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Think in ranges, by position',
      content: `Strong players do not think about one hand at a time. They think about a **range**: the whole set of hands they would play a given way.

The first thing that sets your range is **position**, your seat relative to the button. Acting later is a real edge, because you see what everyone does before you decide.

- **Early** (under the gun): play **tight**, only your best hands.
- **Late** (cutoff, button): play **wider**, because position lets you control the hand.

Being first to raise is a **raise-first-in (RFI)**, also called an **open**. A solid **tight-aggressive** style opens about **15 to 20%** of hands overall: far fewer early, many more late.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt:
        'You are under the gun (first to act). Is K-9 suited in a sensible opening range from this early seat?',
      interaction: 'range-grid',
      concepts: ['position', 'preflop-ranges'],
      config: {
        mode: 'is-hand-in-range',
        rangeName: 'an early-position open',
        range: UTG_OPEN,
        hand: 'K9s',
        helperText: 'Early position means you should be tight. The tinted cells are a typical UTG opening range.',
      },
      answer: { inRange: false },
      feedback: {
        correct: 'Right. K-9 suited is too weak to open from under the gun, where you should be **tight**.',
        incorrect:
          'From under the gun you open only strong hands. K-9 suited is not one of them, so it is **out** of an early-position range.',
        hints: [
          'Under the gun is the first seat to act, so the range should be tight.',
          'Look at where K-9 suited sits on the grid versus the tinted cells.',
          'A medium suited King plays better in late position than under the gun.',
        ],
        why: 'Under the gun you act first on every later street, so you need a **tight** range of strong hands. A medium suited King like K-9s is dominated too often from early position. It becomes a fine open later, on the button, where **position** adds value.',
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt:
        'Build a simple early-position opening range by tapping exactly these seven hands: AA, KK, QQ, JJ, AKs, AKo, AQs.',
      interaction: 'range-grid',
      concepts: ['preflop-ranges'],
      config: {
        mode: 'build-range',
        rangeName: 'a tight early open',
        range: EARLY_PREMIUM,
        helperText: 'Tap each of the seven hands listed. Pairs run down the diagonal; suited hands sit above it, offsuit below.',
      },
      answer: { hands: EARLY_PREMIUM },
      feedback: {
        correct: 'Nice. Those are the kind of premium hands you can open from any seat, even the earliest.',
        incorrect: 'Tap exactly the seven listed hands: the big pairs (AA, KK, QQ, JJ) plus AKs, AKo, and AQs.',
        hints: [
          'The four pairs (AA, KK, QQ, JJ) are on the diagonal, top-left.',
          'AKs sits just above the diagonal; AKo sits just below it.',
          'AQs is one column to the right of AKs in the top (Ace) row.',
        ],
        why: 'The big **pocket pair**s and the best **broadway** hands are strong enough to open from **any** position. Keeping the earliest range this tight avoids the spots where weaker hands get dominated out of position.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Reading the 13x13 grid',
      content: `Every two-card starting hand falls into one of **169** classes, shown on a 13 by 13 grid:

- The **diagonal** is the **pocket pairs**: AA, KK, all the way to 22.
- **Above** the diagonal are the **suited** hands, written with an "s" (AKs).
- **Below** the diagonal are the **offsuit** hands, written with an "o" (AKo).

There are more offsuit combinations than suited ones, but **suited** hands play a little better because they can make a **flush**. As you move from early to late position, your range grows down and to the right: more pairs, more suited hands, then the offsuit broadways.

You do not need to memorize the grid. It is just a map: pairs on the diagonal, suited above it, offsuit below.`,
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        'It folds to you on the button (last to act). Is that same K-9 suited in a sensible button opening range now?',
      interaction: 'range-grid',
      concepts: ['position', 'preflop-ranges'],
      config: {
        mode: 'is-hand-in-range',
        rangeName: 'a button open',
        range: BTN_OPEN,
        hand: 'K9s',
        helperText: 'On the button you act last after the flop, so you can open a much wider range.',
      },
      answer: { inRange: true },
      feedback: {
        correct: 'Yes. The same hand that folds under the gun is a clear open on the button, because position widens your range.',
        incorrect:
          'On the button you open a wide range. K-9 suited is comfortably **in** a button opening range, even though it folds under the gun.',
        hints: [
          'The button is the best seat: you act last on every street after the flop.',
          'A wider range means more suited hands like K-9 suited get to open.',
          'Compare this tinted range to the tight early one from before.',
        ],
        why: 'The **button** is the most profitable seat because you act last after the flop. That edge lets you open a far **wider** range, so a hand like K-9s that you fold under the gun becomes a routine open here. Same cards, different **position**, different decision.',
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt: 'Tap every pocket pair on the grid, from Aces down to deuces.',
      interaction: 'range-grid',
      concepts: ['preflop-ranges'],
      config: {
        mode: 'select-range',
        rangeName: 'all pocket pairs',
        range: PAIRS,
        helperText: 'The pocket pairs are the hands where both cards are the same rank.',
      },
      answer: { hands: PAIRS },
      feedback: {
        correct: 'Correct. All 13 pocket pairs live on the diagonal of the grid.',
        incorrect: 'The pocket pairs are the 13 cells running diagonally from AA in the top-left to 22 in the bottom-right.',
        hints: [
          'A pocket pair is two cards of the same rank, like 88.',
          'They form a straight line across the grid.',
          'Start at AA in the top-left corner and follow the diagonal to 22.',
        ],
        why: 'The **pocket pair**s sit on the **diagonal** because that is where the first rank equals the second rank. There are 13 of them, one per rank, and they are the backbone of most opening ranges.',
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt: 'Back under the gun. Is pocket Nines (99) in a tight early-position opening range?',
      interaction: 'range-grid',
      concepts: ['preflop-ranges', 'position'],
      config: {
        mode: 'is-hand-in-range',
        rangeName: 'an early-position open',
        range: UTG_OPEN,
        hand: '99',
        helperText: 'Even a tight early range still opens the better pocket pairs.',
      },
      answer: { inRange: true },
      feedback: {
        correct: 'Right. A solid pair like Nines is strong enough to open even from under the gun.',
        incorrect: 'Pocket Nines is a strong pair that opens from any seat, so it is **in** the early range.',
        hints: [
          'Pocket Nines is a strong, ready-made hand before the flop.',
          'Tight early ranges still include the better pairs.',
          'Find 99 on the diagonal and compare it to the tinted cells.',
        ],
        why: 'Medium and high **pocket pair**s open from early position because they are already a made hand and can flop a **set**. A tight range trims weak suited and offsuit hands first, not its good pairs.',
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        'Under the gun, it is your turn first and you look down at the Ace and King of spades. The blinds are 5 and 10. What is the best action?',
      interaction: 'betting-round',
      concepts: ['preflop-ranges', 'position'],
      config: {
        hole: ['AS', 'KS'],
        board: [],
        street: 'preflop',
        pot: 15,
        heroStack: 500,
        villainStack: 500,
        facing: { action: 'bet', amount: 10 },
        sizingOptions: [0.5, 0.75, 1],
        seed: 401,
        task: 'choose-action',
        helperText:
          'You are first to act under the gun. There is 15 in the blinds and 10 to call. You can fold, call 10, or raise (open).',
      },
      answer: { action: 'raise' },
      feedback: {
        correct: 'Yes. A-K suited is at the very top of every range, so you **open** it with a raise even from under the gun.',
        incorrect:
          'A-K suited is a premium hand and the cornerstone of an early range. Open it with a **raise** rather than calling or folding.',
        hints: [
          'A-K suited is one of the strongest starting hands you can hold.',
          'Being first to raise is called an open.',
          'Premium hands raise from any seat, including under the gun.',
        ],
        why: 'A-K suited is a **premium** hand that belongs in even the tightest early **range**. The right play is to **raise (open)**, building the pot while you are ahead, rather than limping or folding a top hand.',
      },
    },
  ],
}
