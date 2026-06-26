import type { LessonProgressPayload } from './lessonProgressFirestore'
import type { LessonSession } from './lessonSession'
import { sanitizeProblemAttempts, sanitizeStringArray } from './lessonProgressSanitize'
import { clearLocalBankroll } from './bankroll'

const COMPLETED_KEY = 'completed-lesson-ids'
const STATS_KEY = 'lesson-stats'
/** Phase 2 casino: ids of rooms the learner has cleared (kept out of the XP economy). */
const CLEARED_TABLES_KEY = 'cleared-table-ids'

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
  /** Problem step ids captured at lesson finish (for XP without loading lesson content). */
  pendingProblemStepIds: string[] | null
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
  pendingProblemStepIds: null,
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
    return sanitizeStringArray(parsed)
  } catch {
    return []
  }
}

/** Read the cleared-room ids from the local mirror (Phase 2 casino state). */
export function readClearedTableIdsFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(CLEARED_TABLES_KEY)
    if (!raw) return []
    return sanitizeStringArray(JSON.parse(raw))
  } catch {
    return []
  }
}

/** Persist the cleared-room ids to the local mirror. Storage errors are ignored. */
export function writeClearedTableIdsToStorage(ids: string[]): void {
  try {
    localStorage.setItem(CLEARED_TABLES_KEY, JSON.stringify(ids))
  } catch {
    // Ignore storage errors (private mode / disabled storage): play still works.
  }
}

export function notifyProgressUpdated(completed = false) {
  // Guard non-DOM contexts (unit tests / SSR), mirroring notifyBankrollUpdated.
  if (typeof window === 'undefined') return
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
        session = {
          stepIndex: typeof parsed.stepIndex === 'number' ? parsed.stepIndex : 0,
          solvedStepIds: sanitizeStringArray(parsed.solvedStepIds),
          problemAttempts: sanitizeProblemAttempts(parsed.problemAttempts),
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

/**
 * Wipe all locally-persisted lesson progress (H1 — shared-device safety).
 *
 * Clears `lesson-stats`, `completed-lesson-ids`, and every `lesson-session-*`
 * key, and resets the in-memory stats cache so a different account signing in
 * on the same device can never inherit (or upload) the previous user's data.
 */
export function clearLocalProgress() {
  statsMapCache = null
  try {
    localStorage.removeItem(STATS_KEY)
    localStorage.removeItem(COMPLETED_KEY)
    // Phase 2 casino tables keep their own "cleared" list + bankroll mirror
    // outside the XP economy. Drop them too so a different account on this device
    // can never inherit the previous user's table progress or chips.
    localStorage.removeItem(CLEARED_TABLES_KEY)
    clearLocalBankroll()

    const sessionKeys: string[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && key.startsWith('lesson-session-')) sessionKeys.push(key)
    }
    for (const key of sessionKeys) localStorage.removeItem(key)
  } catch {
    // Ignore storage access errors (e.g. disabled/blocked storage).
  }
}
