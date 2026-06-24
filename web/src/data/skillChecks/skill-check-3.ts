import type { SkillCheckDefinition } from '../../types/skillCheck'

export const skillCheck3: SkillCheckDefinition = {
  lessonId: '3',
  title: 'Counting Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        'A meal has **2 appetizers**, **3 entrées**, and **2 desserts** (pick one of each). Build a meal, then **enter $|\\Omega|$** using the multiplication principle.',
      interaction: 'counting-product',
      config: {
        stages: [
          { label: 'Appetizer', options: ['Soup', 'Salad'] },
          { label: 'Entrée', options: ['Pasta', 'Fish', 'Tofu'] },
          { label: 'Dessert', options: ['Cake', 'Fruit'] },
        ],
        countLabel: 'Enter |Ω| — total meals (2 × 3 × 2)?',
      },
      answer: { product: 12 },
      incorrectFeedback: 'Multiply the stages: $2 \\times 3 \\times 2 = 12$ meals in $\\Omega$.',
    },
    {
      id: 'q2',
      prompt:
        'Every card is one **suit** (4 options) and one **rank** (13 options). Pick one of each, then **enter $|\\Omega|$** — the size of a standard deck.',
      interaction: 'counting-product',
      config: {
        stages: [
          { label: 'Suit', options: ['Spades', 'Hearts', 'Diamonds', 'Clubs'] },
          {
            label: 'Rank',
            options: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
          },
        ],
        countLabel: 'Enter |Ω| — total cards (4 × 13)?',
      },
      answer: { product: 52 },
      incorrectFeedback: 'Each card is one (suit, rank) pair: $4 \\times 13 = 52$.',
    },
    {
      id: 'q3',
      prompt:
        'Seat **4 distinct guests** in **4 chairs** where order matters. Seat everyone, then **enter $4!$** — total arrangements.',
      interaction: 'seat-permutation',
      config: { guests: ['1', '2', '3', '4'] },
      answer: { totalArrangements: 24 },
      incorrectFeedback:
        'Count seatings: $4 \\times 3 \\times 2 \\times 1 = 4! = 24$ arrangements in $\\Omega$.',
    },
  ],
}
