import type { LessonDefinition } from '../../types/lesson'
import { cardsBySuit, cardsByRank } from '../../types/lesson'

/**
 * Lesson 1: "Poker & the Deck" (design doc §6, Lesson 1).
 *
 * Objectives (true beginner, no prior poker knowledge): learn the 52-card deck
 * (ranks + suits), the goal of a hand, and the core Hold'em structure: 2 hole
 * cards + 5 community cards, from which you build a 5-card hand. The big idea to
 * cement: your hand is five of seven, using both / one / none of your hole cards
 * ("playing the board").
 *
 * Pedagogical ordering rule: hand *rankings* (which five-card hand is "best") are
 * not taught until Lesson 2, so NO Lesson 1 problem may require judging which hand
 * is best. The build steps are therefore framed by a rank-agnostic *pattern*
 * ("tap five cards that all share one suit"), which the learner can solve purely by
 * matching suits. The goal ("make the best five-card hand to win the pot") is still
 * stated in the concepts, with an explicit forward-reference to Lesson 2.
 *
 * Ratio: 6 problems / 8 steps = 75% interactive. Concepts never sit back-to-back.
 * Keep `id: '1'` / export `lesson1`.
 */
export const lesson1: LessonDefinition = {
  id: '1',
  title: 'Poker & the Deck',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Poker and the deck',
      content: `Poker uses a standard **52-card deck**: 13 ranks (2, 3, …, 10, J, Q, K, A) in four suits: spades ♠, hearts ♥, diamonds ♦, clubs ♣.

Suits don't beat each other. Only the **ranks** and the **patterns** you make matter. The goal of a hand is to win the **pot** (all the chips bet), usually by making the best five-card hand.

This course teaches **Texas Hold'em**, the most popular kind of poker.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'Get to know the deck. Tap **every heart**, then enter how many there are.',
      interaction: 'card-deck',
      config: {
        helperText: 'Hearts are one of the four suits.',
        selectionLabel: 'Your selection (the hearts)',
        countLabel: 'How many hearts are in the deck?',
      },
      answer: { cards: cardsBySuit('H'), count: 13 },
      feedback: {
        correct: 'There are **13 hearts**. Every suit runs 2 through Ace, which is 13 cards.',
        incorrect: 'Each suit has 13 cards (2–10, J, Q, K, A). Tap all the hearts.',
        hints: [
          'A suit goes from 2 all the way up to Ace.',
          'That is 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A.',
          'Count those ranks to see how many are in each suit.',
        ],
        why: 'The deck splits into 4 suits of 13 cards each, and 4 times 13 makes 52. Hearts are one of those four suits, so there are 13 of them.',
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt: 'Now tap **all the Aces**, then enter how many there are.',
      interaction: 'card-deck',
      config: {
        helperText: 'The same rank appears once in each suit.',
        selectionLabel: 'Your selection (the Aces)',
        countLabel: 'How many Aces are in the deck?',
      },
      answer: { cards: cardsByRank('A'), count: 4 },
      feedback: {
        correct: 'Four Aces, one in each suit. Every rank appears exactly **4 times**.',
        incorrect: 'There is one Ace in each of the 4 suits, so there are 4 Aces.',
        hints: [
          'How many suits are there?',
          'Each rank shows up once per suit.',
          'There is exactly one Ace in each suit.',
        ],
        why: 'The other way to split the deck: 13 ranks, each appearing once in all 4 suits, so 13 times 4 makes 52. That is why there are exactly 4 Aces, and 4 of every rank.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Hole cards and the board',
      content: `In Texas Hold'em you get **2 private cards**, called your **hole cards**. Then up to **5 shared cards**, the **community cards**, are dealt face-up for everyone.

Your hand is the best **five-card combination** from those **7 cards** (2 + 5). Key beginner point: you may use **both, one, or none** of your hole cards. If the five community cards already make your whole hand, that is fine. It is called **playing the board**.

*Which* five-card hand wins (the ranking for what counts as "best") is the **next lesson**. For now, just get comfortable building five cards from seven and spotting simple patterns, like five cards that share a suit.`,
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        'Deal a full hand: reveal your **2 hole cards**, then the **flop**, **turn**, and **river**. Watch all 7 cards appear.',
      interaction: 'board-dealer',
      config: {
        hole: ['AS', 'KD'],
        board: ['QH', '9C', '4D', '7S', '2H'],
        streets: ['preflop', 'flop', 'turn', 'river'],
        annotateStreets: true,
        helperText: 'Tap to deal each stage until all 7 cards are out.',
      },
      answer: { minStreetsRevealed: 4 },
      feedback: {
        correct: 'A complete hand: **2 hole cards + 5 community cards = 7 cards** to work with.',
        incorrect: 'Keep dealing until all five community cards (flop, turn, river) are out.',
        hints: [
          'Tap to deal the next stage.',
          'The board comes out as 3 cards (flop), then 1 (turn), then 1 (river).',
          'Reveal every street so all 7 cards are showing.',
        ],
        why: 'Every Hold\'em hand gives you the same raw material: 2 private hole cards + 5 shared community cards. You build your five-card hand from these 7. (The betting that happens between stages comes in a later lesson.)',
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt:
        'Your **hole cards** are the **A♥** and **J♥**. From all **7 cards**, build a five-card hand by tapping **five cards that all share one suit**.',
      interaction: 'hand-ranker',
      config: {
        mode: 'build-hand',
        targetCategory: 'flush',
        pool: ['AH', 'JH', 'KS', '9H', '4C', '6H', '3H'],
        helperText: 'Find the one suit you have five of, then tap exactly those five.',
      },
      answer: { cards: ['AH', 'JH', '9H', '6H', '3H'], category: 'flush' },
      feedback: {
        correct:
          'Five cards of one suit make a **flush**. Both your hole hearts joined three hearts on the board, so you used **both** hole cards.',
        incorrect:
          'All five cards must match the same suit. Find the suit you can collect five of, and tap exactly those five.',
        hints: [
          'Count how many cards you hold of each suit.',
          'Only one suit reaches five cards; the others fall short.',
          'Tap all five cards of that one suit.',
        ],
        why: 'From 7 cards you pick **5** to make your hand. Five of one suit is a **flush** (one of the patterns you will rank next lesson). Here only the hearts reach five, and both of yours are hearts, so this hand uses **both** hole cards.',
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt:
        'New hand. Your **hole cards** are the **A♦** and **9♣**. Again, tap a **five-card hand whose five cards all share one suit**.',
      interaction: 'hand-ranker',
      config: {
        mode: 'build-hand',
        targetCategory: 'flush',
        pool: ['AD', '9C', 'KD', '8D', '7S', '5D', '2D'],
        helperText: 'Find the suit with five cards, then notice which of your hole cards actually fit it.',
      },
      answer: { cards: ['AD', 'KD', '8D', '5D', '2D'], category: 'flush' },
      feedback: {
        correct:
          'Five of one suit again, a **flush**. Only your A♦ fit. Your 9♣ did not, so this hand uses just **one** of your two hole cards.',
        incorrect:
          'Look for the suit you can find five of. One of your hole cards fits it and one does not, so take the five matching cards.',
        hints: [
          'Which suit appears five times across the seven cards?',
          'Check each hole card: does it share that suit?',
          'Tap the five cards of that suit. Only one hole card belongs.',
        ],
        why: 'You may use **both, one, or none** of your hole cards. Here the five-of-one-suit hand needs your A♦ but not your 9♣, so you build the five using **one** hole card. The 9♣ simply sits out.',
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        'Last hand. Your **hole cards** are the **7♣** and **2♦**. Once more, tap a **five-card hand whose five cards all share one suit**.',
      interaction: 'hand-ranker',
      config: {
        mode: 'build-hand',
        targetCategory: 'flush',
        pool: ['7C', '2D', 'AS', 'QS', '9S', '5S', '3S'],
        helperText: 'Find the suit with five cards, then check whether your hole cards are part of it.',
      },
      answer: { cards: ['AS', 'QS', '9S', '5S', '3S'], category: 'flush' },
      feedback: {
        correct:
          'The five matching cards are all **community cards**, so you used **neither** hole card. When the shared board already makes your whole hand, that is **playing the board**.',
        incorrect:
          'Find the suit with five cards. Your 7♣ and 2♦ are not that suit, so all five matching cards are on the board.',
        hints: [
          'Which suit shows up five times?',
          'Are your hole cards (7♣, 2♦) that suit?',
          'All five matching cards are community cards, so tap those five.',
        ],
        why: 'Across these three hands you used **both**, then **one**, then **none** of your hole cards, always just **five of your seven**. Here the five community cards already share a suit, so your hole cards add nothing and you **play the board**. That busts the myth that you must use your own two cards. (Which five-card hand is strongest is the next lesson.)',
      },
    },
  ],
}
