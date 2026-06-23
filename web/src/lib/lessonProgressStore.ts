import type { LessonProgressPayload } from './lessonProgressFirestore'
import type { LessonSession } from './lessonSession'

const COMPLETED_KEY = 'completed-lesson-ids'
const STATS_KEY = 'lesson-stats'

export type LessonXpBreakdownStored = {
  base: number
  bonus: number
}

export type LessonStats = {
  attempted: boolean
  lessonFinished: boolean
  completed: boolean
  lessonAccuracy: number | null
  skillCheckCorrect: number | null
  skillCheckTotal: number | null
  /** Problem submit counts saved when the lesson body is finished (before skill check). */
  pendingProblemAttempts: Record<string, number> | null
  /** XP breakdown from the most recent first-time completion. */
  lastLessonXpBreakdown: LessonXpBreakdownStored | null
}

export const defaultLessonStats = (): LessonStats => ({
  attempted: false,
  lessonFinished: false,
  completed: false,
  lessonAccuracy: null,
  skillCheckCorrect: null,
  skillCheckTotal: null,
  pendingProblemAttempts: null,
  lastLessonXpBreakdown: null,
})

let statsMapCache: Record<string, LessonStats> | null = null

function readStatsMapFromStorage(): Record<string, LessonStats> {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export function ensureStatsCache(): Record<string, LessonStats> {
  if (!statsMapCache) {
    statsMapCache = readStatsMapFromStorage()
  }
  return statsMapCache
}

export function writeStatsMap(map: Record<string, LessonStats>) {
  statsMapCache = map
  localStorage.setItem(STATS_KEY, JSON.stringify(map))
}

export function syncCompletedIds(map: Record<string, LessonStats>) {
  const completed = Object.entries(map)
    .filter(([, stats]) => stats.completed)
    .map(([id]) => id)
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed))
}

export function getCompletedLessonIdsFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function notifyProgressUpdated(completed = false) {
  if (completed) {
    window.dispatchEvent(new Event('lesson-completed'))
  }
  window.dispatchEvent(new Event('lesson-progress-updated'))
}

export function applyRemoteProgress(remote: Record<string, LessonProgressPayload>) {
  const map: Record<string, LessonStats> = {}
  for (const [lessonId, payload] of Object.entries(remote)) {
    map[lessonId] = payload.stats
  }
  writeStatsMap(map)
  syncCompletedIds(map)

  for (const [lessonId, payload] of Object.entries(remote)) {
    if (payload.session) {
      localStorage.setItem(
        `lesson-session-${lessonId}`,
        JSON.stringify(payload.session),
      )
    } else {
      localStorage.removeItem(`lesson-session-${lessonId}`)
    }
  }
}

export function exportLocalProgress(): Record<string, LessonProgressPayload> {
  const map = readStatsMapFromStorage()
  const out: Record<string, LessonProgressPayload> = {}

  for (const [lessonId, stats] of Object.entries(map)) {
    const sessionRaw = localStorage.getItem(`lesson-session-${lessonId}`)
    let session: LessonProgressPayload['session']
    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw) as LessonSession
        const problemAttempts =
          parsed.problemAttempts && typeof parsed.problemAttempts === 'object'
            ? Object.fromEntries(
                Object.entries(parsed.problemAttempts).filter(
                  ([, n]) => typeof n === 'number' && n > 0,
                ),
              )
            : undefined
        session = {
          stepIndex: typeof parsed.stepIndex === 'number' ? parsed.stepIndex : 0,
          solvedStepIds: Array.isArray(parsed.solvedStepIds)
            ? parsed.solvedStepIds.filter((id) => typeof id === 'string')
            : [],
          problemAttempts,
        }
      } catch {
        session = undefined
      }
    }

    out[lessonId] = { stats, session }
  }

  return out
}

export function getStatsMapSnapshot(): Record<string, LessonStats> {
  return { ...ensureStatsCache() }
}
