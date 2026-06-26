import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import { lessonNumber, sections, type LessonMeta, type SectionId, type SectionMeta } from '../data/lessons'
import { getTable } from '../data/tables'
import { isTableCleared, isTableUnlocked } from '../lib/casinoProgress'
import { LessonPathModal } from './LessonPathModal'
import { CheckIcon, ChipIcon, LockIcon } from './icons'
import { DUR, EASE } from '../lib/motion'
import { usePrefersReducedMotion } from './lesson/interactions/usePrefersReducedMotion'

type LessonStatus = 'completed' | 'current' | 'locked'

/** sessionStorage key holding the completed-node baseline from the last time the path was
 *  shown, so a freshly-won lesson still flips when the learner returns to the (remounted)
 *  path — without every already-done node flipping on first load. */
const SEEN_KEY = 'suited-course-seen-completed'

/** Completed nodes read as a "won hand" across every section: a success-green chip + check. */
const COMPLETED_NODE = 'bg-success-500 text-white shadow-md ring-[5px] ring-success-200'

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
/** Zigzag amplitude as a fraction of the track width on roomy layouts */
const OFFSET_RATIO = 0.21
/** Vertical room reserved above each section's first node for its banner */
const SECTION_HEADER_SPACE = 96
/** Banner offset from the top of its section band */
const HEADER_PAD_TOP = 14
/** Breathing room between two section bands */
const SECTION_GAP = 30
/** A little tail below the last node so the final ring never clips */
const TAIL_PAD = 28
/** Shared box for a section banner's pill background and its text, so the two
 *  layers (BOTH drawn above the connector trail) line up exactly and occlude the
 *  line behind the card. Compact so the trail still visibly enters the top and
 *  exits the bottom of each station, reading as one continuous path. */
const BANNER_BOX = 'h-[4.5rem] w-full max-w-[18rem]'

/**
 * Per-section visual theme. Tints map onto palette tokens in index.css: foundations →
 * success-* (felt-green), oxblood → brand-*, brass → gold-*; the casino capstone keeps a
 * distinct violet "neon" tint (no token equivalent). Completed nodes are unified to
 * COMPLETED_NODE so finishing reads as a "won hand" everywhere. Class strings are literal
 * (Tailwind needs them visible) and preserve the status affordances (check / number-or-star
 * / lock + current pulse + badge). Connector colours are CSS-var tokens for the SVG trail.
 */
const SECTION_THEME: Record<
  SectionId,
  {
    band: string
    /** Ring around the banner "station" card the trail runs behind. */
    headerRing: string
    eyebrow: string
    title: string
    connector: string
    node: { completed: string; current: string; locked: string }
  }
> = {
  foundations: {
    band: 'bg-success-50/70 ring-1 ring-inset ring-success-100',
    headerRing: 'ring-success-200',
    eyebrow: 'text-success-600',
    title: 'text-success-900',
    connector: 'var(--color-success-500)',
    node: {
      completed: COMPLETED_NODE,
      current:
        'bg-success-600 text-white shadow-lg shadow-success-500/40 ring-[5px] ring-success-200 animate-[pulse_2.5s_ease-in-out_infinite]',
      locked: 'bg-success-50 text-success-300 ring-[5px] ring-success-100',
    },
  },
  playing: {
    band: 'bg-brand-50/60 ring-1 ring-inset ring-brand-100',
    headerRing: 'ring-brand-200',
    eyebrow: 'text-brand-600',
    title: 'text-brand-900',
    connector: 'var(--color-brand-600)',
    node: {
      completed: COMPLETED_NODE,
      current:
        'bg-brand-600 text-white shadow-lg shadow-brand-500/40 ring-[5px] ring-brand-200 animate-[pulse_2.5s_ease-in-out_infinite]',
      locked: 'bg-brand-50 text-brand-300 ring-[5px] ring-brand-100',
    },
  },
  math: {
    band: 'bg-gold-200/30 ring-1 ring-inset ring-gold-200',
    headerRing: 'ring-gold-200',
    eyebrow: 'text-gold-600',
    title: 'text-gold-600',
    connector: 'var(--color-gold-500)',
    node: {
      completed: COMPLETED_NODE,
      current:
        'bg-gold-600 text-white shadow-lg shadow-gold-400/40 ring-[5px] ring-gold-200 animate-[pulse_2.5s_ease-in-out_infinite]',
      locked: 'bg-gold-200/60 text-gold-600 ring-[5px] ring-gold-200',
    },
  },
  // Casino Floor (Phase 2 AI tables): a distinct violet "neon" tint with no palette
  // token, kept as-is so the capstone arena reads as its own place.
  casino: {
    band: 'bg-violet-50/70 ring-1 ring-inset ring-violet-100',
    headerRing: 'ring-violet-200',
    eyebrow: 'text-violet-600',
    title: 'text-violet-900',
    connector: '#8b5cf6',
    node: {
      completed: COMPLETED_NODE,
      current:
        'bg-violet-600 text-white shadow-lg shadow-violet-500/40 ring-[5px] ring-violet-200 animate-[pulse_2.5s_ease-in-out_infinite]',
      locked: 'bg-violet-50 text-violet-300 ring-[5px] ring-violet-100',
    },
  },
}

type LessonLayout = {
  lesson: LessonMeta
  globalIndex: number
  section: SectionId
  /** Node center y, in the shared pixel coordinate system. */
  y: number
}

type SectionLayout = {
  meta: SectionMeta
  index: number
  bandTop: number
  bandHeight: number
  headerTop: number
}

type PathLayout = {
  lessonLayouts: LessonLayout[]
  sectionLayouts: SectionLayout[]
  totalHeight: number
}

/**
 * Vertical layout (width-independent): stack each section's banner + rows, with a
 * gap between sections. Returns node y-centers plus per-section band/header bounds,
 * all in one pixel coordinate system shared by the SVG connectors and the DOM nodes.
 */
function computeLayout(lessonList: LessonMeta[]): PathLayout {
  const lessonLayouts: LessonLayout[] = []
  const sectionLayouts: SectionLayout[] = []
  let cursor = 0

  sections.forEach((section) => {
    const inSection = lessonList.filter((l) => l.section === section.id)
    if (inSection.length === 0) return

    const bandTop = cursor
    const headerTop = cursor + HEADER_PAD_TOP
    cursor += SECTION_HEADER_SPACE

    inSection.forEach((lesson) => {
      lessonLayouts.push({
        lesson,
        globalIndex: lessonList.indexOf(lesson),
        section: section.id,
        y: cursor + NODE_RADIUS + 20,
      })
      cursor += ROW_HEIGHT
    })

    sectionLayouts.push({
      meta: section,
      index: sectionLayouts.length,
      bandTop,
      bandHeight: cursor - bandTop,
      headerTop,
    })
    cursor += SECTION_GAP
  })

  // Keep declared lesson order even if the data is grouped unusually.
  lessonLayouts.sort((a, b) => a.globalIndex - b.globalIndex)

  return { lessonLayouts, sectionLayouts, totalHeight: cursor - SECTION_GAP + TAIL_PAD }
}

/** Has this path node been finished? Lessons use completedIds; tables use the cleared store. */
function isNodeDone(node: LessonMeta, completedIds: string[]): boolean {
  return node.kind === 'ai-table' ? isTableCleared(node.id) : completedIds.includes(node.id)
}

function getLessonStatus(
  lesson: LessonMeta,
  index: number,
  lessonList: LessonMeta[],
  completedIds: string[],
): LessonStatus {
  // AI tables unlock by their own prerequisite (a completed lesson or a cleared
  // table), independent of the strict lesson sequence.
  if (lesson.kind === 'ai-table') {
    if (isTableCleared(lesson.id)) return 'completed'
    const table = getTable(lesson.id)
    const unlocked = table ? isTableUnlocked(table, completedIds) : false
    return unlocked ? 'current' : 'locked'
  }

  if (completedIds.includes(lesson.id)) return 'completed'
  if (index === 0) return 'current'
  const prev = lessonList[index - 1]
  if (isNodeDone(prev, completedIds)) return 'current'
  return 'locked'
}

/** Zigzag direction (sign only) for any N: the first node is centered, then rows alternate. */
function directionFor(index: number) {
  if (index === 0) return 0
  return index % 2 === 1 ? 1 : -1
}

/** Horizontal zigzag offset (px) for a row, clamped so the node (with its ring) and
 *  its outer label both stay inside the current track width at every breakpoint. */
function offsetFor(index: number, width: number) {
  const dir = directionFor(index)
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

function nodeCenter(index: number, y: number, width: number) {
  return { x: width / 2 + offsetFor(index, width), y }
}

function connectorPath(from: LessonLayout, to: LessonLayout, width: number) {
  const a = nodeCenter(from.globalIndex, from.y, width)
  const b = nodeCenter(to.globalIndex, to.y, width)
  const midY = (a.y + b.y) / 2
  return `M ${a.x} ${a.y + NODE_RADIUS - 2} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y - NODE_RADIUS + 2}`
}

export function CoursePath({ lessons, completedIds = [] }: CoursePathProps) {
  const { lessonLayouts, sectionLayouts, totalHeight } = computeLayout(lessons)
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

  const statuses = lessons.map((lesson, i) => getLessonStatus(lesson, i, lessons, completedIds))
  const reduced = usePrefersReducedMotion()

  // Nodes finished since the path was last shown get a one-shot chip flip. The per-session
  // baseline lives in sessionStorage, captured once at mount, so a freshly-won node still
  // flips when the learner returns to the (remounted) path — while existing completions
  // never flip on first load. The effect advances the baseline after each completion change.
  const completedNodeIds = lessonLayouts
    .filter((ll) => statuses[ll.globalIndex] === 'completed')
    .map((ll) => ll.lesson.id)
  const completedKey = completedNodeIds.join(',')
  const [flipIds] = useState<Set<string>>(() => {
    try {
      const raw = sessionStorage.getItem(SEEN_KEY)
      if (raw === null) return new Set()
      const prev = new Set<string>(JSON.parse(raw) as string[])
      return new Set(completedNodeIds.filter((id) => !prev.has(id)))
    } catch {
      return new Set()
    }
  })
  useEffect(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, JSON.stringify(completedKey ? completedKey.split(',') : []))
    } catch {
      /* ignore storage failures (e.g. private mode) */
    }
  }, [completedKey])

  return (
    <>
      <div className="relative mx-auto w-full max-w-md rounded-[2rem] bg-white px-2 py-8 ring-1 ring-night-900/5 sm:max-w-lg sm:px-6">
        <div ref={trackRef} className="relative mx-auto w-full" style={{ height: totalHeight }}>
          {/* Soft tinted band behind each section's banner + rows */}
          {sectionLayouts.map((section) => (
            <div
              key={`band-${section.meta.id}`}
              className={`absolute inset-x-0 z-0 rounded-[1.75rem] ${SECTION_THEME[section.meta.id].band}`}
              style={{ top: section.bandTop, height: section.bandHeight }}
              aria-hidden
            />
          ))}

          {/* Frosted "station" pill BACKGROUND for each banner, drawn ABOVE the trail so
              the connector line is occluded BEHIND the card. The banner TEXT sits above
              this pill, so the line passes behind the whole station while the trail stays
              visible in the gaps above/below — the path still reads as one continuous line. */}
          {sectionLayouts.map((section) => (
            <div
              key={`banner-bg-${section.meta.id}`}
              className="pointer-events-none absolute inset-x-0 z-20 flex justify-center px-4"
              style={{ top: section.headerTop }}
              aria-hidden
            >
              <div
                className={`${BANNER_BOX} rounded-2xl bg-white/85 shadow-sm ring-1 ring-inset backdrop-blur-sm ${SECTION_THEME[section.meta.id].headerRing}`}
              />
            </div>
          ))}

          {/* Connectors — ONE continuous trail through all nodes, drawn BELOW the banner
              pill cards so the line passes BEHIND each station (it visibly enters the top
              and exits the bottom of a card, hidden only behind the card itself) while the
              path still reads as continuous. Same-section segments use that section's color;
              cross-section segments blend the two section colors (a "stepping up" cue). */}
          <svg
            className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
            viewBox={`0 0 ${Math.max(width, 1)} ${totalHeight}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            {width > 0 && (
              <defs>
                {lessonLayouts.slice(0, -1).map((from, i) => {
                  const to = lessonLayouts[i + 1]
                  if (from.section === to.section) return null
                  // Gradient oriented along the actual (clamped) node centers, so it
                  // stays aligned with the trail at every width — mobile included.
                  const a = nodeCenter(from.globalIndex, from.y, width)
                  const b = nodeCenter(to.globalIndex, to.y, width)
                  return (
                    <linearGradient
                      key={`grad-${from.lesson.id}`}
                      id={`xsection-${from.lesson.id}`}
                      gradientUnits="userSpaceOnUse"
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                    >
                      <stop offset="0%" stopColor={SECTION_THEME[from.section].connector} />
                      <stop offset="100%" stopColor={SECTION_THEME[to.section].connector} />
                    </linearGradient>
                  )
                })}
              </defs>
            )}
            {width > 0 &&
              lessonLayouts.slice(0, -1).map((from, i) => {
                const to = lessonLayouts[i + 1]
                const crossSection = from.section !== to.section
                const fromStatus = statuses[from.globalIndex]
                const active = fromStatus === 'completed' || fromStatus === 'current'
                const stroke = !active
                  ? 'var(--color-night-200)'
                  : crossSection
                    ? `url(#xsection-${from.lesson.id})`
                    : SECTION_THEME[from.section].connector
                // The trail draws itself in top→bottom (stroke-dashoffset via pathLength).
                return (
                  <motion.path
                    key={from.lesson.id}
                    d={connectorPath(from, to, width)}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={10}
                    strokeLinecap="round"
                    initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: active ? 1 : 0.85 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : {
                            pathLength: { delay: 0.06 * i, duration: DUR.deal, ease: EASE.deal },
                            opacity: { delay: 0.06 * i, duration: DUR.quick, ease: EASE.standard },
                          }
                    }
                  />
                )
              })}
          </svg>

          {/* Banner TEXT, drawn ABOVE both the trail and its pill card so each label stays
              crisp and unmistakably on top while the connector line passes behind the card. */}
          {sectionLayouts.map((section) => (
            <SectionBannerText
              key={`banner-text-${section.meta.id}`}
              section={section.meta}
              index={section.index}
              top={section.headerTop}
            />
          ))}

          {/* Lesson nodes */}
          <ol className="relative z-40 m-0 list-none p-0" style={{ height: totalHeight }}>
            {lessonLayouts.map((ll, liIndex) => {
              const index = ll.globalIndex
              const status = statuses[index]
              const center = nodeCenter(index, ll.y, width)
              const labelOnRight = offsetFor(index, width) >= 0

              return (
                <li
                  key={ll.lesson.id}
                  className="absolute"
                  style={{
                    left: width > 0 ? center.x : '50%',
                    top: center.y,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Staggered top→bottom reveal; the node center stays put (transform lives here, not on the li). */}
                  <motion.div
                    className="relative flex items-center justify-center"
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { delay: 0.08 + liIndex * 0.045, duration: DUR.base, ease: EASE.deal }
                    }
                  >
                    <PathNode
                      lesson={ll.lesson}
                      status={status}
                      section={ll.section}
                      justCompleted={flipIds.has(ll.lesson.id)}
                      reduced={reduced}
                      onSelect={() => setSelectedLesson({ lesson: ll.lesson, status })}
                    />

                    <LessonSideLabel
                      lesson={ll.lesson}
                      status={status}
                      side={labelOnRight ? 'right' : 'left'}
                      width={width > 0 ? labelWidthFor(index, width) : undefined}
                    />
                  </motion.div>
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

function SectionBannerText({
  section,
  index,
  top,
}: {
  section: SectionMeta
  index: number
  top: number
}) {
  const theme = SECTION_THEME[section.id]
  const style: CSSProperties = { top }
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-4"
      style={style}
    >
      {/* Text only (the frosted pill background is a separate layer just below this, and
          both sit above the trail), so the connector line passes behind these labels and
          behind the card while the path stays continuous. */}
      <div className={`${BANNER_BOX} flex flex-col items-center justify-center px-3 text-center`}>
        <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${theme.eyebrow}`}>
          Section {index + 1}
        </p>
        <h2 className={`mt-0.5 font-display text-[15px] font-bold leading-tight ${theme.title}`}>
          {section.title}
        </h2>
        <p className="mt-0.5 line-clamp-2 max-w-[15rem] text-[11px] leading-snug text-night-600">
          {section.subtitle}
        </p>
      </div>
    </div>
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
        status === 'locked' ? 'text-night-400' : 'text-night-800'
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
  section,
  justCompleted,
  reduced,
  onSelect,
}: {
  lesson: LessonMeta
  status: LessonStatus
  section: SectionId
  justCompleted: boolean
  reduced: boolean
  onSelect: () => void
}) {
  const shell = [
    'relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full transition-transform',
    SECTION_THEME[section].node[status],
    'hover:scale-105 active:scale-95',
  ]
    .filter(Boolean)
    .join(' ')

  const isTable = lesson.kind === 'ai-table'
  const number = lessonNumber(lesson.id)
  const content =
    status === 'completed' ? (
      <CheckIcon className="h-8 w-8" strokeWidth={3} />
    ) : status === 'locked' ? (
      <LockIcon className="h-6 w-6" />
    ) : isTable ? (
      <ChipIcon className="h-9 w-9" strokeWidth={2.25} />
    ) : (
      <span className="text-2xl font-bold">{number}</span>
    )

  const badgeText = isTable ? 'Play' : number === 1 ? 'Start' : 'Up next'
  // A freshly-won node flips face-up like a chip being raked in; otherwise it sits still
  // (initial=false) so hover/active scale on the inner shell keeps working.
  const flip = justCompleted && !reduced

  return (
    <button
      type="button"
      onClick={onSelect}
      className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-4"
      aria-label={isTable ? `Table: ${lesson.title}` : `Lesson ${number}: ${lesson.title}`}
    >
      <motion.div
        className="relative"
        style={{ transformPerspective: 700 }}
        initial={flip ? { rotateY: -180, scale: 0.6, opacity: 0 } : false}
        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
        transition={flip ? { duration: DUR.deal, ease: EASE.chip, delay: 0.18 } : { duration: 0 }}
      >
        <div className={shell}>
          {content}
          {status === 'current' && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-night-900 shadow">
              {badgeText}
            </span>
          )}
        </div>
      </motion.div>
    </button>
  )
}
