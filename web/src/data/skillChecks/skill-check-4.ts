import { coinPatterns, countHeads } from '../../types/lesson'
import type { SkillCheckDefinition } from '../../types/skillCheck'

const exactlyTwoHeadsFour = coinPatterns(4).filter((p) => countHeads(p) === 2)
const exactlyTwoHeadsThree = coinPatterns(3).filter((p) => countHeads(p) === 2)

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
        'Select all patterns with exactly 2 H’s — there are $\\binom{4}{2} = 6$ — then enter $|A| = 6$.',
    },
    {
      id: 'q3',
      prompt:
        'Flip **3 fair coins**. **Event $A$:** exactly **2 heads**. Select every pattern in $A$, then **enter $|A|$** ($|\\Omega| = 8$).',
      interaction: 'coin-event-grid',
      config: {
        coins: 3,
        maxHeads: 3,
        countLabel: 'Enter |A| — patterns with exactly 2 heads?',
      },
      answer: { patterns: exactlyTwoHeadsThree, count: 3 },
      incorrectFeedback:
        'Patterns with exactly 2 H’s: HHT, HTH, THH — enter $|A| = 3$, so $P(A) = \\frac{3}{8}$.',
    },
  ],
}
