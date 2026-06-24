import type { LessonDefinition } from '../../types/lesson'
import { cardsByRank, cardsBySuit } from '../../types/lesson'

export const lesson1: LessonDefinition = {
  id: '1',
  title: 'Experiments, Outcomes & Sample Spaces',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'What can happen',
      content: `A **random experiment** is anything you can repeat whose result you cannot predict in advance — flip a coin, roll a die, draw a card.

Each separate result the experiment can produce is an **outcome**. One coin flip can come up heads; one die roll can show a 3. A single outcome is written $\\omega$.

The **sample space** is the complete list of every outcome that could happen. We write it $\\Omega$. Before asking how *likely* anything is, you first list what *can* happen — and that list is $\\Omega$.

How big $\\Omega$ is depends on the experiment:

- Flip one **coin** → $|\\Omega| = 2$.
- Roll one **die** → $|\\Omega| = 6$.
- Draw one **card** → $|\\Omega| = 52$.`,
      visual: {
        type: 'sample-space',
        labelOmega: 'Ω (one coin flip)',
        outcomes: ['H', 'T'],
        caption: 'Flip one coin → Ω = {H, T}: just two possible outcomes',
      },
    },
    {
      type: 'problem',
      id: 'p1',
      prompt:
        '**Experiment:** flip one fair coin once. You do not yet know what belongs in $\\Omega$ — so **discover it**. **Flip the coin several times** and watch each *new* result join $\\Omega$ (a face you have already seen leaves the set unchanged). When you are sure you have seen every outcome a single flip can produce, **lock in $\\Omega$** and enter $|\\Omega|$.',
      interaction: 'sample-space-picker',
      config: {
        options: ['H', 'T'],
        discoverMode: true,
        confirmCount: true,
        discoverHelperText:
          'Flip again and again. The first time a result lands it joins Ω; seeing it again does not grow the set. Once new flips stop revealing anything new, you have found all of Ω.',
        countLabel: 'How many distinct outcomes are in Ω? Enter |Ω|.',
        lockInLabel: "I've seen every outcome — lock in Ω",
      },
      answer: { selected: ['H', 'T'] },
      feedback: {
        correct:
          'You discovered $\\Omega = \\{\\text{H}, \\text{T}\\}$ — exactly **two** outcomes, so $|\\Omega| = 2$. No matter how many times you flip, only heads or tails ever appears. New flips stopped adding members because the set was already complete.',
        incorrect:
          'Keep flipping until **no new result** appears, then lock in. A single coin can only land **H** or **T**, so $\\Omega$ should hold exactly those two — $|\\Omega| = 2$.',
        hints: [
          'Flip many times. Notice that after a while, every flip is a repeat of something already in Ω.',
          'Only **two** faces ever land: H (heads) and T (tails). Both must be in Ω before you lock in.',
          'Once you have seen both H and T, enter $|\\Omega| = 2$ and lock in.',
        ],
        why: `**Step 1 — Name the experiment:** flip one fair coin once.

**Step 2 — Discover every outcome.** Each flip reveals one result. The *distinct* results you can ever see form the sample space. Flipping repeatedly, you only ever uncover **H** and **T** — repeats never add anything new:

$$\\Omega = \\{\\text{H}, \\text{T}\\}$$

**Step 3 — Count:** $|\\Omega| = 2$.

The sample space is the complete menu of possibilities. If a result is not in $\\Omega$, it cannot happen on one flip. This “flip-to-discover” view shows $\\Omega$ as something you *observe*, not just memorize.`,
        venn: {
          type: 'sample-space',
          outcomes: ['H', 'T'],
          caption: '|Ω| = 2 outcomes',
        },
      },
    },
    {
      type: 'problem',
      id: 'p2',
      prompt:
        'Same idea, a bigger menu. **Experiment:** roll one fair six-sided die. You do not yet know everything in $\\Omega$ — so **discover it**. **Roll the die over and over** and watch each *new* face join $\\Omega$ (rolling a face you have already seen only adds to its tally). Once every face has appeared, **lock in $\\Omega$** and enter $|\\Omega|$.',
      interaction: 'die-sample-space',
      config: {
        sides: 6,
        discoverMode: true,
        confirmCount: true,
        discoverHelperText:
          'Roll again and again. The first time a face lands it joins Ω; seeing it again does not grow the set, only its tally. When new rolls stop revealing new faces, you have found all of Ω.',
        countLabel: 'How many distinct outcomes are in Ω? Enter |Ω|.',
        lockInLabel: "I've rolled every face — lock in Ω",
      },
      answer: { selected: [1, 2, 3, 4, 5, 6], count: 6 },
      feedback: {
        correct:
          'You discovered $\\Omega = \\{1, 2, 3, 4, 5, 6\\}$ — **six** outcomes, so $|\\Omega| = 6$. No matter how many times you roll, only these six faces ever appear. That is a bigger sample space than the coin ($|\\Omega| = 2$): different experiments have different-sized $\\Omega$.',
        incorrect:
          'Keep rolling until **no new face** appears, then lock in. A standard die can land on six faces, so $\\Omega = \\{1,2,3,4,5,6\\}$ and $|\\Omega| = 6$.',
        hints: [
          'Roll many times. After a while every roll just repeats a face already in Ω.',
          'A standard die has six faces; each one is a separate outcome. All six belong in Ω.',
          'Once you have seen all six faces, enter $|\\Omega| = 6$ and lock in.',
        ],
        why: `**Step 1 — Name the experiment:** roll one fair six-sided die.

**Step 2 — Discover every outcome.** Each roll reveals one face. The *distinct* faces you can ever see form the sample space. Rolling repeatedly, you only uncover the numbers 1 through 6 — repeats add nothing new:

$$\\Omega = \\{1, 2, 3, 4, 5, 6\\}.$$

**Step 3 — Count:** $|\\Omega| = 6$.

Compare to the coin ($|\\Omega| = 2$): the die's sample space is larger. Pinning down $\\Omega$ is the groundwork for measuring probabilities next.`,
        venn: {
          type: 'sample-space',
          outcomes: ['1', '2', '3', '4', '5', '6'],
          caption: '|Ω| = 6 equally likely outcomes',
        },
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Equally likely, and the chance of one outcome',
      content: `When nothing about the experiment favors one result over another, the outcomes are **equally likely**. A fair coin has no reason to prefer heads over tails; a fair die has no reason to prefer any face.

The **probability** of an outcome is a number from $0$ to $1$ that says how often it happens — $0$ means it never happens, $1$ means it always happens. The probability of a single outcome $\\omega$ is written $P(\\omega)$.

When all $|\\Omega|$ outcomes are equally likely, they split the chance evenly, so each one gets

$$P(\\omega) = \\frac{1}{|\\Omega|}.$$

A fair coin has two equally likely sides, so each side is $\\frac{1}{2}$. Next, work out the die.`,
      visual: {
        type: 'sample-space',
        labelOmega: 'Ω with equal weights',
        outcomes: ['H · 1/2', 'T · 1/2'],
        caption: 'Equally likely: each side gets the same share, 1/2',
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        'Your die is fair, so all six faces are **equally likely**. **Tap the face showing 4** to single out one outcome. The sample space still has six faces in all, so confirm $|\\Omega|$ and then give the chance of landing on that one face, $P(\\omega) = \\frac{1}{|\\Omega|}$, as a fraction.',
      interaction: 'die-sample-space',
      config: {
        sides: 6,
        targetFace: 4,
        countLabel: 'How many equally likely faces does the die have in all? Enter |Ω|.',
        probabilityLabel: 'What is P of that one face = 1 / |Ω| as a fraction?',
      },
      answer: { selected: [4], count: 6, probability: { num: 1, den: 6 } },
      feedback: {
        correct:
          'Each face is equally likely and there are six of them, so a single face has probability $P(\\omega) = \\frac{1}{6}$. This is the uniform rule $P(\\omega) = \\frac{1}{|\\Omega|}$ in action — and it is smaller than the coin’s $\\frac{1}{2}$ because the die spreads the same total chance over more outcomes.',
        incorrect:
          'There are $|\\Omega| = 6$ equally likely faces, so one specific face has probability $\\frac{1}{|\\Omega|} = \\frac{1}{6}$.',
        hints: [
          'All six faces share the chance equally — none is favored.',
          'The rule for equally likely outcomes is $P(\\omega) = \\frac{1}{|\\Omega|}$.',
          'Here $|\\Omega| = 6$, so $P(\\omega) = \\frac{1}{6}$.',
        ],
        why: `The die is fair, so its six outcomes are **equally likely**. The uniform rule says each equally likely outcome gets the same share of the total probability:

$$P(\\omega) = \\frac{1}{|\\Omega|} = \\frac{1}{6}.$$

The coin gave $\\frac{1}{2}$ because it had only two outcomes; the die gives $\\frac{1}{6}$ because it has six. The larger the sample space, the smaller each single outcome’s probability.`,
        venn: {
          type: 'event-subset',
          labelOmega: 'Ω (6 faces)',
          labelA: 'one face',
          outcomes: ['face 4', '5 other faces'],
          eventOutcomes: ['face 4'],
          caption: 'one outcome of |Ω| = 6 → P(ω) = 1/6',
        },
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt:
        'Usually you care about a **group** of outcomes, not just one. A group of outcomes is called an **event**. **Event $A$:** the die shows an **even number**. Tap every even face, enter how many there are ($|A|$), then enter $P(A) = \\frac{|A|}{|\\Omega|}$ as a reduced fraction.',
      interaction: 'die-sample-space',
      config: {
        sides: 6,
        countLabel: 'How many faces are even? Enter |A|.',
        probabilityLabel: 'What is P(A) = |A| / 6 as a reduced fraction?',
      },
      answer: { selected: [2, 4, 6], count: 3, probability: { num: 1, den: 2 } },
      feedback: {
        correct:
          'The even faces are $2, 4, 6$, so $|A| = 3$. Since all six faces are equally likely, $P(A) = \\frac{|A|}{|\\Omega|} = \\frac{3}{6} = \\frac{1}{2}$. An event simply collects several equally likely outcomes, and its probability is their share of $\\Omega$.',
        incorrect:
          'Even faces are $2, 4, 6$ — three of the six — so $|A| = 3$ and $P(A) = \\frac{3}{6} = \\frac{1}{2}$. Remember to reduce the fraction.',
        hints: [
          'The even faces on a die are 2, 4 and 6.',
          'Count them: $|A| = 3$ out of $|\\Omega| = 6$.',
          '$P(A) = \\frac{3}{6}$, which reduces to $\\frac{1}{2}$.',
        ],
        why: `**Event $A$ = “the roll is even.”** The even faces are $2, 4, 6$, so

$$|A| = 3.$$

All six faces are equally likely, so the probability of an event is its share of the sample space:

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{3}{6} = \\frac{1}{2}.$$

Always reduce: $\\frac{3}{6}$ and $\\frac{1}{2}$ are the same number. An event holding three of the six faces has the same one-half chance as a single coin flip.`,
        venn: {
          type: 'event-subset',
          labelOmega: 'Ω (6 faces)',
          labelA: 'A: even',
          outcomes: ['2, 4, 6', '1, 3, 5'],
          eventOutcomes: ['2, 4, 6'],
          caption: '|A| = 3 of |Ω| = 6 → P(A) = 1/2',
        },
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt:
        'Now a bigger sample space: draw one card from a standard deck, so $|\\Omega| = 52$ equally likely cards. There is a second way to picture probability — as the **long-run frequency** of an event, the fraction of times it happens over many repeats. **Event $A$:** the card is a **heart**. First predict $P(\\text{heart})$, then **draw many cards** (each one returned) and watch the running fraction of hearts settle toward your prediction. Finally confirm $|A|$ and $P(\\text{heart}) = \\frac{|A|}{52}$ as a reduced fraction.',
      interaction: 'card-deck',
      config: {
        mode: 'draw-tally',
        targetEvent: cardsBySuit('H'),
        targetLabel: 'a heart',
        minDraws: 16,
        predictFirst: true,
        withReplacement: true,
        helperText:
          'Predict P(a heart), then draw again and again. The empirical bar (your draws) should drift toward the theoretical bar as the number of draws grows.',
        predictLabel: 'Predict P(a heart) as a reduced fraction, then draw to test it.',
        countLabel: 'How many of the 52 cards are hearts? Enter |A|.',
        probabilityLabel: 'Confirm P(a heart) = |A| / 52 as a reduced fraction.',
      },
      answer: { count: 13, probability: { num: 1, den: 4 } },
      feedback: {
        correct:
          'One suit holds 13 cards, so $|A| = 13$ and $P(\\text{heart}) = \\frac{13}{52} = \\frac{1}{4}$. Your draw-by-draw frequency wobbles early on but homes in on $\\frac{1}{4}$ as the draws pile up — that is probability as **long-run frequency**, and it agrees with the equally-likely count exactly.',
        incorrect:
          'Hearts are one of the four suits, so $|A| = 13$ and $P(\\text{heart}) = \\frac{13}{52} = \\frac{1}{4}$. Keep drawing — the empirical fraction should hover near $\\frac{1}{4}$.',
        hints: [
          'Each suit has 13 cards (A through K), and hearts are one suit.',
          'Draw a lot of cards; the share that are hearts settles near the true probability.',
          '$|A| = 13$, so $P(\\text{heart}) = \\frac{13}{52} = \\frac{1}{4}$.',
        ],
        why: `**Experiment:** draw one card; $|\\Omega| = 52$ equally likely cards.

**Event $A$ = “a heart.”** Hearts are one of the four suits, each holding 13 cards:

$$|A| = 13.$$

**Equally-likely count:**

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{13}{52} = \\frac{1}{4}.$$

**Why drawing works.** The fraction of draws that are hearts is an *empirical* estimate of $P(A)$. With only a handful of draws it can be well off, but as the number of draws grows it converges to the theoretical $\\frac{1}{4}$ — theory and experiment agree.`,
        venn: {
          type: 'event-subset',
          labelOmega: 'Ω (52 cards)',
          labelA: 'A: heart',
          outcomes: ['13 hearts', '39 others'],
          eventOutcomes: ['13 hearts'],
          caption: '|A| = 13 of |Ω| = 52 → P(A) = 1/4',
        },
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        'The deck is a rich sample space, but counting an event works exactly as it did for the die. **Event $A$:** the card is an **Ace**. Tap all four Aces (one per suit), enter $|A|$, then enter $P(A) = \\frac{|A|}{52}$ as a reduced fraction.',
      interaction: 'card-deck',
      config: {
        helperText:
          'Tap all four Aces — one in each suit (spades, hearts, diamonds, clubs). The whole deck (|Ω| = 52) is equally likely.',
        selectionLabel: 'Your selection (event A: the Aces)',
        countLabel: 'How many Aces are in the deck? Enter |A|.',
        probabilityLabel: 'What is P(A) = |A| / 52 as a reduced fraction?',
      },
      answer: { cards: cardsByRank('A'), count: 4, probability: { num: 1, den: 13 } },
      feedback: {
        correct:
          'There is one Ace in each of the four suits, so $|A| = 4$ and $P(A) = \\frac{4}{52} = \\frac{1}{13}$. Counting an event in a 52-card deck is the same move as on the die: count the favorable outcomes, divide by $|\\Omega|$, and reduce.',
        incorrect:
          'There are four Aces — one per suit — so $|A| = 4$ and $P(A) = \\frac{4}{52} = \\frac{1}{13}$. Be sure to reduce the fraction.',
        hints: [
          'Every suit (spades, hearts, diamonds, clubs) has exactly one Ace.',
          'Four suits → four Aces, so $|A| = 4$ out of $|\\Omega| = 52$.',
          '$P(A) = \\frac{4}{52}$; divide top and bottom by 4 to get $\\frac{1}{13}$.',
        ],
        why: `**Sample space:** one card from 52 equally likely cards, $|\\Omega| = 52$.

**Event $A$ = “an Ace.”** Each of the four suits holds exactly one Ace, so

$$|A| = 4.$$

**Uniform rule for an event:**

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{4}{52} = \\frac{1}{13}.$$

The counting is identical to the die’s “even” event — only the sample space is larger. Always reduce: $\\frac{4}{52} = \\frac{1}{13}$.`,
        venn: {
          type: 'event-subset',
          labelOmega: 'Ω (52 cards)',
          labelA: 'A: Aces',
          outcomes: ['4 Aces', '48 others'],
          eventOutcomes: ['4 Aces'],
          caption: '|A| = 4 of |Ω| = 52 → P(A) = 1/13',
        },
      },
    },
  ],
}
