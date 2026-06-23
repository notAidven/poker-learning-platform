import type { SkillCheckDefinition } from '../../types/skillCheck'

export const skillCheck4: SkillCheckDefinition = {
  lessonId: '4',
  title: 'Combinations Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: 'Choose **2 from 5** (order does not matter). What is $\\binom{5}{2}$?',
      choices: [
        { id: 'a', label: '5' },
        { id: 'b', label: '10' },
        { id: 'c', label: '20' },
        { id: 'd', label: '25' },
      ],
      correctChoiceId: 'b',
    },
    {
      id: 'q2',
      prompt: 'Flip **4 fair coins**. How many patterns have **exactly 2 heads** ($|A| = \\binom{4}{2}$)?',
      choices: [
        { id: 'a', label: '4' },
        { id: 'b', label: '6' },
        { id: 'c', label: '8' },
        { id: 'd', label: '16' },
      ],
      correctChoiceId: 'b',
    },
    {
      id: 'q3',
      prompt:
        'Flip **3 fair coins**. $|A| = 3$ patterns with exactly 2 heads and $|\\Omega| = 8$. What is $P(A)$?',
      choices: [
        { id: 'a', label: '$\\frac{1}{8}$' },
        { id: 'b', label: '$\\frac{3}{8}$' },
        { id: 'c', label: '$\\frac{1}{2}$' },
        { id: 'd', label: '$\\frac{3}{4}$' },
      ],
      correctChoiceId: 'b',
    },
  ],
}
