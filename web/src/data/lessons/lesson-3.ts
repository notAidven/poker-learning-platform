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

If there are more stages, keep multiplying. This is the **multiplication principle** — it builds $|\\Omega|$ when you cannot (or should not) write every outcome by hand.`,
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

$$|\\Omega| = 3 \\times 2 = 6$$

Example outcomes: (Red, Khaki), (Red, Black), (Blue, Khaki), … — six distinct paths through the two stages.`,
        venn: {
          type: 'sample-space',
          outcomes: ['R·K', 'R·B', 'Bl·K', 'Bl·B', 'G·K', 'G·B'],
          caption: '|Ω| = 3 shirts × 2 pants = 6 outfits',
        },
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Why multiplication works',
      content: `Imagine a **tree**: from the root you branch to each shirt (3 branches). From **each** shirt node you branch again to each pants (2 branches).

Every **path** from root to leaf is one outcome. Number of paths = (branches at first split) × (branches from each first-level node).

So counting $|\\Omega|$ for staged choices is really: **multiply the counts at each stage**. You will use this to build denominators like $|\\Omega| = 36$ or $|\\Omega| = 8$ in harder probability problems.`,
    },
    {
      type: 'problem',
      id: 'p2',
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

$$|\\Omega| = 3 \\times 2 \\times 1 = 3! = 6$$

Examples: ABC, ACB, BAC, BCA, CAB, CBA — order matters, so each permutation is a different $\\omega$.`,
        venn: {
          type: 'sample-space',
          outcomes: ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'],
          caption: '|Ω| = 3! = 6 distinct seatings',
        },
      },
    },
    {
      type: 'concept',
      id: 'c3',
      title: 'Factorials: the seating shortcut',
      content: `When **all $n$ objects are distinct** and **all $n$ seats are filled** with order mattering:

$$|\\Omega| = n \\times (n-1) \\times \\cdots \\times 1 = n!$$

Read $n!$ as “$n$ factorial.” Examples: $3! = 6$, $4! = 24$.

This is the same multiplication principle — each stage (chair) has one fewer guest available than the stage before.`,
      visual: {
        type: 'sample-space',
        labelOmega: 'Ω (seat A, B, C)',
        outcomes: ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'],
        caption: '3 distinct guests in 3 chairs: 3! = 3 × 2 × 1 = 6 orderings',
      },
    },
    {
      type: 'problem',
      id: 'p3',
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

$$|\\Omega| = 2 \\times 3 \\times 2 = 12$$

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
      id: 'p4',
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

$$|\\Omega| = 4 \\times 3 \\times 2 \\times 1 = 4! = 24$$

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
