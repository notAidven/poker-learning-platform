import { auth } from './firebase'
import {
  fetchAllLessonProgress,
  fetchClearedTableIds,
  writeAllLessonProgress,
  writeClearedTableIds,
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
  readClearedTableIdsFromStorage,
  writeClearedTableIdsToStorage,
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

  // A genuine pre-auth/anonymous session this load (no real uid synced earlier).
  // Only such a handoff may donate local data to a freshly signed-in account;
  // a different account must NOT inherit the prior user's progress (H1).
  const isAnonymousHandoff = previousUid == null

  try {
    const remote = await fetchAllLessonProgress(uid)

    if (Object.keys(remote).length === 0) {
      const local = exportLocalProgress()
      if (isAnonymousHandoff && Object.keys(local).length > 0) {
        await writeAllLessonProgress(uid, local)
        applyRemoteProgress(local)
      } else {
        // Different account with empty remote — make sure no prior local data
        // lingers. (The progress-updated event fires at the end.)
        clearLocalProgress()
      }
    } else {
      applyRemoteProgress(remote)
    }
  } catch (err) {
    console.warn('Failed to sync lesson progress from Firestore:', err)
  }

  // Cleared-room (casino) state syncs alongside lesson progress so a room cleared
  // on one device unlocks Room 2 on another. Reconciled the same way: remote is
  // the source of truth, except a real anonymous handoff donates local clears once.
  // Done after the lesson reconcile, since clearLocalProgress() also wipes the
  // local cleared-room mirror.
  try {
    await reconcileClearedTables(uid, isAnonymousHandoff)
  } catch (err) {
    console.warn('Failed to sync cleared-table state from Firestore:', err)
  }

  syncReady = true
  notifyProgressUpdated()
}

function unionIds(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b]))
}

/**
 * Reconcile cleared-room ids between Firestore and the local mirror on sign-in,
 * mirroring the lesson-progress reconcile:
 *  - remote has clears  → remote wins (a true anonymous handoff also folds in any
 *    local clears and pushes the union back, so a just-finished room is not lost);
 *  - remote empty + anonymous handoff with local clears → donate local once;
 *  - remote empty otherwise (different account / nothing local) → match remote.
 */
async function reconcileClearedTables(uid: string, isAnonymousHandoff: boolean): Promise<void> {
  const remote = await fetchClearedTableIds(uid)
  const local = readClearedTableIdsFromStorage()

  if (remote.length > 0) {
    const merged = isAnonymousHandoff ? unionIds(remote, local) : remote
    writeClearedTableIdsToStorage(merged)
    if (isAnonymousHandoff && merged.length > remote.length) {
      await writeClearedTableIds(uid, merged)
    }
  } else if (isAnonymousHandoff && local.length > 0) {
    await writeClearedTableIds(uid, local) // local already holds them
  } else {
    writeClearedTableIdsToStorage([])
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

/**
 * Persist the cleared-room list to Firestore (best-effort) so a room cleared on
 * one device unlocks Room 2 on another. Signed-out users have no uid, so this is
 * a no-op and play stays local-only — matching the lesson-stats write path.
 */
export function queueClearedTablesFirestoreWrite(clearedTableIds: string[]) {
  const uid = syncUid ?? auth.currentUser?.uid
  if (!uid) return

  void writeClearedTableIds(uid, clearedTableIds).catch((err) => {
    console.warn('Failed to persist cleared-table state:', err)
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
