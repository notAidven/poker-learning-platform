import { auth } from './firebase'
import {
  fetchAllLessonProgress,
  writeAllLessonProgress,
  writeLessonProgress,
  type LessonProgressPayload,
} from './lessonProgressFirestore'
import { loadLessonSession, type LessonSession } from './lessonSession'
import {
  applyRemoteProgress,
  clearLocalProgress,
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

export function isProgressSyncReady() {
  return syncReady
}

export async function syncProgressOnAuth(uid: string | null): Promise<void> {
  syncReady = false
  const previousUid = syncUid

  // Sign-out (or no user): wipe local progress so the next person on this
  // shared device starts clean and we never upload the prior user's data (H1).
  if (!uid) {
    clearLocalProgress()
    syncUid = null
    syncReady = true
    notifyProgressUpdated()
    return
  }

  // Account switch without a sign-out in between: clear the previous user's
  // local data before loading the new account's remote progress (H1).
  if (previousUid && previousUid !== uid) {
    clearLocalProgress()
  }

  syncUid = uid

  try {
    const remote = await fetchAllLessonProgress(uid)

    if (Object.keys(remote).length === 0) {
      // Only merge local → remote for a genuine pre-auth/anonymous session,
      // i.e. no real uid was synced earlier this session. For a freshly
      // signed-in different account we must NOT donate the prior local data;
      // clear it and treat remote (empty) as the source of truth (H1).
      const isAnonymousHandoff = previousUid == null
      const local = exportLocalProgress()
      if (isAnonymousHandoff && Object.keys(local).length > 0) {
        await writeAllLessonProgress(uid, local)
        applyRemoteProgress(local)
      } else {
        // Different account with empty remote — make sure no prior local data
        // lingers. (The `finally` block fires the progress-updated event.)
        clearLocalProgress()
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

  const session = loadLessonSession(lessonId, Number.MAX_SAFE_INTEGER)
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

/**
 * Durable fallback for a FAILED atomic lesson award (see lib/lessonProgress.ts).
 *
 * `awardLessonCompletion` normally persists the progress doc (completed:true +
 * xpAwarded:true) in one transaction. If that transaction fails, the completion
 * lives only in local storage and the NEXT `applyRemoteProgress` sync would
 * silently revert it (remote still says not-completed). This best-effort write
 * lands `completed:true` straight in the progress doc (and clears any stale
 * session) so the completion survives a resync.
 *
 * It deliberately does NOT stamp `xpAwarded`: a merge write of the plain
 * `LessonStats` never overwrites an `xpAwarded:true` that a (falsely-rejected but
 * actually-committed) award already set, and because `awardLessonCompletion`
 * treats an existing `completed:true` as "already awarded", any later award or
 * retake stays idempotent and never double-grants XP.
 */
export function queueCompletionFallbackWrite(lessonId: string, stats: LessonStats) {
  const uid = syncUid ?? auth.currentUser?.uid
  if (!uid) return

  const existing = sessionWriteTimers.get(lessonId)
  if (existing) {
    clearTimeout(existing)
    sessionWriteTimers.delete(lessonId)
  }

  void writeLessonProgress(uid, lessonId, { stats, session: null }).catch((err) => {
    console.warn(`Failed to persist fallback lesson completion for ${lessonId}:`, err)
  })
}
