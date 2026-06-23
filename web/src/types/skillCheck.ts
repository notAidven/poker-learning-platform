import type { ProblemStep } from './lesson'

export type SkillCheckQuestion = Omit<ProblemStep, 'type' | 'feedback'> & {
  incorrectFeedback?: string
}

export type SkillCheckDefinition = {
  lessonId: string
  title: string
  questions: SkillCheckQuestion[]
}
