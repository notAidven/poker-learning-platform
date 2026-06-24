import type { LessonDefinition } from '../../types/lesson'

export const lesson5: LessonDefinition = {
  id: '5',
  title: 'Classic Probability Problems',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'The birthday problem',
      content: `How many people in a room until a **shared birthday** is more likely than not?

For one person, $|\\Omega| = 365$ possible birthdays (ignore leap years). For $n$ people, ordered assignments give $365^n$ outcomes — but we care whether **some pair matches**.

Simulate random groups and watch the **match rate** rise surprisingly fast near $n \\approx 23$.`,
      visual: {
        type: 'sample-space',
        labelOmega: 'Ω (one birthday)',
        outcomes: ['Jan 1', 'Jan 2', 'Jan 3', '…', 'Dec 31'],
        caption: 'One person has |Ω| = 365 equally likely day slots',
      },
    },
    {
      type: 'problem',
      id: 'p1',
      prompt:
        'Simulate groups of **10 people** (random birthdays). Run at least **15 trials**, watch for matches, then **enter $365$** — how many day-of-year slots $\\Omega$ uses for one person’s birthday?',
      interaction: 'birthday-simulation',
      config: { people: 10, minTrials: 15 },
      answer: { count: 365 },
      feedback: {
        correct:
          'One person’s birthday has **365** equally likely day slots (we ignore Feb 29). That is $|\\Omega| = 365$ for a single person. With 10 people you likely saw **some** matches — but the rate is still well below 50%.',
        incorrect:
          'Run the simulation first, then enter the number of days in a standard year: **365**.',
        hints: [
          'Ignore leap years — use a 365-day year.',
          'Each person picks one of 365 equally likely birthdays.',
          'Enter **365**.',
        ],
        why: `**Experiment:** record one person’s birthday (ignore Feb 29).

**Step 1 — Sample space:** each day-of-year slot is one outcome $\\omega$:

$$\\Omega = \\{\\text{Jan 1}, \\text{Jan 2}, \\ldots, \\text{Dec 31}\\}$$

**Step 2 — Count:**

$$|\\Omega| = 365$$

**Step 3 — Fairness:** assuming birthdays are spread uniformly, each day gets $P(\\omega) = \\frac{1}{365}$.

With **10 people**, you compare many birthdays at once — matches become likely — but a single person still has 365 equally likely slots. The simulation builds intuition for collisions; this step anchors $|Ω|$ for **one** person.`,
        venn: {
          type: 'sample-space',
          outcomes: ['Jan 1', 'Jan 2', '…', 'Dec 31'],
          caption: '|Ω| = 365 day-of-year slots per person',
        },
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt:
        'Now simulate **23 people** per trial. Run at least **20 trials** and watch the match rate hover near 50%. The surprise comes from **pairs** — every two people are one chance to match. **Enter the number of pairs** among 23 people, $\\binom{23}{2}$.',
      interaction: 'birthday-simulation',
      config: {
        people: 23,
        minTrials: 20,
        countLabel: 'How many pairs of people can be formed? Enter C(23, 2).',
      },
      answer: { count: 253 },
      feedback: {
        correct:
          '$\\binom{23}{2} = \\frac{23 \\times 22}{2} = 253$ pairs. That is the secret: 23 people *feels* small, but it hides **253** chances for a collision — enough to push the match probability just past half, $P(\\text{match}) \\approx 50.7\\%$.',
        incorrect:
          'Count **pairs**, not people. Use a combination: $\\binom{23}{2} = \\frac{23 \\times 22}{2} = 253$.',
        hints: [
          'Each unordered pair of people is one chance to match — that is a combination $\\binom{n}{2}$.',
          '$\\binom{23}{2} = \\frac{23 \\times 22}{2}$.',
          'Enter **253**.',
        ],
        why: `**Event:** “at least one shared birthday” among $n = 23$ people.

For one person, $|\\Omega| = 365$. The reason matches appear so soon is the number of **pairs** we compare:

$$\\binom{23}{2} = \\frac{23 \\times 22}{2} = 253.$$

Each of those 253 pairs has roughly a $\\frac{1}{365}$ chance to share a birthday, and the chances accumulate. The exact result is

$$P(\\text{at least one match}) \\approx 50.7\\% \\quad \\text{when } n = 23,$$

so **23** is the smallest group where a shared birthday is more likely than not. The count $\\binom{23}{2} = 253$ — combinations from the previous lesson — is what makes it work.`,
        venn: {
          type: 'two-events',
          labelA: 'A: ≥1 match',
          labelB: 'B: all distinct',
          eventOutcomes: ['253 pairs'],
          outcomes: ['no shared days'],
          caption: 'n = 23 → C(23,2) = 253 pairs → P(A) ≈ 50.7%',
        },
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        'Simulate **30 people**. Run at least **15 trials** — the match rate should be high (~70%). **Enter the number of pairs** among 30 people, $\\binom{30}{2}$, and compare it to the 253 pairs you found for 23 people.',
      interaction: 'birthday-simulation',
      config: {
        people: 30,
        minTrials: 15,
        countLabel: 'How many pairs of people can be formed? Enter C(30, 2).',
      },
      answer: { count: 435 },
      feedback: {
        correct:
          '$\\binom{30}{2} = \\frac{30 \\times 29}{2} = 435$ pairs — up from 253 at $n = 23$. Those extra chances push the match probability to $P \\approx 71\\%$. The jump is not because 30 is a big fraction of 365; it is the **number of pairs** that grows fast.',
        incorrect:
          'Count **pairs**: $\\binom{30}{2} = \\frac{30 \\times 29}{2} = 435$.',
        hints: [
          'Pairs again — use $\\binom{30}{2}$, not 30.',
          '$\\binom{30}{2} = \\frac{30 \\times 29}{2}$.',
          'Enter **435**.',
        ],
        why: `With **$n = 30$** people, the number of pairs to compare grows:

$$\\binom{30}{2} = \\frac{30 \\times 29}{2} = 435 \\text{ pairs}.$$

Each pair can share a birthday, so collisions become **very** likely:

$$P(\\text{at least one match}) \\approx 71\\%.$$

Compare to $n = 23$ (253 pairs, ~50.7%): only seven more people add nearly 200 pairs. The surprise is not “30 is a big fraction of 365” — it is how many **pairs** a modest group hides.`,
        venn: {
          type: 'two-events',
          labelA: 'A: ≥1 match',
          labelB: 'B: all distinct',
          eventOutcomes: ['435 pairs'],
          outcomes: ['rare at n=30'],
          caption: 'C(30,2) = 435 pairs → P(match) ≈ 71%',
        },
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Secretary problem & derangements',
      content: `**Secretary problem:** $n$ letters go into $n$ envelopes at random. What is $P(\\text{no letter in its correct envelope})$?

A **derangement** is a placement where **every** letter is wrong. Count derangements $D_n$; total placements are $n!$.

For $n=3$: only **2** derangements out of $3! = 6$ permutations — so $P = \\frac{2}{6} = \\frac{1}{3}$.`,
      visual: {
        type: 'event-subset',
        labelOmega: 'Ω (3! = 6)',
        labelA: 'D: all wrong',
        outcomes: ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'],
        eventOutcomes: ['BCA', 'CAB'],
        caption: 'Derangements (no letter in its own envelope): D₃ = 2 of 6',
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt:
        'Place letters **A, B, C** into envelopes **A, B, C** so **no letter matches** its envelope (a derangement). Drag to build one valid placement, then **enter $D_3$** — how many derangements exist?',
      interaction: 'derangement-match',
      config: { labels: ['A', 'B', 'C'] },
      answer: { derangementCount: 2 },
      feedback: {
        correct:
          '$D_3 = 2$ derangements: B→A envelope, C→B, A→C (BCA) and C→A, A→B, B→C (CAB). Total permutations $3! = 6$, so $P(\\text{all wrong}) = \\frac{2}{6} = \\frac{1}{3}$.',
        incorrect:
          'Every letter must be in the **wrong** envelope. There are exactly **2** such placements — enter $D_3 = 2$.',
        hints: [
          'A cannot go in envelope A; same for B and C.',
          'Try BCA or CAB — those are the only derangements.',
          'Enter **2**.',
        ],
        why: `**Sample space:** place letters A, B, C into envelopes A, B, C — every **permutation** is one outcome.

$$|\\Omega| = 3! = 6$$

List all placements: ABC, ACB, BAC, BCA, CAB, CBA.

**Event $D$:** a **derangement** — **no** letter in its matching envelope.

Only **BCA** and **CAB** qualify:

$$D_3 = 2 \\quad\\Rightarrow\\quad P(\\text{all wrong}) = \\frac{D_3}{3!} = \\frac{2}{6} = \\frac{1}{3}$$

The secretary problem asks for this probability that nobody gets the right envelope.`,
        venn: {
          type: 'event-subset',
          labelA: 'D: derangements',
          outcomes: ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'],
          eventOutcomes: ['BCA', 'CAB'],
          caption: 'D₃ = 2 derangements inside |Ω| = 3! = 6',
        },
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt:
        'Now **4 letters** (A–D) into matching envelopes. Build a derangement, then **enter $D_4$** — the total number of derangements for 4 items.',
      interaction: 'derangement-match',
      config: { labels: ['A', 'B', 'C', 'D'] },
      answer: { derangementCount: 9 },
      feedback: {
        correct:
          '$D_4 = 9$. Out of $4! = 24$ permutations, 9 leave every letter wrong. So $P(\\text{no correct letter}) = \\frac{9}{24} = \\frac{3}{8}$.',
        incorrect:
          'Find a valid derangement first (no letter in its own envelope), then enter $D_4 = 9$.',
        hints: [
          'For 4 items, derangements satisfy $D_n = (n-1)(D_{n-1} + D_{n-2})$ — or count by case.',
          'Known value: $D_4 = 9$.',
          'Enter **9**.',
        ],
        why: `**Sample space:** random placement of 4 letters into 4 envelopes.

$$|\\Omega| = 4! = 24 \\text{ permutations}$$

**Event:** every letter is in the **wrong** envelope (a derangement).

Count derangements $D_4$ — placements where **no** fixed point occurs:

$$D_4 = 9$$

**Probability:**

$$P(\\text{all wrong}) = \\frac{D_4}{4!} = \\frac{9}{24} = \\frac{3}{8}$$

Recurrence (optional): $D_n = (n-1)(D_{n-1} + D_{n-2})$ with $D_1 = 0$, $D_2 = 1$ gives $D_4 = 9$.`,
        venn: {
          type: 'event-subset',
          labelA: 'D: derangements',
          outcomes: ['24 permutations'],
          eventOutcomes: ['9 with no fixed point'],
          caption: 'D₄ = 9 inside |Ω| = 4! = 24',
        },
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        'For **3 letters**, how many **total** random placements into 3 envelopes are in $\\Omega$ (all permutations)? Seat **3 distinct guests** in **3 chairs** to see order matter, then **enter $3!$**.',
      interaction: 'seat-permutation',
      config: { guests: ['X', 'Y', 'Z'] },
      answer: { totalArrangements: 6 },
      feedback: {
        correct:
          '$3! = 6$ total placements. Derangements are the subset where nobody is correct: $D_3 = 2$, so $P(\\text{all wrong}) = \\frac{2}{6}$. **Secretary problem = derangement count ÷ factorial.**',
        incorrect:
          'Seat all three guests, then enter total arrangements $3! = 6$.',
        hints: [
          'Every ordering of 3 distinct objects is one permutation.',
          '$3 \\times 2 \\times 1 = 3!$.',
          'Enter **6**.',
        ],
        why: `**Sample space:** every way to assign 3 distinct letters to 3 envelopes is one permutation in $\\Omega$.

Chair-by-chair (or envelope-by-envelope) counting:

$$|\\Omega| = 3 \\times 2 \\times 1 = 3! = 6$$

**Connect to derangements:** of these 6 placements, only $D_3 = 2$ leave **every** letter wrong.

$$P(\\text{all wrong}) = \\frac{D_3}{3!} = \\frac{2}{6} = \\frac{1}{3}$$

**Secretary problem recipe:** count derangements (event), divide by total permutations ($|\\Omega|$).`,
        venn: {
          type: 'event-subset',
          labelA: 'D: all wrong',
          outcomes: ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'],
          eventOutcomes: ['BCA', 'CAB'],
          caption: '|Ω| = 3! = 6 · D₃ = 2 derangements',
        },
      },
    },
  ],
}
