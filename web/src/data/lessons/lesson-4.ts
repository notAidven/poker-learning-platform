import type { LessonDefinition } from '../../types/lesson'

export const lesson4: LessonDefinition = {
  id: '4',
  title: 'Combinations & the Binomial Theorem',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Combinations: order does not matter',
      content: `A **combination** chooses $k$ objects from $n$ **without caring about order**.

Committee of 3 from 5 people: $\\{Alice, Bob, Carol\\}$ is the **same** committee as $\\{Carol, Alice, Bob\\}$.

When order **does** matter, use permutations ($n!$). When it **does not**, count combinations:

$$\\binom{n}{k} = \\frac{n!}{k!(n-k)!}$$

Read $\\binom{n}{k}$ as “$n$ choose $k$.”

**Cards are the classic example.** A 5-card poker hand is a choice of 5 cards from 52, order ignored, so the number of possible hands is $\\binom{52}{5} = 2{,}598{,}960$. That single count is why poker odds work the way they do.`,
      visual: {
        type: 'sample-space',
        labelOmega: 'Ω (pick 2 of A, B, C)',
        outcomes: ['{A, B}', '{A, C}', '{B, C}'],
        caption: 'Order ignored, so {A,B} = {B,A}: C(3,2) = 3 committees in Ω',
      },
    },
    {
      type: 'problem',
      id: 'p1',
      prompt:
        'Pick **2 students from 5** for a committee (order does not matter). Select any 2 in the widget, then **enter $\\binom{5}{2}$** — how many committees are possible?',
      interaction: 'select-combination',
      config: {
        items: ['Ana', 'Ben', 'Cara', 'Dan', 'Eve'],
        selectCount: 2,
      },
      answer: { combinationCount: 10 },
      feedback: {
        correct:
          '$\\binom{5}{2} = 10$ committees. **Recipe:** $\\binom{n}{k} = \\frac{n!}{k!(n-k)!} = \\frac{5!}{2!\\,3!} = 10$. Any one selection you made is one of those 10 — we counted the set, not the order.',
        incorrect:
          'Select 2 names (any pair works), then enter $\\binom{5}{2}$. Divide $5!$ by $2!\\,3!$ — the answer is **10**.',
        hints: [
          'Order does not matter — only **which two** people are on the committee.',
          'Use $\\binom{5}{2} = \\frac{5 \\times 4}{2 \\times 1}$ (cancel $3!$ in the formula).',
          'Enter $\\binom{5}{2} = 10$.',
        ],
        why: `**Experiment:** choose a committee of 2 from 5 students — **order does not matter**.

**Step 1 — Sample space:** every **unordered pair** of distinct students is one outcome in $\\Omega$.

**Step 2 — Count with combinations** (not permutations):

$$|\\Omega| = \\binom{5}{2} = \\frac{5!}{2!\\,3!} = \\frac{5 \\times 4}{2 \\times 1} = 10$$

**Shortcut:** pick 2 in order ($5 \\times 4$ ways), then divide by $2!$ because swapping the two names gives the **same** committee.

Each pair you select in the widget is one of these 10 equally likely committees if everyone is chosen at random.`,
        venn: {
          type: 'event-subset',
          labelA: 'A: one committee',
          outcomes: ['Ana', 'Ben', 'Cara', 'Dan', 'Eve'],
          eventOutcomes: ['Ana', 'Ben'],
          caption: '|Ω| = C(5,2) = 10 unordered pairs',
        },
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt:
        'Choose **3 toppings from 6** on a pizza (order does not matter). Select 3 toppings, then **enter $\\binom{6}{3}$**.',
      interaction: 'select-combination',
      config: {
        items: ['Pepperoni', 'Mushroom', 'Olive', 'Pepper', 'Onion', 'Basil'],
        selectCount: 3,
      },
      answer: { combinationCount: 20 },
      feedback: {
        correct:
          '$\\binom{6}{3} = 20$ topping sets. Same idea as committees: $\\frac{6!}{3!\\,3!} = \\frac{6 \\times 5 \\times 4}{3 \\times 2 \\times 1} = 20$.',
        incorrect:
          'Pick any 3 toppings, then compute $\\binom{6}{3} = 20$.',
        hints: [
          'This is “6 choose 3” — combinations, not permutations.',
          'Shortcut: $\\binom{6}{3} = \\frac{6 \\cdot 5 \\cdot 4}{3 \\cdot 2 \\cdot 1}$.',
          'Enter **20**.',
        ],
        why: `**Experiment:** pick 3 toppings from 6 — the **set** of toppings matters, not the order you click them.

$$|\\Omega| = \\binom{6}{3} = \\frac{6!}{3!\\,3!}$$

**Cancel factorials:**

$$\\binom{6}{3} = \\frac{6 \\times 5 \\times 4}{3 \\times 2 \\times 1} = 20$$

**Recipe:** multiply the first $k$ descending numbers from $n$, divide by $k!$ to remove order over-counting.

If you later ask “probability of one specific topping trio,” event $A$ has $|A| = 1$ and $P(A) = \\frac{1}{20}$.`,
        venn: {
          type: 'event-subset',
          labelA: 'A: one topping set',
          outcomes: ['Pep', 'Mush', 'Olive', 'Pepper', 'Onion', 'Basil'],
          eventOutcomes: ['Pep', 'Mush', 'Olive'],
          caption: '|Ω| = C(6,3) = 20 topping sets',
        },
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Binomial theorem and coin flips',
      content: `Flip **$n$ fair coins**. Each pattern in $\\Omega$ has $2^n$ equally likely outcomes.

**Event:** “exactly $k$ heads.” How many patterns have $k$ heads? **$\\binom{n}{k}$** — choose which $k$ flips are H.

So $|A| = \\binom{n}{k}$ and $P(\\text{exactly } k \\text{ heads}) = \\binom{n}{k} / 2^n$.

The **binomial theorem** expands $(x+y)^n$ using these same coefficients.`,
      visual: {
        type: 'event-subset',
        labelOmega: 'Ω (3 flips)',
        labelA: 'A: exactly 2 H',
        outcomes: ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'],
        eventOutcomes: ['HHT', 'HTH', 'THH'],
        caption: 'Choose which 2 of 3 flips are heads: |A| = C(3,2) = 3 of |Ω| = 8',
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        'Flip **3 fair coins**. **Event:** exactly **2 heads**. Run trials in the simulator, then **enter $|A|$** — how many patterns in $\\Omega$ have exactly 2 heads?',
      interaction: 'coin-flip-probability',
      config: { coins: 3, targetHeads: 2, minTrials: 12 },
      answer: { eventCount: 3 },
      feedback: {
        correct:
          '$|A| = \\binom{3}{2} = 3$ patterns: HHT, HTH, THH. With $|\\Omega| = 8$, $P(A) = \\frac{3}{8}$. The simulation should hover near $\\frac{3}{8} \\approx 38\\%$ — theory matches long-run frequency.',
        incorrect:
          'List patterns with exactly 2 H’s, or use $\\binom{3}{2}$. There are **3** favorable outcomes.',
        hints: [
          'Reference grid shows all 8 patterns — count those with exactly 2 H’s.',
          '$|A| = \\binom{3}{2}$ — choose which 2 of the 3 flips are heads.',
          'Enter $|A| = 3$.',
        ],
        why: `**Sample space:** 3 fair coin flips → every length-3 H/T pattern.

$$|\\Omega| = 2^3 = 8$$

**Event $A$:** exactly **2 heads**. Choose **which 2** of the 3 positions are H (order within the pattern is already fixed):

$$|A| = \\binom{3}{2} = 3$$

The favorable patterns are **HHT**, **HTH**, **THH** — each is one outcome in $A$.

**Probability recipe:**

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{3}{8}$$

The simulator estimates this by long-run frequency; theory gives $\\frac{3}{8} \\approx 38\\%$.`,
        venn: {
          type: 'event-subset',
          labelA: 'A: exactly 2 H',
          outcomes: ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'],
          eventOutcomes: ['HHT', 'HTH', 'THH'],
          caption: '|A| = C(3,2) = 3 inside |Ω| = 8',
        },
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt:
        'Flip **4 fair coins**. **Event:** exactly **2 heads**. Experiment with the simulator, then **enter $|A| = \\binom{4}{2}$**.',
      interaction: 'coin-flip-probability',
      config: { coins: 4, targetHeads: 2, minTrials: 12 },
      answer: { eventCount: 6 },
      feedback: {
        correct:
          '$|A| = \\binom{4}{2} = 6$. Patterns: HHTT, HTHT, HTTH, THHT, THTH, TTHH. $P(A) = \\frac{6}{16} = \\frac{3}{8}$. Binomial counting gives the numerator; $2^n$ gives $|\\Omega|$.',
        incorrect:
          'Use $\\binom{4}{2} = \\frac{4 \\times 3}{2 \\times 1} = 6$ favorable patterns.',
        hints: [
          'Exactly 2 heads means choose **which 2** of 4 flips are H.',
          '$\\binom{4}{2} = 6$.',
          'Enter **6**.',
        ],
        why: `**Sample space:** 4 coin flips → $|\\Omega| = 2^4 = 16$ equally likely patterns.

**Event $A$:** exactly 2 heads. Count by **choosing positions** for the two H’s:

$$|A| = \\binom{4}{2} = \\frac{4 \\times 3}{2 \\times 1} = 6$$

List check: HHTT, HTHT, HTTH, THHT, THTH, TTHH — six patterns, no more.

**Divide:**

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{6}{16} = \\frac{3}{8}$$

Binomial counting gives the numerator; $2^n$ gives the denominator.`,
        venn: {
          type: 'event-subset',
          labelA: 'A: exactly 2 H',
          outcomes: ['HHHH', 'HHTT', 'HTHT', 'HTTH', 'THHT', 'THTH', 'TTHH', 'TTTT', '…'],
          eventOutcomes: ['HHTT', 'HTHT', 'HTTH', 'THHT', 'THTH', 'TTHH'],
          caption: '|A| = C(4,2) = 6 inside |Ω| = 16',
        },
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt:
        'An exam has **7 questions**; you must **answer 4**. Order of answers does not matter. Select 4 questions in the widget, then **enter $\\binom{7}{4}$**.',
      interaction: 'select-combination',
      config: {
        items: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'],
        selectCount: 4,
      },
      answer: { combinationCount: 35 },
      feedback: {
        correct:
          '$\\binom{7}{4} = 35$ ways. Note $\\binom{7}{4} = \\binom{7}{3}$ — choosing 4 to **answer** is the same as choosing 3 to **skip**.',
        incorrect:
          'Select any 4 questions, then enter $\\binom{7}{4} = 35$.',
        hints: [
          '“7 choose 4” — combinations again.',
          '$\\binom{7}{4} = \\frac{7 \\cdot 6 \\cdot 5}{3 \\cdot 2 \\cdot 1} = 35$.',
          'Enter **35**.',
        ],
        why: `**Experiment:** answer 4 of 7 exam questions — only **which four** you pick matters.

$$|\\Omega| = \\binom{7}{4} = \\frac{7!}{4!\\,3!}$$

**Compute:**

$$\\binom{7}{4} = \\frac{7 \\times 6 \\times 5}{3 \\times 2 \\times 1} = 35$$

**Symmetry trick:** choosing 4 to **answer** is the same as choosing 3 to **skip**:

$$\\binom{7}{4} = \\binom{7}{3} = 35$$

Each selection in the widget represents one of these 35 equally likely 4-question sets (if chosen uniformly at random).`,
        venn: {
          type: 'event-subset',
          labelA: 'A: one 4-Q set',
          outcomes: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'],
          eventOutcomes: ['Q1', 'Q2', 'Q5', 'Q7'],
          caption: '|Ω| = C(7,4) = C(7,3) = 35',
        },
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        'Flip **5 fair coins**. **Event:** exactly **3 heads**. Run trials, then **enter $|A| = \\binom{5}{3}$**.',
      interaction: 'coin-flip-probability',
      config: { coins: 5, targetHeads: 3, minTrials: 12 },
      answer: { eventCount: 10 },
      feedback: {
        correct:
          '$|A| = \\binom{5}{3} = 10$. With $|\\Omega| = 32$, $P(A) = \\frac{10}{32} = \\frac{5}{16}$. You now have the full recipe: **count** favorable patterns with $\\binom{n}{k}$, **divide** by $2^n$.',
        incorrect:
          'Use $\\binom{5}{3} = \\binom{5}{2} = 10$.',
        hints: [
          'Choose which 3 of 5 flips are heads.',
          '$\\binom{5}{3} = 10$.',
          'Enter **10**.',
        ],
        why: `**Sample space:** 5 fair coins → $|\\Omega| = 2^5 = 32$ patterns.

**Event $A$:** exactly **3 heads**. Pick which 3 of the 5 flips are H:

$$|A| = \\binom{5}{3} = \\binom{5}{2} = 10$$

(Choosing 3 heads = choosing 2 tails.)

**Full recipe:**

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{10}{32} = \\frac{5}{16}$$

This is the binomial pattern: **count** favorable patterns with $\\binom{n}{k}$, **divide** by $2^n$.`,
        venn: {
          type: 'event-subset',
          labelA: 'A: exactly 3 H',
          outcomes: ['HHHHH', 'HHHHT', 'HHHTH', '…', '32 total'],
          eventOutcomes: ['HHHHT', 'HHHTH', 'HHTHH', 'HTHHH', 'THHHH', '…'],
          caption: '|A| = C(5,3) = 10 inside |Ω| = 32',
        },
      },
    },
  ],
}
