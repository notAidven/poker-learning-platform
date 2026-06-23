import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { LessonMeta } from '../data/lessons'
import { hasLessonContent } from '../data/lessonContent'
import { hasSkillCheck } from '../data/skillCheckContent'
import {
  getLessonStats,
  isLessonInProgress,
  skillCheckScorePercent,
  type LessonStats,
} from '../lib/lessonProgress'

type LessonStatus = 'completed' | 'current' | 'locked'

type LessonPathModalProps = {
  lesson: LessonMeta
  status: LessonStatus
  open: boolean
  onClose: () => void
}

export function LessonPathModal({ lesson, status, open, onClose }: LessonPathModalProps) {
  const stats = getLessonStats(lesson.id)
  const inProgress = isLessonInProgress(lesson.id, 100)
  const hasContent = hasLessonContent(lesson.id)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-modal-title"
        className="relative w-full max-w-sm animate-[fadeIn_0.2s_ease-out] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          Lesson {lesson.id}
        </p>
        <h2 id="lesson-modal-title" className="mt-1 pr-8 text-lg font-bold text-slate-900">
          {lesson.title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{lesson.unit}</p>

        <div className="mt-5">
          {status === 'locked' && <LockedBody />}
          {status !== 'locked' && stats.completed && (
            <CompletedBody stats={stats} lessonId={lesson.id} onClose={onClose} />
          )}
          {status !== 'locked' && !stats.completed && stats.lessonFinished && hasSkillCheck(lesson.id) && (
            <SkillCheckPendingBody lessonId={lesson.id} onClose={onClose} />
          )}
          {status !== 'locked' && !stats.completed && !(stats.lessonFinished && hasSkillCheck(lesson.id)) && (
            <StartBody
              lessonId={lesson.id}
              hasContent={hasContent}
              inProgress={inProgress}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function LockedBody() {
  return (
    <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
      Complete the previous lesson and its skill check to unlock this one.
    </p>
  )
}

function CompletedBody({
  stats,
  lessonId,
  onClose,
}: {
  stats: LessonStats
  lessonId: string
  onClose: () => void
}) {
  const skillPercent = skillCheckScorePercent(stats)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Lesson accuracy"
          value={stats.lessonAccuracy != null ? `${stats.lessonAccuracy}%` : '—'}
        />
        <StatCard
          label="Skill check"
          value={
            stats.skillCheckCorrect != null && stats.skillCheckTotal != null
              ? `${stats.skillCheckCorrect}/${stats.skillCheckTotal}${skillPercent != null ? ` (${skillPercent}%)` : ''}`
              : '—'
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Link
          to={`/lesson/${lessonId}`}
          onClick={onClose}
          className="rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
        >
          Review lesson
        </Link>
        {hasSkillCheck(lessonId) && (
          <Link
            to={`/lesson/${lessonId}/skill-check`}
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Retake skill check
          </Link>
        )}
      </div>
    </div>
  )
}

function SkillCheckPendingBody({ lessonId, onClose }: { lessonId: string; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Lesson complete! Take the 3-question skill check to finish and unlock the next lesson.
      </p>
      <Link
        to={`/lesson/${lessonId}/skill-check`}
        onClick={onClose}
        className="block rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
      >
        Continue skill check
      </Link>
    </div>
  )
}

function StartBody({
  lessonId,
  hasContent,
  inProgress,
  onClose,
}: {
  lessonId: string
  hasContent: boolean
  inProgress: boolean
  onClose: () => void
}) {
  if (!hasContent) {
    return (
      <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Interactive content for this lesson is coming soon.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        {inProgress
          ? 'Pick up where you left off, then finish with a short skill check.'
          : 'Work through interactive problems, then prove it with 3 no-hint questions.'}
      </p>
      <Link
        to={`/lesson/${lessonId}`}
        onClick={onClose}
        className="block rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
      >
        {inProgress ? 'Continue lesson' : 'Start lesson'}
      </Link>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
