import type { LessonDefinition } from '../../types/lesson'
import { cardsBySuit, redCards } from '../../types/lesson'

export const lesson1: LessonDefinition = {
  id: '1',
  title: 'Experiments, Outcomes & Sample Spaces',
  steps: [
    {
      type: 'concept',
      id: 'c1',
      title: 'Start with the experiment',
      content: `Probability always begins with a **random experiment** — something you can repeat whose result you cannot predict ahead of time (flip a coin, roll a die, draw a card).

Each possible result is an **outcome**, written $\\omega$. The set of **all** outcomes that could happen is the **sample space** $\\Omega$.

Before you talk about “how likely” anything is, you must know what could happen. That list is $\\Omega$ — and it can be tiny or huge. Watch the sample space **grow** as the experiment gets richer:

- Flip one **coin** → $|\\Omega| = 2$.
- Roll one **die** → $|\\Omega| = 6$.
- Draw one **card** from a deck → $|\\Omega| = 52$.

This lesson builds that ladder, one rung at a time.`,
      visual: {
        type: 'sample-space',
        labelOmega: 'Ω (one coin flip)',
        outcomes: ['H', 'T'],
        caption: 'Smallest rung: flip one coin → Ω = {H, T}, just two possible outcomes',
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
        '**Next rung — experiment:** roll a standard six-sided die once. **Roll it several times first** and watch the outcomes pile up in the roll history below. Then **tap every face** that belongs to $\\Omega$, enter $|\\Omega|$, and (because the die is fair) enter $P(\\omega)$ for one face as a fraction.',
      interaction: 'die-sample-space',
      config: { sides: 6, selectAll: true },
      answer: { selected: [1, 2, 3, 4, 5, 6], count: 6, probability: { num: 1, den: 6 } },
      feedback: {
        correct:
          'Rolling builds the picture: every roll lands on one of six faces, so $\\Omega = \\{1,2,3,4,5,6\\}$ and $|\\Omega| = 6$. A fair die spreads probability evenly, so each face has $P(\\omega) = \\frac{1}{6}$. Bigger $\\Omega$ than the coin — and each single outcome is rarer.',
        incorrect:
          'Roll a few times to see which faces appear, then list **every** face 1–6. There are $|\\Omega| = 6$ outcomes, and a fair die gives each $P(\\omega) = \\frac{1}{6}$.',
        hints: [
          'Roll several times — the history fills with values, and they are always between 1 and 6.',
          'A standard die has six faces; each is one separate outcome $\\omega$. Select all six.',
          'Count them: $|\\Omega| = 6$. Fair die → $P(\\omega) = \\frac{1}{6}$.',
        ],
        why: `**Experiment:** roll a standard six-sided die once.

**Step 1 — Watch outcomes accumulate.** Each roll lands on one face. Over many rolls the only values you ever see are 1–6, so the sample space is

$$\\Omega = \\{1, 2, 3, 4, 5, 6\\}.$$

**Step 2 — Count:** $|\\Omega| = 6$.

**Step 3 — Fair share.** All faces are equally likely, so each gets

$$P(\\omega) = \\frac{1}{|\\Omega|} = \\frac{1}{6}.$$

Compare to the coin ($|\\Omega| = 2$, $P = \\frac{1}{2}$): a larger sample space makes each individual outcome **less** likely when fairness holds.`,
        venn: {
          type: 'sample-space',
          outcomes: ['1', '2', '3', '4', '5', '6'],
          caption: '|Ω| = 6 outcomes → P(ω) = 1/6 each',
        },
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        '**Top rung — experiment:** draw one card from a standard deck. The deck on screen **is** the sample space: $|\\Omega| = 52$ equally likely cards. For now, just pin down a single outcome — **tap the Ace of Spades** and enter $|A|$, the number of cards in that one-card event.',
      interaction: 'card-deck',
      config: {
        helperText:
          'The whole 52-card deck is the sample space Ω. Tap the single card named in the prompt — that one card is the event A.',
        selectionLabel: 'Your card (event A)',
        countLabel: 'How many cards are in this one-card event? Enter |A|.',
      },
      answer: { cards: ['AS'], count: 1 },
      feedback: {
        correct:
          'One card, so $|A| = 1$ — while the sample space around it holds $|\\Omega| = 52$ equally likely cards. The deck is by far the biggest $\\Omega$ in this lesson: coin (2) → die (6) → **deck (52)**.',
        incorrect:
          'The event is the **single** Ace of Spades, so $|A| = 1$. The 52-card deck around it is the sample space $\\Omega$, not the event.',
        hints: [
          'Find the Ace (rank A) in the spades row (the top, black suit), and tap only that card.',
          'A one-card event contains exactly one outcome, so $|A| = 1$.',
          'The deck shows $|\\Omega| = 52$; your event is just 1 of those 52 cards.',
        ],
        why: `**Experiment:** draw one card from a well-shuffled 52-card deck.

**Sample space.** Every card is one possible outcome, and all are equally likely:

$$|\\Omega| = 52.$$

**Event $A$ = “the Ace of spades.”** Only one card matches, so

$$|A| = 1.$$

This is the third rung of the ladder — coin $(2)$, die $(6)$, deck $(52)$. The richer the experiment, the larger $\\Omega$. Next we turn $|A|$ and $|\\Omega|$ into a probability.`,
        venn: {
          type: 'event-subset',
          labelOmega: 'Ω (52 cards)',
          labelA: 'A: one card',
          outcomes: ['Ace of spades', '51 other cards'],
          eventOutcomes: ['Ace of spades'],
          caption: '|A| = 1 inside |Ω| = 52',
        },
      },
    },
    {
      type: 'concept',
      id: 'c2',
      title: 'Equally likely outcomes: the uniform rule',
      content: `Each outcome $\\omega$ gets a number $P(\\omega)$ between **0** and **1** (0% to 100%). Two rules always hold:

1. **No outcome is negative** — $P(\\omega) \\ge 0$.
2. **Everything that could happen accounts for 100%** — adding $P(\\omega)$ over **all** $\\omega$ in $\\Omega$ gives **1**.

**The uniform (fair) rule.** When every outcome is **equally likely**, the total splits evenly across $\\Omega$, so each outcome gets

$$P(\\omega) = \\frac{1}{|\\Omega|}.$$

A fair coin gives $\\frac{1}{2}$, a fair die $\\frac{1}{6}$, and one card $\\frac{1}{52}$. And because each outcome carries the same share, the probability of an **event** $A$ (any collection of outcomes) is just its share of the whole:

$$P(A) = \\frac{|A|}{|\\Omega|}.$$

Count $\\Omega$ first — everything else follows.`,
      visual: {
        type: 'sample-space',
        labelOmega: 'Ω with weights',
        outcomes: ['H · 50%', 'T · 50%'],
        caption: 'Equally likely: weights are equal and sum to 100% (here 50% + 50%)',
      },
    },
    {
      type: 'problem',
      id: 'p4',
      prompt:
        'Now turn that single card into a probability. Every one of the 52 cards is equally likely, so use the uniform rule. **Tap the Queen of Hearts**, enter $|A|$, then enter $P(A) = \\frac{|A|}{52}$ as a reduced fraction.',
      interaction: 'card-deck',
      config: {
        helperText:
          'All 52 cards are equally likely. Tap the single card named in the prompt, then apply the uniform rule.',
        selectionLabel: 'Your card (event A)',
        countLabel: 'How many cards are in this event? Enter |A|.',
        probabilityLabel: 'What is P(A) = |A| / 52 as a reduced fraction?',
      },
      answer: { cards: ['QH'], count: 1, probability: { num: 1, den: 52 } },
      feedback: {
        correct:
          'One favorable card out of 52 equally likely cards: $P(A) = \\frac{1}{52}$. Every single card has this same tiny probability — that is exactly what “equally likely” means. Notice the pattern: fair coin $\\frac{1}{2}$, fair die $\\frac{1}{6}$, one card $\\frac{1}{52}$.',
        incorrect:
          'A single card is one outcome, so $|A| = 1$, and the uniform rule gives $P(A) = \\frac{1}{|\\Omega|} = \\frac{1}{52}$.',
        hints: [
          'Find the Queen (rank Q) in the hearts row (a red suit), and tap only that card.',
          '$|A| = 1$ because exactly one card is the Queen of hearts.',
          'Uniform rule: $P(A) = \\frac{1}{52}$.',
        ],
        why: `**Experiment:** draw one card; $|\\Omega| = 52$ equally likely cards.

**Event $A$ = “the Queen of hearts.”** One card matches, so $|A| = 1$.

**Uniform rule** (every outcome equally likely):

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{1}{52}.$$

Any single named card gives the same answer, $\\frac{1}{52}$ — the deck just makes “each outcome equally likely” vivid across 52 possibilities. This recipe, $P = \\frac{|A|}{|\\Omega|}$, is the engine for the whole course.`,
        venn: {
          type: 'event-subset',
          labelOmega: 'Ω (52 cards)',
          labelA: 'A: Q hearts',
          outcomes: ['Queen of hearts', '51 other cards'],
          eventOutcomes: ['Queen of hearts'],
          caption: '|A| = 1, |Ω| = 52 → P(A) = 1/52',
        },
      },
    },
    {
      type: 'problem',
      id: 'p5',
      prompt:
        'An event can hold **many** equally likely outcomes. **Event $A$:** the card is **red** (hearts or diamonds). Tap every red card, enter $|A|$, then enter $P(A) = \\frac{|A|}{52}$ as a reduced fraction.',
      interaction: 'card-deck',
      config: {
        helperText:
          'Tap every red card — all hearts and all diamonds. The whole deck (|Ω| = 52) is equally likely.',
        selectionLabel: 'Your selection (event A: red)',
        countLabel: 'How many red cards are there? Enter |A|.',
        probabilityLabel: 'What is P(A) = |A| / 52 as a reduced fraction?',
      },
      answer: { cards: redCards(), count: 26, probability: { num: 1, den: 2 } },
      feedback: {
        correct:
          'Half the deck is red: $|A| = 26$, so $P(A) = \\frac{26}{52} = \\frac{1}{2}$. Because all 52 cards are equally likely, an event’s probability is just its share of the deck. Red-vs-black mirrors a coin’s heads-vs-tails — both $\\frac{1}{2}$ — but here the sample space holds 52 outcomes, not 2.',
        incorrect:
          'Red means **hearts and diamonds** — two of the four suits, so $26$ cards. With all cards equally likely, $P(A) = \\frac{26}{52} = \\frac{1}{2}$.',
        hints: [
          'Red suits are hearts and diamonds; black suits are spades and clubs.',
          'Two suits of 13 cards each → $|A| = 13 + 13 = 26$.',
          '$P(A) = \\frac{26}{52} = \\frac{1}{2}$.',
        ],
        why: `**Sample space:** one card from 52 equally likely cards, $|\\Omega| = 52$.

**Event $A$ = “red.”** Two of the four suits are red (hearts, diamonds), each with 13 cards:

$$|A| = 13 + 13 = 26.$$

**Uniform rule for an event** — each card is $\\frac{1}{52}$, and the event collects 26 of them:

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{26}{52} = \\frac{1}{2}.$$

This is the same equally-likely idea as a single card, scaled up to a 26-outcome event. Always reduce the fraction.`,
        venn: {
          type: 'event-subset',
          labelOmega: 'Ω (52 cards)',
          labelA: 'A: red',
          outcomes: ['26 red', '26 black'],
          eventOutcomes: ['26 red'],
          caption: '|A| = 26 of |Ω| = 52 → P(A) = 1/2',
        },
      },
    },
    {
      type: 'problem',
      id: 'p6',
      prompt:
        'One more equally likely event. **Event $A$:** the card is a **spade** (one of the four suits). Tap all the spades, enter $|A|$, then enter $P(A) = \\frac{|A|}{52}$ as a reduced fraction.',
      interaction: 'card-deck',
      config: {
        helperText: 'Tap every spade — the whole top row. All 52 cards are equally likely.',
        selectionLabel: 'Your selection (event A: spades)',
        countLabel: 'How many spades are there? Enter |A|.',
        probabilityLabel: 'What is P(A) = |A| / 52 as a reduced fraction?',
      },
      answer: { cards: cardsBySuit('S'), count: 13, probability: { num: 1, den: 4 } },
      feedback: {
        correct:
          'One suit is 13 cards, so $|A| = 13$ and $P(A) = \\frac{13}{52} = \\frac{1}{4}$. A smaller event than “red” (26 cards), so a smaller probability — $\\frac{1}{4}$ instead of $\\frac{1}{2}$. The event’s size drives its probability when outcomes are equally likely.',
        incorrect:
          'A spade is one of the four suits, and each suit has 13 cards, so $|A| = 13$. Then $P(A) = \\frac{13}{52} = \\frac{1}{4}$.',
        hints: [
          'Spades are one suit; each suit has 13 cards (A through K).',
          '$|A| = 13$, one quarter of the 52-card deck.',
          '$P(A) = \\frac{13}{52} = \\frac{1}{4}$.',
        ],
        why: `**Event $A$ = “a spade.”** A deck has 4 suits of 13 cards each, so one suit is

$$|A| = 13.$$

**Uniform rule for an event:**

$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{13}{52} = \\frac{1}{4}.$$

Compare the three card events: one card $\\frac{1}{52}$, a suit $\\frac{1}{4}$, red $\\frac{1}{2}$. Each is just (event size) ÷ 52 — the same uniform rule, larger or smaller numerator.`,
        venn: {
          type: 'event-subset',
          labelOmega: 'Ω (52 cards)',
          labelA: 'A: spade',
          outcomes: ['13 spades', '39 others'],
          eventOutcomes: ['13 spades'],
          caption: '|A| = 13 of |Ω| = 52 → P(A) = 1/4',
        },
      },
    },
  ],
}
