import type { SkillCheckDefinition } from '../../types/skillCheck'

export const skillCheck5: SkillCheckDefinition = {
  lessonId: '5',
  title: 'Classic Problems Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        'In the birthday problem (365-day year), about how many people are needed so a shared birthday is **more likely than not**?',
      choices: [
        { id: 'a', label: '10' },
        { id: 'b', label: '23' },
        { id: 'c', label: '50' },
        { id: 'd', label: '183' },
      ],
      correctChoiceId: 'b',
    },
    {
      id: 'q2',
      prompt: 'How many **derangements** $D_3$ exist for 3 letters (no letter in its correct envelope)?',
      choices: [
        { id: 'a', label: '1' },
        { id: 'b', label: '2' },
        { id: 'c', label: '3' },
        { id: 'd', label: '6' },
      ],
      correctChoiceId: 'b',
    },
    {
      id: 'q3',
      prompt:
        '3 letters are randomly placed in 3 envelopes. $|D_3| = 2$ and $|\\Omega| = 3! = 6$. What is $P(\\text{no letter correct})$?',
      choices: [
        { id: 'a', label: '$\\frac{1}{6}$' },
        { id: 'b', label: '$\\frac{1}{3}$' },
        { id: 'c', label: '$\\frac{1}{2}$' },
        { id: 'd', label: '$\\frac{2}{3}$' },
      ],
      correctChoiceId: 'b',
    },
  ],
}
