import type { LessonDefinition } from '../types/lesson'
import { lesson1 } from './lessons/lesson-1'
import { lesson2 } from './lessons/lesson-2'
import { lesson3 } from './lessons/lesson-3'
import { lesson4 } from './lessons/lesson-4'
import { lesson5 } from './lessons/lesson-5'
import { lesson6 } from './lessons/lesson-6'

const lessonCatalog: Record<string, LessonDefinition> = {
  '1': lesson1,
  '2': lesson2,
  '3': lesson3,
  '4': lesson4,
  '5': lesson5,
  '6': lesson6,
}

export function getLesson(id: string): LessonDefinition | undefined {
  return lessonCatalog[id]
}

export function hasLessonContent(id: string): boolean {
  return id in lessonCatalog
}

export function listAvailableLessonIds(): string[] {
  return Object.keys(lessonCatalog)
}
