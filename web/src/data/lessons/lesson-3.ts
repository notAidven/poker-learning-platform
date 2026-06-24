import type { LessonDefinition } from '../../types/lesson'

export const lesson3: LessonDefinition = {
  id: '3',
  title: 'Counting & Factorials',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Count in stages, then multiply',
      content: `Many experiments happen in **stages** (pick a shirt, **then** pick pants). To count outcomes without listing every one:

**Step 1:** Count options at stage 1.  
**Step 2:** Count options at stage 2.  
**Step 3:** **Multiply** — each choice at stage 1 can pair with **every** choice at stage 2.

**Why multiplication works.** Picture a **tree**: from the root you branch to each shirt (3 branches); from **each** shirt you branch again to each pants (2 branches). Every **path** from root to leaf is one outcome, and

$$\\text{# paths} = (\\text{branches at stage 1}) \\times (\\text{branches at stage 2}).$$

This is the **multiplication principle**. It builds $|\\Omega|$ when you cannot (or should not) write every outcome by hand — including big sample spaces like the 52-card deck.`,
      visual: {
        type: 'sample-space',
        labelOmega: 'Ω (shirt · pants)',
        outcomes: ['R·K', 'R·B', 'Bl·K', 'Bl·B', 'G·K', 'G·B'],
        caption: 'Each shirt pairs with every pants: 3 × 2 = 6 outfits fill Ω',
      },
    },
    {
      type: 'problem',
      id: 'p1',
      prompt:
        'Build outfits: pick **one shirt** (3 colors) **and** **one pants** (2 colors). Try combinations in the widget, then **enter $|\\Omega|$** — the total number of outfits (multiply the options at each stage).',
      interaction: 'counting-product',
      config: {
        stages: [
          { label: 'Shirt', options: ['Red', 'Blue', 'Green'] },
          { label: 'Pants', options: ['Khaki', 'Black'] },
        ],
      },
      answer: { product: 6 },
      feedback: {
        correct:
          '$3 \\times 2 = 6$ outfits. **Stage 1:** 3 shirts. **Stage 2:** for **each** shirt, 2 pants choices → $3 \\times 2 = 6$ total outcomes. That is $|\\Omega| = 6$.',
        incorrect:
          'Count shirts and pants separately, multiply, then enter the product. Each shirt can pair with every pants option — $|\\Omega| = 3 \\times 2$.',
        hints: [
          'How many shirt choices? How many pants choices?',
          'Multiply: (shirts) × (pants).',
          'Enter $|\\Omega| = 3 \\times 2 = 6$.',
        ],
        why: `Treat each outfit as one outcome $\\omega \\in \\Omega$.

**Stage 1 — Shirt:** 3 choices (Red, Blue, Green).  
**Stage 2 — Pants:** 2 choices (Khaki, Black).

For **each** shirt, you can pair with **every** pants → multiplication principle:

$$|\\Omega| = 3 \\times 2 = 6.$$

Example outcomes: (Red, Khaki), (Red, Black), (Blue, Khaki), … — six distinct paths through the two stages.`,
        venn: {
          type: 'sample-space',
          outcomes: ['R·K', 'R·B', 'Bl·K', 'Bl·B', 'G·K', 'G·B'],
          caption: '|Ω| = 3 shirts × 2 pants = 6 outfits',
        },
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt:
        'A full meal has **3 stages**: pick 1 of **2 appetizers**, 1 of **3 entrées**, and 1 of **2 desserts**. Build a meal in the widget, then **enter $|\\Omega|$** — how many different meals are possible?',
      interaction: 'counting-product',
      config: {
        stages: [
          { label: 'Appetizer', options: ['Soup', 'Salad'] },
          { label: 'Entrée', options: ['Pasta', 'Fish', 'Tofu'] },
          { label: 'Dessert', options: ['Cake', 'Fruit'] },
        ],
      },
      answer: { product: 12 },
      feedback: {
        correct:
          '$2 \\times 3 \\times 2 = 12$ meals. **Three stages → multiply three counts.** If you later ask “probability of a specific meal,” you would use $|A| = 1$ and $|\\Omega| = 12$ in the recipe $P(A) = |A|/|\\Omega|$.',
        incorrect:
          'Multiply the options at each stage: $2 \\times 3 \\times 2$, then enter that total as $|\\Omega|$.',
        hints: [
          'Count options: 2 appetizers, 3 entrées, 2 desserts.',
          'Multiply all three counts together.',
          'Enter $|\\Omega| = 2 \\times 3 \\times 2 = 12$.',
        ],
        why: `Three **stages**, each choice independent:

| Stage | Options | Count |
|-------|---------|-------|
| Appetizer | Soup, Salad | 2 |
| Entrée | Pasta, Fish, Tofu | 3 |
| Dessert | Cake, Fruit | 2 |

**Multiplication principle** across all stages:

$$|\\Omega| = 2 \\times 3 \\times 2 = 12.$$

Each full meal (appetizer + entrée + dessert) is one outcome. If you later pick one specific meal as event $A$, then $|A| = 1$ and $P(A) = \\frac{1}{12}$.`,
        venn: {
          type: 'sample-space',
          outcomes: ['S·P·C', 'S·Fi·F', 'Sa·T·C', 'Sa·Fi·F', '…'],
          caption: '|Ω| = 2 × 3 × 2 = 12 complete meals',
        },
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        'Every playing card is built in **2 stages**: choose a **suit** (4 options) **and** a **rank** (13 options). Pick one of each, then **enter $|\\Omega|$** — the total number of cards in a standard deck.',
      interaction: 'counting-product',
      config: {
        stages: [
          { label: 'Suit', options: ['Spades', 'Hearts', 'Diamonds', 'Clubs'] },
          {
            label: 'Rank',
            options: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
          },
        ],
      },
      answer: { product: 52 },
      feedback: {
        correct:
          '$4 \\times 13 = 52$ cards. The deck’s $|\\Omega| = 52$ from earlier lessons is just the multiplication principle: every suit pairs with every rank. Counting in stages explains *why* the deck is 52, not 50 or 56.',
        incorrect:
          'Each card is one (suit, rank) pair: $4$ suits $\\times$ $13$ ranks. Multiply to get $|\\Omega| = 52$.',
        hints: [
          'How many suits are there? How many ranks per suit?',
          'Every suit contains every rank → multiply $4 \\times 13$.',
          'Enter $|\\Omega| = 4 \\times 13 = 52$.',
        ],
        why: `A card is determined by **two** independent choices:

**Stage 1 — Suit:** 4 options (spades, hearts, diamonds, clubs).  
**Stage 2 — Rank:** 13 options (A, 2, …, 10, J, Q, K).

Each suit contains each rank, so by the multiplication principle:

$$|\\Omega| = 4 \\times 13 = 52.$$

This is exactly the 52-card sample space you have been drawing from. Big sample spaces are easiest to count by stages, not by listing.`,
        venn: {
          type: 'sample-space',
          labelOmega: 'Ω (one card)',
          outcomes: ['4 suits', '× 13 ranks', '= 52 cards'],
          caption: '|Ω| = 4 × 13 = 52 cards',
        },
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt:
        'Flip **1 fair coin 3 times** in a row — each flip is its own stage. Pick a result for each flip, then **enter $|\\Omega|$** (multiply the stages), and enter $P(\\omega)$ for one specific pattern as a fraction.',
      interaction: 'counting-product',
      config: {
        stages: [
          { label: 'Flip 1', options: ['H', 'T'] },
          { label: 'Flip 2', options: ['H', 'T'] },
          { label: 'Flip 3', options: ['H', 'T'] },
        ],
        countLabel: 'Enter |Ω| — how many length-3 H/T patterns (2 × 2 × 2)?',
        probabilityLabel: 'What is P(ω) for one specific pattern? (fraction)',
      },
      answer: { product: 8, probability: { num: 1, den: 8 } },
      feedback: {
        correct:
          '$2 \\times 2 \\times 2 = 2^3 = 8$ patterns, so each specific pattern has $P(\\omega) = \\frac{1}{8}$. Repeated stages with the same count give a **power**: $n$ flips → $2^n$ outcomes. You will reuse this in the next lesson on coins.',
        incorrect:
          'Each flip has 2 options and there are 3 flips: $2 \\times 2 \\times 2 = 8$. A fair experiment gives each outcome $P(\\omega) = \\frac{1}{8}$.',
        hints: [
          'Each flip is a stage with 2 options (H or T).',
          'Three stages → $2 \\times 2 \\times 2 = 2^3 = 8$.',
          'Fair outcomes → $P(\\omega) = \\frac{1}{8}$.',
        ],
        why: `Three flips, each an independent stage with **2** options:

$$|\\Omega| = 2 \\times 2 \\times 2 = 2^3 = 8.$$

The eight outcomes are HHH, HHT, HTH, HTT, THH, THT, TTH, TTT. All equally likely, so each specific pattern has

$$P(\\omega) = \\frac{1}{|\\Omega|} = \\frac{1}{8}.$$

When every stage has the same number of options $k$ over $n$ stages, the count is $k^n$ — here $2^3$.`,
        venn: {
          type: 'sample-space',
          outcomes: ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'],
          caption: '|Ω| = 2³ = 8 → P(ω) = 1/8 each',
        },
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Factorials: the seating shortcut',
      content: `Sometimes every stage uses up one option from the **same** pool. Seat $n$ **distinct** guests in $n$ chairs (order matters): chair 1 has $n$ choices, chair 2 has $n-1$ left, and so on down to 1.

$$|\\Omega| = n \\times (n-1) \\times \\cdots \\times 1 = n!$$

Read $n!$ as “$n$ factorial.” Examples: $3! = 6$, $4! = 24$.

This is the same multiplication principle — each stage simply has one fewer option than the stage before, because a seated guest cannot be seated again.`,
      visual: {
        type: 'sample-space',
        labelOmega: 'Ω (seat A, B, C)',
        outcomes: ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'],
        caption: '3 distinct guests in 3 chairs: 3! = 3 × 2 × 1 = 6 orderings',
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt:
        'Seat **3 distinct guests** (A, B, C) in **3 chairs** where **order matters**. Seat everyone once, then **enter $3!$** — the total number of arrangements in $\\Omega$.',
      interaction: 'seat-permutation',
      config: { guests: ['A', 'B', 'C'] },
      answer: { totalArrangements: 6 },
      feedback: {
        correct:
          '**6** orderings = $3!$. **Chair 1:** 3 guest choices. **Chair 2:** 2 guests left. **Chair 3:** 1 guest left. Multiply: $3 \\times 2 \\times 1 = 6$. Each complete seating is one outcome in $\\Omega$.',
        incorrect:
          'Fill all three chairs, then enter the total arrangement count. First chair 3 options, second 2, third 1 — multiply to get $3! = 6$.',
        hints: [
          'Tap a guest, then tap an empty chair. Repeat until all are seated.',
          'First chair: 3 choices. Second: 2 remaining. Third: 1 remaining.',
          'Enter $3 \\times 2 \\times 1 = 3! = 6$.',
        ],
        why: `Each **complete seating** of A, B, C in three chairs is one outcome in $\\Omega$.

**Chair 1:** 3 guests available.  
**Chair 2:** 2 guests left.  
**Chair 3:** 1 guest left.

Multiply the choices at each stage:

$$|\\Omega| = 3 \\times 2 \\times 1 = 3! = 6.$$

Examples: ABC, ACB, BAC, BCA, CAB, CBA — order matters, so each permutation is a different $\\omega$.`,
        venn: {
          type: 'sample-space',
          outcomes: ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'],
          caption: '|Ω| = 3! = 6 distinct seatings',
        },
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        '**4 distinct guests**, **4 chairs**, order matters. Seat everyone, then **enter $4!$** — the total number of arrangements. Notice how the count grows compared to 3 guests.',
      interaction: 'seat-permutation',
      config: { guests: ['1', '2', '3', '4'] },
      answer: { totalArrangements: 24 },
      feedback: {
        correct:
          '$4! = 4 \\times 3 \\times 2 \\times 1 = 24$ arrangements. Adding one more guest **multiplies** the count by 4. Factorials grow fast — that is why $|\\Omega|$ explodes in real problems and counting matters.',
        incorrect:
          'Fill all four chairs, then enter the product $4 \\times 3 \\times 2 \\times 1 = 4! = 24$.',
        hints: [
          'Same seating mechanic: guest → empty chair until full.',
          'Chair counts: 4, then 3, then 2, then 1.',
          'Enter $4! = 4 \\times 3 \\times 2 \\times 1 = 24$.',
        ],
        why: `With **4 distinct guests** and **4 chairs**, each full seating is one outcome.

Chair-by-chair counts: **4**, then **3**, then **2**, then **1**:

$$|\\Omega| = 4 \\times 3 \\times 2 \\times 1 = 4! = 24.$$

Compare to 3 guests ($3! = 6$): adding one more guest **multiplies** $|\\Omega|$ by 4. Factorials grow quickly — that is why careful counting beats listing every outcome by hand.`,
        venn: {
          type: 'sample-space',
          outcomes: ['1234', '1243', '1324', '…', '24 total'],
          caption: '|Ω| = 4! = 4 × 3 × 2 × 1 = 24 seatings',
        },
      },
    },
  ],
}
