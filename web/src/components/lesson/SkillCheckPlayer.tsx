import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { saveSkillCheckResult } from '../../lib/lessonProgress'
import { isSkillCheckPassing } from '../../lib/gamification'
import type { SkillCheckDefinition } from '../../types/skillCheck'
import { SkillCheckStepView } from './SkillCheckStepView'
import { CheckIcon, RetryIcon, StarIcon } from '../icons'

type SkillCheckPlayerProps = {
  skillCheck: SkillCheckDefinition
  lessonTitle: string
  /**
   * Reports whether the learner is actively answering questions (vs. sitting on
   * a result screen). Drives the page-level exit guard so the result screens'
   * navigation buttons (incl. free retries) don't trip a "leave?" prompt.
   */
  onActiveChange?: (active: boolean) => void
}

export function SkillCheckPlayer({ skillCheck, lessonTitle, onActiveChange }: SkillCheckPlayerProps) {
  const total = skillCheck.questions.length
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [passed, setPassed] = useState(false)
  const [xpBreakdown, setXpBreakdown] = useState<{ base: number; bonus: number; total: number } | null>(
    null,
  )
  // Bumped on each retake to force a fresh mount of the interaction widgets
  // (they lock after a single submit), so a retry starts from a clean slate.
  const [attemptKey, setAttemptKey] = useState(0)

  const question = skillCheck.questions[questionIndex]
  const isLast = questionIndex >= total - 1

  useEffect(() => {
    onActiveChange?.(!finished)
  }, [finished, onActiveChange])

  function handleAnswered(correct: boolean) {
    setAnswered(true)
    if (correct) setCorrectCount((c) => c + 1)
  }

  function handleContinue() {
    if (!answered) return

    if (isLast) {
      const finalCorrect = correctCount
      const didPass = isSkillCheckPassing(finalCorrect, total)
      // Only a passing score completes the lesson + awards XP + unlocks the next
      // lesson. A failing score leaves the lesson un-completed so the learner can
      // retake the skill check directly (P1 #3).
      if (didPass) {
        const result = saveSkillCheckResult(skillCheck.lessonId, finalCorrect, total)
        if (result.isFirstCompletion && result.xpBreakdown) {
          setXpBreakdown(result.xpBreakdown)
        }
      }
      setPassed(didPass)
      setFinished(true)
      return
    }

    setQuestionIndex((i) => i + 1)
    setAnswered(false)
  }

  function handleRetake() {
    setQuestionIndex(0)
    setAnswered(false)
    setCorrectCount(0)
    setFinished(false)
    setPassed(false)
    setXpBreakdown(null)
    setAttemptKey((k) => k + 1)
  }

  if (finished) {
    const percent = Math.round((correctCount / total) * 100)

    if (!passed) {
      return (
        <div className="mx-auto max-w-lg text-center">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <div className="flex justify-center" aria-hidden>
              <RetryIcon className="h-12 w-12 text-amber-500" />
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Not quite yet</h2>
            <p className="mt-2 text-sm text-slate-600">
              You scored{' '}
              <span className="font-bold text-amber-700">
                {correctCount}/{total}
              </span>{' '}
              ({percent}%). You need at least <span className="font-semibold">2 of 3</span> correct
              to pass the {lessonTitle} skill check.
            </p>
            <p className="mt-3 rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-700">
              Your lesson progress is saved — retake the skill check whenever you're ready. No need
              to redo the lesson.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleRetake}
                className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Retake skill check
              </button>
              <Link
                to={`/lesson/${skillCheck.lessonId}`}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Review lesson
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm">
          <div className="flex justify-center" aria-hidden>
            {percent === 100 ? (
              <StarIcon className="h-12 w-12 text-amber-400" />
            ) : (
              <CheckIcon className="h-12 w-12 text-emerald-600" strokeWidth={2.5} />
            )}
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Skill check complete</h2>
          <p className="mt-2 text-sm text-slate-600">
            You scored{' '}
            <span className="font-bold text-emerald-700">
              {correctCount}/{total}
            </span>{' '}
            ({percent}%) on the {lessonTitle} skill check.
          </p>
          {xpBreakdown && (
            <p className="mt-3 rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold text-brand-700">+{xpBreakdown.total} XP</span>
              {' '}
              ({xpBreakdown.base} base
              {xpBreakdown.bonus > 0 ? ` + ${xpBreakdown.bonus} first-try bonus` : ''})
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/course"
              className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Back to course path
            </Link>
            <Link
              to={`/lesson/${skillCheck.lessonId}`}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Review lesson
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
        <span className="font-semibold text-brand-600">Skill check</span>
        <span>
          Question {questionIndex + 1} of {total}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${((questionIndex + (answered ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <SkillCheckStepView
          key={`${question.id}-${attemptKey}`}
          question={question}
          onAnswered={handleAnswered}
        />
      </div>

      <div className="mt-6 flex justify-end">
        {answered && (
          <button
            type="button"
            onClick={handleContinue}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {isLast ? 'Finish skill check' : 'Next question'}
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        No hints — answer from memory. Pass with 2 of 3.
      </p>
    </div>
  )
}
