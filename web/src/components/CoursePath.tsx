import { useLayoutEffect, useRef, useState } from 'react'
import type { LessonMeta } from '../data/lessons'
import { LessonPathModal } from './LessonPathModal'
import { CheckIcon, LockIcon, StarIcon } from './icons'

type LessonStatus = 'completed' | 'current' | 'locked'

type CoursePathProps = {
  lessons: LessonMeta[]
  /** Lesson ids the user has fully completed (lesson + skill check) */
  completedIds?: string[]
}

const NODE_RADIUS = 36
/** Node radius including the 5px status ring — keeps nodes clear of the edges */
const NODE_OUTER_RADIUS = 42
const ROW_HEIGHT = 132
const LABEL_GAP = 12
/** Smallest width a side label may shrink to before we rely on wrap/clamp */
const MIN_LABEL_WIDTH = 64
/** Largest label width — matches the previous sm:max-w-[11rem] look */
const MAX_LABEL_WIDTH = 176

/** Zigzag direction per row (sign only) — Duolingo-style path down the page.
 *  The magnitude is derived from the live width so nodes + connectors stay aligned. */
const PATH_DIRECTIONS = [0, 1, -1, 1, -1, 0]
/** Zigzag amplitude as a fraction of the track width on roomy layouts */
const OFFSET_RATIO = 0.21

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

/** Horizontal zigzag offset (px) for a row, clamped so the node (with its ring)
 *  and its outer label both stay inside the current track width at every breakpoint. */
function offsetFor(index: number, width: number) {
  const dir = PATH_DIRECTIONS[index] ?? 0
  if (dir === 0 || width <= 0) return 0
  const ideal = OFFSET_RATIO * width
  const maxByNode = width / 2 - NODE_OUTER_RADIUS
  const maxByLabel = width / 2 - NODE_RADIUS - LABEL_GAP - MIN_LABEL_WIDTH
  const max = Math.max(0, Math.min(maxByNode, maxByLabel))
  return dir * Math.min(ideal, max)
}

/** Outer space available for a row's side label (px), given its node position. */
function labelWidthFor(index: number, width: number) {
  if (width <= 0) return MAX_LABEL_WIDTH
  const center = width / 2 + offsetFor(index, width)
  const outerEdge = offsetFor(index, width) >= 0 ? width - center : center
  return Math.min(MAX_LABEL_WIDTH, Math.max(0, outerEdge - NODE_RADIUS - LABEL_GAP))
}

function nodeCenter(index: number, width: number) {
  return {
    x: width / 2 + offsetFor(index, width),
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
  const height = lessons.length * ROW_HEIGHT + 56
  const trackRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [selectedLesson, setSelectedLesson] = useState<{
    lesson: LessonMeta
    status: LessonStatus
  } | null>(null)

  // Measure the actual track width so the SVG connectors and the DOM lesson
  // nodes share ONE pixel coordinate system at every breakpoint.
  useLayoutEffect(() => {
    const el = trackRef.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div className="relative mx-auto w-full max-w-md rounded-[2rem] bg-gradient-to-b from-sky-50/80 via-white to-violet-50/50 px-2 py-10 sm:max-w-lg sm:px-6">
        <div ref={trackRef} className="relative mx-auto w-full" style={{ height }}>
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            viewBox={`0 0 ${Math.max(width, 1)} ${height}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            {width > 0 &&
              lessons.slice(0, -1).map((_, i) => {
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

          <ol className="relative m-0 list-none p-0" style={{ height }}>
            {lessons.map((lesson, index) => {
              const status = getLessonStatus(lesson, index, lessons, completedIds)
              const center = nodeCenter(index, width)
              const isLast = index === lessons.length - 1
              const labelOnRight = offsetFor(index, width) >= 0

              return (
                <li
                  key={lesson.id}
                  className="absolute"
                  style={{
                    left: width > 0 ? center.x : '50%',
                    top: center.y,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    <PathNode
                      lesson={lesson}
                      status={status}
                      isLast={isLast}
                      onSelect={() => setSelectedLesson({ lesson, status })}
                    />

                    <LessonSideLabel
                      lesson={lesson}
                      status={status}
                      side={labelOnRight ? 'right' : 'left'}
                      width={width > 0 ? labelWidthFor(index, width) : undefined}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
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
  side,
  width,
}: {
  lesson: LessonMeta
  status: LessonStatus
  side: 'left' | 'right'
  width?: number
}) {
  // Absolutely positioned next to the node so the node's center stays exactly on
  // the connector attach point. An explicit width (the measured outer space) makes
  // the label wrap to fill that space instead of collapsing to its longest word.
  const position =
    side === 'right' ? 'left-full ml-3 text-left' : 'right-full mr-3 text-right'
  return (
    <p
      className={`pointer-events-none absolute top-1/2 line-clamp-4 -translate-y-1/2 text-xs font-semibold leading-snug sm:text-sm ${position} ${
        status === 'locked' ? 'text-slate-400' : 'text-slate-800'
      }`}
      style={{ width, maxWidth: width }}
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
      <CheckIcon className="h-8 w-8" strokeWidth={3} />
    ) : status === 'locked' ? (
      <LockIcon className="h-6 w-6" />
    ) : isLast ? (
      <StarIcon className="h-8 w-8" />
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
