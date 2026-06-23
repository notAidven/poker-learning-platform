import { Link } from 'react-router-dom'
import { CoursePath } from '../components/CoursePath'
import { course } from '../data/course'
import { lessons } from '../data/lessons'
import { useCompletedLessons } from '../hooks/useCompletedLessons'

export function CoursePage() {
  const { completedIds } = useCompletedLessons()

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          {course.title}
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Your learning path</h1>
        <p className="mt-2 text-sm text-slate-600">{course.pathDescription}</p>
      </div>

      <CoursePath lessons={lessons} completedIds={completedIds} />

      <p className="text-center text-sm text-slate-500 sm:text-left">
        <Link to="/" className="font-semibold text-brand-600 hover:text-brand-700">
          ← Back to home
        </Link>
      </p>
    </div>
  )
}
