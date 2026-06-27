import { createContext, useContext, useMemo, useSyncExternalStore } from 'react'
import type { SectionId } from '../../data/lessons'
import type { ProgressStore } from './ProgressStore'
import { getNextLessonPath, isLessonUnlocked } from './selectors'
import {
  gateId,
  isGatePassed,
  isSectionTestedOut,
  isSectionUnlocked,
  isTestOutAvailable,
} from '../sectionGates'
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
  /** Stats for a section's gate doc (`gate-<sectionId>`). */
  getGateStats: (sectionId: SectionId) => LessonStats
  /** True once the prior section's gate is passed (Foundations is always unlocked). */
  isSectionUnlocked: (sectionId: SectionId) => boolean
  /** True once this section's gate is passed (the section is complete). */
  isGatePassed: (sectionId: SectionId) => boolean
  /** True when the section was cleared via test-out rather than worked through. */
  isSectionTestedOut: (sectionId: SectionId) => boolean
  /** True when the "Test out / Skip section" affordance applies (unlocked, not done). */
  isTestOutAvailable: (sectionId: SectionId) => boolean
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
      getGateStats: (sectionId: SectionId) =>
        statsByLesson[gateId(sectionId)] ?? defaultLessonStats(),
      isSectionUnlocked: (sectionId: SectionId) => isSectionUnlocked(statsByLesson, sectionId),
      isGatePassed: (sectionId: SectionId) => isGatePassed(statsByLesson, sectionId),
      isSectionTestedOut: (sectionId: SectionId) => isSectionTestedOut(statsByLesson, sectionId),
      isTestOutAvailable: (sectionId: SectionId) =>
        isTestOutAvailable(statsByLesson, completedIds, sectionId),
    }),
    [store, statsByLesson, completedIds],
  )
}

export type { LessonSession, LessonStats }
