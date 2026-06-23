import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearLessonSession,
  loadLessonSession,
  saveLessonSession,
} from '../../lib/lessonSession'
import {
  markLessonAttempted,
  onLessonSessionCleared,
  saveLessonFinished,
} from '../../lib/lessonProgress'
import { hasSkillCheck } from '../../data/skillCheckContent'
import type { LessonDefinition } from '../../types/lesson'
import { isConceptStep, isProblemStep } from '../../types/lesson'
import { ConceptStepView } from './ConceptStepView'
import { LessonProgressBar } from './LessonProgressBar'
import { ProblemStepView } from './ProblemStepView'

type LessonPlayerProps = {
  lesson: LessonDefinition
  onProgressChange?: (progress: { stepIndex: number; solvedCount: number }) => void
  allowNavigation?: () => void
}

export function LessonPlayer({ lesson, onProgressChange, allowNavigation }: LessonPlayerProps) {
  const navigate = useNavigate()
  const problemSteps = useMemo(
    () => lesson.steps.filter(isProblemStep),
    [lesson.steps],
  )

  const initial = useMemo(
    () => loadLessonSession(lesson.id, lesson.steps.length),
    [lesson.id, lesson.steps.length],
  )

  const [stepIndex, setStepIndex] = useState(initial.stepIndex)
  const [solvedStepIds, setSolvedStepIds] = useState<Set<string>>(
    () => new Set(initial.solvedStepIds),
  )
  const [firstTryCorrect, setFirstTryCorrect] = useState<Record<string, boolean>>({})
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
    saveLessonSession(lesson.id, {
      stepIndex,
      solvedStepIds: [...solvedStepIds],
      problemAttempts,
    })
  }, [lesson.id, stepIndex, solvedStepIds, problemAttempts])

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

  const handleFirstSubmit = useCallback((stepId: string, correct: boolean) => {
    setFirstTryCorrect((prev) => {
      if (stepId in prev) return prev
      return { ...prev, [stepId]: correct }
    })
  }, [])

  const canContinue = step && (isConceptStep(step) || problemReady)

  const finishLesson = useCallback(() => {
    const tracked = problemSteps.filter((p) => p.id in firstTryCorrect)
    const correctOnFirstTry = tracked.filter((p) => firstTryCorrect[p.id]).length
    const lessonAccuracy =
      problemSteps.length > 0
        ? Math.round((correctOnFirstTry / problemSteps.length) * 100)
        : 100

    saveLessonFinished(lesson.id, lessonAccuracy, problemAttempts)
    clearLessonSession(lesson.id)
    onLessonSessionCleared(lesson.id)
    allowNavigation?.()

    if (hasSkillCheck(lesson.id)) {
      navigate(`/lesson/${lesson.id}/skill-check`)
      return
    }

    navigate('/course')
  }, [allowNavigation, firstTryCorrect, lesson.id, navigate, problemAttempts, problemSteps])

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
          <ConceptStepView key={step.id} title={step.title} content={step.content} />
        )}

        {isProblemStep(step) && (
          <ProblemStepView
            key={step.id}
            step={step}
            alreadySolved={solvedStepIds.has(step.id)}
            onSolved={() => handleStepSolved(step.id)}
            onFirstSubmit={(correct) => handleFirstSubmit(step.id, correct)}
            onAttemptSubmit={() => handleAttemptSubmit(step.id)}
          />
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          Back
        </button>

        <button
          type="button"
          onClick={goNext}
          disabled={!canContinue}
          className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
        >
          {isLast ? 'Finish lesson' : 'Continue'}
        </button>
      </div>

      {isLast && canContinue && hasSkillCheck(lesson.id) && (
        <p className="mt-3 text-center text-xs text-slate-500">
          Next up: a 3-question skill check with no hints.
        </p>
      )}
    </div>
  )
}
