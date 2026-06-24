import { cardsByRank } from '../../types/lesson'
import type { SkillCheckDefinition } from '../../types/skillCheck'

const aceOrKing = [...cardsByRank('A'), ...cardsByRank('K')]

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
        'Draw one card ($|\\Omega| = 52$). **Event:** the card is an **Ace or a King**. Tap every card in $A \\cup B$, enter $|A \\cup B|$, then enter $P(A \\cup B)$ as a reduced fraction.',
      interaction: 'card-deck',
      config: {
        helperText: 'Tap every Ace and every King. No card is both, so the sets do not overlap.',
        selectionLabel: 'Your selection (Aces ∪ Kings)',
        countLabel: 'How many cards are Aces or Kings? Enter |A ∪ B|.',
        probabilityLabel: 'What is P(A ∪ B) = |A ∪ B| / 52 as a reduced fraction?',
      },
      answer: { cards: aceOrKing, count: 8, probability: { num: 2, den: 13 } },
      incorrectFeedback:
        'Aces and Kings are disjoint, so $|A \\cup B| = 4 + 4 = 8$ and $P = \\frac{8}{52} = \\frac{2}{13}$.',
    },
  ],
}
