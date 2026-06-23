import { coinPatterns } from '../../types/lesson'
import type { SkillCheckDefinition } from '../../types/skillCheck'

export const skillCheck1: SkillCheckDefinition = {
  lessonId: '1',
  title: 'Sample Spaces Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        'Flip one fair coin once. **Select every outcome** in $\\Omega$, **enter $|\\Omega|$**, then **enter $P(\\omega)$ as a fraction**.',
      interaction: 'coin-event-grid',
      config: {
        coins: 1,
        maxHeads: 1,
        countLabel: 'Enter |Ω| — how many outcomes are in the sample space?',
      },
      answer: { patterns: coinPatterns(1), count: 2, probability: { num: 1, den: 2 } },
      incorrectFeedback:
        '$\\Omega = \\{\\text{H}, \\text{T}\\}$ — select **both** outcomes, enter $|Ω| = 2$, then $P(\\omega) = \\frac{1}{2}$.',
    },
    {
      id: 'q2',
      prompt:
        'Roll a fair six-sided die once. **Tap every face** in $\\Omega$, **enter $|\\Omega|$**, then **enter $P(\\omega)$ as a fraction**.',
      interaction: 'die-sample-space',
      config: { sides: 6, selectAll: true },
      answer: { selected: [1, 2, 3, 4, 5, 6], count: 6, probability: { num: 1, den: 6 } },
      incorrectFeedback:
        'List every face 1–6, enter $|Ω| = 6$, then $P(\\omega) = \\frac{1}{6}$.',
    },
    {
      id: 'q3',
      prompt:
        'Roll a fair **8-sided** die once. **Tap every outcome** in $\\Omega$, **enter $|\\Omega|$**, then **enter $P(\\omega)$ as a fraction**.',
      interaction: 'die-sample-space',
      config: { sides: 8, selectAll: true },
      answer: { selected: [1, 2, 3, 4, 5, 6, 7, 8], count: 8, probability: { num: 1, den: 8 } },
      incorrectFeedback:
        'Include every integer outcome from 1 through 8, enter $|Ω| = 8$, then $P(\\omega) = \\frac{1}{8}$.',
    },
  ],
}
