import type { SkillCheckDefinition } from '../../types/skillCheck'

export const skillCheck6: SkillCheckDefinition = {
  lessonId: '6',
  title: 'Set Operations Skill Check',
  questions: [
    {
      id: 'q1',
      prompt: '$|A| = 12$, $|B| = 10$, $|A \\cap B| = 4$. What is $|A \\cup B|$?',
      choices: [
        { id: 'a', label: '14' },
        { id: 'b', label: '18' },
        { id: 'c', label: '22' },
        { id: 'd', label: '26' },
      ],
      correctChoiceId: 'b',
    },
    {
      id: 'q2',
      prompt: '$|\\Omega| = 30$ and $|A| = 12$. What is $|A^c|$ (the complement of $A$)?',
      choices: [
        { id: 'a', label: '12' },
        { id: 'b', label: '18' },
        { id: 'c', label: '30' },
        { id: 'd', label: '42' },
      ],
      correctChoiceId: 'b',
    },
    {
      id: 'q3',
      prompt:
        'Which formula correctly counts $|A \\cup B|$ when you know $|A|$, $|B|$, and $|A \\cap B|$?',
      choices: [
        { id: 'a', label: '$|A| + |B|$' },
        { id: 'b', label: '$|A| + |B| - |A \\cap B|$' },
        { id: 'c', label: '$|A| \\times |B|$' },
        { id: 'd', label: '$|\\Omega| - |A \\cap B|$' },
      ],
      correctChoiceId: 'b',
    },
  ],
}
