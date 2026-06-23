import type { SkillCheckDefinition } from '../../types/skillCheck'

export const skillCheck6: SkillCheckDefinition = {
  lessonId: '6',
  title: 'Set Operations Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        '$|A| = 12$, $|B| = 10$, $|A \\cap B| = 4$. **Enter $|A \\cup B|$** using inclusion–exclusion.',
      interaction: 'venn-diagram',
      config: {
        sizeA: 12,
        sizeB: 10,
        intersection: 4,
        task: 'enter-union',
      },
      answer: { count: 18 },
      incorrectFeedback:
        '$|A \\cup B| = |A| + |B| - |A \\cap B| = 12 + 10 - 4 = 18$.',
    },
    {
      id: 'q2',
      prompt:
        '$|\\Omega| = 30$ and $|A| = 12$. **Enter $|A^c|$** — outcomes in $\\Omega$ but **not** in $A$.',
      interaction: 'venn-diagram',
      config: {
        sizeA: 12,
        sizeB: 10,
        intersection: 4,
        universeSize: 30,
        task: 'enter-complement',
        countLabel: 'Enter |Aᶜ| = |Ω| − |A|:',
      },
      answer: { count: 18 },
      incorrectFeedback: '$|A^c| = |\\Omega| - |A| = 30 - 12 = 18$.',
    },
    {
      id: 'q3',
      prompt:
        '$|A| = 12$, $|B| = 10$, $|A \\cap B| = 4$. **Select every region** that belongs to $A \\cup B$ (union).',
      interaction: 'venn-diagram',
      config: {
        sizeA: 12,
        sizeB: 10,
        intersection: 4,
        task: 'select-union',
      },
      answer: { selectedRegions: ['aOnly', 'bOnly', 'ab'] },
      incorrectFeedback:
        'Union = A-only + B-only + overlap — select all three regions (not outside the circles).',
    },
  ],
}
