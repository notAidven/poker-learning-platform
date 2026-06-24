import { cardsBySuit } from '../../types/lesson'
import type { SkillCheckDefinition } from '../../types/skillCheck'

export const skillCheck1: SkillCheckDefinition = {
  lessonId: '1',
  title: 'Sample Spaces Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        'Flip one fair coin. **Flip it several times** to discover every outcome, **lock in $\\Omega$**, and enter $|\\Omega|$.',
      interaction: 'sample-space-picker',
      config: {
        options: ['H', 'T'],
        discoverMode: true,
        confirmCount: true,
        discoverHelperText:
          'Flip until no new result appears. Each distinct outcome you see joins Ω.',
        countLabel: 'How many distinct outcomes are in Ω? Enter |Ω|.',
        lockInLabel: "I've seen every outcome — lock in Ω",
      },
      answer: { selected: ['H', 'T'] },
      incorrectFeedback:
        'A single flip only ever lands H or T, so $\\Omega = \\{\\text{H}, \\text{T}\\}$ and $|\\Omega| = 2$.',
    },
    {
      id: 'q2',
      prompt:
        'Roll a fair six-sided die. **Event $A$:** the result is **even**. Tap every even face, enter $|A|$, then enter $P(A)$ as a reduced fraction.',
      interaction: 'die-sample-space',
      config: {
        sides: 6,
        countLabel: 'How many faces are even? Enter |A|.',
        probabilityLabel: 'What is P(A) = |A| / 6 as a reduced fraction?',
      },
      answer: { selected: [2, 4, 6], count: 3, probability: { num: 1, den: 2 } },
      incorrectFeedback:
        'Even faces are 2, 4, 6, so $|A| = 3$ and $P(A) = \\frac{3}{6} = \\frac{1}{2}$.',
    },
    {
      id: 'q3',
      prompt:
        'Draw one card from a standard deck ($|\\Omega| = 52$). **Event $A$:** the card is a **spade**. Tap every spade, enter $|A|$, then enter $P(A) = \\frac{|A|}{52}$ as a reduced fraction.',
      interaction: 'card-deck',
      config: {
        helperText: 'Tap every spade — one full suit. The deck (|Ω| = 52) is equally likely.',
        selectionLabel: 'Your selection (event A: spades)',
        countLabel: 'How many spades are there? Enter |A|.',
        probabilityLabel: 'What is P(A) = |A| / 52 as a reduced fraction?',
      },
      answer: { cards: cardsBySuit('S'), count: 13, probability: { num: 1, den: 4 } },
      incorrectFeedback:
        'A spade is one of four suits of 13, so $|A| = 13$ and $P(A) = \\frac{13}{52} = \\frac{1}{4}$.',
    },
  ],
}
