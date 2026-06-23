import type { SkillCheckDefinition } from '../../types/skillCheck'

export const skillCheck1: SkillCheckDefinition = {
  lessonId: '1',
  title: 'Sample Spaces Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        'You flip one fair coin once. Which set is the **complete sample space** $\\Omega$ (all outcomes that could happen)?',
      choices: [
        { id: 'a', label: '$\\{\\text{H}, \\text{T}\\}$' },
        { id: 'b', label: '$\\{0, 1\\}$' },
        { id: 'c', label: '$\\{\\text{H}, \\text{T}, \\text{Edge}\\}$' },
        { id: 'd', label: '$\\{\\text{Heads only}\\}$' },
      ],
      correctChoiceId: 'a',
    },
    {
      id: 'q2',
      prompt:
        'A fair six-sided die is rolled once. You counted $|\\Omega| = 6$. What is $P(\\omega)$ for **each** outcome $\\omega$?',
      choices: [
        { id: 'a', label: '$\\frac{1}{3}$' },
        { id: 'b', label: '$\\frac{1}{6}$' },
        { id: 'c', label: '$\\frac{1}{2}$' },
        { id: 'd', label: 'It depends on which face you want' },
      ],
      correctChoiceId: 'b',
    },
    {
      id: 'q3',
      prompt:
        'A fair **8-sided** die is rolled once. How many outcomes are in $\\Omega$ (what is $|\\Omega|$)?',
      choices: [
        { id: 'a', label: '6' },
        { id: 'b', label: '8' },
        { id: 'c', label: '16' },
        { id: 'd', label: '64' },
      ],
      correctChoiceId: 'b',
    },
  ],
}
