import { Link } from 'react-router-dom'
import { course } from '../data/course'
import { lessons } from '../data/lessons'
import { hasLessonContent } from '../data/lessonContent'
import { useAuth } from '../contexts/AuthContext'
import { useCompletedLessons } from '../hooks/useCompletedLessons'
import { getEffectiveStreak, getLevelProgress } from '../lib/gamification'
import { getNextLessonPath } from '../lib/lessonProgress'

export function HomePage() {
  const { profile } = useAuth()
  const { completedIds } = useCompletedLessons()
  const continueTo = getNextLessonPath(completedIds)

  const totalXp = profile?.totalXp ?? 0
  const levelProgress = getLevelProgress(totalXp)
  const streak = getEffectiveStreak(profile?.streak ?? 0, profile?.lastActivityDate ?? null)

  function lessonUnlocked(index: number) {
    if (index === 0) return true
    return completedIds.includes(lessons[index - 1].id)
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-medium text-brand-100">{course.title}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">
          {course.heroLine}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-brand-100 sm:text-base">
          {course.heroDescription}
        </p>

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to={continueTo}
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Continue learning
            </Link>
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white/10 px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>
                  🔥
                </span>
                <div>
                  <p className="text-brand-100">Streak</p>
                  <p className="text-lg font-bold">{streak}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-white/20" aria-hidden />
              <div>
                <p className="text-brand-100">Level</p>
                <p className="text-lg font-bold">{levelProgress.level}</p>
              </div>
              <div className="h-8 w-px bg-white/20" aria-hidden />
              <div>
                <p className="text-brand-100">XP</p>
                <p className="text-lg font-bold">{totalXp}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white/10 px-4 py-3">
            <div className="flex items-center justify-between text-xs font-medium text-brand-100">
              <span>Level {levelProgress.level}</span>
              <span>
                {levelProgress.xpInLevel} / {levelProgress.xpToNext} XP to level{' '}
                {levelProgress.level + 1}
              </span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"
              role="progressbar"
              aria-valuenow={levelProgress.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress to next level"
            >
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${levelProgress.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Your course</h2>
            <p className="text-sm text-slate-500">{course.courseSummary}</p>
          </div>
          <Link to="/course" className="text-sm font-semibold text-brand-600">
            View path →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson, index) => {
            const unlocked = lessonUnlocked(index) && hasLessonContent(lesson.id)
            const done = completedIds.includes(lesson.id)

            if (unlocked) {
              return (
                <Link
                  key={lesson.id}
                  to={`/lesson/${lesson.id}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                    Lesson {lesson.id}
                    {done && ' · ✓'}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{lesson.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{lesson.unit}</p>
                </Link>
              )
            }

            return (
              <article
                key={lesson.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm opacity-90"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                  Lesson {lesson.id}
                </p>
                <h3 className="mt-1 text-base font-semibold">{lesson.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{lesson.unit}</p>
                <p className="mt-2 text-xs font-medium text-slate-400">
                  {hasLessonContent(lesson.id) ? 'Locked' : 'Coming soon'}
                </p>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
