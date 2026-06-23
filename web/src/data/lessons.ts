/** Canonical course path — 6 lessons for intro Probability & Random Variables */
export type LessonMeta = {
  id: string
  title: string
  unit: string
  primaryInteraction: string
}

export const lessons: LessonMeta[] = [
  {
    id: '1',
    title: 'Experiments, Outcomes & Sample Spaces',
    unit: 'Unit 1 · Foundations',
    primaryInteraction: 'Die/coin simulation; probability weights',
  },
  {
    id: '2',
    title: 'Events & Basic Probability',
    unit: 'Unit 2 · Events',
    primaryInteraction: 'Two-dice grid; coin flip events',
  },
  {
    id: '3',
    title: 'Counting & Factorials',
    unit: 'Unit 3 · Counting',
    primaryInteraction: 'Counting widget; seating guests',
  },
  {
    id: '4',
    title: 'Combinations & the Binomial Theorem',
    unit: 'Unit 4 · Combinations',
    primaryInteraction: 'Select k from n; coin-flip probability',
  },
  {
    id: '5',
    title: 'Classic Probability Problems',
    unit: 'Unit 5 · Classic problems',
    primaryInteraction: 'Birthday simulation; secretary problem',
  },
  {
    id: '6',
    title: 'Operations on Events',
    unit: 'Unit 6 · Set operations',
    primaryInteraction: 'Venn diagrams; inclusion–exclusion',
  },
]
