import type { SkillCheckDefinition } from '../../types/skillCheck'

export const skillCheck3: SkillCheckDefinition = {
  lessonId: '3',
  title: 'Counting Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        'Outfit choice: 3 shirts **and** 1 pair of pants from 2 options. Using the multiplication principle, how many outcomes in $\\Omega$?',
      choices: [
        { id: 'a', label: '5' },
        { id: 'b', label: '6' },
        { id: 'c', label: '8' },
        { id: 'd', label: '9' },
      ],
      correctChoiceId: 'b',
    },
    {
      id: 'q2',
      prompt:
        '3 **distinct** guests sit in 3 chairs; order matters. What is $|\\Omega|$ (total seatings)?',
      choices: [
        { id: 'a', label: '3' },
        { id: 'b', label: '6' },
        { id: 'c', label: '9' },
        { id: 'd', label: '12' },
      ],
      correctChoiceId: 'b',
    },
    {
      id: 'q3',
      prompt:
        'A meal has 2 appetizers, 3 entrées, and 2 desserts (pick one of each). Multiply the stage counts — how many meals?',
      choices: [
        { id: 'a', label: '7' },
        { id: 'b', label: '10' },
        { id: 'c', label: '12' },
        { id: 'd', label: '24' },
      ],
      correctChoiceId: 'c',
    },
  ],
}
