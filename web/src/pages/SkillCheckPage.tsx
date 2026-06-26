import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ExitLessonModal } from '../components/ExitLessonModal'
import { SkillCheckPlayer } from '../components/lesson/SkillCheckPlayer'
import { hasSkillCheck, loadSkillCheck } from '../data/skillCheckContent'
import { lessonNumber, lessons } from '../data/lessons'
import type { SkillCheckDefinition } from '../types/skillCheck'
import { useActivityExitGuard } from '../hooks/useActivityExitGuard'
import { useProgress } from '../lib/progress'

export function SkillCheckPage() {
  const { lessonId = '' } = useParams()
  const meta = lessons.find((l) => l.id === lessonId)
  const { getStats, isLessonUnlocked } = useProgress()
  const stats = getStats(lessonId)
  const [skillCheck, setSkillCheck] = useState<SkillCheckDefinition | undefined>()
  const [skillCheckLoading, setSkillCheckLoading] = useState(() => hasSkillCheck(lessonId))
  const [skillCheckActive, setSkillCheckActive] = useState(false)

  useEffect(() => {
    if (!hasSkillCheck(lessonId)) {
      setSkillCheck(undefined)
      setSkillCheckLoading(false)
      return
    }

    let cancelled = false
    setSkillCheckLoading(true)
    void loadSkillCheck(lessonId).then((loaded) => {
      if (!cancelled) {
        setSkillCheck(loaded)
        setSkillCheckLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [lessonId])

  // Warn only while actively answering. Leaving no longer resets the lesson —
  // the body stays finished so the learner returns straight to the skill check
  // and can retake it freely (P1 #3).
  const { modalOpen, stay, confirmExit } = useActivityExitGuard({
    when: Boolean(skillCheck) && skillCheckActive,
  })

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

  // Sequential unlock on direct URLs (P1 #5): can't open a skill check whose
  // lesson is still locked.
  if (!isLessonUnlocked(lessonId)) {
    return <Navigate to="/course" replace />
  }

  if (!hasSkillCheck(lessonId)) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-xl font-bold">{meta.title}</h1>
        <p className="mt-2 text-sm text-night-700">Skill check coming soon.</p>
        <Link to="/course" className="mt-4 inline-block text-brand-600">
          ← Back to course
        </Link>
      </div>
    )
  }

  if (skillCheckLoading || !skillCheck) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-sm text-night-600" aria-live="polite">
        Loading skill check…
      </div>
    )
  }

  if (!stats.lessonFinished && !stats.completed) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-xl font-bold">Finish the lesson first</h1>
        <p className="mt-2 text-sm text-night-700">
          Complete all steps in <span className="font-semibold">{meta.title}</span> before the skill
          check.
        </p>
        <Link
          to={`/lesson/${lessonId}`}
          className="mt-4 inline-block min-h-11 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Go to lesson
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
            Lesson {lessonNumber(meta.id)} · Skill check
          </p>
          <h1 className="text-xl font-bold text-ink sm:text-2xl">{meta.title}</h1>
          <p className="mt-1 text-sm text-night-700">
            3 interactive challenges — no hints. Pass with 2 of 3.
          </p>
        </div>

        <SkillCheckPlayer
          skillCheck={skillCheck}
          lessonTitle={meta.title}
          onActiveChange={setSkillCheckActive}
        />
      </div>

      <ExitLessonModal
        open={modalOpen}
        onStay={stay}
        onExit={confirmExit}
        title="Leave the skill check?"
        description="Your lesson progress is saved. You can retake the skill check anytime — no need to redo the lesson."
      />
    </>
  )
}
