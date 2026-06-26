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
}

const lessonCache = new Map<string, LessonDefinition>()

export function hasLessonContent(id: string): boolean {
  return id in lessonLoaders
}

export function getLesson(id: string): LessonDefinition | undefined {
  return lessonCache.get(id)
}

export async function loadLesson(id: string): Promise<LessonDefinition | undefined> {
  if (!hasLessonContent(id)) return undefined

  const cached = lessonCache.get(id)
  if (cached) return cached

  const lesson = await lessonLoaders[id]()
  lessonCache.set(id, lesson)
  return lesson
}

export function listAvailableLessonIds(): string[] {
  return Object.keys(lessonLoaders)
}
