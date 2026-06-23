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
    },
    {
      type: 'problem',
      id: 'p1',
      prompt:
        '**Experiment:** flip one fair coin once. Run the simulation until you have seen **both** faces (H and T) appear at least once — that builds intuition for what belongs in $\\Omega$.',
      interaction: 'coin-flip-lab',
      config: { requireBothFaces: true },
      answer: { requireBothFaces: true },
      feedback: {
        correct:
          'You observed both H and T. For one coin flip, the sample space is $\\Omega = \\{\\text{H}, \\text{T}\\}$ — **two** outcomes, no more and no less. Every probability question about this coin starts from this list.',
        incorrect:
          'Keep flipping until you have seen **both** H and T. We need the complete sample space before moving on.',
        hints: [
          'Tap the coin to run the experiment.',
          'Watch the row of results — you need at least one H and one T.',
          'For one fair coin, $\\Omega$ has exactly two outcomes: H and T.',
        ],
        why: `**Step 1 — Name the experiment:** flip one fair coin once.

**Step 2 — List every outcome** that could happen. A single flip can only land **H** (heads) or **T** (tails). Nothing else is possible, so the sample space is:

$$\\Omega = \\{\\text{H}, \\text{T}\\}$$

**Step 3 — Count:** $|\\Omega| = 2$.

The simulation asks you to see both faces so you trust that $\\Omega$ is complete — not because one flip produces both at once, but because repeated flips reveal every member of the set.`,
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
        'A die is **fair** when every outcome in $\\Omega$ gets the **same** weight and the total is **100%**. Use the sliders to make this six-sided die fair.',
      interaction: 'fairness-scale',
      config: { outcomes: 6 },
      answer: { each: 1 / 6 },
      feedback: {
        correct:
          'Each outcome now has $P(\\omega) = \\frac{1}{6} \\approx 17\\%$. **Fair** means: split 100% evenly across all outcomes in $\\Omega$. Six equal slices → $\\frac{1}{6}$ each.',
        incorrect:
          'Probabilities must **sum to 100%**, and each of the 6 outcomes should be equal.',
        hints: [
          'The total should read **100%**.',
          'For 6 equally likely outcomes, each weight is $\\frac{1}{6} \\approx 17\\%$.',
          'Use the top slider to split probability equally across all six outcomes.',
        ],
        why: `With $|\\Omega| = 6$, the **fairness rules** are:

1. Every $P(\\omega) \\ge 0$ (no negative weights).
2. All weights sum to **1** (100%).

**Fair** adds a third idea: every outcome gets the **same** share. Split 1 evenly across 6 outcomes:

$$P(\\omega) = \\frac{1}{|\\Omega|} = \\frac{1}{6} \\approx 0.167$$

Six equal slices inside $\\Omega$ — that is what the sliders encode.`,
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
    },
    {
      type: 'problem',
      id: 'p4',
      prompt:
        '**Experiment:** roll a fair **8-sided** die once. First, tap **every outcome** in $\\Omega$. Then **enter $|\\Omega|$**. Use the fair-die shortcut: if there are $n$ outcomes, each has probability $\\frac{1}{n}$.',
      interaction: 'die-sample-space',
      config: { sides: 8, selectAll: true },
      answer: { selected: [1, 2, 3, 4, 5, 6, 7, 8], count: 8 },
      feedback: {
        correct:
          'Eight outcomes → $|\\Omega| = 8$. Because the die is fair, $P(\\omega) = \\frac{1}{8}$ for each face. **More outcomes in $\\Omega$ means each individual outcome is less likely** when things stay fair.',
        incorrect:
          'Include every integer outcome from 1 through 8, then enter how many you found. That count is $|\\Omega|$.',
        hints: [
          'An 8-sided die shows the numbers 1 through 8.',
          'Each number is one outcome; select all eight.',
          'Enter $|\\Omega| = 8$. Fair means each outcome has probability $\\frac{1}{8}$.',
        ],
        why: `An 8-sided die lists outcomes **1 through 8**:

$$\\Omega = \\{1, 2, 3, 4, 5, 6, 7, 8\\}$$

So $|\\Omega| = 8$.

**Fair-die shortcut:** when every outcome is equally likely,

$$P(\\omega) = \\frac{1}{|\\Omega|} = \\frac{1}{8}$$

Compare to a 6-sided die ($\\frac{1}{6}$ each): **more outcomes → smaller individual probability** when fairness is preserved.`,
        venn: {
          type: 'sample-space',
          outcomes: ['1', '2', '3', '4', '5', '6', '7', '8'],
          caption: '|Ω| = 8 → P(ω) = 1/8 each when fair',
        },
      },
    },
  ],
}
