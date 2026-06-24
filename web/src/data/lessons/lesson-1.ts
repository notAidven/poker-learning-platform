import type { LessonDefinition } from '../../types/lesson'
import { cardsBySuit, cardsByRank } from '../../types/lesson'

/**
 * Lesson 1 — "Poker & the Deck" (design doc §6, Lesson 1).
 *
 * Objectives (true beginner, no prior poker knowledge): learn the 52-card deck
 * (ranks + suits), the goal of a hand, and the core Hold'em structure — 2 hole
 * cards + 5 community cards, from which you make the best 5-card hand. The big
 * idea to cement: your hand is the best *five of seven*, using both / one / none
 * of your hole cards ("playing the board").
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
      content: `Poker is played with a standard **52-card deck**: 13 ranks (2, 3, …, 10, J, Q, K, A) in four suits — spades ♠, hearts ♥, diamonds ♦, clubs ♣.

Suits don't outrank one another; only the **ranks** and the **patterns** you make matter. The goal of a hand is to win the **pot** (the chips at stake), usually by making the best five-card hand.

This course teaches **Texas Hold'em**, the most popular form of poker.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'Get to know the deck — tap **every heart**, then enter how many there are.',
      interaction: 'card-deck',
      config: {
        helperText: 'Hearts are one of the four suits.',
        selectionLabel: 'Your selection (the hearts)',
        countLabel: 'How many hearts are in the deck?',
      },
      answer: { cards: cardsBySuit('H'), count: 13 },
      feedback: {
        correct: 'There are **13 hearts** — every suit runs 2 through Ace, which is 13 cards.',
        incorrect: 'Each suit has 13 cards (2–10, J, Q, K, A). Tap all the hearts.',
        hints: [
          'A suit goes from 2 all the way up to Ace.',
          'That is 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A.',
          'Thirteen cards in every suit.',
        ],
        why: 'The deck splits into 4 suits of 13 cards each: $4 \\times 13 = 52$. Hearts are one of those four suits, so there are 13 of them.',
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt: 'Now tap **all four Aces**, then enter how many there are.',
      interaction: 'card-deck',
      config: {
        helperText: 'The same rank appears once in each suit.',
        selectionLabel: 'Your selection (the Aces)',
        countLabel: 'How many Aces are in the deck?',
      },
      answer: { cards: cardsByRank('A'), count: 4 },
      feedback: {
        correct: 'Four Aces — one in each suit. Every rank appears exactly **4 times**.',
        incorrect: 'There is one Ace in each of the 4 suits, so there are 4 Aces.',
        hints: [
          'How many suits are there?',
          'Each rank shows up once per suit.',
          'Four suits → four Aces.',
        ],
        why: 'The other way to split the deck: 13 ranks, each appearing once in all 4 suits, so $13 \\times 4 = 52$. That is why there are exactly 4 Aces — and 4 of every rank.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Hole cards and the board',
      content: `In Texas Hold'em you are dealt **2 private cards** — your **hole cards** — that only you can use. Then up to **5 shared cards**, the **community cards** (or "the board"), are dealt face-up for everyone.

Your hand is the **best five-card combination** you can make from those **7 cards** (2 + 5).

A key beginner point: you may use **both, one, or none** of your hole cards. If the five community cards are already your best hand, that is fine — it's called **playing the board**.`,
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
        why: 'Every Hold\'em hand gives you the same raw material: 2 private hole cards + 5 shared community cards. You build your best five-card hand from these 7. (The betting that happens between stages comes in a later lesson.)',
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt: 'Here are your 7 cards (2 hole + 5 community). Tap the **best 5-card hand** you can make.',
      interaction: 'hand-ranker',
      config: {
        mode: 'pick-best-five',
        cards: ['AH', 'KH', '9H', '5H', '2H', '8S', '3C'],
        helperText: 'You may use any five of the seven cards.',
      },
      answer: { cards: ['AH', 'KH', '9H', '5H', '2H'] },
      feedback: {
        correct: 'Five hearts make a **flush** — the strongest five-card hand hiding in these seven.',
        incorrect: 'Look for five cards of one suit. Five hearts beat any other combination here.',
        hints: [
          'Scan all 7 cards for a pattern.',
          'Count the hearts.',
          'Five of one suit is a flush — take the five hearts.',
        ],
        why: 'Your hand is the **best 5 of 7**. Five of these cards are hearts, forming a flush. (Why a flush is strong comes next lesson — for now, the skill is choosing the best five.)',
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt: 'New hand — your hole cards look weak. Tap the **best 5** from all 7.',
      interaction: 'hand-ranker',
      config: {
        mode: 'pick-best-five',
        cards: ['7C', '2D', 'AS', 'KS', 'QS', 'JS', '10S'],
        helperText: 'Your hole cards are the 7♣ and 2♦. Do they help?',
      },
      answer: { cards: ['AS', 'KS', 'QS', 'JS', '10S'] },
      feedback: {
        correct: 'The five community spades (A-K-Q-J-10) are the best hand — your hole cards do not help. This is **playing the board**.',
        incorrect: 'Your hole cards (7♣, 2♦) do not improve anything. The five community cards already make the best hand.',
        hints: [
          'Your two hole cards are a 7 and a 2 — do they fit any pattern?',
          'Look at the five community cards together.',
          'The best five are all on the board — use none of your hole cards.',
        ],
        why: 'You can use **both, one, or none** of your hole cards. Here the board itself is the best five-card hand, so you "play the board." That busts the common myth that you must use your hole cards.',
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt: 'One more — this time your hole cards matter. Tap the **best 5** from all 7.',
      interaction: 'hand-ranker',
      config: {
        mode: 'pick-best-five',
        cards: ['8H', '8D', '8S', 'KC', 'AH', '3D', '2C'],
        helperText: 'Your hole cards are the 8♥ and 8♦.',
      },
      answer: { cards: ['8H', '8D', '8S', 'AH', 'KC'] },
      feedback: {
        correct: 'Both your 8s plus the 8 on the board make **three of a kind**, with Ace-King kickers — you used both hole cards.',
        incorrect: 'You hold two 8s, and there is a third 8 on the board — that is three of a kind. Add the two highest other cards.',
        hints: [
          'What pair are you holding?',
          'Is there another card on the board that matches your pair?',
          'Three 8s, then the two highest remaining cards (Ace and King).',
        ],
        why: 'Sometimes your hole cards are the key: both 8s combine with the board\'s 8 for three of a kind. Across these three hands you used **none**, then **both** hole cards — always just the best five of seven.',
      },
    },
  ],
}
