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

Before you talk about “how likely” anything is, you must know what could happen. That list is $\\Omega$ — and it can be tiny or huge. Its size depends on the experiment:

- Flip one **coin** → $|\\Omega| = 2$.
- Roll one **die** → $|\\Omega| = 6$.
- Draw one **card** from a deck → $|\\Omega| = 52$.`,
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
        '**Experiment:** roll a standard six-sided die once. **Roll it several times first** and watch the outcomes pile up in the roll history below. Then **tap every face** that belongs to $\\Omega$ and enter $|\\Omega|$.',
      interaction: 'die-sample-space',
      config: { sides: 6, selectAll: true },
      answer: { selected: [1, 2, 3, 4, 5, 6], count: 6 },
      feedback: {
        correct:
          'Rolling builds the picture: every roll lands on one of six faces, so $\\Omega = \\{1,2,3,4,5,6\\}$ and $|\\Omega| = 6$. That is a bigger sample space than the coin ($|\\Omega| = 2$). Pinning down $\\Omega$ first is what lets you measure probabilities of **events** next.',
        incorrect:
          'Roll a few times to see which faces appear, then list **every** face 1–6. There are $|\\Omega| = 6$ outcomes in the sample space.',
        hints: [
          'Roll several times — the history fills with values, and they are always between 1 and 6.',
          'A standard die has six faces; each is one separate outcome $\\omega$. Select all six.',
          'Count them: $|\\Omega| = 6$ — six possible outcomes.',
        ],
        why: `**Experiment:** roll a standard six-sided die once.

**Step 1 — Watch outcomes accumulate.** Each roll lands on one face. Over many rolls the only values you ever see are 1–6, so the sample space is

$$\\Omega = \\{1, 2, 3, 4, 5, 6\\}.$$

**Step 2 — Count:** $|\\Omega| = 6$.

Compare to the coin ($|\\Omega| = 2$): the die has a larger sample space. Listing and counting $\\Omega$ is the groundwork — the next section turns these counts into probabilities for **events** that contain several outcomes.`,
        venn: {
          type: 'sample-space',
          outcomes: ['1', '2', '3', '4', '5', '6'],
          caption: '|Ω| = 6 equally likely outcomes',
        },
      },
    },
    {
      type: 'problem',
      id: 'p3',
      prompt:
        '**Experiment:** draw one card from a standard deck. The deck on screen **is** the sample space: $|\\Omega| = 52$ equally likely cards. For now, just pin down a single outcome — **tap the Ace of Spades** and enter $|A|$, the number of cards in that one-card event.',
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

The size progression continues: coin $(2)$, die $(6)$, deck $(52)$. A more involved experiment simply has a larger $\\Omega$.`,
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
        'A probability is also the **long-run frequency** of an event. **Event $A$:** the drawn card is a **heart**. First predict $P(\\text{heart})$, then **draw many cards** (returned each time) and watch the running fraction of hearts settle toward your prediction. Finally, confirm $|A|$ (hearts in the deck) and $P(\\text{heart}) = \\frac{|A|}{52}$ as a reduced fraction.',
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
          'One suit holds 13 cards, so $|A| = 13$ and $P(\\text{heart}) = \\frac{13}{52} = \\frac{1}{4}$. Your draw-by-draw frequency wobbles early on but homes in on $\\frac{1}{4}$ as the draws pile up — that is probability as **long-run frequency**, and it agrees with the uniform count exactly.',
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

**Uniform rule:**

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
        'A single outcome is **less** likely when the sample space is larger. **Which is more likely:** rolling one specific face on a fair die, or drawing one specific card from a 52-card deck? Tap the more likely event.',
      interaction: 'compare-events',
      config: {
        helperText:
          'Both events name a single outcome — but they live in sample spaces of different sizes (die: 6, deck: 52).',
        chooseLabel: 'Which single outcome is more likely?',
        eventA: {
          label: 'Roll a 4 on a die',
          detail: 'One face out of 6 equally likely faces',
          favorable: 1,
          total: 6,
        },
        eventB: {
          label: 'Draw the Ace of spades',
          detail: 'One card out of 52 equally likely cards',
          favorable: 1,
          total: 52,
        },
      },
      answer: { more: 'a' },
      feedback: {
        correct:
          'Rolling a given face is more likely: $\\frac{1}{6} \\approx 16.7\\%$ beats $\\frac{1}{52} \\approx 1.9\\%$. Same kind of event (a single outcome), but the die’s smaller sample space hands each outcome a bigger share. Larger $\\Omega$ → rarer individual outcomes.',
        incorrect:
          'Compare the shares: a die face is $\\frac{1}{6}$, one card is $\\frac{1}{52}$. Since $\\frac{1}{6} > \\frac{1}{52}$, the die face is more likely.',
        hints: [
          'Each die face has probability $\\frac{1}{|\\Omega|} = \\frac{1}{6}$; each card has $\\frac{1}{52}$.',
          'A smaller sample space spreads the same total probability over fewer outcomes.',
          'Since $\\frac{1}{6} > \\frac{1}{52}$, choose the die face.',
        ],
        why: `Both events contain exactly **one** outcome, so the uniform rule gives each a probability of $\\frac{1}{|\\Omega|}$:

$$P(\\text{die face}) = \\frac{1}{6} \\approx 16.7\\%, \\qquad P(\\text{one card}) = \\frac{1}{52} \\approx 1.9\\%.$$

The die has the **smaller** sample space, so its single outcome carries a larger share of the total. This is the lesson’s size list seen through probability: coin $(2)$, die $(6)$, deck $(52)$ — as $\\Omega$ grows larger, each individual outcome becomes **less** likely.`,
        venn: {
          type: 'sample-space',
          labelOmega: 'die Ω (6) vs deck Ω (52)',
          outcomes: ['die face: 1/6', 'one card: 1/52'],
          caption: '1/6 ≈ 16.7% > 1/52 ≈ 1.9% → the die face is more likely',
        },
      },
    },
  ],
}
