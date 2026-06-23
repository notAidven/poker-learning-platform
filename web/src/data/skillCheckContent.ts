import type { SkillCheckDefinition } from '../types/skillCheck'
import { skillCheck1 } from './skillChecks/skill-check-1'
import { skillCheck2 } from './skillChecks/skill-check-2'
import { skillCheck3 } from './skillChecks/skill-check-3'
import { skillCheck4 } from './skillChecks/skill-check-4'
import { skillCheck5 } from './skillChecks/skill-check-5'
import { skillCheck6 } from './skillChecks/skill-check-6'

const skillCheckCatalog: Record<string, SkillCheckDefinition> = {
  '1': skillCheck1,
  '2': skillCheck2,
  '3': skillCheck3,
  '4': skillCheck4,
  '5': skillCheck5,
  '6': skillCheck6,
}

export function getSkillCheck(lessonId: string): SkillCheckDefinition | undefined {
  return skillCheckCatalog[lessonId]
}

export function hasSkillCheck(lessonId: string): boolean {
  return lessonId in skillCheckCatalog
}
