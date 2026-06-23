import { useState } from 'react'
import type { LessonMeta } from '../data/lessons'
import { LessonPathModal } from './LessonPathModal'

type LessonStatus = 'completed' | 'current' | 'locked'

type CoursePathProps = {
  lessons: LessonMeta[]
  /** Lesson ids the user has fully completed (lesson + skill check) */
  completedIds?: string[]
}

const NODE_RADIUS = 36
const ROW_HEIGHT = 132

/** Horizontal offset from center — Duolingo-style zigzag down the path */
const PATH_OFFSETS = [0, 84, -84, 84, -84, 0]

function getLessonStatus(
  lesson: LessonMeta,
  index: number,
  lessons: LessonMeta[],
  completedIds: string[],
): LessonStatus {
  if (completedIds.includes(lesson.id)) return 'completed'
  if (index === 0) return 'current'
  const prev = lessons[index - 1]
  if (completedIds.includes(prev.id)) return 'current'
  return 'locked'
}

function nodeCenter(index: number, width: number) {
  return {
    x: width / 2 + (PATH_OFFSETS[index] ?? 0),
    y: index * ROW_HEIGHT + NODE_RADIUS + 20,
  }
}

function connectorPath(from: number, to: number, width: number) {
  const a = nodeCenter(from, width)
  const b = nodeCenter(to, width)
  const midY = (a.y + b.y) / 2
  return `M ${a.x} ${a.y + NODE_RADIUS - 2} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y - NODE_RADIUS + 2}`
}

export function CoursePath({ lessons, completedIds = [] }: CoursePathProps) {
  const width = 400
  const height = lessons.length * ROW_HEIGHT + 56
  const [selectedLesson, setSelectedLesson] = useState<{
    lesson: LessonMeta
    status: LessonStatus
  } | null>(null)

  return (
    <>
      <div className="relative mx-auto w-full max-w-md rounded-[2rem] bg-gradient-to-b from-sky-50/80 via-white to-violet-50/50 px-2 py-10 sm:max-w-lg sm:px-6">
        <svg
          className="pointer-events-none absolute inset-x-0 top-10 w-full overflow-visible"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMin meet"
          aria-hidden
        >
          {lessons.slice(0, -1).map((_, i) => {
            const from = getLessonStatus(lessons[i], i, lessons, completedIds)
            const active = from === 'completed' || from === 'current'
            return (
              <path
                key={i}
                d={connectorPath(i, i + 1, width)}
                fill="none"
                stroke={active ? '#60a5fa' : '#cbd5e1'}
                strokeWidth={10}
                strokeLinecap="round"
                opacity={active ? 1 : 0.85}
              />
            )
          })}
        </svg>

        <ol className="relative m-0 list-none p-0" style={{ minHeight: height }}>
          {lessons.map((lesson, index) => {
            const status = getLessonStatus(lesson, index, lessons, completedIds)
            const offset = PATH_OFFSETS[index] ?? 0
            const isLast = index === lessons.length - 1
            const labelOnRight = offset >= 0

            return (
              <li
                key={lesson.id}
                className="absolute left-1/2 flex items-center gap-3"
                style={{
                  top: index * ROW_HEIGHT + 20,
                  transform: `translateX(calc(-50% + ${offset}px))`,
                }}
              >
                {!labelOnRight && (
                  <LessonSideLabel lesson={lesson} status={status} align="right" />
                )}

                <PathNode
                  lesson={lesson}
                  status={status}
                  isLast={isLast}
                  onSelect={() => setSelectedLesson({ lesson, status })}
                />

                {labelOnRight && (
                  <LessonSideLabel lesson={lesson} status={status} align="left" />
                )}
              </li>
            )
          })}
        </ol>
      </div>

      {selectedLesson && (
        <LessonPathModal
          lesson={selectedLesson.lesson}
          status={selectedLesson.status}
          open
          onClose={() => setSelectedLesson(null)}
        />
      )}
    </>
  )
}

function LessonSideLabel({
  lesson,
  status,
  align,
}: {
  lesson: LessonMeta
  status: LessonStatus
  align: 'left' | 'right'
}) {
  return (
    <p
      className={`max-w-[9.5rem] text-xs font-semibold leading-snug sm:max-w-[11rem] sm:text-sm ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${status === 'locked' ? 'text-slate-400' : 'text-slate-800'}`}
    >
      {lesson.title}
    </p>
  )
}

function PathNode({
  lesson,
  status,
  isLast,
  onSelect,
}: {
  lesson: LessonMeta
  status: LessonStatus
  isLast: boolean
  onSelect: () => void
}) {
  const shell = [
    'relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full transition-transform',
    status === 'current' &&
      'bg-brand-600 text-white shadow-lg shadow-brand-500/40 ring-[5px] ring-brand-200 animate-[pulse_2.5s_ease-in-out_infinite]',
    status === 'completed' &&
      'bg-emerald-500 text-white shadow-md ring-[5px] ring-emerald-200',
    status === 'locked' && 'bg-slate-200 text-slate-400 ring-[5px] ring-slate-100',
    'hover:scale-105 active:scale-95',
  ]
    .filter(Boolean)
    .join(' ')

  const content =
    status === 'completed' ? (
      <CheckIcon />
    ) : status === 'locked' ? (
      <LockIcon />
    ) : isLast ? (
      <StarIcon />
    ) : (
      <span className="text-2xl font-bold">{lesson.id}</span>
    )

  return (
    <button
      type="button"
      onClick={onSelect}
      className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-4"
      aria-label={`Lesson ${lesson.id}: ${lesson.title}`}
    >
      <div className={shell}>
        {content}
        {status === 'current' && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow">
            {lesson.id === '1' ? 'Start' : 'Up next'}
          </span>
        )}
      </div>
    </button>
  )
}

function CheckIcon() {
  return (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path
        fillRule="evenodd"
        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 22 12 18.56 5.8 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
    </svg>
  )
}
