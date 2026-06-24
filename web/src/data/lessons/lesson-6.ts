import type { LessonDefinition } from '../../types/lesson'
import { cardsByRank, redCards } from '../../types/lesson'

const kings = cardsByRank('K')
const aces = cardsByRank('A')
const reds = redCards()
const aceOrKing = [...aces, ...kings]
const redKings = reds.filter((card) => kings.includes(card))
const redOrKing = Array.from(new Set([...reds, ...kings]))

export const lesson6: LessonDefinition = {
  id: '6',
  title: 'Operations on Events',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Complement, union, intersection',
      content: `Events are **sets** of outcomes. Three operations combine them:

- **Complement** $A^c$: outcomes in $\\Omega$ **not** in $A$.
- **Union** $A \\cup B$: in $A$ **or** $B$ (or both).
- **Intersection** $A \\cap B$: in **both** $A$ and $B$.

Venn diagrams shade these regions. Count the outcomes in each region **before** computing probabilities.

A deck of cards makes them concrete: “**red or King**” is a union $A \\cup B$; “**red and King**” (the red Kings) is an intersection $A \\cap B$; “**not a King**” is a complement $A^c$.`,
      visual: {
        type: 'two-events',
        labelOmega: 'Ω',
        labelA: 'A',
        labelB: 'B',
        intersectionOutcomes: ['A ∩ B'],
        caption: 'Overlap = A ∩ B · both circles together = A ∪ B · outside A (still in Ω) = Aᶜ',
      },
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
      type: 'concept',
      id: 'c2',
      title: 'Inclusion–exclusion & complement',
      content: `**Inclusion–exclusion** for two events:
$$|A \\cup B| = |A| + |B| - |A \\cap B|.$$

**Complement:** $|A^c| = |\\Omega| - |A|$, since every outcome is either in $A$ or not.

These formulas turn Venn regions into counts — then $P = \\frac{\\text{count}}{|\\Omega|}$ as before. On a deck, $|\\Omega| = 52$, so once you count the union or intersection you divide by 52 and reduce. The next three problems do exactly that.`,
      visual: {
        type: 'two-events',
        labelOmega: 'Ω',
        labelA: 'A',
        labelB: 'B',
        eventOutcomes: ['8'],
        outcomes: ['8', '6'],
        intersectionOutcomes: ['4'],
        caption: 'Regions: 8 + 4 + 6 = 18 = |A| + |B| − |A ∩ B| (overlap counted once)',
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        '$|\\Omega| = 30$, $|A| = 12$. **Enter $|A^c|$** — outcomes **not** in $A$ (the complement).',
      interaction: 'venn-diagram',
      config: {
        sizeA: 12,
        sizeB: 10,
        intersection: 4,
        universeSize: 30,
        task: 'enter-complement',
        countLabel: 'Enter |Aᶜ| = |Ω| − |A|:',
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

$$|A| + |A^c| = |\\Omega|.$$

Therefore:

$$|A^c| = |\\Omega| - |A| = 30 - 12 = 18.$$

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
      id: 'p4',
      prompt:
        'Now on a real deck ($|\\Omega| = 52$). **Event:** the card is an **Ace or a King**. Tap every card in $A \\cup B$, enter $|A \\cup B|$, then enter $P(A \\cup B)$ as a reduced fraction.',
      interaction: 'card-deck',
      config: {
        helperText: 'Tap every Ace and every King. (No card is both, so the two sets do not overlap.)',
        selectionLabel: 'Your selection (Aces ∪ Kings)',
        countLabel: 'How many cards are Aces or Kings? Enter |A ∪ B|.',
        probabilityLabel: 'What is P(A ∪ B) = |A ∪ B| / 52 as a reduced fraction?',
      },
      answer: { cards: aceOrKing, count: 8, probability: { num: 2, den: 13 } },
      feedback: {
        correct:
          'Four Aces and four Kings, with **no overlap** (no card is both), so $|A \\cup B| = 4 + 4 = 8$ and $P = \\frac{8}{52} = \\frac{2}{13}$. When $A \\cap B = \\varnothing$ (disjoint events), the union is just the sum: $|A \\cup B| = |A| + |B|$.',
        incorrect:
          'Aces and Kings never coincide, so add them: $|A \\cup B| = 4 + 4 = 8$, and $P = \\frac{8}{52} = \\frac{2}{13}$.',
        hints: [
          'There are 4 Aces and 4 Kings; a card cannot be both at once.',
          'Disjoint events: $|A \\cup B| = |A| + |B| = 4 + 4 = 8$.',
          '$P = \\frac{8}{52} = \\frac{2}{13}$.',
        ],
        why: `Let $A$ = “Ace” ($|A| = 4$) and $B$ = “King” ($|B| = 4$).

No card is simultaneously an Ace and a King, so the events are **disjoint**:

$$A \\cap B = \\varnothing \\quad\\Rightarrow\\quad |A \\cap B| = 0.$$

Inclusion–exclusion then loses its subtraction term:

$$|A \\cup B| = |A| + |B| - 0 = 4 + 4 = 8.$$

**Probability:**

$$P(A \\cup B) = \\frac{8}{52} = \\frac{2}{13}.$$`,
        venn: {
          type: 'two-events',
          labelOmega: 'Ω (52 cards)',
          labelA: 'A: Ace (4)',
          labelB: 'B: King (4)',
          eventOutcomes: ['4 Aces'],
          outcomes: ['4 Kings'],
          caption: 'Disjoint: |A ∪ B| = 4 + 4 = 8 → P = 2/13',
        },
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt:
        '**Event:** the card is **red and a King** — the intersection of “red” and “King.” Tap every card in $A \\cap B$, enter $|A \\cap B|$, then enter $P(A \\cap B)$ as a reduced fraction.',
      interaction: 'card-deck',
      config: {
        helperText: 'Tap only the cards that are BOTH red AND a King.',
        selectionLabel: 'Your selection (red ∩ King)',
        countLabel: 'How many cards are red Kings? Enter |A ∩ B|.',
        probabilityLabel: 'What is P(A ∩ B) = |A ∩ B| / 52 as a reduced fraction?',
      },
      answer: { cards: redKings, count: 2, probability: { num: 1, den: 26 } },
      feedback: {
        correct:
          'Only the King of hearts and the King of diamonds are **both** red and a King, so $|A \\cap B| = 2$ and $P = \\frac{2}{52} = \\frac{1}{26}$. The intersection is the overlap — much smaller than either event alone.',
        incorrect:
          'Intersection = **both** conditions. The red Kings are the King of hearts and the King of diamonds, so $|A \\cap B| = 2$ and $P = \\frac{2}{52} = \\frac{1}{26}$.',
        hints: [
          'You need cards that satisfy BOTH “red” and “King” at once.',
          'Red Kings = King of hearts and King of diamonds → $|A \\cap B| = 2$.',
          '$P = \\frac{2}{52} = \\frac{1}{26}$.',
        ],
        why: `Let $A$ = “red” ($|A| = 26$) and $B$ = “King” ($|B| = 4$).

The **intersection** $A \\cap B$ holds cards that are red **and** a King. The four Kings are the Kings of spades, hearts, diamonds, and clubs; only the hearts and diamonds Kings are red:

$$A \\cap B = \\{\\text{K of hearts}, \\text{K of diamonds}\\} \\quad\\Rightarrow\\quad |A \\cap B| = 2.$$

**Probability:**

$$P(A \\cap B) = \\frac{2}{52} = \\frac{1}{26}.$$

Hold on to this count — the next problem needs it for the union.`,
        venn: {
          type: 'two-events',
          labelOmega: 'Ω (52 cards)',
          labelA: 'A: red (26)',
          labelB: 'B: King (4)',
          intersectionOutcomes: ['2 red Kings'],
          caption: '|A ∩ B| = 2 red Kings → P = 1/26',
        },
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        '**Event:** the card is **red or a King** — the union of “red” and “King.” Tap every card in $A \\cup B$, enter $|A \\cup B|$, then enter $P(A \\cup B)$ as a reduced fraction. (Use inclusion–exclusion — and the overlap you just found.)',
      interaction: 'card-deck',
      config: {
        helperText: 'Tap every red card and every King. The two black Kings join the 26 red cards.',
        selectionLabel: 'Your selection (red ∪ King)',
        countLabel: 'How many cards are red or a King? Enter |A ∪ B|.',
        probabilityLabel: 'What is P(A ∪ B) = |A ∪ B| / 52 as a reduced fraction?',
      },
      answer: { cards: redOrKing, count: 28, probability: { num: 7, den: 13 } },
      feedback: {
        correct:
          'Inclusion–exclusion: $|A \\cup B| = 26 + 4 - 2 = 28$, so $P = \\frac{28}{52} = \\frac{7}{13}$. The 26 red cards already include the 2 red Kings, so only the 2 **black** Kings are new. Subtracting the overlap prevents double-counting.',
        incorrect:
          'Use inclusion–exclusion: $|A \\cup B| = |A| + |B| - |A \\cap B| = 26 + 4 - 2 = 28$, then $P = \\frac{28}{52} = \\frac{7}{13}$.',
        hints: [
          'Red has 26 cards, Kings have 4, but the 2 red Kings are in both.',
          '$|A \\cup B| = 26 + 4 - 2 = 28$ (the only new cards are the 2 black Kings).',
          '$P = \\frac{28}{52} = \\frac{7}{13}$.',
        ],
        why: `Let $A$ = “red” ($|A| = 26$) and $B$ = “King” ($|B| = 4$), with overlap $|A \\cap B| = 2$ (the red Kings, from the previous problem).

**Inclusion–exclusion:**

$$|A \\cup B| = |A| + |B| - |A \\cap B| = 26 + 4 - 2 = 28.$$

Why subtract 2? The two red Kings are counted in **both** “red” and “King,” so adding $26 + 4$ counts them twice. Concretely, the union is the 26 red cards plus the 2 **black** Kings (spades and clubs) = 28.

**Probability:**

$$P(A \\cup B) = \\frac{28}{52} = \\frac{7}{13}.$$`,
        venn: {
          type: 'two-events',
          labelOmega: 'Ω (52 cards)',
          labelA: 'A: red (26)',
          labelB: 'B: King (4)',
          intersectionOutcomes: ['2 red Kings'],
          caption: '|A ∪ B| = 26 + 4 − 2 = 28 → P = 7/13',
        },
      },
    },
  ],
}
