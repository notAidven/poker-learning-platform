import { Link } from 'react-router-dom'
import { CoursePath } from '../components/CoursePath'
import { course } from '../data/course'
import { lessons } from '../data/lessons'
import { useCompletedLessons } from '../hooks/useCompletedLessons'
import { Badge } from '../components/ui/Badge'

export function CoursePage() {
  const { completedIds } = useCompletedLessons()
  const total = lessons.length
  const completedCount = lessons.filter((l) => completedIds.includes(l.id)).length
  const percent = Math.round((completedCount / total) * 100)

  return (
    <div className="mx-auto max-w-lg space-y-7">
      <header className="text-center sm:text-left">
        <Badge tone="brand">{course.title}</Badge>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Your learning path
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{course.pathDescription}</p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">
            <span className="tnum">{completedCount}</span> of{' '}
            <span className="tnum">{total}</span> lessons complete
          </p>
          <span className="tnum text-sm font-bold text-emerald-600">{percent}%</span>
        </div>
        <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-700"
            style={{ width: `${Math.max(percent, completedCount > 0 ? 6 : 0)}%` }}
          />
        </div>
        <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-slate-500">
          <LegendItem className="bg-emerald-500" label="Completed" />
          <LegendItem className="bg-brand-600" label="Current" />
          <LegendItem className="bg-slate-300" label="Locked" />
        </ul>
      </div>

      <CoursePath lessons={lessons} completedIds={completedIds} />

      <p className="text-center text-sm text-slate-500 sm:text-left">
        <Link to="/" className="font-semibold text-brand-600 transition hover:text-brand-700">
          ← Back to home
        </Link>
      </p>
    </div>
  )
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} aria-hidden />
      {label}
    </li>
  )
}
