import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearLessonSession,
  loadLessonSession,
  saveLessonSession,
} from '../../lib/lessonSession'
import {
  completeLessonWithoutSkillCheck,
  getLessonStats,
  markLessonAttempted,
  onLessonSessionCleared,
  recordReviewActivity,
  saveLessonFinished,
} from '../../lib/lessonProgress'
import { hasSkillCheck } from '../../data/skillCheckContent'
import type { LessonDefinition } from '../../types/lesson'
import { isConceptStep, isProblemStep } from '../../types/lesson'
import { ConceptStepView } from './ConceptStepView'
import { LessonCompleteModal } from './LessonCompleteModal'
import { LessonProgressBar } from './LessonProgressBar'
import { ProblemStepView } from './ProblemStepView'

type LessonPlayerProps = {
  lesson: LessonDefinition
  onProgressChange?: (progress: { stepIndex: number; solvedCount: number }) => void
  onLessonFinished?: () => void
  allowNavigation?: () => void
}

export function LessonPlayer({
  lesson,
  onProgressChange,
  onLessonFinished,
  allowNavigation,
}: LessonPlayerProps) {
  const navigate = useNavigate()
  const [showLessonCompleteModal, setShowLessonCompleteModal] = useState(false)
  const problemSteps = useMemo(
    () => lesson.steps.filter(isProblemStep),
    [lesson.steps],
  )

  // Opening an already-completed lesson is a review: each review is a fresh run, so
  // start at step 0 with nothing solved and ignore any persisted session.
  const isCompletedReview = useMemo(
    () => getLessonStats(lesson.id).completed,
    [lesson.id],
  )

  const initial = useMemo(
    () =>
      isCompletedReview
        ? {
            stepIndex: 0,
            solvedStepIds: [] as string[],
            problemAttempts: {} as Record<string, number>,
          }
        : loadLessonSession(lesson.id, lesson.steps.length),
    [isCompletedReview, lesson.id, lesson.steps.length],
  )

  const [stepIndex, setStepIndex] = useState(initial.stepIndex)
  const [solvedStepIds, setSolvedStepIds] = useState<Set<string>>(
    () => new Set(initial.solvedStepIds),
  )
  const [problemAttempts, setProblemAttempts] = useState<Record<string, number>>(
    () => ({ ...initial.problemAttempts }),
  )

  const step = lesson.steps[stepIndex]
  const isLast = stepIndex >= lesson.steps.length - 1

  const problemReady = useMemo(() => {
    if (!step) return false
    if (isConceptStep(step)) return true
    return solvedStepIds.has(step.id)
  }, [step, solvedStepIds])

  useEffect(() => {
    markLessonAttempted(lesson.id)
  }, [lesson.id])

  useEffect(() => {
    // Clear any stale session so a review starts cleanly from step 0.
    if (isCompletedReview) {
      clearLessonSession(lesson.id)
    }
  }, [isCompletedReview, lesson.id])

  useEffect(() => {
    // Don't persist a review run — completed lessons always restart from step 0.
    if (isCompletedReview) return
    saveLessonSession(lesson.id, {
      stepIndex,
      solvedStepIds: [...solvedStepIds],
      problemAttempts,
    })
  }, [isCompletedReview, lesson.id, stepIndex, solvedStepIds, problemAttempts])

  useEffect(() => {
    onProgressChange?.({ stepIndex, solvedCount: solvedStepIds.size })
  }, [onProgressChange, stepIndex, solvedStepIds.size])

  const handleStepSolved = useCallback((stepId: string) => {
    setSolvedStepIds((prev) => {
      if (prev.has(stepId)) return prev
      const next = new Set(prev)
      next.add(stepId)
      return next
    })
  }, [])

  const handleAttemptSubmit = useCallback((stepId: string) => {
    setProblemAttempts((prev) => ({
      ...prev,
      [stepId]: (prev[stepId] ?? 0) + 1,
    }))
  }, [])

  const canContinue = step && (isConceptStep(step) || problemReady)

  const finishLesson = useCallback(() => {
    // Finishing a review of a completed lesson must not overwrite recorded stats,
    // accuracy, XP, or skill-check scores — just end the review run cleanly. A
    // completed review is a qualifying daily activity, so credit the streak
    // (no XP) to keep it alive once all lessons are done (P1 #4).
    if (isCompletedReview) {
      clearLessonSession(lesson.id)
      onLessonSessionCleared(lesson.id)
      recordReviewActivity()
      onLessonFinished?.()
      allowNavigation?.()
      navigate('/course')
      return
    }

    // Resume-safe accuracy: derive "first try correct" from the PERSISTED
    // problemAttempts (the same source XP uses), not the in-memory firstTryCorrect,
    // which resets to {} on resume and would undercount problems solved before the
    // learner left. Every solved problem records ≥1 attempt; a single attempt means
    // it was right on the first submit, while >1 means at least one retry.
    const correctOnFirstTry = problemSteps.filter(
      (p) => (problemAttempts[p.id] ?? 1) <= 1,
    ).length
    const lessonAccuracy =
      problemSteps.length > 0
        ? Math.round((correctOnFirstTry / problemSteps.length) * 100)
        : 100

    saveLessonFinished(lesson.id, lessonAccuracy, problemAttempts, problemSteps.map((p) => p.id))
    clearLessonSession(lesson.id)
    onLessonSessionCleared(lesson.id)
    onLessonFinished?.()

    if (hasSkillCheck(lesson.id)) {
      setShowLessonCompleteModal(true)
      return
    }

    // No skill check for this lesson → finishing the body completes it and
    // awards XP directly (latent-safety / item #12). All 6 current lessons have
    // skill checks, so this path is a guard for future content.
    completeLessonWithoutSkillCheck(lesson.id)
    allowNavigation?.()
    navigate('/course')
  }, [
    allowNavigation,
    isCompletedReview,
    lesson.id,
    navigate,
    onLessonFinished,
    problemAttempts,
    problemSteps,
  ])

  const dismissLessonCompleteModal = useCallback(() => {
    // "Later" / Escape / backdrop: defer the skill check and return to the
    // course path, where the lesson shows a "Continue skill check" CTA (#11).
    setShowLessonCompleteModal(false)
    allowNavigation?.()
    navigate('/course')
  }, [allowNavigation, navigate])

  const startSkillCheck = useCallback(() => {
    allowNavigation?.()
    navigate(`/lesson/${lesson.id}/skill-check`)
  }, [allowNavigation, lesson.id, navigate])

  const goNext = useCallback(() => {
    if (!canContinue) return
    if (isLast) {
      finishLesson()
      return
    }
    setStepIndex((i) => i + 1)
  }, [canContinue, finishLesson, isLast])

  if (!step) return null

  return (
    <div className="mx-auto max-w-lg">
      <LessonProgressBar current={stepIndex} total={lesson.steps.length} />

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {isConceptStep(step) && (
          <ConceptStepView
            key={step.id}
            title={step.title}
            content={step.content}
            visual={step.visual}
          />
        )}

        {isProblemStep(step) && (
          <ProblemStepView
            key={step.id}
            step={step}
            alreadySolved={solvedStepIds.has(step.id)}
            onSolved={() => handleStepSolved(step.id)}
            onAttemptSubmit={() => handleAttemptSubmit(step.id)}
          />
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          className="min-h-11 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          Back
        </button>

        <button
          type="button"
          onClick={goNext}
          disabled={!canContinue}
          className="min-h-11 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
        >
          {isLast ? 'Finish lesson' : 'Continue'}
        </button>
      </div>

      <LessonCompleteModal
        open={showLessonCompleteModal}
        onStartSkillCheck={startSkillCheck}
        onClose={dismissLessonCompleteModal}
      />
    </div>
  )
}
