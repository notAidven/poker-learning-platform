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
        'Roll a fair six-sided die once. **Tap every face** in $\\Omega$, **enter $|\\Omega|$**, then **enter $P(\\omega)$ as a fraction**.',
      interaction: 'die-sample-space',
      config: { sides: 6, selectAll: true },
      answer: { selected: [1, 2, 3, 4, 5, 6], count: 6, probability: { num: 1, den: 6 } },
      incorrectFeedback:
        'List every face 1–6, enter $|\\Omega| = 6$, then $P(\\omega) = \\frac{1}{6}$.',
    },
    {
      id: 'q3',
      prompt:
        'Draw one card from a standard deck ($|\\Omega| = 52$). **Tap the Ace of Spades**, enter $|A|$, then enter $P(A) = \\frac{|A|}{52}$ as a reduced fraction.',
      interaction: 'card-deck',
      config: {
        helperText: 'Tap the single card named in the prompt. The deck (|Ω| = 52) is equally likely.',
        selectionLabel: 'Your card (event A)',
        countLabel: 'How many cards are in this event? Enter |A|.',
        probabilityLabel: 'What is P(A) = |A| / 52 as a reduced fraction?',
      },
      answer: { cards: ['AS'], count: 1, probability: { num: 1, den: 52 } },
      incorrectFeedback:
        'One card out of 52 equally likely cards: $|A| = 1$ and $P(A) = \\frac{1}{52}$.',
    },
  ],
}
