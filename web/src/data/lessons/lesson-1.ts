import type { LessonDefinition } from '../../types/lesson'

export const lesson1: LessonDefinition = {
  id: '1',
  title: 'Experiments, Outcomes & Sample Spaces',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Start with the experiment',
      content: `Probability always begins with a **random experiment** — something you can repeat whose result you cannot predict ahead of time (flip a coin, roll a die).

Each possible result is an **outcome**, written $\\omega$. The set of **all** outcomes that could happen is the **sample space** $\\Omega$.

Before you talk about “how likely” anything is, you must know what could happen. That list is $\\Omega$.`,
      visual: {
        type: 'sample-space',
        labelOmega: 'Ω (one coin flip)',
        outcomes: ['H', 'T'],
        caption: 'Example: flip one coin → Ω = {H, T}, the two possible outcomes',
      },
    },
    {
      type: 'problem',
      id: 'p1',
      prompt:
        '**Experiment:** flip one fair coin once. **Tap the coin** to explore what can happen, then **build $\\Omega$** from the chips below — tap every outcome that **could** happen on a single flip. Leave out anything that cannot happen. When your list is complete, check your answer.',
      interaction: 'sample-space-picker',
      config: {
        options: ['H', 'T', '1', '2', '3', '4'],
        showCoinFlip: true,
        listLabel: 'Your sample space Ω',
        helperText:
          'Each tap adds or removes an outcome from your list. Numbers are not coin faces — only include what a single flip can produce.',
      },
      answer: { selected: ['H', 'T'] },
      feedback: {
        correct:
          '$\\Omega = \\{\\text{H}, \\text{T}\\}$ — exactly **two** outcomes. A single flip shows heads or tails, nothing else. Numbers do not belong because they are not faces of the coin.',
        incorrect:
          'Include **every** outcome that can happen on one flip — and **only** those. H and T are the coin faces; the numbers are distractors.',
        hints: [
          'Flip the coin a few times — you should only ever see H or T land face-up.',
          'H (heads) and T (tails) are the only two faces. Tap both to add them to Ω.',
          'Do not add numbers — a coin flip cannot produce 1, 2, 3, or 4.',
        ],
        why: `**Step 1 — Name the experiment:** flip one fair coin once.

**Step 2 — List every outcome** that could happen. A single flip can only land **H** (heads) or **T** (tails). The numbers 1–4 are **not** outcomes of this experiment — they are distractors to check that you know what belongs in $\\Omega$.

$$\\Omega = \\{\\text{H}, \\text{T}\\}$$

**Step 3 — Count:** $|\\Omega| = 2$.

The sample space is the complete menu of possibilities. If an outcome is not in $\\Omega$, it cannot happen on one flip.`,
        venn: {
          type: 'sample-space',
          outcomes: ['H', 'T'],
          caption: '|Ω| = 2 outcomes',
        },
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Assigning probability to each outcome',
      content: `Each outcome $\\omega$ gets a number $P(\\omega)$ between **0%** and **100%** (or 0 and 1 as a decimal).

Two rules always hold:

1. **No outcome is negative** — $P(\\omega) \\ge 0$.
2. **Everything that could happen accounts for 100%** — if you add $P(\\omega)$ over **all** $\\omega$ in $\\Omega$, you get **1** (or 100%).

Think of the percentages as weights on a scale: they must balance to a full 100%.`,
      visual: {
        type: 'sample-space',
        labelOmega: 'Ω with weights',
        outcomes: ['H · 50%', 'T · 50%'],
        caption: 'Each outcome gets a weight P(ω); together they fill 100% (50% + 50%)',
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt:
        '**Experiment:** roll a standard six-sided die once. **Roll** the die, then **tap every face** that is a possible outcome. When you have listed $\\Omega$, **enter $|\\Omega|$** — how many outcomes are in the sample space.',
      interaction: 'die-sample-space',
      config: { sides: 6, selectAll: true },
      answer: { selected: [1, 2, 3, 4, 5, 6], count: 6 },
      feedback: {
        correct:
          'All six faces belong: $\\Omega = \\{1,2,3,4,5,6\\}$. There are $|\\Omega| = 6$ outcomes. Nothing is missing, and nothing extra is included — that is what “sample space” means.',
        incorrect:
          'List **every** face from 1 through 6, then enter the count. The sample space must include each outcome exactly once — $|\\Omega| = 6$.',
        hints: [
          'A standard die has six faces numbered 1–6.',
          'Each number is one separate outcome $\\omega$ — select all six faces.',
          'Count how many outcomes you selected, then enter $|\\Omega| = 6$.',
        ],
        why: `**Experiment:** roll a standard six-sided die once.

Each face that can land face-up is one outcome $\\omega$. You must list **all** of them before counting:

$$\\Omega = \\{1, 2, 3, 4, 5, 6\\}$$

**Count:** tap each face once → $|\\Omega| = 6$.

The sample space is the complete menu of possibilities. Probability always starts here — if an outcome is not in $\\Omega$, it cannot happen.`,
        venn: {
          type: 'sample-space',
          outcomes: ['1', '2', '3', '4', '5', '6'],
          caption: '|Ω| = 6 outcomes',
        },
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        'You just found $|\\Omega| = 6$ for a standard die. This one is **loaded** — face **6** is favored. Study the bars (faces **1–6**), then tap **Split evenly** so every outcome in $\\Omega$ gets the **same** weight (total **100%**). Enter what **percent** one face gets.',
      interaction: 'fairness-scale',
      config: {
        outcomes: 6,
        faceLabels: ['1', '2', '3', '4', '5', '6'],
        initialWeights: [0.1, 0.1, 0.1, 0.1, 0.1, 0.5],
        requireCount: true,
        mode: 'equalize-button',
        countLabel:
          'The die is fair. What percent does one face get? (Round to a whole number.)',
      },
      answer: { each: 1 / 6, countAnswer: 17 },
      feedback: {
        correct:
          'Six equal outcomes in $\\Omega$ → each gets $\\frac{1}{6} \\approx 17\\%$. **Fair** means splitting 100% evenly: $P(\\omega) = \\frac{1}{|\\Omega|}$ when $|\\Omega| = 6$.',
        incorrect:
          'Tap **Split evenly across all 6 faces** so every bar matches, then enter the percent for **one** face. With 6 equal outcomes, each gets $\\frac{1}{6}$ of 100%.',
        hints: [
          'Tap **Split evenly** — all six bars should become equal height.',
          'The total should stay at **100%**.',
          'Six equal slices → $\\frac{1}{6}$ each ≈ **17%** per face.',
        ],
        why: `You already counted $|\\Omega| = 6$. A **fair** die splits probability evenly across those six outcomes (faces 1–6).

**Rules:**
1. Every $P(\\omega) \\ge 0$.
2. All weights sum to **100%**.
3. **Fair:** each outcome gets the same share.

With $|\\Omega| = 6$:

$$P(\\omega) = \\frac{1}{|\\Omega|} = \\frac{1}{6} \\approx 0.167 \\approx 17\\%$$

Splitting the loaded die evenly makes every face in $\\Omega$ carry the same slice.`,
        venn: {
          type: 'sample-space',
          outcomes: ['⅙', '⅙', '⅙', '⅙', '⅙', '⅙'],
          caption: 'Fair die: equal weight on each outcome',
        },
      },
    },
    {
      type: 'concept',
      id: 'c3',
      title: 'The fair-die shortcut',
      content: `When a die (or any experiment) is **fair**, every outcome in $\\Omega$ is **equally likely**. That gives a shortcut:

$$P(\\omega) = \\frac{1}{|\\Omega|}$$

**Step 1:** Count how many outcomes are in $\\Omega$ — call that $|\\Omega|$.  
**Step 2:** Each outcome gets the same share: $\\frac{1}{|\\Omega|}$.

Example: six-sided fair die → $|\\Omega| = 6$ → each face has $P(\\omega) = \\frac{1}{6}$.`,
      visual: {
        type: 'sample-space',
        labelOmega: 'Ω (fair die)',
        outcomes: ['1', '2', '3', '4', '5', '6'],
        caption: 'Fair die: |Ω| = 6, so every outcome gets the same share P(ω) = 1/6',
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt:
        '**Experiment:** roll a fair **8-sided** die once. First, tap **every outcome** in $\\Omega$. Then **enter $|\\Omega|$**. Finally, use the fair-die shortcut to enter **$P(\\omega)$ for one outcome as a fraction**.',
      interaction: 'die-sample-space',
      config: { sides: 8, selectAll: true },
      answer: { selected: [1, 2, 3, 4, 5, 6, 7, 8], count: 8, probability: { num: 1, den: 8 } },
      feedback: {
        correct:
          'Eight outcomes → $|\\Omega| = 8$. Because the die is fair, $P(\\omega) = \\frac{1}{8}$ for each face. **More outcomes in $\\Omega$ means each individual outcome is less likely** when things stay fair.',
        incorrect:
          'Include every integer outcome from 1 through 8, enter $|\\Omega| = 8$, then enter $P(\\omega) = \\frac{1}{8}$ as a fraction.',
        hints: [
          'An 8-sided die shows the numbers 1 through 8.',
          'Each number is one outcome; select all eight, then enter $|\\Omega| = 8$.',
          'Fair-die shortcut: $P(\\omega) = \\frac{1}{|\\Omega|}$ — enter $\\frac{1}{8}$.',
        ],
        why: `An 8-sided die lists outcomes **1 through 8**:

$$\\Omega = \\{1, 2, 3, 4, 5, 6, 7, 8\\}$$

So $|\\Omega| = 8$.

**Fair-die shortcut:** when every outcome is equally likely,

$$P(\\omega) = \\frac{1}{|\\Omega|} = \\frac{1}{8}$$

Enter the count **8**, then the fraction **1/8**. Compare to a 6-sided die ($\\frac{1}{6}$ each): **more outcomes → smaller individual probability** when fairness is preserved.`,
        venn: {
          type: 'sample-space',
          outcomes: ['1', '2', '3', '4', '5', '6', '7', '8'],
          caption: '|Ω| = 8 → P(ω) = 1/8 each when fair',
        },
      },
    },
  ],
}
