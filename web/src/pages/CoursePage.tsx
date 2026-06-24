import { CoursePath } from '../components/CoursePath'
import { course } from '../data/course'
import { lessons } from '../data/lessons'
import { useCompletedLessons } from '../hooks/useCompletedLessons'

export function CoursePage() {
  const { completedIds } = useCompletedLessons()
  const total = lessons.length
  const completedCount = lessons.filter((l) => completedIds.includes(l.id)).length
  const percent = Math.round((completedCount / total) * 100)

  return (
    <div className="mx-auto max-w-lg space-y-7">
      <header className="text-center sm:text-left">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Your learning path
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-night-700/80">{course.pathDescription}</p>
      </header>

      <div className="rounded-2xl border border-night-900/10 bg-white p-4 shadow-card sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">
            <span className="tnum">{completedCount}</span> of{' '}
            <span className="tnum">{total}</span> lessons complete
          </p>
          <span className="tnum text-sm font-bold text-emerald-600">{percent}%</span>
        </div>
        <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-night-900/[0.06] ring-1 ring-inset ring-night-900/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-700"
            style={{ width: `${Math.max(percent, completedCount > 0 ? 6 : 0)}%` }}
          />
        </div>
      </div>

      <CoursePath lessons={lessons} completedIds={completedIds} />
    </div>
  )
}
