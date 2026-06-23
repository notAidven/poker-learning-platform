import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExitLessonModal } from '../components/ExitLessonModal'
import { LessonPlayer } from '../components/lesson/LessonPlayer'
import { getLesson, hasLessonContent } from '../data/lessonContent'
import { lessons } from '../data/lessons'
import { useActivityExitGuard } from '../hooks/useActivityExitGuard'
import {
  abandonLessonAttempt,
  getLessonStats,
} from '../lib/lessonProgress'
import { loadLessonSession } from '../lib/lessonSession'

type LessonProgressState = {
  stepIndex: number
  solvedCount: number
}

export function LessonPage() {
  const { lessonId = '' } = useParams()
  const meta = lessons.find((l) => l.id === lessonId)
  const content = getLesson(lessonId)
  const stats = getLessonStats(lessonId)
  const stepCount = content?.steps.length ?? 1
  const savedSession = useMemo(
    () => loadLessonSession(lessonId, stepCount),
    [lessonId, stepCount],
  )

  const [progress, setProgress] = useState<LessonProgressState>(() => ({
    stepIndex: savedSession.stepIndex,
    solvedCount: savedSession.solvedStepIds.length,
  }))

  const isMidLesson =
    Boolean(content) &&
    !stats.completed &&
    !stats.lessonFinished &&
    (progress.stepIndex > 0 ||
      progress.solvedCount > 0 ||
      savedSession.stepIndex > 0 ||
      savedSession.solvedStepIds.length > 0)

  const handleConfirmExit = useCallback(() => {
    abandonLessonAttempt(lessonId)
  }, [lessonId])

  const { modalOpen, stay, confirmExit, allowNavigation } = useActivityExitGuard({
    when: isMidLesson,
    onConfirmExit: handleConfirmExit,
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

  if (!content || !hasLessonContent(lessonId)) {
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
            Lesson {meta.id}
          </p>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{meta.title}</h1>
        </div>

        <LessonPlayer
          lesson={content}
          onProgressChange={handleProgressChange}
          allowNavigation={allowNavigation}
        />
      </div>

      <ExitLessonModal open={modalOpen} onStay={stay} onExit={confirmExit} />
    </>
  )
}
