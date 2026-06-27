import type { LessonDefinition } from '../types/lesson'

const lessonLoaders: Record<string, () => Promise<LessonDefinition>> = {
  '1': () => import('./lessons/lesson-1').then((m) => m.lesson1),
  '2': () => import('./lessons/lesson-2').then((m) => m.lesson2),
  '3': () => import('./lessons/lesson-3').then((m) => m.lesson3),
  '4': () => import('./lessons/lesson-4').then((m) => m.lesson4),
  preflop: () => import('./lessons/lesson-preflop').then((m) => m.lessonPreflop),
  '5': () => import('./lessons/lesson-5').then((m) => m.lesson5),
  '6': () => import('./lessons/lesson-6').then((m) => m.lesson6),
  '7': () => import('./lessons/lesson-7').then((m) => m.lesson7),
  '8': () => import('./lessons/lesson-8').then((m) => m.lesson8),
  // Advanced Play (Part A)
  'adv-ranges': () => import('./lessons/adv-ranges').then((m) => m.advRanges),
  'adv-texture': () => import('./lessons/adv-texture').then((m) => m.advTexture),
  'adv-implied': () => import('./lessons/adv-implied').then((m) => m.advImplied),
  'adv-combos': () => import('./lessons/adv-combos').then((m) => m.advCombos),
  'adv-icm': () => import('./lessons/adv-icm').then((m) => m.advIcm),
}

const lessonCache = new Map<string, LessonDefinition>()

export function hasLessonContent(id: string): boolean {
  return id in lessonLoaders
}

export async function loadLesson(id: string): Promise<LessonDefinition | undefined> {
  if (!hasLessonContent(id)) return undefined

  const cached = lessonCache.get(id)
  if (cached) return cached

  const lesson = await lessonLoaders[id]()
  lessonCache.set(id, lesson)
  return lesson
}
