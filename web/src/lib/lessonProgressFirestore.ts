import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { LessonStats } from './lessonProgress'
import type { LessonSession } from './lessonSession'
import { sanitizeProblemAttempts, sanitizeStringArray } from './lessonProgressSanitize'

/** Firestore: users/{uid}/lessonProgress/{lessonId} */
export type FirestoreLessonProgressDoc = LessonStats & {
  session?: LessonSession
  updatedAt?: Timestamp
}

export type LessonProgressPayload = {
  stats: LessonStats
  session?: LessonSession | null
}

/**
 * Reserved lessonProgress doc id that holds the Phase 2 casino state (cleared
 * rooms) instead of a lesson. It lives in this subcollection because the user
 * doc is locked to a strict field whitelist by firestore.rules, while
 * lessonProgress is owner read/write with no field constraint. The double
 * underscore can never collide with a real lesson id, and it is skipped by
 * `fetchAllLessonProgress` so it never masquerades as a lesson.
 */
export const CASINO_STATE_DOC_ID = '__casino__'

function progressCollection(uid: string) {
  return collection(db, 'users', uid, 'lessonProgress')
}

function progressDoc(uid: string, lessonId: string) {
  return doc(db, 'users', uid, 'lessonProgress', lessonId)
}

export async function fetchAllLessonProgress(
  uid: string,
): Promise<Record<string, LessonProgressPayload>> {
  const snap = await getDocs(progressCollection(uid))
  const out: Record<string, LessonProgressPayload> = {}

  for (const docSnap of snap.docs) {
    // The casino-state doc shares this subcollection but is not a lesson — skip it
    // so it never becomes a phantom lesson entry in the stats map.
    if (docSnap.id === CASINO_STATE_DOC_ID) continue
    const data = docSnap.data() as FirestoreLessonProgressDoc
    out[docSnap.id] = {
      stats: {
        attempted: Boolean(data.attempted),
        lessonFinished: Boolean(data.lessonFinished),
        completed: Boolean(data.completed),
        lessonAccuracy: data.lessonAccuracy ?? null,
        skillCheckCorrect: data.skillCheckCorrect ?? null,
        skillCheckTotal: data.skillCheckTotal ?? null,
        pendingProblemAttempts: sanitizeProblemAttempts(data.pendingProblemAttempts) ?? null,
        pendingProblemStepIds: Array.isArray(data.pendingProblemStepIds)
          ? sanitizeStringArray(data.pendingProblemStepIds)
          : null,
        lastLessonXpBreakdown:
          data.lastLessonXpBreakdown &&
          typeof data.lastLessonXpBreakdown.base === 'number' &&
          typeof data.lastLessonXpBreakdown.bonus === 'number'
            ? {
                base: data.lastLessonXpBreakdown.base,
                bonus: data.lastLessonXpBreakdown.bonus,
              }
            : null,
      },
      session: data.session
        ? {
            stepIndex: data.session.stepIndex ?? 0,
            solvedStepIds: sanitizeStringArray(data.session.solvedStepIds),
            problemAttempts: sanitizeProblemAttempts(data.session.problemAttempts),
          }
        : undefined,
    }
  }

  return out
}

export async function writeLessonProgress(
  uid: string,
  lessonId: string,
  payload: LessonProgressPayload,
): Promise<void> {
  const hasActiveSession = Boolean(
    payload.session &&
      (payload.session.stepIndex > 0 || payload.session.solvedStepIds.length > 0),
  )

  // Loose record so we can write deleteField() to actually remove a stale session
  // under merge:true — omitting the key would otherwise leave the old value behind,
  // resurrecting mid-lesson progress after a completed-lesson review restart,
  // skill-check reset, or lesson completion. (A normal mid-lesson leave keeps the
  // session so the learner resumes where they left off, so no clear happens then.)
  const body: Record<string, unknown> = {
    ...payload.stats,
    updatedAt: serverTimestamp(),
    session: hasActiveSession ? payload.session : deleteField(),
  }

  await setDoc(progressDoc(uid, lessonId), body, { merge: true })
}

export async function writeAllLessonProgress(
  uid: string,
  entries: Record<string, LessonProgressPayload>,
): Promise<void> {
  await Promise.all(
    Object.entries(entries).map(([lessonId, payload]) =>
      writeLessonProgress(uid, lessonId, payload),
    ),
  )
}

/** Firestore: users/{uid}/lessonProgress/__casino__ */
type FirestoreCasinoStateDoc = {
  clearedTableIds?: unknown
  updatedAt?: Timestamp
}

/** Read the cleared-room ids for cross-device casino unlock. Missing doc → []. */
export async function fetchClearedTableIds(uid: string): Promise<string[]> {
  const snap = await getDoc(progressDoc(uid, CASINO_STATE_DOC_ID))
  if (!snap.exists()) return []
  const data = snap.data() as FirestoreCasinoStateDoc
  return sanitizeStringArray(data.clearedTableIds)
}

/** Persist the cleared-room ids so a room cleared on one device unlocks elsewhere. */
export async function writeClearedTableIds(uid: string, clearedTableIds: string[]): Promise<void> {
  await setDoc(
    progressDoc(uid, CASINO_STATE_DOC_ID),
    { clearedTableIds, updatedAt: serverTimestamp() },
    { merge: true },
  )
}
