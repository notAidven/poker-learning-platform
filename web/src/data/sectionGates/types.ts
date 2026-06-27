import type { SectionId } from '../lessons'
import type { SkillCheckQuestion } from '../../types/skillCheck'

/**
 * A section-gate question reuses the exact skill-check question model (so the gate
 * player can reuse `SkillCheckStepView` / `InteractionRenderer` and grade identically
 * — interactive, no hints). It adds a `lessonId` tag recording which lesson in the
 * section the question draws on, used for coverage (every lesson appears) and the
 * maintainer-facing report.
 */
export type SectionGateQuestion = SkillCheckQuestion & {
  /** The section lesson this question covers (every lesson in the section is represented). */
  lessonId: string
}

export type SectionGateDefinition = {
  sectionId: SectionId
  title: string
  questions: SectionGateQuestion[]
}
