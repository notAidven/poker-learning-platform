import { auth } from './firebase'
import {
  fetchAllLessonProgress,
  writeAllLessonProgress,
  writeLessonProgress,
  type LessonProgressPayload,
} from './lessonProgressFirestore'
import type { LessonSession } from './lessonSession'
import {
  applyRemoteProgress,
  defaultLessonStats,
  exportLocalProgress,
  getStatsMapSnapshot,
  notifyProgressUpdated,
  type LessonStats,
} from './lessonProgressStore'

let syncUid: string | null = null
let syncReady = false
const sessionWriteTimers = new Map<string, ReturnType<typeof setTimeout>>()

const SESSION_DEBOUNCE_MS = 400

type SessionPayload = LessonSession

function readSessionFromStorage(lessonId: string): SessionPayload {
  try {
    const raw = localStorage.getItem(`lesson-session-${lessonId}`)
    if (!raw) return { stepIndex: 0, solvedStepIds: [] }
    const parsed = JSON.parse(raw) as SessionPayload
    const problemAttempts =
      parsed.problemAttempts && typeof parsed.problemAttempts === 'object'
        ? Object.fromEntries(
            Object.entries(parsed.problemAttempts).filter(
              ([, n]) => typeof n === 'number' && n > 0,
            ),
          )
        : undefined
    return {
      stepIndex: typeof parsed.stepIndex === 'number' ? parsed.stepIndex : 0,
      solvedStepIds: Array.isArray(parsed.solvedStepIds)
        ? parsed.solvedStepIds.filter((id) => typeof id === 'string')
        : [],
      problemAttempts,
    }
  } catch {
    return { stepIndex: 0, solvedStepIds: [] }
  }
}

export function isProgressSyncReady() {
  return syncReady
}

export function getProgressSyncUid() {
  return syncUid
}

export async function syncProgressOnAuth(uid: string | null): Promise<void> {
  syncReady = false
  syncUid = uid

  if (!uid) {
    syncReady = true
    notifyProgressUpdated()
    return
  }

  try {
    const remote = await fetchAllLessonProgress(uid)

    if (Object.keys(remote).length === 0) {
      const local = exportLocalProgress()
      if (Object.keys(local).length > 0) {
        await writeAllLessonProgress(uid, local)
        applyRemoteProgress(local)
      }
    } else {
      applyRemoteProgress(remote)
    }
  } catch (err) {
    console.warn('Failed to sync lesson progress from Firestore:', err)
  } finally {
    syncReady = true
    notifyProgressUpdated()
  }
}

export function queueStatsFirestoreWrite(lessonId: string, stats: LessonStats) {
  const uid = syncUid ?? auth.currentUser?.uid
  if (!uid) return

  const session = readSessionFromStorage(lessonId)
  const payload: LessonProgressPayload = {
    stats,
    session: session.stepIndex > 0 || session.solvedStepIds.length > 0 ? session : null,
  }

  void writeLessonProgress(uid, lessonId, payload).catch((err) => {
    console.warn(`Failed to persist lesson stats for ${lessonId}:`, err)
  })
}

export function queueSessionFirestoreWrite(lessonId: string, session: SessionPayload) {
  const uid = syncUid ?? auth.currentUser?.uid
  if (!uid) return

  const existing = sessionWriteTimers.get(lessonId)
  if (existing) clearTimeout(existing)

  sessionWriteTimers.set(
    lessonId,
    setTimeout(() => {
      sessionWriteTimers.delete(lessonId)
      const stats = getStatsMapSnapshot()[lessonId] ?? {
        ...defaultLessonStats(),
        attempted: true,
      }

      void writeLessonProgress(uid, lessonId, {
        stats,
        session: session.stepIndex > 0 || session.solvedStepIds.length > 0 ? session : null,
      }).catch((err) => {
        console.warn(`Failed to persist lesson session for ${lessonId}:`, err)
      })
    }, SESSION_DEBOUNCE_MS),
  )
}

export function queueSessionClearFirestoreWrite(lessonId: string, stats: LessonStats) {
  const uid = syncUid ?? auth.currentUser?.uid
  if (!uid) return

  const existing = sessionWriteTimers.get(lessonId)
  if (existing) {
    clearTimeout(existing)
    sessionWriteTimers.delete(lessonId)
  }

  void writeLessonProgress(uid, lessonId, { stats, session: null }).catch((err) => {
    console.warn(`Failed to clear lesson session for ${lessonId}:`, err)
  })
}
