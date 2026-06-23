import type { LessonDefinition } from '../../types/lesson'
import { cellKey } from '../../types/lesson'

const sumSeven = [cellKey(1, 6), cellKey(2, 5), cellKey(3, 4), cellKey(4, 3), cellKey(5, 2), cellKey(6, 1)]

const doubles = [1, 2, 3, 4, 5, 6].map((n) => cellKey(n, n))

export const lesson2: LessonDefinition = {
  id: '2',
  title: 'Events & Basic Probability',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Events and the two-dice sample space',
      content: `An **event** is a **collection of outcomes** you care about — a subset of $\\Omega$, often called $A$.

Examples: “the die shows an even number” (event = $\\{2,4,6\\}$), or “the coin is heads” (event = $\\{\\text{H}\\}$).

**Important:** an event is not a single number unless only one outcome qualifies. First you list $\\Omega$; then you pick which outcomes belong to the event.

Roll **Die 1** and **Die 2** (both fair, six-sided). Each result is an **ordered pair** $(d_1, d_2)$ because “3 on the first, 5 on the second” is different from “5 on the first, 3 on the second.”

Die 1 has 6 outcomes; for **each** of those, Die 2 has 6 outcomes. So
$$|\\Omega| = 6 \\times 6 = 36.$$

The grid you will use lists all 36 ordered pairs — that **is** the sample space.`,
      visual: {
        type: 'event-subset',
        labelOmega: 'Ω (one die)',
        labelA: 'A: even',
        outcomes: ['1', '2', '3', '4', '5', '6'],
        eventOutcomes: ['2', '4', '6'],
        caption: 'An event is a subset of Ω. Here A = “even” = {2, 4, 6}; the rest stay outside A',
      },
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
      id: 'c2',
      title: 'How to find $P(A)$ — recipe and example',
      content: `When every outcome in $\\Omega$ is **equally likely**, probability is counting:

**Step 1 — Sample space:** List (or count) all of $\\Omega$. Get $|\\Omega|$.

**Step 2 — Event:** List every outcome that makes the event happen. Get $|A|$.

**Step 3 — Divide:**
$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{\\text{# outcomes you want}}{\\text{# outcomes that could happen}}$$

You are **not** done after finding $|A|$. The denominator is always **all of $\\Omega$**, not just the event.

**Worked example** (“sum is 7” with two fair dice):
- **Step 1:** $|\\Omega| = 36$ (all ordered pairs on the grid).
- **Step 2:** $|A| = 6$ — the six pairs you just selected.
- **Step 3:** $P(\\text{sum is 7}) = \\frac{6}{36} = \\frac{1}{6}$.

Notice: we **counted first**, then **divided**. That order matters.`,
      visual: {
        type: 'event-subset',
        labelOmega: 'Ω (one die)',
        labelA: 'A: even',
        outcomes: ['1', '2', '3', '4', '5', '6'],
        eventOutcomes: ['2', '4', '6'],
        caption: 'Count, then divide: P(A) = |A| / |Ω| = 3 / 6 = 1/2',
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt:
        '**Experiment:** flip **2 fair coins** (first flip, then second — order matters). **Tap the coin** to explore, then **build $\\Omega$** from the chips — tap every length-2 pattern that **could** happen. Leave out single letters and three-flip patterns. **Enter $|\\Omega|$** when your list is complete.',
      interaction: 'coin-flip-lab',
      config: {
        options: ['HH', 'HT', 'TH', 'TT', 'H', 'TTH'],
        pickerHelperText:
          'Each outcome is an ordered pair of flips (first coin, second coin). Single letters or three-flip patterns cannot happen in this experiment.',
        listLabel: 'Your sample space Ω',
        countLabel: 'Enter |Ω| — how many ordered two-flip patterns?',
      },
      answer: {
        selected: ['HH', 'HT', 'TH', 'TT'],
        count: 4,
      },
      feedback: {
        correct:
          '$\\Omega = \\{\\text{HH}, \\text{HT}, \\text{TH}, \\text{TT}\\}$ — **four** ordered outcomes. Two flips → $2 \\times 2 = 4$ patterns. H alone or TTH belong to **different** experiments, not this one.',
        incorrect:
          'Include **every** length-2 pattern (HH, HT, TH, TT) and **only** those. Single letters and three-flip strings are distractors — then enter $|Ω| = 4$.',
        hints: [
          'Flip the coin — each flip is H or T. Two flips make a **two-letter** pattern.',
          'List HH, HT, TH, and TT — all four ordered pairs.',
          'Do not add H, T, or TTH — those are not outcomes of **two** flips. Enter $|Ω| = 4$.',
        ],
        why: `**Step 1 — Experiment:** flip two fair coins in order (first, then second).

**Step 2 — List $\\Omega$:** each outcome is an ordered pattern of length 2:

$$\\Omega = \\{\\text{HH}, \\text{HT}, \\text{TH}, \\text{TT}\\}$$

**Step 3 — Count:** $|Ω| = 2^2 = 4$.

The single letters H and T describe **one** flip, not two. TTH describes **three** flips. Neither belongs in this sample space.

Before you pick an event like “at least one head,” you need this full list — $|Ω|$ is always the denominator in $P(A) = |A|/|Ω|$.`,
        venn: {
          type: 'sample-space',
          outcomes: ['HH', 'HT', 'TH', 'TT'],
          caption: '|Ω| = 4 ordered two-flip patterns',
        },
      },
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
      id: 'p5',
      prompt:
        '**Event:** the two dice show **doubles** — Die 1 and Die 2 display the **same number** (both 1s, both 2s, …). Select every ordered pair in this event on the grid, then **enter $|A|$**.',
      interaction: 'two-dice-grid',
      config: {},
      answer: { cells: doubles, eventCount: 6 },
      feedback: {
        correct:
          'Six outcomes: $(1,1)$ through $(6,6)$. So $|A| = 6$ while $|\\Omega| = 36$. By the recipe: $P(\\text{doubles}) = \\frac{6}{36} = \\frac{1}{6}$ — same count as “sum is 7,” but a **different** event on the same grid.',
        incorrect:
          'Doubles means $d_1 = d_2$. Find the diagonal cells (1-1, 2-2, …, 6-6), select all six, then enter $|A| = 6$.',
        hints: [
          'Doubles = both dice show the same face: (1,1), (2,2), …',
          'They lie on the diagonal of the grid where the two die values match.',
          'Select all six diagonal cells, then enter $|A| = 6$.',
        ],
        why: `**Sample space:** $|\\Omega| = 36$ ordered pairs (unchanged).

**Event $A$:** “doubles” — Die 1 equals Die 2:

$$A = \\{(1,1), (2,2), (3,3), (4,4), (5,5), (6,6)\\}$$

**Count:** $|A| = 6$ (one double for each face 1–6).

**Probability recipe:**

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{6}{36} = \\frac{1}{6}$$

Different events can share the same $|A|$ but mean different things — always name **which** outcomes belong to $A$.`,
        venn: {
          type: 'event-subset',
          labelA: 'A: doubles',
          outcomes: ['(1,1)', '(2,2)', '(3,3)', '(4,4)', '(5,5)', '(6,6)'],
          eventOutcomes: ['(1,1)', '(2,2)', '(3,3)', '(4,4)', '(5,5)', '(6,6)'],
          caption: '|A| = 6 doubles inside |Ω| = 36',
        },
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        '**Experiment:** flip **2 fair coins** ($|\\Omega| = 4$). **Event $A$:** “**at least one head**.” Select every pattern in $A$, enter $|A|$, then enter **$P(A)$ as a reduced fraction** using the recipe $P(A) = |A|/|\\Omega|$.',
      interaction: 'coin-event-grid',
      config: {
        coins: 2,
        maxHeads: 2,
        countLabel: 'Enter |A| — how many patterns have at least one H?',
        probabilityLabel: 'Enter P(A) = |A| / |Ω| as a reduced fraction',
      },
      answer: {
        patterns: ['HH', 'HT', 'TH'],
        count: 3,
        probability: { num: 3, den: 4 },
      },
      feedback: {
        correct:
          'Three patterns qualify: HH, HT, and TH. Only **TT** is left out (zero heads). So $|A| = 3$, $|Ω| = 4$, and $P(A) = \\frac{3}{4}$. Complement check: $P(\\text{no heads}) = \\frac{1}{4}$.',
        incorrect:
          '“At least one H” means **HH, HT, or TH** — every pattern except TT. Select those three, enter $|A| = 3$, then $P(A) = \\frac{3}{4}$.',
        hints: [
          'List all four patterns in Ω: HH, HT, TH, TT.',
          'Which patterns show **one or two** heads? All except TT.',
          'Select HH, HT, TH → $|A| = 3$. Then $P(A) = \\frac{3}{4}$.',
        ],
        why: `**Step 1 — Sample space** (two fair flips):

$$\\Omega = \\{\\text{HH}, \\text{HT}, \\text{TH}, \\text{TT}\\} \\quad\\Rightarrow\\quad |\\Omega| = 4$$

**Step 2 — Event $A$:** “at least one head” = every pattern **except** TT:

$$A = \\{\\text{HH}, \\text{HT}, \\text{TH}\\} \\quad\\Rightarrow\\quad |A| = 3$$

**Step 3 — Divide:**

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{3}{4}$$

The only outcome **outside** $A$ is TT (zero heads). It still lives in $\\Omega$ — that is why the denominator stays 4, not 3.`,
        venn: {
          type: 'event-subset',
          labelA: 'A: ≥1 head',
          outcomes: ['HH', 'HT', 'TH', 'TT'],
          eventOutcomes: ['HH', 'HT', 'TH'],
          caption: '|A| = 3 inside |Ω| = 4 → P(A) = 3/4',
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
