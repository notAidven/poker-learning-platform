import { cardsByRank } from '../../types/lesson'
import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson "Combinatorics & Blockers" (Section 4 · Advanced Play), the fourth Advanced
 * lesson. It teaches counting hand combinations and how cards in your hand remove an
 * opponent's combos:
 *   1. Combinatorics: a specific pocket PAIR = 6 combos (choose 2 of its 4 cards), a
 *      SUITED hand = 4 (one per suit), an OFFSUIT hand = 12 (4x4 minus the 4 suited).
 *      All 169 classes sum to 1326 = C(52,2) (research / poker-math combinatorics).
 *   2. Blockers: holding an Ace cuts the opponent's AA combos from 6 to 3 and removes
 *      an ace from their AK combos, which strengthens bluffs and big calls.
 *
 * Reuses `card-deck` (tap a rank, with the numeric count) and `compare-events` (compare
 * combo counts and blocker effects). 6 problems / 8 steps = 75% interactive; concepts
 * never run back-to-back. ASCII only. Keep `id: 'adv-combos'`.
 */
export const advCombos: LessonDefinition = {
  id: 'adv-combos',
  title: 'Combinatorics & Blockers',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Counting combos',
      content: `There are **1326** ways to be dealt two cards. Sorted into the 169 starting-hand classes, each class has a fixed number of **combinations** (combos):

- A specific **pocket pair** (like KK): **6** combos. You choose 2 of its 4 cards.
- A specific **suited** hand (like AKs): **4** combos, one per suit.
- A specific **offsuit** hand (like AKo): **12** combos. That is 4 x 4 ways, minus the 4 suited ones.

So offsuit hands are the **most** common kind, and pairs the **rarest**. Counting combos is how you measure how likely a particular holding is.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'Each rank has four cards, one per suit. Tap all four Aces, then enter how many there are.',
      interaction: 'card-deck',
      concepts: ['combinatorics'],
      config: {
        helperText: 'The four Aces are the building blocks of every Ace-x combo.',
        selectionLabel: 'Your selection (the Aces)',
        countLabel: 'How many Aces are in the deck?',
      },
      answer: { cards: cardsByRank('A'), count: 4 },
      feedback: {
        correct: 'Right. Four of every rank. That is why pairs, suited, and offsuit hands have the combo counts they do.',
        incorrect: 'There is one Ace in each of the four suits, so there are 4 Aces in the deck.',
        hints: [
          'Every rank appears once in each suit.',
          'There are four suits: spades, hearts, diamonds, clubs.',
          'So how many Aces total?',
        ],
        why: 'Each rank has exactly **4** cards (one per suit). That is the starting point for every combo count: a pair picks 2 of those 4 (**6** ways), a suited hand pairs matching suits (**4** ways), and an offsuit hand mixes suits (**12** ways).',
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt: 'Which specific starting hand has MORE combinations?',
      interaction: 'compare-events',
      concepts: ['combinatorics'],
      config: {
        chooseLabel: 'Which has more combos?',
        helperText: 'Count the ways each exact hand can be dealt.',
        eventA: {
          label: 'Pocket Kings (KK)',
          detail: '6 combos: choose 2 of the 4 Kings.',
        },
        eventB: {
          label: 'A-K suited (AKs)',
          detail: '4 combos: one for each suit.',
        },
      },
      answer: { more: 'a' },
      feedback: {
        correct: 'Right. A pocket pair is 6 combos, a suited hand only 4, so Kings has more.',
        incorrect: 'A specific pair is 6 combos; a specific suited hand is only 4. Pocket Kings has more.',
        hints: [
          'A pocket pair chooses 2 of its 4 cards.',
          'A suited hand has one combo per suit.',
          'Compare 6 versus 4.',
        ],
        why: 'A specific **pair** has $\\binom{4}{2} = 6$ combos, while a specific **suited** hand has only **4** (one per suit). So before any cards are seen, a pair like KK is a bit more likely than a single suited hand like AKs.',
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt: 'Same two ranks, A and K. Which version has MORE combinations?',
      interaction: 'compare-events',
      concepts: ['combinatorics'],
      config: {
        chooseLabel: 'Which has more combos?',
        helperText: 'Compare the offsuit version with the suited version.',
        eventA: {
          label: 'A-K offsuit (AKo)',
          detail: '12 combos: 4 x 4 minus the 4 suited.',
        },
        eventB: {
          label: 'A-K suited (AKs)',
          detail: '4 combos: one per suit.',
        },
      },
      answer: { more: 'a' },
      feedback: {
        correct: 'Right. Offsuit is 12 combos versus only 4 suited, so the offsuit version is three times as common.',
        incorrect: 'A specific offsuit hand is 12 combos; the suited version is only 4. Offsuit has more.',
        hints: [
          'Offsuit means the two cards have different suits.',
          'There are 4 x 4 = 16 ways to pair the ranks, and 4 of those are suited.',
          '16 minus 4 leaves how many offsuit combos?',
        ],
        why: 'A specific **offsuit** hand has **12** combos ($4 \\times 4 - 4$), three times the **4** of its suited twin. That is why, when you put an opponent on Ace-King, the offsuit version is far more likely than the suited one.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Blockers',
      content: `A **blocker** is a card in **your** hand that removes combos from your opponent's range.

Say you hold the **Ace of spades**. Now the opponent:

- can have only **3** combos of pocket Aces instead of 6 (you hold one of the four Aces), and
- has fewer **A-K** combos, because one Ace is gone.

Blockers make your **bluffs** and big **calls** better. If you hold a card that blocks the strong hands that would call you (or beat you), there are simply fewer of those hands left, so your aggressive line works more often. Counting combos is how you measure a blocker.`,
    },
    {
      type: 'problem',
      id: 'p4',
      prompt:
        'You hold the Ace of spades. Tap the three OTHER Aces an opponent could still be dealt, then enter how many there are.',
      interaction: 'card-deck',
      concepts: ['blockers'],
      config: {
        helperText: 'You are holding one Ace, so it is no longer available to anyone else.',
        selectionLabel: 'Aces still available',
        countLabel: 'How many Aces can the opponent still have?',
      },
      answer: { cards: ['AH', 'AD', 'AC'], count: 3 },
      feedback: {
        correct: 'Right. Only 3 Aces remain, so the opponent can make pocket Aces just 3 ways instead of 6.',
        incorrect:
          'You hold the Ace of spades, so the three remaining Aces are hearts, diamonds, and clubs. That leaves 3.',
        hints: [
          'You are holding the Ace of spades yourself.',
          'Tap only the Aces that are still in the deck for others.',
          'Four Aces minus the one you hold leaves how many?',
        ],
        why: 'Holding the **Ace of spades** removes it from everyone else. With only **3** Aces left, the opponent can make pocket Aces just $\\binom{3}{2} = 3$ ways instead of 6. That is a **blocker** cutting their combos in half.',
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt: 'You hold the Ace of spades. Which premium pair do you BLOCK for your opponent?',
      interaction: 'compare-events',
      concepts: ['blockers', 'combinatorics'],
      config: {
        chooseLabel: 'Which hand does your Ace block?',
        helperText: 'A blocker removes combos only of hands that use that card.',
        eventA: {
          label: 'Pocket Aces (AA)',
          detail: 'You hold an Ace, so AA drops from 6 combos to 3.',
        },
        eventB: {
          label: 'Pocket Kings (KK)',
          detail: 'You hold no King, so KK still has all 6 combos.',
        },
      },
      answer: { more: 'a' },
      feedback: {
        correct: 'Right. Your Ace blocks AA (down to 3 combos) but does nothing to KK.',
        incorrect:
          'A blocker only removes hands that use the card you hold. Your Ace cuts AA from 6 combos to 3; it does not touch KK.',
        hints: [
          'A blocker only affects hands containing that exact card.',
          'You hold an Ace, not a King.',
          'Which pair needs an Ace?',
        ],
        why: 'A **blocker** only removes combos of hands that contain your card. The Ace of spades cuts pocket **Aces** from 6 to 3 combos, but pocket **Kings** is untouched (you hold no King). Knowing which hands you block is what makes blockers useful.',
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        'The board shows three clubs and you are thinking about bluffing. Why does holding the Ace of clubs help your bluff?',
      interaction: 'compare-events',
      concepts: ['blockers'],
      config: {
        chooseLabel: 'Why does the Ace of clubs help?',
        helperText: 'Think about which hands the opponent can have, and which would call you.',
        eventA: {
          label: 'It blocks the nut flush',
          detail: 'They cannot hold the Ace-high flush, so they have fewer strong clubs to call with.',
        },
        eventB: {
          label: 'It gives you a made flush',
          detail: 'One club is not a flush, so this does nothing for your hand.',
        },
      },
      answer: { more: 'a' },
      feedback: {
        correct: 'Right. Holding the Ace of clubs means the opponent cannot have the nut flush, so a bluff works more often.',
        incorrect:
          'One Ace of clubs is not a flush. Its value is as a BLOCKER: the opponent cannot have the nut flush, so fewer strong hands call your bluff.',
        hints: [
          'A single club does not make you a flush.',
          'Think about the best flush the opponent could hold.',
          'If you hold the Ace of clubs, can they have the nut flush?',
        ],
        why: 'Holding the **Ace of clubs** on a three-club board is a powerful **blocker**: the opponent cannot have the **nut flush**, so there are fewer strong clubs in their calling range. That makes a bluff more likely to succeed, even though your single club is no hand by itself.',
      },
    },
  ],
}
