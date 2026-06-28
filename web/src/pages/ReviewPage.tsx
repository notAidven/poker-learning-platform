import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExitLessonModal } from '../components/ExitLessonModal'
import { ReviewPlayer } from '../components/lesson/ReviewPlayer'
import { useActivityExitGuard } from '../hooks/useActivityExitGuard'
import { useProgress, useProgressStore } from '../lib/progress'
import { buildReviewQueue, collectReviewPool } from '../lib/review/reviewQueue'
import { todayCAT } from '../lib/review/scheduler'
import { dueReviewConcepts, introducedConcepts } from '../lib/review/selectors'
import type { ReviewItem } from '../lib/review/types'
import { buttonVariants } from '../components/ui/buttonVariants'

/** How many questions a single Daily Review session serves (kept short, habit-friendly). */
const REVIEW_SESSION_LIMIT = 10

export function ReviewPage() {
  const { completedIds } = useProgress()
  const store = useProgressStore()

  // Computed once per mount: which introduced concepts are due, and whether the learner
  // has been introduced to anything at all (drives the two distinct empty states).
  const { introducedCount, dueIds } = useMemo(() => {
    const states = store.getAllReviewStates()
    const today = todayCAT()
    return {
      introducedCount: introducedConcepts(completedIds).length,
      dueIds: dueReviewConcepts(states, completedIds, today),
    }
    // completedIds identity changes on every progress commit; that is the right cadence.
  }, [store, completedIds])

  const [queue, setQueue] = useState<ReviewItem[] | null>(null)
  const [active, setActive] = useState(false)

  const hasDue = dueIds.length > 0

  // Only the async pool build sets state (inside the promise callback, never
  // synchronously in the effect body). The "nothing due" case is derived in render
  // from `hasDue`, so no setState is needed there.
  useEffect(() => {
    if (!hasDue) return
    let cancelled = false
    void collectReviewPool().then((pool) => {
      if (cancelled) return
      setQueue(buildReviewQueue(pool, dueIds, REVIEW_SESSION_LIMIT))
    })
    return () => {
      cancelled = true
    }
  }, [hasDue, dueIds])

  const { modalOpen, stay, confirmExit } = useActivityExitGuard({
    when: Boolean(queue && queue.length > 0) && active,
  })

  const header = (
    <div className="mx-auto max-w-lg">
      <Link to="/" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
        ← Home
      </Link>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
        Daily Review
      </p>
      <h1 className="text-xl font-bold text-ink sm:text-2xl">Bring it back</h1>
      <p className="mt-1 text-sm text-night-700">
        A short, mixed set of problems from concepts you have learned. Recalling beats re-reading.
      </p>
    </div>
  )

  // No lessons completed yet → nothing has been introduced to review.
  if (introducedCount === 0) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-xl font-bold text-ink">Nothing to review yet</h1>
        <p className="mt-2 text-sm text-night-700">
          Complete your first lesson and its concepts will start showing up here for spaced review.
        </p>
        <Link to="/course" className={`mt-5 inline-flex ${buttonVariants({ variant: 'primary' })}`}>
          Go to the course
        </Link>
      </div>
    )
  }

  // Introduced concepts exist, but none are due today (or the build produced no
  // items) → all caught up.
  if (!hasDue || (queue !== null && queue.length === 0)) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-3xl border border-success-200 bg-success-50 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-ink">All caught up</h1>
          <p className="mt-2 text-sm text-night-700">
            Nothing is due for review right now. Spacing is working — check back tomorrow, or learn
            something new.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/course" className={buttonVariants({ variant: 'primary' })}>
              Course path
            </Link>
            <Link to="/" className={buttonVariants({ variant: 'secondary' })}>
              Back home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (queue === null) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-sm text-night-600" aria-live="polite">
        Building your review…
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {header}
        <ReviewPlayer queue={queue} onActiveChange={setActive} />
      </div>

      <ExitLessonModal
        open={modalOpen}
        onStay={stay}
        onExit={confirmExit}
        title="Leave the review?"
        description="Your scheduling so far is saved. You can come back to the Daily Review anytime."
      />
    </>
  )
}
