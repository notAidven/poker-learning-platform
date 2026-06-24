import { cardsByRank, cellKey } from '../../types/lesson'
import type { SkillCheckDefinition } from '../../types/skillCheck'

const sumSeven = [
  cellKey(1, 6),
  cellKey(2, 5),
  cellKey(3, 4),
  cellKey(4, 3),
  cellKey(5, 2),
  cellKey(6, 1),
]

export const skillCheck2: SkillCheckDefinition = {
  lessonId: '2',
  title: 'Events Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        'Two fair dice are rolled ($|\\Omega| = 36$). **Event $A$:** sum is **7**. Select every cell in $A$ on the grid, then **enter $|A|$**.',
      interaction: 'two-dice-grid',
      config: { matchSum: 7, exactCount: 6 },
      answer: { cells: sumSeven, eventCount: 6 },
      incorrectFeedback:
        'Find every pair with Die 1 + Die 2 = 7 — six cells — then enter $|A| = 6$.',
    },
    {
      id: 'q2',
      prompt:
        'Draw one card ($|\\Omega| = 52$). **Event $A$:** the card is a **King**. Tap all four Kings, enter $|A|$, then enter $P(A) = \\frac{|A|}{52}$ as a reduced fraction.',
      interaction: 'card-deck',
      config: {
        helperText: 'Tap every King — one per suit.',
        selectionLabel: 'Your selection (event A: Kings)',
        countLabel: 'How many Kings are there? Enter |A|.',
        probabilityLabel: 'What is P(A) = |A| / 52 as a reduced fraction?',
      },
      answer: { cards: cardsByRank('K'), count: 4, probability: { num: 1, den: 13 } },
      incorrectFeedback:
        'One King per suit → $|A| = 4$, so $P(A) = \\frac{4}{52} = \\frac{1}{13}$.',
    },
    {
      id: 'q3',
      prompt:
        'Flip **2 fair coins** ($|\\Omega| = 4$). **Event $A$:** “at least one head.” Select every pattern in $A$, enter $|A|$, then enter $P(A)$ as a reduced fraction.',
      interaction: 'coin-event-grid',
      config: {
        coins: 2,
        maxHeads: 2,
        countLabel: 'Enter |A| — how many patterns have at least one H?',
        probabilityLabel: 'Enter P(A) = |A| / |Ω| as a reduced fraction',
      },
      answer: { patterns: ['HH', 'HT', 'TH'], count: 3, probability: { num: 3, den: 4 } },
      incorrectFeedback:
        '“At least one head” = HH, HT, TH (every pattern except TT), so $|A| = 3$ and $P(A) = \\frac{3}{4}$.',
    },
  ],
}
