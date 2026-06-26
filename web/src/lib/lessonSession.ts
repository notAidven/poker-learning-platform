import { queueSessionFirestoreWrite } from './progressSync'
import { sanitizeProblemAttempts, sanitizeStringArray } from './lessonProgressSanitize'

const sessionKey = (lessonId: string) => `lesson-session-${lessonId}`

export type LessonSession = {
  stepIndex: number
  solvedStepIds: string[]
  /** Submit count per problem step id (every "Check answer" click). */
  problemAttempts?: Record<string, number>
}

export function loadLessonSession(lessonId: string, stepCount: number): LessonSession {
  try {
    const raw = localStorage.getItem(sessionKey(lessonId))
    if (!raw) return { stepIndex: 0, solvedStepIds: [] }
    const parsed = JSON.parse(raw) as LessonSession
    const stepIndex =
      typeof parsed.stepIndex === 'number' &&
      parsed.stepIndex >= 0 &&
      parsed.stepIndex < stepCount
        ? parsed.stepIndex
        : 0
    const solvedStepIds = sanitizeStringArray(parsed.solvedStepIds)
    const problemAttempts = sanitizeProblemAttempts(parsed.problemAttempts)
    return { stepIndex, solvedStepIds, problemAttempts }
  } catch {
    return { stepIndex: 0, solvedStepIds: [] }
  }
}

export function saveLessonSession(lessonId: string, session: LessonSession) {
  localStorage.setItem(sessionKey(lessonId), JSON.stringify(session))
  queueSessionFirestoreWrite(lessonId, session)
}

export function clearLessonSession(lessonId: string) {
  localStorage.removeItem(sessionKey(lessonId))
}
