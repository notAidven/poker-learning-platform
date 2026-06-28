import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useProgressStore } from '../../lib/progress/ProgressContext'
import { conceptsGradedBy } from '../../lib/review/reviewQueue'
import type { ReviewItem } from '../../lib/review/types'
import { DUR, EASE } from '../../lib/motion'
import { usePrefersReducedMotion } from './interactions/usePrefersReducedMotion'
import { SkillCheckStepView } from './SkillCheckStepView'
import { CheckIcon, StarIcon } from '../icons'
import { Button } from '../ui/Button'
import { buttonVariants } from '../ui/buttonVariants'

type ReviewPlayerProps = {
  queue: ReviewItem[]
  /** Reports active answering (vs. the result screen) for the page-level exit guard. */
  onActiveChange?: (active: boolean) => void
}

/**
 * Runs a Daily Review queue. Mirrors `SkillCheckPlayer` (one interactive question at a
 * time, no hints, code-graded) but on each answer it feeds the scheduler via
 * `store.recordReviewResult` for EVERY concept the question trains — correct answers
 * push a concept further out, misses resurface it tomorrow. Finishing the session keeps
 * the daily streak alive (`recordReviewSessionComplete`). No XP and no pot: the reward
 * is the spaced retrieval itself (decision quality, not outcomes).
 */
export function ReviewPlayer({ queue, onActiveChange }: ReviewPlayerProps) {
  const store = useProgressStore()
  const reduced = usePrefersReducedMotion()
  const total = queue.length
  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)

  const item = queue[index]
  const isLast = index >= total - 1

  useEffect(() => {
    onActiveChange?.(!finished)
  }, [finished, onActiveChange])

  function handleAnswered(correct: boolean) {
    if (answered) return
    setAnswered(true)
    if (correct) setCorrectCount((c) => c + 1)
    // Which concepts an answer re-schedules is the review module's rule (co-located
    // with the queue admission rule), not a loose loop here.
    for (const conceptId of conceptsGradedBy(item)) {
      store.recordReviewResult(conceptId, correct)
    }
  }

  function handleContinue() {
    if (!answered) return
    if (isLast) {
      // A finished review counts as a qualifying daily activity (keeps the streak).
      store.recordReviewSessionComplete()
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setAnswered(false)
  }

  if (finished) {
    const percent = Math.round((correctCount / total) * 100)
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
          <h2 className="mt-3 text-2xl font-bold text-ink">Review complete</h2>
          <p className="mt-2 text-sm text-night-700">
            You recalled{' '}
            <span className="font-bold text-success-700">
              {correctCount}/{total}
            </span>{' '}
            ({percent}%). Concepts you missed come back sooner; the ones you nailed wait longer.
          </p>
          <p className="mt-3 rounded-2xl bg-white/80 px-4 py-3 text-sm text-night-700">
            Your streak is safe for today. Come back tomorrow to keep the spacing working.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/" className={buttonVariants({ variant: 'primary' })}>
              Back home
            </Link>
            <Link to="/course" className={buttonVariants({ variant: 'secondary' })}>
              Course path
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 text-sm font-medium text-night-600">
        Review {index + 1} of {total}
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-night-200">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-night-900/10 bg-white p-6 shadow-sm sm:p-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item.questionId}
            initial={reduced ? false : { x: 28, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { x: -28, opacity: 0 }}
            transition={{ duration: reduced ? 0 : DUR.base, ease: EASE.standard }}
          >
            <SkillCheckStepView question={item.question} onAnswered={handleAnswered} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-end">
        {answered && (
          <Button onClick={handleContinue}>{isLast ? 'Finish review' : 'Next'}</Button>
        )}
      </div>
    </div>
  )
}
