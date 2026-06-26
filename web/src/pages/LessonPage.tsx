import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ExitLessonModal } from '../components/ExitLessonModal'
import { LessonPlayer } from '../components/lesson/LessonPlayer'
import { hasLessonContent, loadLesson } from '../data/lessonContent'
import { lessonNumber, lessons } from '../data/lessons'
import type { LessonDefinition } from '../types/lesson'
import { useActivityExitGuard } from '../hooks/useActivityExitGuard'
import { useProgress, useProgressStore } from '../lib/progress'

type LessonProgressState = {
  stepIndex: number
  solvedCount: number
}

export function LessonPage() {
  const { lessonId = '' } = useParams()
  const meta = lessons.find((l) => l.id === lessonId)
  const store = useProgressStore()
  const { getStats, isLessonUnlocked } = useProgress()
  const stats = getStats(lessonId)
  const [content, setContent] = useState<LessonDefinition | undefined>()
  const [contentLoading, setContentLoading] = useState(() => hasLessonContent(lessonId))

  useEffect(() => {
    if (!hasLessonContent(lessonId)) {
      setContent(undefined)
      setContentLoading(false)
      return
    }

    let cancelled = false
    setContentLoading(true)
    void loadLesson(lessonId).then((lesson) => {
      if (!cancelled) {
        setContent(lesson)
        setContentLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [lessonId])

  const stepCount = content?.steps.length ?? 1
  const savedSession = useMemo(
    () => store.loadSession(lessonId, stepCount),
    [store, lessonId, stepCount],
  )

  // A completed lesson opened here is a "review": it always restarts from step 0,
  // so its persisted session is ignored for progress tracking.
  const [progress, setProgress] = useState<LessonProgressState>(() => ({
    stepIndex: stats.completed ? 0 : savedSession.stepIndex,
    solvedCount: stats.completed ? 0 : savedSession.solvedStepIds.length,
  }))
  const [lessonFinished, setLessonFinished] = useState(
    stats.completed ? false : stats.lessonFinished,
  )

  useEffect(() => {
    if (!content) return
    setProgress({
      stepIndex: stats.completed ? 0 : savedSession.stepIndex,
      solvedCount: stats.completed ? 0 : savedSession.solvedStepIds.length,
    })
  }, [content, stats.completed, savedSession.stepIndex, savedSession.solvedStepIds.length])

  const isReview = stats.completed
  const hasLiveProgress = progress.stepIndex > 0 || progress.solvedCount > 0
  const hasSavedProgress =
    savedSession.stepIndex > 0 || savedSession.solvedStepIds.length > 0

  // Guard while a run is active: an in-progress lesson, or a review of a completed
  // lesson. Reviews always restart from step 0, so only live progress counts there.
  const isMidLesson =
    Boolean(content) &&
    !lessonFinished &&
    (isReview ? hasLiveProgress : hasLiveProgress || hasSavedProgress)

  // Resume-where-you-left-off: leaving mid-lesson preserves the in-progress
  // session (localStorage + Firestore) so the next visit reopens at the saved
  // stepIndex + solvedStepIds. We deliberately do NOT clear the session here —
  // confirming "Leave" just allows navigation away. (Completed-lesson reviews
  // still restart from step 0; that reset lives in LessonPlayer.)
  const { modalOpen, stay, confirmExit, allowNavigation } = useActivityExitGuard({
    when: isMidLesson,
  })

  const handleProgressChange = useCallback((next: LessonProgressState) => {
    setProgress(next)
  }, [])

  if (!meta) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-xl font-bold">Lesson not found</h1>
        <Link to="/course" className="mt-4 inline-block text-brand-600">
          ← Back to course
        </Link>
      </div>
    )
  }

  // Sequential unlock on direct URLs (P1 #5): redirect to the course path if the
  // prior lesson hasn't been completed yet.
  if (!isLessonUnlocked(lessonId)) {
    return <Navigate to="/course" replace />
  }

  if (!hasLessonContent(lessonId)) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-xl font-bold">{meta.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Interactive content for this lesson is coming soon.
        </p>
        <Link to="/course" className="mt-4 inline-block text-brand-600">
          ← Back to course
        </Link>
      </div>
    )
  }

  if (contentLoading || !content) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-sm text-slate-500" aria-live="polite">
        Loading lesson…
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="mx-auto max-w-lg">
          <Link
            to="/course"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            ← Course path
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
            Lesson {lessonNumber(meta.id)}
          </p>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{meta.title}</h1>
        </div>

        <LessonPlayer
          lesson={content}
          onProgressChange={handleProgressChange}
          onLessonFinished={() => setLessonFinished(true)}
          allowNavigation={allowNavigation}
        />
      </div>

      <ExitLessonModal open={modalOpen} onStay={stay} onExit={confirmExit} />
    </>
  )
}
