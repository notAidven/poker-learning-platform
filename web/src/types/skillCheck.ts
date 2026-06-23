export type SkillCheckChoice = {
  id: string
  label: string
}

export type SkillCheckQuestion = {
  id: string
  prompt: string
  choices: SkillCheckChoice[]
  correctChoiceId: string
}

export type SkillCheckDefinition = {
  lessonId: string
  title: string
  questions: SkillCheckQuestion[]
}
