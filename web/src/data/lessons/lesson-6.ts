import type { LessonDefinition } from '../../types/lesson'

export const lesson6: LessonDefinition = {
  id: '6',
  title: 'Operations on Events',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Complement, union, intersection',
      content: `Events are **sets** of outcomes. Key operations:

- **Complement** $A^c$: outcomes in $\\Omega$ **not** in $A$.
- **Union** $A \\cup B$: in $A$ **or** $B$ (or both).
- **Intersection** $A \\cap B$: in **both** $A$ and $B$.

Venn diagrams shade these regions. Count outcomes in each region before computing probabilities.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt:
        'On the Venn diagram, **select the region** for $A \\cap B$ (outcomes in **both** $A$ and $B$). $|A| = 12$, $|B| = 10$, $|A \\cap B| = 4$.',
      interaction: 'venn-diagram',
      config: {
        sizeA: 12,
        sizeB: 10,
        intersection: 4,
        task: 'select-intersection',
      },
      answer: { selectedRegions: ['ab'] },
      feedback: {
        correct:
          '$A \\cap B$ is the **overlap** — $|A \\cap B| = 4$ outcomes. Only outcomes in both circles belong here. **A only** has $12 - 4 = 8$; **B only** has $10 - 4 = 6$.',
        incorrect:
          'Tap the **overlap** where both circles meet — that is $A \\cap B$.',
        hints: [
          'Intersection = “and” — both events happen.',
          'Look for the lens-shaped region in the middle.',
          'Select only the overlap (4 outcomes).',
        ],
        why: `**Intersection** $A \\cap B$ means outcomes in **both** events at once (“$A$ **and** $B$”).

Given counts:
- $|A| = 12$ total in circle $A$
- $|B| = 10$ total in circle $B$
- $|A \\cap B| = 4$ in the **overlap**

**Region breakdown:**
- **A only:** $|A| - |A \\cap B| = 12 - 4 = 8$
- **B only:** $|B| - |A \\cap B| = 10 - 4 = 6$
- **Overlap:** $|A \\cap B| = 4$

Only the overlap belongs to $A \\cap B$. Outcomes in A-only or B-only are **not** in the intersection.`,
        venn: {
          type: 'two-events',
          labelA: 'A (|A|=12)',
          labelB: 'B (|B|=10)',
          eventOutcomes: ['A only: 8'],
          outcomes: ['B only: 6'],
          caption: 'A ∩ B = overlap → |A ∩ B| = 4',
        },
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt:
        '$|A| = 12$, $|B| = 10$, $|A \\cap B| = 4$. **Enter $|A \\cup B|$** — outcomes in $A$ **or** $B$ (or both).',
      interaction: 'venn-diagram',
      config: {
        sizeA: 12,
        sizeB: 10,
        intersection: 4,
        task: 'enter-union',
      },
      answer: { count: 18 },
      feedback: {
        correct:
          '$|A \\cup B| = |A| + |B| - |A \\cap B| = 12 + 10 - 4 = 18$. **Inclusion–exclusion:** add both sets, subtract the overlap counted twice.',
        incorrect:
          'Use $|A \\cup B| = |A| + |B| - |A \\cap B| = 12 + 10 - 4$. Enter **18**.',
        hints: [
          'Union counts everything in either circle.',
          'Add $|A|$ and $|B|$, then subtract $|A \\cap B|$ once.',
          'Enter **18**.',
        ],
        why: `**Union** $A \\cup B$ = outcomes in $A$ **or** $B$ (or both).

**Inclusion–exclusion** avoids double-counting the overlap:

$$|A \\cup B| = |A| + |B| - |A \\cap B|$$

Plug in the numbers:

$$|A \\cup B| = 12 + 10 - 4 = 18$$

**Region check:** A only ($8$) + B only ($6$) + overlap ($4$) = $8 + 6 + 4 = 18$.

We subtract $|A \\cap B|$ because those 4 outcomes were counted in **both** $|A|$ and $|B|$.`,
        venn: {
          type: 'two-events',
          labelA: 'A (|A|=12)',
          labelB: 'B (|B|=10)',
          eventOutcomes: ['A only: 8'],
          outcomes: ['B only: 6'],
          caption: '|A ∪ B| = 12 + 10 − 4 = 18',
        },
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        '**Select all regions** that belong to $A \\cup B$ (the union). $|A| = 12$, $|B| = 10$, $|A \\cap B| = 4$.',
      interaction: 'venn-diagram',
      config: {
        sizeA: 12,
        sizeB: 10,
        intersection: 4,
        task: 'select-union',
      },
      answer: { selectedRegions: ['aOnly', 'bOnly', 'ab'] },
      feedback: {
        correct:
          'Union = **A only** + **B only** + **overlap**. That is $8 + 6 + 4 = 18$ outcomes — matching $|A \\cup B|$ from inclusion–exclusion.',
        incorrect:
          'Select **three** regions: A-only, B-only, and the overlap. Do not select outside the circles.',
        hints: [
          'Union means “A or B or both.”',
          'Include both crescents and the middle overlap.',
          'Select A-only, B-only, and $A \\cap B$.',
        ],
        why: `**Union** $A \\cup B$ shades **three** regions on the Venn diagram:

1. **A only** — in $A$ but not $B$: $12 - 4 = 8$ outcomes
2. **B only** — in $B$ but not $A$: $10 - 4 = 6$ outcomes
3. **Overlap** $A \\cap B$: $4$ outcomes

**Do not** include “outside both circles” — those outcomes are not in $A \\cup B$.

**Total:**

$$|A \\cup B| = 8 + 6 + 4 = 18$$

Same answer as inclusion–exclusion: $12 + 10 - 4 = 18$.`,
        venn: {
          type: 'two-events',
          labelA: 'A only: 8',
          labelB: 'B only: 6',
          eventOutcomes: ['A only'],
          outcomes: ['B only'],
          caption: 'Union = A only + B only + overlap (4) = 18',
        },
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Inclusion–exclusion & complement',
      content: `**Inclusion–exclusion** for two events:
$$|A \\cup B| = |A| + |B| - |A \\cap B|$$

**Complement:** $|A^c| = |\\Omega| - |A|$ when every outcome is either in $A$ or not.

These formulas turn Venn regions into counts — then $P(A) = |A|/|\\Omega|$ as before.`,
    },
    {
      type: 'problem',
      id: 'p4',
      prompt:
        '$|\\Omega| = 30$, $|A| = 12$. **Enter $|A^c|$** — outcomes **not** in $A$ (the complement).',
      interaction: 'venn-diagram',
      config: {
        sizeA: 12,
        sizeB: 10,
        intersection: 4,
        universeSize: 30,
        task: 'enter-complement',
        countLabel: 'Enter $|A^c| = |\\Omega| - |A|$:',
      },
      answer: { count: 18 },
      feedback: {
        correct:
          '$|A^c| = |\\Omega| - |A| = 30 - 12 = 18$. Complement fills everything outside $A$ but still inside $\\Omega$.',
        incorrect:
          'Subtract: $30 - 12 = 18$. Enter $|A^c| = 18$.',
        hints: [
          'Complement = all outcomes not in A.',
          '$|A^c| = |\\Omega| - |A|$.',
          'Enter **18**.',
        ],
        why: `**Complement** $A^c$ = all outcomes in $\\Omega$ that are **not** in $A$.

Every outcome is either in $A$ or in $A^c$ (and not both), so:

$$|A| + |A^c| = |\\Omega|$$

Therefore:

$$|A^c| = |\\Omega| - |A| = 30 - 12 = 18$$

On the diagram: circle $A$ holds 12 outcomes; the rest of $\\Omega$ (outside $A$ but inside the rectangle) holds 18.`,
        venn: {
          type: 'event-subset',
          labelA: 'A',
          outcomes: ['18 in Aᶜ', '12 in A'],
          eventOutcomes: ['12 in A'],
          caption: '|Aᶜ| = |Ω| − |A| = 30 − 12 = 18',
        },
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt:
        '$|A| = 15$, $|B| = 11$, $|A \\cap B| = 5$. **Enter $|A \\cup B|$** using inclusion–exclusion.',
      interaction: 'venn-diagram',
      config: {
        sizeA: 15,
        sizeB: 11,
        intersection: 5,
        task: 'enter-union',
      },
      answer: { count: 21 },
      feedback: {
        correct:
          '$|A \\cup B| = 15 + 11 - 5 = 21$. **A only** = 10, **B only** = 6, **overlap** = 5 — sum to 21.',
        incorrect:
          'Apply $|A \\cup B| = |A| + |B| - |A \\cap B| = 15 + 11 - 5$. Enter **21**.',
        hints: [
          'Add $|A|$ and $|B|$, subtract the overlap.',
          '$15 + 11 - 5 = ?$',
          'Enter **21**.',
        ],
        why: `Apply **inclusion–exclusion** for union:

$$|A \\cup B| = |A| + |B| - |A \\cap B|$$

Substitute $|A| = 15$, $|B| = 11$, $|A \\cap B| = 5$:

$$|A \\cup B| = 15 + 11 - 5 = 21$$

**Region check:**
- A only: $15 - 5 = 10$
- B only: $11 - 5 = 6$
- Overlap: $5$
- Sum: $10 + 6 + 5 = 21$`,
        venn: {
          type: 'two-events',
          labelA: 'A (|A|=15)',
          labelB: 'B (|B|=11)',
          eventOutcomes: ['A only: 10'],
          outcomes: ['B only: 6'],
          caption: '|A ∪ B| = 15 + 11 − 5 = 21',
        },
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        '$|A| = 20$, $|B| = 16$, $|A \\cap B| = 6$. **Enter $|A \\cup B|$**. Then recall: $P(A \\cup B) = |A \\cup B| / |\\Omega|$ once you know $|\\Omega|$.',
      interaction: 'venn-diagram',
      config: {
        sizeA: 20,
        sizeB: 16,
        intersection: 6,
        task: 'enter-union',
      },
      answer: { count: 30 },
      feedback: {
        correct:
          '$|A \\cup B| = 20 + 16 - 6 = 30$. You have the full toolkit: **intersection** (overlap), **union** (inclusion–exclusion), **complement** ($|\\Omega| - |A|$). Set operations + counting → probability.',
        incorrect:
          'Use inclusion–exclusion: $20 + 16 - 6 = 30$.',
        hints: [
          'Same formula: $|A \\cup B| = |A| + |B| - |A \\cap B|$.',
          '$20 + 16 - 6 = 30$.',
          'Enter **30**.',
        ],
        why: `**Inclusion–exclusion** (same recipe, new numbers):

$$|A \\cup B| = |A| + |B| - |A \\cap B| = 20 + 16 - 6 = 30$$

**Regions:**
- A only: $20 - 6 = 14$
- B only: $16 - 6 = 10$
- Overlap: $6$
- Total: $14 + 10 + 6 = 30$

Once you know $|A \\cup B|$ and $|\\Omega|$, probability follows:

$$P(A \\cup B) = \\frac{|A \\cup B|}{|\\Omega|}$$

You now have the full toolkit: **intersection**, **union** (inclusion–exclusion), and **complement**.`,
        venn: {
          type: 'two-events',
          labelA: 'A (|A|=20)',
          labelB: 'B (|B|=16)',
          eventOutcomes: ['A only: 14'],
          outcomes: ['B only: 10'],
          caption: '|A ∪ B| = 20 + 16 − 6 = 30',
        },
      },
    },
  ],
}
