import type { LessonDefinition } from '../../types/lesson'
import { cellKey } from '../../types/lesson'

const sumSeven = [cellKey(1, 6), cellKey(2, 5), cellKey(3, 4), cellKey(4, 3), cellKey(5, 2), cellKey(6, 1)]

export const lesson2: LessonDefinition = {
  id: '2',
  title: 'Events & Basic Probability',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'From outcomes to events',
      content: `An **event** is a **collection of outcomes** you care about — a subset of $\\Omega$, often called $A$.

Examples: “the die shows an even number” (event = $\\{2,4,6\\}$), or “the coin is heads” (event = $\\{\\text{H}\\}$).

**Important:** an event is not a single number unless only one outcome qualifies. First you list $\\Omega$; then you pick which outcomes belong to the event.`,
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Two dice: build the sample space first',
      content: `Roll **Die 1** and **Die 2** (both fair, six-sided). Each result is an **ordered pair** $(d_1, d_2)$ because “3 on the first, 5 on the second” is different from “5 on the first, 3 on the second.”

Die 1 has 6 outcomes; for **each** of those, Die 2 has 6 outcomes. So
$$|\\Omega| = 6 \\times 6 = 36.$$

The grid you will use lists all 36 ordered pairs — that **is** the sample space.`,
    },
    {
      type: 'problem',
      id: 'p1',
      prompt:
        '**Event:** “the two dice **sum to 7**.” On the grid, select **every ordered pair** in this event, then **enter $|A|$** — how many outcomes belong to $A$. Do not compute a probability yet.',
      interaction: 'two-dice-grid',
      config: { matchSum: 7, exactCount: 6 },
      answer: { cells: sumSeven, eventCount: 6 },
      feedback: {
        correct:
          'The event has **6** outcomes: $(1,6), (2,5), (3,4), (4,3), (5,2), (6,1)$. So $|A| = 6$ while $|\\Omega| = 36$. Listing the event **before** dividing is the step most people skip.',
        incorrect:
          'Find every cell where Die 1 + Die 2 = 7, then enter how many you selected. There are exactly six such pairs — $|A| = 6$.',
        hints: [
          'An event is a set of outcomes — highlight every cell that qualifies.',
          'Try pairs that add to 7: (1,6), (2,5), (3,4), and their reverses.',
          'Select all six cells, then enter $|A| = 6$.',
        ],
        why: `**Step 1 — Sample space:** two dice → $|\\Omega| = 6 \\times 6 = 36$ ordered pairs.

**Step 2 — Event $A$:** “sum is 7.” Scan the grid for $d_1 + d_2 = 7$:

$$A = \\{(1,6), (2,5), (3,4), (4,3), (5,2), (6,1)\\}$$

**Step 3 — Count the event:** $|A| = 6$.

We are **not** dividing yet — just identifying which outcomes belong to $A$. The diagram shows $A$ as a subset of $\\Omega$. Later, $P(A) = \\frac{|A|}{|\\Omega|} = \\frac{6}{36}$.`,
        venn: {
          type: 'event-subset',
          labelA: 'A: sum = 7',
          outcomes: [
            '(1,6)',
            '(2,5)',
            '(3,4)',
            '(4,3)',
            '(5,2)',
            '(6,1)',
          ],
          eventOutcomes: [
            '(1,6)',
            '(2,5)',
            '(3,4)',
            '(4,3)',
            '(5,2)',
            '(6,1)',
          ],
          caption: '|A| = 6 outcomes inside Ω (|Ω| = 36 total pairs)',
        },
      },
    },
    {
      type: 'concept',
      id: 'c3',
      title: 'How to find $P(A)$ — the full recipe',
      content: `When every outcome in $\\Omega$ is **equally likely**, probability is counting:

**Step 1 — Sample space:** List (or count) all of $\\Omega$. Get $|\\Omega|$.

**Step 2 — Event:** List every outcome that makes the event happen. Get $|A|$.

**Step 3 — Divide:**
$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{\\text{# outcomes you want}}{\\text{# outcomes that could happen}}$$

You are **not** done after finding $|A|$. The denominator is always **all of $\\Omega$**, not just the event.`,
    },
    {
      type: 'concept',
      id: 'c4',
      title: 'Worked example: sum is 7',
      content: `Apply the recipe to “sum is 7” with two fair dice:

- **Step 1:** $|\\Omega| = 36$ (all ordered pairs on the grid).
- **Step 2:** $|A| = 6$ — the six pairs you just selected.
- **Step 3:** $P(\\text{sum is 7}) = \\frac{6}{36} = \\frac{1}{6}$.

Notice: we **counted first**, then **divided**. That order matters.`,
    },
    {
      type: 'problem',
      id: 'p2',
      prompt:
        '**Experiment:** flip **3 fair coins**. **Event:** “**at most one head**” (zero heads **or** exactly one head). Select every outcome pattern in this event, then **enter $|A|$**.',
      interaction: 'coin-event-grid',
      config: { coins: 3, maxHeads: 1 },
      answer: { patterns: ['TTT', 'HTT', 'THT', 'TTH'], count: 4 },
      feedback: {
        correct:
          'Four outcomes qualify: TTT (zero heads) plus HTT, THT, TTH (exactly one H). So $|A| = 4$ and $|\\Omega| = 2^3 = 8$. Using the recipe: $P(A) = \\frac{4}{8} = \\frac{1}{2}$.',
        incorrect:
          '“At most one head” means **zero or one** H — not two or three. Select TTT and every pattern with a single H, then enter $|A| = 4$.',
        hints: [
          'First list all 8 patterns (that is $\\Omega$).',
          '“At most one H” allows TTT and patterns with exactly one H.',
          'Select TTT, HTT, THT, and TTH — four patterns — then enter $|A| = 4$.',
        ],
        why: `**Sample space** for 3 coin flips: every length-3 pattern of H and T.

$$|\\Omega| = 2^3 = 8 \\text{ patterns}$$

**Event $A$:** “at most one head” = zero heads **or** exactly one head.

- Zero heads: **TTT**
- One head: **HTT**, **THT**, **TTH**

So $|A| = 4$. Patterns with 2 or 3 heads (HHT, HTH, THH, HHH) stay **outside** $A$ but still inside $\\Omega$.

**Probability recipe:** $P(A) = \\frac{|A|}{|\\Omega|} = \\frac{4}{8} = \\frac{1}{2}$.`,
        venn: {
          type: 'event-subset',
          labelA: 'A: ≤1 head',
          outcomes: ['TTT', 'HTT', 'THT', 'TTH', 'HHT', 'HTH', 'THH', 'HHH'],
          eventOutcomes: ['TTT', 'HTT', 'THT', 'TTH'],
          caption: '|A| = 4 inside |Ω| = 8',
        },
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        '**Event:** Die 1 shows **4** and Die 2 shows **2** — a single specific outcome $(4,2)$. Select that one cell, then **enter $|A|$** for this single-outcome event.',
      interaction: 'two-dice-grid',
      config: {},
      answer: { cells: [cellKey(4, 2)], eventCount: 1 },
      feedback: {
        correct:
          'Only one outcome matches, so $|A| = 1$. With $|\\Omega| = 36$, the recipe gives $P(4,2) = \\frac{1}{36}$. **One favorable outcome ÷ all possible outcomes** — that is the whole story for equally likely cases.',
        incorrect:
          'Find the one cell labeled 4 on Die 1 and 2 on Die 2. A single-outcome event has $|A| = 1$ — enter that count.',
        hints: [
          'Locate the cell where the first die reads 4 and the second reads 2.',
          'This event contains exactly one ordered pair.',
          'Select it, then enter $|A| = 1$. Later: $P = \\frac{1}{|\\Omega|} = \\frac{1}{36}$.',
        ],
        why: `This event names **one specific outcome**: $(4, 2)$.

Even though it reads like a sentence, it is a single ordered pair in $\\Omega$. So:

$$A = \\{(4, 2)\\} \\quad\\Rightarrow\\quad |A| = 1$$

The full sample space still has $|\\Omega| = 36$ pairs. **One** sits inside $A$; the other 35 are outside $A$ but still possible.

For equally likely outcomes:

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{1}{36}$$`,
        venn: {
          type: 'event-subset',
          labelA: 'A: (4,2)',
          outcomes: ['(4,2)'],
          eventOutcomes: ['(4,2)'],
          caption: 'Single-outcome event: |A| = 1 inside |Ω| = 36',
        },
      },
    },
  ],
}
