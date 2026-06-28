import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useProgressStore } from '../../lib/progress/ProgressContext'
import { gatePassMark, isGatePassing } from '../../lib/gamification'
import type { RewardModel } from '../../lib/reward'
import { DUR, EASE } from '../../lib/motion'
import { usePrefersReducedMotion } from './interactions/usePrefersReducedMotion'
import { useAuth } from '../../contexts/useAuth'
import type { SectionId } from '../../data/lessons'
import type { SectionGateDefinition } from '../../data/sectionGates'
import { SkillCheckStepView } from './SkillCheckStepView'
import { RewardCelebration } from '../gamification/RewardCelebration'
import { CheckIcon, RetryIcon, StarIcon } from '../icons'
import { Button } from '../ui/Button'
import { buttonVariants } from '../ui/buttonVariants'

type SectionGatePlayerProps = {
  gate: SectionGateDefinition
  sectionTitle: string
  /**
   * `'test-out'` when the learner is skipping the section's lessons (so a fail sends
   * them to the lessons); `'gate'` when they reached the gate after the lessons (so a
   * fail offers a review + retake). Drives only the result-screen copy + the link.
   */
  mode: 'test-out' | 'gate'
  /** First lesson of the section, for the "do the lessons" link after a failed test-out. */
  firstLessonId: string
  /** Reports active answering (vs. a result screen) for the page-level exit guard. */
  onActiveChange?: (active: boolean) => void
}

/**
 * Section Gate player — mirrors `SkillCheckPlayer` (interactive questions, no hints,
 * one pass screen + a retryable fail screen) but grades the whole section: it passes
 * at ~70% and, on a pass, completes the section via `store.saveGateResult` (awarding
 * the gate / test-out XP, or small replay XP on a re-pass). A failed test-out leaves
 * everything untouched, so the section's lessons stay available and the gate retryable.
 */
export function SectionGatePlayer({
  gate,
  sectionTitle,
  mode,
  firstLessonId,
  onActiveChange,
}: SectionGatePlayerProps) {
  const store = useProgressStore()
  const { profile } = useAuth()
  const reduced = usePrefersReducedMotion()
  const total = gate.questions.length
  const passMark = gatePassMark(total)
  const sectionId: SectionId = gate.sectionId

  const [questionIndex, setQuestionIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [passed, setPassed] = useState(false)
  const [reward, setReward] = useState<RewardModel | null>(null)
  // Bumped on each retake to force a fresh mount of the interaction widgets.
  const [attemptKey, setAttemptKey] = useState(0)

  const question = gate.questions[questionIndex]
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
      const didPass = isGatePassing(finalCorrect, total)
      // Only a passing score completes the section. A failing score changes nothing —
      // the lessons stay available and the gate stays retryable.
      if (didPass) {
        // One store call passes the gate AND returns the ready celebration (the store
        // owns the XP/streak read-state + award await + meter math). No snapshot-race.
        const { reward } = store.completeGate(sectionId, finalCorrect, total, {
          totalXp: profile?.totalXp ?? 0,
          streak: profile?.streak ?? 0,
          lastActivityDate: profile?.lastActivityDate ?? null,
        })
        void reward.then((model) => {
          if (model) setReward(model)
        })
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
          <div className="rounded-3xl border border-danger-200 bg-danger-50 p-8 shadow-sm">
            <div className="flex justify-center" aria-hidden>
              <RetryIcon className="h-12 w-12 text-danger-500" />
            </div>
            <h2 className="mt-3 text-2xl font-bold text-ink">Gate not cleared</h2>
            <p className="mt-2 text-sm text-night-700">
              You scored{' '}
              <span className="font-bold text-danger-700">
                {correctCount}/{total}
              </span>{' '}
              ({percent}%). You need at least{' '}
              <span className="font-semibold">
                {passMark} of {total}
              </span>{' '}
              to clear the {sectionTitle} gate.
            </p>
            <p className="mt-3 rounded-2xl bg-white/80 px-4 py-3 text-sm text-night-700">
              {mode === 'test-out'
                ? 'No problem — work through the section\u2019s lessons to build it up, then the gate will be waiting whenever you\u2019re ready.'
                : 'Give the section another look, then retake the gate. There\u2019s no penalty for a retry.'}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={handleRetake}>Retake gate</Button>
              <Link
                to={mode === 'test-out' ? `/lesson/${firstLessonId}` : '/course'}
                className={buttonVariants({ variant: 'secondary' })}
              >
                {mode === 'test-out' ? 'Start the lessons' : 'Back to course path'}
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-3xl border border-success-200 bg-success-50 p-8 shadow-sm">
          <div className="flex justify-center" aria-hidden>
            {percent === 100 ? (
              <StarIcon className="h-12 w-12 text-gold-400" />
            ) : (
              <CheckIcon className="h-12 w-12 text-success-600" strokeWidth={2.5} />
            )}
          </div>
          <h2 className="mt-3 text-2xl font-bold text-ink">Section complete</h2>
          <p className="mt-2 text-sm text-night-700">
            You scored{' '}
            <span className="font-bold text-success-700">
              {correctCount}/{total}
            </span>{' '}
            ({percent}%) on the {sectionTitle} gate. The next section is unlocked.
          </p>
          {reward && (
            <div className="mt-4">
              <RewardCelebration {...reward} />
            </div>
          )}
          <p className="mt-5 rounded-2xl bg-white/80 px-4 py-3 text-sm text-night-700">
            Lock it in with a quick mixed review — a few problems pulled from everything you have
            learned so far, spaced out so it sticks.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/review" className={buttonVariants({ variant: 'primary' })}>
              Start a mixed review
            </Link>
            <Link to="/course" className={buttonVariants({ variant: 'secondary' })}>
              Back to course path
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 text-sm font-medium text-night-600">
        Question {questionIndex + 1} of {total}
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-night-200">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${((questionIndex + (answered ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-night-900/10 bg-white p-6 shadow-sm sm:p-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${question.id}-${attemptKey}`}
            initial={reduced ? false : { x: 28, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { x: -28, opacity: 0 }}
            transition={{ duration: reduced ? 0 : DUR.base, ease: EASE.standard }}
          >
            <SkillCheckStepView question={question} onAnswered={handleAnswered} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-end">
        {answered && (
          <Button onClick={handleContinue}>{isLast ? 'Finish gate' : 'Next question'}</Button>
        )}
      </div>
    </div>
  )
}
