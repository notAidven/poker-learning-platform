import { cellKey, coinPatterns } from '../../types/lesson'
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
        'Two fair dice are rolled (ordered pairs). Pick one outcome from each die in the widget, then **enter $|\\Omega|$** — total ordered pairs.',
      interaction: 'counting-product',
      config: {
        stages: [
          { label: 'Die 1', options: ['1', '2', '3', '4', '5', '6'] },
          { label: 'Die 2', options: ['1', '2', '3', '4', '5', '6'] },
        ],
        countLabel: 'Enter |Ω| — how many ordered pairs (6 × 6)?',
      },
      answer: { product: 36 },
      incorrectFeedback: 'Multiply: 6 outcomes on Die 1 × 6 on Die 2 → $|Ω| = 36$.',
    },
    {
      id: 'q2',
      prompt:
        'Two fair dice are rolled. **Event $A$:** sum is **7**. Select every cell in $A$ on the grid, then **enter $|A|$**.',
      interaction: 'two-dice-grid',
      config: { matchSum: 7, exactCount: 6 },
      answer: { cells: sumSeven, eventCount: 6 },
      incorrectFeedback:
        'Find every pair with Die 1 + Die 2 = 7 — six cells — then enter $|A| = 6$.',
    },
    {
      id: 'q3',
      prompt:
        'Flip **3 fair coins**. **Select every outcome pattern** in $\\Omega$, then **enter $|\\Omega|$**.',
      interaction: 'coin-event-grid',
      config: {
        coins: 3,
        maxHeads: 3,
        countLabel: 'Enter |Ω| — how many length-3 H/T patterns?',
      },
      answer: { patterns: coinPatterns(3), count: 8 },
      incorrectFeedback:
        'Each flip is H or T — list all 8 patterns, then enter $|Ω| = 2^3 = 8$.',
    },
  ],
}
