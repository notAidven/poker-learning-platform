import {
  collection,
  deleteField,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { LessonStats } from './lessonProgress'
import type { LessonSession } from './lessonSession'

/** Firestore: users/{uid}/lessonProgress/{lessonId} */
export type FirestoreLessonProgressDoc = LessonStats & {
  session?: LessonSession
  updatedAt?: Timestamp
}

export type LessonProgressPayload = {
  stats: LessonStats
  session?: LessonSession | null
}

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
    const data = docSnap.data() as FirestoreLessonProgressDoc
    out[docSnap.id] = {
      stats: {
        attempted: Boolean(data.attempted),
        lessonFinished: Boolean(data.lessonFinished),
        completed: Boolean(data.completed),
        lessonAccuracy: data.lessonAccuracy ?? null,
        skillCheckCorrect: data.skillCheckCorrect ?? null,
        skillCheckTotal: data.skillCheckTotal ?? null,
        pendingProblemAttempts:
          data.pendingProblemAttempts && typeof data.pendingProblemAttempts === 'object'
            ? Object.fromEntries(
                Object.entries(data.pendingProblemAttempts).filter(
                  ([, n]) => typeof n === 'number' && n > 0,
                ),
              )
            : null,
        pendingProblemStepIds: Array.isArray(data.pendingProblemStepIds)
          ? data.pendingProblemStepIds.filter((id) => typeof id === 'string')
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
            solvedStepIds: Array.isArray(data.session.solvedStepIds)
              ? data.session.solvedStepIds.filter((id) => typeof id === 'string')
              : [],
            problemAttempts:
              data.session.problemAttempts &&
              typeof data.session.problemAttempts === 'object'
                ? Object.fromEntries(
                    Object.entries(data.session.problemAttempts).filter(
                      ([, n]) => typeof n === 'number' && n > 0,
                    ),
                  )
                : undefined,
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
