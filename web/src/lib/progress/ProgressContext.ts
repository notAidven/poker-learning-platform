import { createContext, useContext, useMemo, useSyncExternalStore } from 'react'
import type { ProgressStore } from './ProgressStore'
import { getNextLessonPath, isLessonUnlocked } from './selectors'
import { defaultLessonStats, type LessonSession, type LessonStats } from './types'

/** App-wide ProgressStore instance, provided by `ProgressProvider`. */
export const ProgressStoreContext = createContext<ProgressStore | null>(null)

/** The raw store instance, for imperative calls (mutations, sessions, auth sync). */
export function useProgressStore(): ProgressStore {
  const store = useContext(ProgressStoreContext)
  if (!store) throw new Error('useProgressStore must be used within ProgressProvider')
  return store
}

export type UseProgress = {
  statsByLesson: Record<string, LessonStats>
  completedIds: string[]
  getStats: (lessonId: string) => LessonStats
  isLessonUnlocked: (lessonId: string) => boolean
  isLessonInProgress: (lessonId: string, stepCount: number) => boolean
  getNextLessonPath: () => string
}

/**
 * Reactive view of the lesson-progress aggregate. Binds the store via
 * `useSyncExternalStore` (same-tab mutations + cross-tab `storage` events) and
 * exposes the derived reads the UI needs. Replaces the former `useCompletedLessons`.
 */
export function useProgress(): UseProgress {
  const store = useProgressStore()
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const { statsByLesson, completedIds } = snapshot

  return useMemo<UseProgress>(
    () => ({
      statsByLesson,
      completedIds,
      getStats: (lessonId: string) => statsByLesson[lessonId] ?? defaultLessonStats(),
      isLessonUnlocked: (lessonId: string) => isLessonUnlocked(lessonId, completedIds),
      isLessonInProgress: (lessonId: string, stepCount: number) =>
        store.isLessonInProgress(lessonId, stepCount),
      getNextLessonPath: () => getNextLessonPath(completedIds, statsByLesson),
    }),
    [store, statsByLesson, completedIds],
  )
}

export type { LessonSession, LessonStats }
