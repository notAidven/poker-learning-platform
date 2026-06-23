import type { SkillCheckDefinition } from '../../types/skillCheck'

export const skillCheck2: SkillCheckDefinition = {
  lessonId: '2',
  title: 'Events Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        'Two fair dice are rolled (ordered pairs). How many outcomes are in the sample space $\\Omega$?',
      choices: [
        { id: 'a', label: '12' },
        { id: 'b', label: '21' },
        { id: 'c', label: '36' },
        { id: 'd', label: '6' },
      ],
      correctChoiceId: 'c',
    },
    {
      id: 'q2',
      prompt:
        'Two fair dice are rolled. Event $A$ = “sum is 7.” You found $|A| = 6$ and $|\\Omega| = 36$. What is $P(A)$?',
      choices: [
        { id: 'a', label: '$\\frac{1}{36}$' },
        { id: 'b', label: '$\\frac{1}{6}$' },
        { id: 'c', label: '$\\frac{7}{36}$' },
        { id: 'd', label: '$\\frac{1}{2}$' },
      ],
      correctChoiceId: 'b',
    },
    {
      id: 'q3',
      prompt:
        'Three fair coins are flipped. Each flip is H or T. How many outcomes are in $\\Omega$?',
      choices: [
        { id: 'a', label: '3' },
        { id: 'b', label: '6' },
        { id: 'c', label: '8' },
        { id: 'd', label: '9' },
      ],
      correctChoiceId: 'c',
    },
  ],
}
