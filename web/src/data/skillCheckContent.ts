import type { SkillCheckDefinition } from '../types/skillCheck'

const skillCheckLoaders: Record<string, () => Promise<SkillCheckDefinition>> = {
  '1': () => import('./skillChecks/skill-check-1').then((m) => m.skillCheck1),
  '2': () => import('./skillChecks/skill-check-2').then((m) => m.skillCheck2),
  '3': () => import('./skillChecks/skill-check-3').then((m) => m.skillCheck3),
  '4': () => import('./skillChecks/skill-check-4').then((m) => m.skillCheck4),
  preflop: () => import('./skillChecks/skill-check-preflop').then((m) => m.skillCheckPreflop),
  '5': () => import('./skillChecks/skill-check-5').then((m) => m.skillCheck5),
  '6': () => import('./skillChecks/skill-check-6').then((m) => m.skillCheck6),
  '7': () => import('./skillChecks/skill-check-7').then((m) => m.skillCheck7),
  '8': () => import('./skillChecks/skill-check-8').then((m) => m.skillCheck8),
  // Advanced Play (Part A)
  'adv-ranges': () => import('./skillChecks/skill-check-adv-ranges').then((m) => m.skillCheckAdvRanges),
  'adv-texture': () => import('./skillChecks/skill-check-adv-texture').then((m) => m.skillCheckAdvTexture),
  'adv-implied': () => import('./skillChecks/skill-check-adv-implied').then((m) => m.skillCheckAdvImplied),
  'adv-icm': () => import('./skillChecks/skill-check-adv-icm').then((m) => m.skillCheckAdvIcm),
}

const skillCheckCache = new Map<string, SkillCheckDefinition>()

export function hasSkillCheck(lessonId: string): boolean {
  return lessonId in skillCheckLoaders
}

export async function loadSkillCheck(
  lessonId: string,
): Promise<SkillCheckDefinition | undefined> {
  if (!hasSkillCheck(lessonId)) return undefined

  const cached = skillCheckCache.get(lessonId)
  if (cached) return cached

  const skillCheck = await skillCheckLoaders[lessonId]()
  skillCheckCache.set(lessonId, skillCheck)
  return skillCheck
}
