import { coinPatterns, countHeads } from '../../types/lesson'
import type { SkillCheckDefinition } from '../../types/skillCheck'

const exactlyTwoHeadsFour = coinPatterns(4).filter((p) => countHeads(p) === 2)

export const skillCheck4: SkillCheckDefinition = {
  lessonId: '4',
  title: 'Combinations Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        'Choose **2 students from 5** for a committee (order does not matter). Select any 2, then **enter $\\binom{5}{2}$**.',
      interaction: 'select-combination',
      config: {
        items: ['Ana', 'Ben', 'Cara', 'Dan', 'Eve'],
        selectCount: 2,
      },
      answer: { combinationCount: 10 },
      incorrectFeedback:
        'Order does not matter — enter $\\binom{5}{2} = \\frac{5 \\times 4}{2 \\times 1} = 10$.',
    },
    {
      id: 'q2',
      prompt:
        'Flip **4 fair coins**. **Event $A$:** exactly **2 heads**. Select every pattern in $A$, then **enter $|A|$**.',
      interaction: 'coin-event-grid',
      config: {
        coins: 4,
        maxHeads: 4,
        countLabel: 'Enter |A| — patterns with exactly 2 heads?',
      },
      answer: { patterns: exactlyTwoHeadsFour, count: 6 },
      incorrectFeedback:
        'Choose which 2 of the 4 flips are heads: $\\binom{4}{2} = 6$ patterns, so $|A| = 6$.',
    },
    {
      id: 'q3',
      prompt:
        'An exam has **7 questions**; you must **answer 4** (order does not matter). Select any 4, then **enter $\\binom{7}{4}$**.',
      interaction: 'select-combination',
      config: {
        items: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'],
        selectCount: 4,
      },
      answer: { combinationCount: 35 },
      incorrectFeedback:
        'Choosing 4 to answer = choosing 3 to skip: $\\binom{7}{4} = \\binom{7}{3} = 35$.',
    },
  ],
}
