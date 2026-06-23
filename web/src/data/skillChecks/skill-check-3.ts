import type { SkillCheckDefinition } from '../../types/skillCheck'

export const skillCheck3: SkillCheckDefinition = {
  lessonId: '3',
  title: 'Counting Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        'Outfit choice: **3 shirts** and **2 pants** (pick one of each). Try combinations, then **enter $|\\Omega|$** using the multiplication principle.',
      interaction: 'counting-product',
      config: {
        stages: [
          { label: 'Shirt', options: ['Red', 'Blue', 'Green'] },
          { label: 'Pants', options: ['Khaki', 'Black'] },
        ],
        countLabel: 'Enter |Ω| — total outfits (3 × 2)?',
      },
      answer: { product: 6 },
      incorrectFeedback: 'Multiply stage counts: $3 \\times 2 = 6$ outfits in $\\Omega$.',
    },
    {
      id: 'q2',
      prompt:
        'Seat **3 distinct guests** (A, B, C) in **3 chairs** where order matters. Seat everyone, then **enter $3!$** — total arrangements.',
      interaction: 'seat-permutation',
      config: { guests: ['A', 'B', 'C'] },
      answer: { totalArrangements: 6 },
      incorrectFeedback:
        'Count seatings: $3 \\times 2 \\times 1 = 3! = 6$ total arrangements in $\\Omega$.',
    },
    {
      id: 'q3',
      prompt:
        'A meal has **2 appetizers**, **3 entrées**, and **2 desserts** (pick one of each). Build a meal, then **enter the total** using the multiplication principle.',
      interaction: 'counting-product',
      config: {
        stages: [
          { label: 'Appetizer', options: ['Soup', 'Salad'] },
          { label: 'Entrée', options: ['Pasta', 'Fish', 'Tofu'] },
          { label: 'Dessert', options: ['Cake', 'Fruit'] },
        ],
        countLabel: 'Enter total meals (2 × 3 × 2)?',
      },
      answer: { product: 12 },
      incorrectFeedback: 'Multiply: $2 \\times 3 \\times 2 = 12$ meals in $\\Omega$.',
    },
  ],
}
