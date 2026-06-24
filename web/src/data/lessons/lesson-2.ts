import type { LessonDefinition } from '../../types/lesson'
import { cardsByRank, cellKey, faceCards } from '../../types/lesson'

const sumSeven = [cellKey(1, 6), cellKey(2, 5), cellKey(3, 4), cellKey(4, 3), cellKey(5, 2), cellKey(6, 1)]
const doubles = [1, 2, 3, 4, 5, 6].map((n) => cellKey(n, n))

export const lesson2: LessonDefinition = {
  id: '2',
  title: 'Events & Basic Probability',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Events: collections of outcomes',
      content: `An **event** is a **collection of outcomes** you care about — a subset of $\\Omega$, often called $A$.

Examples: “the die shows an even number” (event = $\\{2,4,6\\}$), “the coin is heads” (event = $\\{\\text{H}\\}$), or “the card is a face card” (event = the 12 Jacks, Queens, and Kings).

**Important:** an event is not a single number unless only one outcome qualifies. First you list $\\Omega$; then you pick which outcomes belong to the event.

To practice on a richer sample space, roll **Die 1** and **Die 2** (both fair, six-sided). Each result is an **ordered pair** $(d_1, d_2)$ because “3 then 5” differs from “5 then 3.” Die 1 has 6 outcomes; for **each** of those, Die 2 has 6 outcomes, so
$$|\\Omega| = 6 \\times 6 = 36.$$
The grid lists all 36 ordered pairs — that **is** the sample space.`,
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

We are **not** dividing yet — just identifying which outcomes belong to $A$. Later, $P(A) = \\frac{|A|}{|\\Omega|} = \\frac{6}{36}$.`,
        venn: {
          type: 'event-subset',
          labelA: 'A: sum = 7',
          outcomes: ['(1,6)', '(2,5)', '(3,4)', '(4,3)', '(5,2)', '(6,1)'],
          eventOutcomes: ['(1,6)', '(2,5)', '(3,4)', '(4,3)', '(5,2)', '(6,1)'],
          caption: '|A| = 6 outcomes inside Ω (|Ω| = 36 total pairs)',
        },
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt:
        '**Event:** the two dice show **doubles** — Die 1 and Die 2 display the **same number** (both 1s, both 2s, …). Select every ordered pair in this event, then **enter $|A|$**.',
      interaction: 'two-dice-grid',
      config: {},
      answer: { cells: doubles, eventCount: 6 },
      feedback: {
        correct:
          'Six outcomes: $(1,1)$ through $(6,6)$. So $|A| = 6$ while $|\\Omega| = 36$ — the **same count** as “sum is 7,” but a completely different event on the same grid. Different events can share a count yet mean different things.',
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

Later this becomes $P(A) = \\frac{|A|}{|\\Omega|} = \\frac{6}{36} = \\frac{1}{6}$ — same probability as “sum is 7,” because both events have 6 outcomes. Always name **which** outcomes belong to $A$.`,
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
      id: 'p3',
      prompt:
        '**Event:** Die 1 shows **4** and Die 2 shows **2** — the single specific outcome $(4,2)$. Select that one cell, then **enter $|A|$** for this single-outcome event.',
      interaction: 'two-dice-grid',
      config: {},
      answer: { cells: [cellKey(4, 2)], eventCount: 1 },
      feedback: {
        correct:
          'Only one outcome matches, so $|A| = 1$. With $|\\Omega| = 36$, the recipe will give $P(4,2) = \\frac{1}{36}$. **One favorable outcome ÷ all possible outcomes** — that is the whole story for equally likely cases.',
        incorrect:
          'Find the one cell where the first die reads 4 and the second reads 2. A single-outcome event has $|A| = 1$ — enter that count.',
        hints: [
          'Locate the cell where the first die reads 4 and the second reads 2.',
          'This event contains exactly one ordered pair.',
          'Select it, then enter $|A| = 1$. Later: $P = \\frac{1}{|\\Omega|} = \\frac{1}{36}$.',
        ],
        why: `This event names **one specific outcome**: $(4, 2)$.

Even though it reads like a sentence, it is a single ordered pair in $\\Omega$:

$$A = \\{(4, 2)\\} \\quad\\Rightarrow\\quad |A| = 1.$$

The full sample space still has $|\\Omega| = 36$ pairs. **One** sits inside $A$; the other 35 are outside $A$ but still possible. Once we divide:

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{1}{36}.$$`,
        venn: {
          type: 'event-subset',
          labelA: 'A: (4,2)',
          outcomes: ['(4,2)'],
          eventOutcomes: ['(4,2)'],
          caption: 'Single-outcome event: |A| = 1 inside |Ω| = 36',
        },
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'How to find $P(A)$ — the recipe',
      content: `When every outcome in $\\Omega$ is **equally likely**, probability is counting:

**Step 1 — Sample space:** list (or count) all of $\\Omega$. Get $|\\Omega|$.

**Step 2 — Event:** list every outcome that makes the event happen. Get $|A|$.

**Step 3 — Divide:**
$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{\\text{# outcomes you want}}{\\text{# outcomes that could happen}}$$

The denominator is always **all of $\\Omega$**, not just the event. Always **reduce** the fraction.

**Worked example** (“sum is 7,” two fair dice): $|\\Omega| = 36$, $|A| = 6$, so
$$P(\\text{sum is 7}) = \\frac{6}{36} = \\frac{1}{6}.$$

The same recipe runs on a **deck of cards**, where $|\\Omega| = 52$. The next problems put it to work there.`,
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
        '**Experiment:** draw one card ($|\\Omega| = 52$). **Event $A$:** “the card is a **King**.” Tap all four kings, enter $|A|$, then enter $P(A) = \\frac{|A|}{52}$ as a reduced fraction.',
      interaction: 'card-deck',
      config: {
        helperText: 'Tap every King in the deck. There is one King per suit.',
        selectionLabel: 'Your selection (event A: Kings)',
        countLabel: 'How many Kings are in the deck? Enter |A|.',
        probabilityLabel: 'What is P(A) = |A| / 52 as a reduced fraction?',
      },
      answer: { cards: cardsByRank('K'), count: 4, probability: { num: 1, den: 13 } },
      feedback: {
        correct:
          'One King per suit → $|A| = 4$, so $P(A) = \\frac{4}{52} = \\frac{1}{13}$. A small event inside a large $\\Omega$: rare, but found the same way — count, divide, reduce.',
        incorrect:
          'There is exactly one King in each of the four suits, so $|A| = 4$. Then $P(A) = \\frac{4}{52} = \\frac{1}{13}$.',
        hints: [
          'Look in the rightmost column (rank K) of each suit row.',
          'Four suits, one King each → $|A| = 4$.',
          '$P(A) = \\frac{4}{52} = \\frac{1}{13}$.',
        ],
        why: `**Event $A$ = “a King.”** Each of the four suits has exactly one King:

$$|A| = 4.$$

**Divide and reduce:**

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{4}{52} = \\frac{1}{13}.$$

There are 13 ranks, each appearing 4 times, so any single rank has probability $\\frac{1}{13}$ — consistent with $\\frac{4}{52}$.`,
        venn: {
          type: 'event-subset',
          labelOmega: 'Ω (52 cards)',
          labelA: 'A: King',
          outcomes: ['4 Kings', '48 non-Kings'],
          eventOutcomes: ['4 Kings'],
          caption: '|A| = 4 of |Ω| = 52 → P(A) = 1/13',
        },
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt:
        '**Event $A$:** “the card is a **face card**” (Jack, Queen, or King). Tap every face card, enter $|A|$, then enter $P(A) = \\frac{|A|}{52}$ as a reduced fraction.',
      interaction: 'card-deck',
      config: {
        helperText: 'Tap every Jack, Queen, and King (all suits).',
        selectionLabel: 'Your selection (event A: face cards)',
        countLabel: 'How many face cards are there? Enter |A|.',
        probabilityLabel: 'What is P(A) = |A| / 52 as a reduced fraction?',
      },
      answer: { cards: faceCards(), count: 12, probability: { num: 3, den: 13 } },
      feedback: {
        correct:
          'Three face ranks (J, Q, K) × four suits = $|A| = 12$, so $P(A) = \\frac{12}{52} = \\frac{3}{13}$. Reducing matters: $\\frac{12}{52}$ and $\\frac{3}{13}$ are the same probability written two ways.',
        incorrect:
          'Face cards are Jacks, Queens, and Kings — three ranks across four suits, so $3 \\times 4 = 12$. Then $P(A) = \\frac{12}{52} = \\frac{3}{13}$.',
        hints: [
          'Face cards are the three picture ranks: J, Q, K.',
          'Three ranks × four suits → $|A| = 3 \\times 4 = 12$.',
          '$P(A) = \\frac{12}{52} = \\frac{3}{13}$ (divide top and bottom by 4).',
        ],
        why: `**Event $A$ = “face card” (J, Q, K).** Three ranks, each in four suits:

$$|A| = 3 \\times 4 = 12.$$

**Divide and reduce** (greatest common factor of 12 and 52 is 4):

$$P(A) = \\frac{12}{52} = \\frac{3}{13}.$$

Always reduce: $\\frac{3}{13}$ is the cleanest form. The recipe $P(A) = \\frac{|A|}{|\\Omega|}$ handled a King event (4 cards) and now a face-card event (12 cards) without changing.`,
        venn: {
          type: 'event-subset',
          labelOmega: 'Ω (52 cards)',
          labelA: 'A: face card',
          outcomes: ['12 face cards', '40 others'],
          eventOutcomes: ['12 face cards'],
          caption: '|A| = 12 of |Ω| = 52 → P(A) = 3/13',
        },
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        '**Experiment:** flip **2 fair coins** ($|\\Omega| = 4$). **Event $A$:** “**at least one head**.” Select every pattern in $A$, enter $|A|$, then enter $P(A)$ as a reduced fraction.',
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
          'Three patterns qualify: HH, HT, and TH. Only **TT** is left out (zero heads). So $|A| = 3$, $|\\Omega| = 4$, and $P(A) = \\frac{3}{4}$. Complement check: $P(\\text{no heads}) = \\frac{1}{4}$.',
        incorrect:
          '“At least one H” means **HH, HT, or TH** — every pattern except TT. Select those three, enter $|A| = 3$, then $P(A) = \\frac{3}{4}$.',
        hints: [
          'List all four patterns in Ω: HH, HT, TH, TT.',
          'Which patterns show **one or two** heads? All except TT.',
          'Select HH, HT, TH → $|A| = 3$. Then $P(A) = \\frac{3}{4}$.',
        ],
        why: `**Step 1 — Sample space** (two fair flips):

$$\\Omega = \\{\\text{HH}, \\text{HT}, \\text{TH}, \\text{TT}\\} \\quad\\Rightarrow\\quad |\\Omega| = 4.$$

**Step 2 — Event $A$:** “at least one head” = every pattern **except** TT:

$$A = \\{\\text{HH}, \\text{HT}, \\text{TH}\\} \\quad\\Rightarrow\\quad |A| = 3.$$

**Step 3 — Divide:**

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{3}{4}.$$

The only outcome **outside** $A$ is TT. It still lives in $\\Omega$ — that is why the denominator stays 4, not 3.`,
        venn: {
          type: 'event-subset',
          labelA: 'A: ≥1 head',
          outcomes: ['HH', 'HT', 'TH', 'TT'],
          eventOutcomes: ['HH', 'HT', 'TH'],
          caption: '|A| = 3 inside |Ω| = 4 → P(A) = 3/4',
        },
      },
    },
  ],
}
