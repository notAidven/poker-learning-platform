import type { LessonDefinition } from '../../types/lesson'

/**
 * Lesson 2: "Hand Rankings" (design doc §6, Lesson 2).
 *
 * Objectives: rank any hand into the 10 categories, explain why rarer = stronger,
 * and decide which of two hands wins (including kickers). Every hand-ranker problem
 * is validated by the pure evaluator in `lib/poker/handEvaluator.ts`; "which wins"
 * reuses the generic `compare-events` widget.
 *
 * Ratio: 9 problems / 11 steps ≈ 82% interactive. Concepts never sit back-to-back.
 * Keep `id: '2'` / export `lesson2`.
 */
export const lesson2: LessonDefinition = {
  id: '2',
  title: 'Hand Rankings',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'The ranking ladder',
      content: `Every poker hand falls into one of **ten categories**. A hand in a higher category *always* beats one in a lower category, no matter the cards inside it.

The ladder below runs from the strongest hand down to the weakest. Start with the two ends: a **royal flush is unbeatable**, and **high card is the floor** (the worst hand is 7-5-4-3-2). Tap any rung to flip up an example five-card hand.`,
    },
    {
      type: 'problem',
      id: 'l1',
      prompt: 'The ten categories, strongest at the top. A higher category always beats a lower one.',
      interaction: 'hand-ranking-ladder',
      config: {
        helperText:
          'Tap a hand to flip up an example. The further up the ladder, the rarer and stronger the hand.',
      },
      answer: { minExamplesRevealed: 1 },
      feedback: {
        correct:
          'A higher category always beats a lower one: a royal flush can’t lose, and high card is the floor.',
        incorrect: 'Tap any hand on the ladder to reveal its example cards.',
        hints: [
          'Tap a row to flip up an example five-card hand.',
          'The ladder runs strongest (top) to weakest (bottom).',
          'A higher category always beats a lower category, whatever the kickers.',
        ],
        why: 'The ladder is ordered by **rarity**: rarer hands sit higher and always beat more common ones. A royal flush is the rarest (and unbeatable); high card is the most common, so it is the floor.',
      },
    },
    {
      type: 'problem',
      id: 'p1',
      prompt: 'What hand does this make?',
      interaction: 'hand-ranker',
      config: {
        mode: 'identify-category',
        cards: ['AH', 'KH', '9H', '5H', '2H'],
        categories: ['flush', 'straight', 'two-pair', 'full-house', 'high-card'],
      },
      answer: { category: 'flush' },
      feedback: {
        correct: 'Five cards of one suit (and not in sequence) is a **flush**.',
        incorrect: 'Check the suits: all five cards are hearts, so this is a flush.',
        hints: [
          'Look at the suit of each card.',
          'All five cards are hearts.',
          'Recall what five cards of one suit, not in a row, are called.',
        ],
        why: 'A **flush** is any five cards of a single suit. These hearts (A-K-9-5-2) are not consecutive, so they make a plain flush rather than a straight flush.',
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt: 'What hand does this make?',
      interaction: 'hand-ranker',
      config: {
        mode: 'identify-category',
        cards: ['KS', 'KH', 'KD', '7C', '7S'],
        categories: ['full-house', 'trips', 'two-pair', 'flush', 'straight'],
      },
      answer: { category: 'full-house' },
      feedback: {
        correct: 'Three of a kind **plus** a pair is a **full house**: here, Kings full of Sevens.',
        incorrect:
          'There are three Kings *and* two Sevens. Three of a kind plus a pair is a full house, not just three of a kind.',
        hints: [
          'Count how many of each rank you see.',
          'Three Kings and two Sevens.',
          'Recall what three of a kind plus a pair is called.',
        ],
        why: 'It is tempting to stop at "three Kings" and call this three of a kind, but the extra **pair** of Sevens upgrades it to a **full house**, which ranks higher. The shape is always **3 + 2**.',
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt: 'Put these categories in order, strongest at the top.',
      interaction: 'hand-ranker',
      config: {
        mode: 'order-categories',
        categories: ['straight', 'full-house', 'two-pair', 'flush', 'pair'],
        helperText: 'Use the arrows to move each row up or down.',
      },
      answer: { categoryOrder: ['full-house', 'flush', 'straight', 'two-pair', 'pair'] },
      feedback: {
        correct: 'Full house → flush → straight → two pair → one pair. A higher category always wins.',
        incorrect: 'Not quite. Remember: full house beats flush, and flush beats straight.',
        hints: [
          '"Full beats Flush": full house sits above flush.',
          '"Feeling Flush beats a Straight": flush sits above straight.',
          'Two pair beats one pair, and both sit below a straight.',
        ],
        why: 'By rarity: a full house ($3{,}744$ ways) is rarer than a flush ($5{,}108$), which is rarer than a straight ($10{,}200$), then two pair ($123{,}552$), then one pair ($1{,}098{,}240$). Rarer = stronger.',
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Rarer = stronger',
      content: `The ladder is ordered by **how hard each hand is to deal**. Of the $2{,}598{,}960$ different five-card hands, only $5{,}108$ are a flush ($\\approx 0.2\\%$) while $10{,}200$ are a straight ($\\approx 0.4\\%$). The flush is **rarer**, so it ranks **higher**.

Two hooks for the spots beginners miss most:

- **"Full beats Flush"**: a full house outranks a flush.
- **"Feeling Flush beats a Straight"**: a flush outranks a straight.

Fun fact: across **seven** cards, plain *high card* is actually rarer than one pair. With seven cards it is hard **not** to pair up.`,
    },
    {
      type: 'problem',
      id: 'p4',
      prompt: 'In a random five-card deal, which hand shows up more often?',
      interaction: 'compare-events',
      config: {
        helperText: 'Rarer hands rank higher. Compare how often each one is dealt.',
        chooseLabel: 'Which hand is dealt more often?',
        eventA: {
          label: 'A straight',
          detail: 'Five in a row, mixed suits',
          favorable: 10200,
          total: 2598960,
        },
        eventB: {
          label: 'A flush',
          detail: 'Five of one suit',
          favorable: 5108,
          total: 2598960,
        },
      },
      answer: { more: 'a' },
      feedback: {
        correct:
          'A straight ($10{,}200$ ways) is dealt about twice as often as a flush ($5{,}108$). Because the flush is **rarer**, it **outranks** the straight.',
        incorrect:
          "Compare the counts: a straight has $10{,}200$ ways versus the flush's $5{,}108$. The straight is more common, which is exactly why the flush ranks higher.",
        hints: [
          'More ways to make a hand means it is more common, and therefore weaker.',
          'Straights: $10{,}200$ ways. Flushes: $5{,}108$ ways.',
          'The bigger count is dealt more often.',
        ],
        why: 'Out of $2{,}598{,}960$ five-card hands, $10{,}200$ are straights but only $5{,}108$ are flushes. The flush is rarer, so it ranks above the straight. Hook: **"Feeling Flush beats a Straight."**',
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt: 'Build a flush: tap five cards that share a suit.',
      interaction: 'hand-ranker',
      config: {
        mode: 'build-hand',
        targetCategory: 'flush',
        pool: ['AH', 'KH', '9H', '5H', '2H', 'KS', 'QD', '7C', '3S'],
        helperText: 'A flush is any five cards of one suit.',
      },
      answer: { category: 'flush', cards: ['AH', 'KH', '9H', '5H', '2H'] },
      feedback: {
        correct: "Five hearts make a flush. Any five cards of one suit will do.",
        incorrect: 'A flush needs **five cards of the same suit**. Tap the five hearts.',
        hints: [
          'A flush is five of one suit.',
          'Only one suit appears five times in this pool.',
          'Suit is what matters here, not the ranks.',
        ],
        why: 'A flush is defined purely by **suit**: any five cards of the same suit. The five hearts here (A-K-9-5-2) are not consecutive, so they make a plain flush.',
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        'Both players hold a pair of Aces, so the **kicker** decides. Which hand wins?',
      interaction: 'compare-events',
      config: {
        helperText: 'Same pair? Compare the next-highest card.',
        chooseLabel: 'Which hand wins?',
        eventA: { label: 'Pair of Aces, Queen kicker', detail: 'A-A-Q-J-9' },
        eventB: { label: 'Pair of Aces, King kicker', detail: 'A-A-K-Q-8' },
      },
      answer: { more: 'b' },
      feedback: {
        correct: 'Both have a pair of Aces, so the **kicker** decides: a King beats a Queen. A-A-**K** wins.',
        incorrect: 'The pairs tie (Aces vs Aces), so compare the highest side card: a King beats a Queen.',
        hints: [
          'The pair is identical, so look past it.',
          'Compare the highest card that is not part of the pair.',
          'The hand with the higher side card wins.',
        ],
        why: 'When the pair ties, the highest **kicker** decides, then the next card, and so on. Here A-A-**K**-Q-8 beats A-A-**Q**-J-9 because K > Q. This is why kickers matter: A-A-K beats A-A-Q.',
      },
    },
    {
      type: 'problem',
      id: 'p7',
      prompt: 'Rank these three hands, strongest at the top.',
      interaction: 'hand-ranker',
      config: {
        mode: 'order-hands',
        helperText: 'Name each hand, then use the arrows to order them.',
        hands: [
          { id: 'h-straight', cards: ['9C', '8D', '7H', '6S', '5C'] },
          { id: 'h-twopair', cards: ['KS', 'KD', '7C', '7H', '2S'] },
          { id: 'h-flush', cards: ['QD', '10D', '7D', '5D', '3D'] },
        ],
      },
      answer: { handOrder: ['h-flush', 'h-straight', 'h-twopair'] },
      feedback: {
        correct: 'Flush → straight → two pair. The five diamonds top a straight, which tops two pair.',
        incorrect: 'Check the categories: a flush beats a straight, and a straight beats two pair.',
        hints: [
          "Name each hand's category first.",
          'Five of one suit is a flush; five in a row is a straight.',
          'Once each hand is named, rank them by the category ladder.',
        ],
        why: 'Category decides first. The diamonds make a **flush**, above the 9-high **straight**, above **two pair** (Kings and Sevens). Only compare kickers when two hands share the same category.',
      },
    },
    {
      type: 'problem',
      id: 'p8',
      prompt: 'From these seven cards, tap the five that make your best hand.',
      interaction: 'hand-ranker',
      config: {
        mode: 'pick-best-five',
        cards: ['AH', 'KH', 'QH', '9H', '4H', 'KS', '4C'],
        helperText: 'You may use any five of the seven cards.',
      },
      answer: { cards: ['AH', 'KH', 'QH', '9H', '4H'] },
      feedback: {
        correct: 'The five hearts make a flush, stronger than the two pair (Kings and Fours). Best five of seven wins.',
        incorrect: 'There is a flush hiding here: five hearts. A flush beats the two pair of Kings and Fours.',
        hints: [
          'Look for five cards of one suit.',
          'Count how many cards of each suit are among the seven.',
          'A flush outranks two pair, so favor the five cards of one suit.',
        ],
        why: 'Your hand is the best **five of seven**. The two pair (K-K and 4-4) is tempting, but the five hearts form a **flush**, which ranks higher. Always scan all seven cards for the strongest five-card combination.',
      },
    },
  ],
}
