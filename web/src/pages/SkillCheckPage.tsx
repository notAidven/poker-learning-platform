import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExitLessonModal } from '../components/ExitLessonModal'
import { SkillCheckPlayer } from '../components/lesson/SkillCheckPlayer'
import { getSkillCheck, hasSkillCheck } from '../data/skillCheckContent'
import { lessons } from '../data/lessons'
import { useActivityExitGuard } from '../hooks/useActivityExitGuard'
import { abandonLessonAttempt, getLessonStats } from '../lib/lessonProgress'

export function SkillCheckPage() {
  const { lessonId = '' } = useParams()
  const meta = lessons.find((l) => l.id === lessonId)
  const skillCheck = getSkillCheck(lessonId)
  const stats = getLessonStats(lessonId)
  const [finished, setFinished] = useState(false)

  const isSkillCheckInProgress = Boolean(skillCheck) && stats.lessonFinished && !stats.completed && !finished

  const handleConfirmExit = useCallback(() => {
    abandonLessonAttempt(lessonId, { resetLessonFinished: true })
  }, [lessonId])

  const { modalOpen, stay, confirmExit } = useActivityExitGuard({
    when: isSkillCheckInProgress,
    onConfirmExit: handleConfirmExit,
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

  if (!skillCheck || !hasSkillCheck(lessonId)) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-xl font-bold">{meta.title}</h1>
        <p className="mt-2 text-sm text-slate-600">Skill check coming soon.</p>
        <Link to="/course" className="mt-4 inline-block text-brand-600">
          ← Back to course
        </Link>
      </div>
    )
  }

  if (!stats.lessonFinished && !stats.completed) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-xl font-bold">Finish the lesson first</h1>
        <p className="mt-2 text-sm text-slate-600">
          Complete all steps in <span className="font-semibold">{meta.title}</span> before the skill
          check.
        </p>
        <Link
          to={`/lesson/${lessonId}`}
          className="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
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
            Lesson {meta.id} · Skill check
          </p>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{meta.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            3 quick questions — no hints. Show what you remember.
          </p>
        </div>

        <SkillCheckPlayer
          skillCheck={skillCheck}
          lessonTitle={meta.title}
          onFinished={() => setFinished(true)}
        />
      </div>

      <ExitLessonModal open={modalOpen} onStay={stay} onExit={confirmExit} />
    </>
  )
}
