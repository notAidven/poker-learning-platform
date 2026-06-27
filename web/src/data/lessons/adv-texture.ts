import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson "Board Texture & C-Betting" (Section 4 · Advanced Play), the second Advanced
 * lesson. It teaches reading the flop and the continuation bet:
 *   1. Board texture: DRY (uncoordinated, rainbow, few draws) vs WET (connected/suited,
 *      many draws). Dry boards favor the preflop raiser; wet boards help the caller.
 *   2. C-betting: as the preflop raiser you often bet again on the flop. Bet SMALL and
 *      often on dry boards; size UP on wet boards (protection/value); do not auto-c-bet
 *      pure air into a board that smashes the caller (research 04 §3.1 TAG c-bet model).
 *
 * Reuses `board-dealer` (deal + read a flop), `compare-events` (which board is wetter),
 * and `betting-round` (choose-action / choose-size for the c-bet). 6 problems / 8 steps
 * = 75% interactive; concepts never run back-to-back. ASCII only. Keep `id: 'adv-texture'`.
 */
export const advTexture: LessonDefinition = {
  id: 'adv-texture',
  title: 'Board Texture & C-Betting',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Dry boards and wet boards',
      content: `Once the flop lands, read its **texture**, how many strong hands and draws it brings.

- A **dry** board is uncoordinated: spread-out ranks, mixed suits (a **rainbow**), few straight or flush draws. Example: K-7-2 with three suits.
- A **wet** board is coordinated: connected ranks and matching suits, so many straights and flushes are possible. Example: 9-8-7 with two of a suit.

Dry boards tend to favor the **preflop raiser**, because high cards hit a tight opening range. Wet boards help the **caller**, whose range has more connected hands. Texture should drive how you bet.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt:
        'You raised before the flop with the Ace and King of spades. Deal the flop, then name your best hand.',
      interaction: 'board-dealer',
      concepts: ['board-texture'],
      config: {
        hole: ['AS', 'KH'],
        board: ['KD', '7C', '2S'],
        streets: ['flop'],
        askBestHandAt: ['flop'],
        helperText: 'A dry, rainbow flop: three different suits and spread-out ranks.',
      },
      answer: { bestHandByStreet: { flop: 'pair' } },
      feedback: {
        correct: 'Right. You flopped **top pair** with the best kicker on a dry board, a great hand to bet.',
        incorrect: 'Your King pairs the board, giving you one pair (top pair, top kicker). The board is dry, so no straights or flushes are out there yet.',
        hints: [
          'Your King matches the King on the board.',
          'Matching one board card makes one pair.',
          'No suit appears three times and the ranks are spread out, so it is just a pair.',
        ],
        why: 'A-K on a K-7-2 rainbow gives you **top pair, top kicker**, a strong made hand. Because the board is **dry**, there are no flush draws and almost no straight draws, so your hand is very likely the best right now.',
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt: 'Both flops are shown below. Which board is WETTER, with more possible draws?',
      interaction: 'compare-events',
      concepts: ['board-texture'],
      config: {
        chooseLabel: 'Which board is wetter?',
        helperText: 'A wetter board has more straights and flushes available.',
        eventA: {
          label: 'K-7-2 rainbow',
          detail: 'Three different suits, spread-out ranks. Hard to draw to.',
          cards: ['KS', '7H', '2D'],
        },
        eventB: {
          label: '9-8-7 with two hearts',
          detail: 'Connected ranks and a flush draw possible. Lots of draws.',
          cards: ['9H', '8H', '7S'],
        },
      },
      answer: { more: 'b' },
      feedback: {
        correct: 'Right. The connected, two-suit 9-8-7 is far wetter than the spread-out rainbow K-7-2.',
        incorrect:
          'The 9-8-7 board is connected and two-suited, so many straights and flush draws are live. That makes it the wetter board.',
        hints: [
          'Wet means lots of straights and flushes are possible.',
          'Which board has connected ranks and two cards of one suit?',
          'A rainbow of spread-out ranks gives very few draws.',
        ],
        why: 'Connected ranks (9-8-7) plus two cards of one suit create many **straight** and **flush** draws, so that board is **wet**. A spread-out rainbow like K-7-2 offers almost no draws, so it is **dry**.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'The continuation bet',
      content: `When you raise before the flop and then bet the flop, that is a **continuation bet**, or **c-bet**. It keeps the pressure on and wins many pots outright.

Let the **texture** pick your size:

- On a **dry** board, a **small** c-bet (about a third of the pot) is enough. Few draws can call, so you do not need to charge them much.
- On a **wet** board, size **up** (two-thirds or more) when you have a strong hand, to charge the draws and build the pot.
- Do not auto-c-bet **pure air** into a wet board that helps your opponent. Checking is fine.`,
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        'Same dry K-7-2 flop, and you hold top pair with the Ace and King. It is checked to you. What is the best action?',
      interaction: 'betting-round',
      concepts: ['c-betting'],
      config: {
        hole: ['AS', 'KH'],
        board: ['KD', '7C', '2S'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        villainAction: 'call',
        seed: 421,
        task: 'choose-action',
        helperText: 'No bet faces you, so your choices are check or bet.',
      },
      answer: { action: 'bet' },
      feedback: {
        correct: 'Yes. With top pair on a dry board as the preflop raiser, **c-bet** for value.',
        incorrect:
          'You have top pair on a dry board and you were the raiser. This is a clear **continuation bet** for value.',
        hints: [
          'You were the preflop raiser, so betting again is a continuation bet.',
          'Top pair, top kicker is well ahead on this board.',
          'Betting charges worse hands and builds the pot while you are ahead.',
        ],
        why: 'As the **preflop raiser** with **top pair**, betting a dry board is a textbook **c-bet**: you get value from worse pairs and draws, and the dry texture means you are rarely behind.',
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt: 'You decide to c-bet that dry K-7-2 board. The pot is 60. Which sizing fits a dry board best?',
      interaction: 'betting-round',
      concepts: ['c-betting', 'bet-sizing'],
      config: {
        hole: ['AS', 'KH'],
        board: ['KD', '7C', '2S'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.33, 0.5, 0.75],
        villainAction: 'call',
        seed: 422,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.33, sizeTolerance: 0.05 },
      feedback: {
        correct: 'Right. A small, one-third-pot c-bet is plenty on a dry board.',
        incorrect:
          'On a dry board with few draws, a **small** bet (about a third of the pot) does the job. You do not need to bet big.',
        hints: [
          'Few draws can continue on a dry board.',
          'You do not need to charge a big price when nothing is chasing.',
          'Pick the smallest of the three sizes.',
        ],
        why: 'On a **dry** board there is little for opponents to draw to, so a **small** c-bet (about one-third pot) gets called by worse hands and risks fewer chips. Save the big sizes for wet boards.',
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt:
        'New flop, 9-8-7 with two clubs, very wet. You hold pocket Aces (an overpair). It is checked to you. The pot is 60. Which sizing fits this wet board?',
      interaction: 'betting-round',
      concepts: ['c-betting', 'bet-sizing'],
      config: {
        hole: ['AH', 'AD'],
        board: ['9C', '8C', '7D'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        villainAction: 'call',
        seed: 423,
        task: 'choose-size',
      },
      answer: { sizeFraction: 0.75, sizeTolerance: 0.05 },
      feedback: {
        correct: 'Yes. On a wet board with a strong hand, size up (about three-quarters pot) to charge the draws.',
        incorrect:
          'A wet board is full of draws. With a strong hand you should size **up** (about three-quarters pot) to make those draws pay.',
        hints: [
          'This board has straight and flush draws everywhere.',
          'A bigger bet makes drawing hands pay a worse price.',
          'Choose the larger sizing here, not the smallest.',
        ],
        why: 'On a **wet** board, draws have real equity against your overpair. A **larger** bet (about three-quarters pot) charges those draws a bad price and builds the pot while you are ahead. Small bets let draws continue too cheaply.',
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        'Same wet 9-8-7 board, but now you hold the Ace and King of spades, just ace-high with no pair and no draw. It is checked to you. What is the best action?',
      interaction: 'betting-round',
      concepts: ['c-betting'],
      config: {
        hole: ['AS', 'KD'],
        board: ['9C', '8C', '7D'],
        street: 'flop',
        pot: 60,
        heroStack: 400,
        villainStack: 400,
        sizingOptions: [0.5, 0.75, 1],
        seed: 424,
        task: 'choose-action',
        helperText: 'No bet faces you, so your choices are check or bet.',
      },
      answer: { action: 'check' },
      feedback: {
        correct: 'Right. With pure air on a board that smashes your opponent, do not auto-c-bet. **Check**.',
        incorrect:
          'You have no pair and no draw on a very wet board that helps the caller. Auto-c-betting here just burns chips, so **check**.',
        hints: [
          'You have no pair and no draw on this board.',
          'A 9-8-7 two-suit board connects with many of the hands that called you.',
          'Betting air into a board that helps your opponent is a common leak.',
        ],
        why: 'Not every flop is a good c-bet. With **pure air** on a **wet** board that connects with the caller, betting rarely makes worse hands fold or better hands call. **Checking** keeps the pot small and saves chips for spots with equity or fold equity.',
      },
    },
  ],
}
