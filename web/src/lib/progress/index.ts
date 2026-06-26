/**
 * Public surface of the lesson-progress module for the UI. The `ProgressProvider`
 * component and the backend adapters are imported from their own files (so importing
 * this barrel for reads never pulls Firebase into a component).
 */
export { useProgress, useProgressStore, type UseProgress } from './ProgressContext'
export { skillCheckScorePercent } from './selectors'
export type {
  LessonSession,
  LessonStats,
  SkillCheckSaveResult,
} from './types'
