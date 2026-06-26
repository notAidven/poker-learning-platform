import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { saveSkillCheckResult, type LessonCompletionAward } from '../../lib/lessonProgress'
import { isSkillCheckPassing } from '../../lib/gamification'
import { buildRewardModel, type RewardModel } from '../../lib/reward'
import { useAuth } from '../../contexts/AuthContext'
import type { SkillCheckDefinition } from '../../types/skillCheck'
import { SkillCheckStepView } from './SkillCheckStepView'
import { RewardCelebration } from '../gamification/RewardCelebration'
import { CheckIcon, RetryIcon, StarIcon } from '../icons'
import { Button, buttonVariants } from '../ui/Button'

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
  const { profile } = useAuth()
  const total = skillCheck.questions.length
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [passed, setPassed] = useState(false)
  const [reward, setReward] = useState<RewardModel | null>(null)
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
        // Snapshot the pre-completion profile so the celebration meter knows where
        // it started (the profile only refreshes after the award lands).
        const prevTotalXp = profile?.totalXp ?? 0
        const prevStreakStored = profile?.streak ?? 0
        const prevLastActivityDate = profile?.lastActivityDate ?? null
        const result = saveSkillCheckResult(skillCheck.lessonId, finalCorrect, total)
        if (result.isFirstCompletion && result.xpBreakdown) {
          const xpBreakdown = result.xpBreakdown
          // Prefer the authoritative Firestore award (streak/level), but never block
          // the celebration on it: fall back to local math for guests / slow writes.
          void (async () => {
            const award = await Promise.race([
              result.award,
              new Promise<LessonCompletionAward | null>((resolve) => {
                setTimeout(() => resolve(null), 1200)
              }),
            ])
            setReward(
              buildRewardModel({
                xpBreakdown,
                prevTotalXp,
                prevStreakStored,
                prevLastActivityDate,
                award,
              }),
            )
          })()
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
    setReward(null)
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
              Your lesson progress is saved. Retake the skill check whenever you're ready. No need
              to redo the lesson.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={handleRetake}>Retake skill check</Button>
              <Link
                to={`/lesson/${skillCheck.lessonId}`}
                className={buttonVariants({ variant: 'secondary' })}
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
          {reward && (
            <div className="mt-4">
              <RewardCelebration {...reward} />
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/course" className={buttonVariants({ variant: 'primary' })}>
              Back to course path
            </Link>
            <Link
              to={`/lesson/${skillCheck.lessonId}`}
              className={buttonVariants({ variant: 'secondary' })}
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
      <div className="mb-4 text-sm font-medium text-slate-500">
        Question {questionIndex + 1} of {total}
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
          <Button onClick={handleContinue}>
            {isLast ? 'Finish skill check' : 'Next question'}
          </Button>
        )}
      </div>
    </div>
  )
}
