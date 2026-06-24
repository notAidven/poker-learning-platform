import type { SkillCheckDefinition } from '../../types/skillCheck'

export const skillCheck5: SkillCheckDefinition = {
  lessonId: '5',
  title: 'Classic Problems Skill Check',
  questions: [
    {
      id: 'q1',
      prompt:
        'Birthday problem: simulate small groups, then **enter $|\\Omega|$** — how many equally likely birthdays does one person have (ignore leap years)?',
      interaction: 'birthday-simulation',
      config: {
        people: 10,
        minTrials: 8,
        countLabel: 'How many day-of-year slots does one person have? Enter |Ω|.',
      },
      answer: { count: 365 },
      incorrectFeedback:
        'One person has one of **365** equally likely birthdays, so $|\\Omega| = 365$.',
    },
    {
      id: 'q2',
      prompt:
        'Place letters **A, B, C** into envelopes **A, B, C** so **no letter matches** its envelope. Build one derangement, then **enter $D_3$**.',
      interaction: 'derangement-match',
      config: { labels: ['A', 'B', 'C'] },
      answer: { derangementCount: 2 },
      incorrectFeedback:
        'Only BCA and CAB leave every letter wrong — there are **2** derangements. Enter $D_3 = 2$.',
    },
    {
      id: 'q3',
      prompt:
        '**3 distinct guests** sit in **3 chairs** (every ordering is one outcome). Seat everyone, then **enter $3!$** — total placements in $\\Omega$.',
      interaction: 'seat-permutation',
      config: {
        guests: ['X', 'Y', 'Z'],
        countLabel: 'Enter |Ω| = 3! — total permutations:',
      },
      answer: { totalArrangements: 6 },
      incorrectFeedback:
        '$|\\Omega| = 3! = 6$ permutations. With $D_3 = 2$, $P(\\text{all wrong}) = \\frac{2}{6} = \\frac{1}{3}$.',
    },
  ],
}
