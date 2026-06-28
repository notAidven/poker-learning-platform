import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { lessonNumber, sections, type LessonMeta, type SectionId } from '../data/lessons'
import { getTable } from '../data/tables'
import { hasLessonContent } from '../data/lessonContent'
import { hasSkillCheck } from '../data/skillCheckContent'
import { useProgress, skillCheckScorePercent, type LessonStats } from '../lib/progress'
import { areAllLessonsComplete, isTableCleared } from '../lib/casinoProgress'
import { areSectionLessonsComplete, priorGatedSection, sectionLessonIds } from '../lib/sectionGates'
import { Modal } from './ui/Modal'
import { Badge } from './ui/Badge'
import { buttonVariants } from './ui/buttonVariants'

type LessonStatus = 'completed' | 'current' | 'locked'

type LessonPathModalProps = {
  lesson: LessonMeta
  status: LessonStatus
  open: boolean
  onClose: () => void
}

export function LessonPathModal({ lesson, status, open, onClose }: LessonPathModalProps) {
  const isTable = lesson.kind === 'ai-table'
  const isGate = lesson.kind === 'gate'
  const { getStats, isLessonInProgress } = useProgress()
  const stats = getStats(lesson.id)
  const inProgress = isLessonInProgress(lesson.id, 100)
  const hasContent = hasLessonContent(lesson.id)
  const closeRef = useRef<HTMLButtonElement>(null)

  const eyebrow = isTable ? 'Casino table' : isGate ? 'Section gate' : `Lesson ${lessonNumber(lesson.id)}`

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="lesson-modal-title"
      initialFocusRef={closeRef}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg p-1 text-night-400 hover:bg-night-100 hover:text-night-600"
        aria-label="Close"
      >
        <CloseIcon />
      </button>

      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{eyebrow}</p>
      <h2 id="lesson-modal-title" className="mt-1 pr-8 text-lg font-bold text-ink">
        {lesson.title}
      </h2>
      <p className="mt-1 text-sm text-night-600">{lesson.unit}</p>

      <div className="mt-5">
        {isTable ? (
          <TableBody lesson={lesson} status={status} onClose={onClose} />
        ) : isGate ? (
          <GateBody lesson={lesson} status={status} onClose={onClose} />
        ) : (
          <>
            {status === 'locked' && <LockedBody lesson={lesson} />}
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
          </>
        )}
      </div>
    </Modal>
  )
}

function GateBody({
  lesson,
  status,
  onClose,
}: {
  lesson: LessonMeta
  status: LessonStatus
  onClose: () => void
}) {
  const sectionId = lesson.section as SectionId
  const { completedIds, isGatePassed, isSectionTestedOut } = useProgress()
  const passed = isGatePassed(sectionId)
  const testedOut = isSectionTestedOut(sectionId)
  const lessonsDone = areSectionLessonsComplete(completedIds, sectionId)

  if (status === 'locked') {
    return (
      <p className="rounded-2xl bg-night-50 px-4 py-3 text-sm text-night-700">
        Pass the previous section&rsquo;s gate to unlock this one.
      </p>
    )
  }

  if (passed) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge tone="success">Section complete</Badge>
          {testedOut && <Badge tone="gold">Tested out</Badge>}
        </div>
        <p className="text-sm text-night-700">
          You&rsquo;ve cleared this gate, so the next section is unlocked. Retake it any time for a
          little practice XP.
        </p>
        <Link
          to={`/gate/${sectionId}`}
          onClick={onClose}
          className={buttonVariants({ variant: 'secondary', className: 'w-full' })}
        >
          Retake gate
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-night-700">
        {lessonsDone
          ? 'You\u2019ve finished every lesson here. Clear this gate to complete the section and unlock the next one.'
          : 'Skip ahead: pass this gate to complete the whole section (for reduced XP). If you don\u2019t pass, just work through the lessons normally — nothing is lost.'}
      </p>
      <Link
        to={`/gate/${sectionId}`}
        onClick={onClose}
        className={buttonVariants({ variant: 'primary', className: 'w-full' })}
      >
        {lessonsDone ? 'Take the section gate' : 'Test out of this section'}
      </Link>
    </div>
  )
}

function LockedBody({ lesson }: { lesson: LessonMeta }) {
  // The FIRST lesson of a section is gated behind the PRIOR section's gate, not the
  // previous lesson — so a learner who has finished the section's lessons is told to
  // pass the gate (the real blocker) instead of being wrongly sent to "redo the
  // previous lesson" they already completed. Within-section lessons keep the
  // sequential message.
  const sectionLessons = sectionLessonIds(lesson.section)
  const prior = sectionLessons[0] === lesson.id ? priorGatedSection(lesson.section) : null
  const priorTitle = prior ? (sections.find((s) => s.id === prior)?.title ?? null) : null

  if (priorTitle && prior) {
    return (
      <div className="space-y-3">
        <p className="rounded-2xl bg-night-50 px-4 py-3 text-sm text-night-700">
          Pass the <span className="font-semibold">{priorTitle}</span> gate to unlock this section.
        </p>
        <Link
          to={`/gate/${prior}`}
          className={buttonVariants({ variant: 'secondary', className: 'w-full' })}
        >
          Go to the {priorTitle} gate
        </Link>
      </div>
    )
  }

  return (
    <p className="rounded-2xl bg-night-50 px-4 py-3 text-sm text-night-700">
      Complete the previous lesson and its skill check to unlock this one.
    </p>
  )
}

function TableBody({
  lesson,
  status,
  onClose,
}: {
  lesson: LessonMeta
  status: LessonStatus
  onClose: () => void
}) {
  const table = getTable(lesson.id)
  const cleared = isTableCleared(lesson.id)
  const { completedIds } = useProgress()

  if (status === 'locked') {
    const lockedMessage =
      table?.feature === 'ai'
        ? 'Finish all lessons and play a coached game to unlock the AI table.'
        : !areAllLessonsComplete(completedIds)
          ? 'Finish all lessons to open the Casino Floor.'
          : 'Clear the previous coached table to unlock this one.'
    return (
      <p className="rounded-2xl bg-night-50 px-4 py-3 text-sm text-night-700">{lockedMessage}</p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-night-700">
        {table?.feature === 'coached'
          ? 'Play full hands against rule-based opponents while an AI coach talks you through every decision.'
          : 'Take a seat against AI opponents. The always-on strategy hint has your back on every street.'}
      </p>
      {cleared && (
        <p className="rounded-2xl bg-success-50 px-4 py-3 text-sm font-semibold text-success-700">
          Table cleared — pull up a chair any time.
        </p>
      )}
      <Link
        to={`/table/${lesson.id}`}
        onClick={onClose}
        className={buttonVariants({ variant: 'primary', className: 'w-full' })}
      >
        {cleared ? 'Play again' : 'Play the table'}
      </Link>
    </div>
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
          value={stats.lessonAccuracy != null ? `${stats.lessonAccuracy}%` : '–'}
        />
        <StatCard
          label="Skill check"
          value={
            stats.skillCheckCorrect != null && stats.skillCheckTotal != null
              ? `${stats.skillCheckCorrect}/${stats.skillCheckTotal}${skillPercent != null ? ` (${skillPercent}%)` : ''}`
              : '–'
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Link
          to={`/lesson/${lessonId}`}
          onClick={onClose}
          className={buttonVariants({ variant: 'primary', className: 'w-full' })}
        >
          Review lesson
        </Link>
        {hasSkillCheck(lessonId) && (
          <Link
            to={`/lesson/${lessonId}/skill-check`}
            onClick={onClose}
            className={buttonVariants({ variant: 'secondary', className: 'w-full' })}
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
      <p className="rounded-2xl bg-gold-100 px-4 py-3 text-sm text-gold-900">
        Lesson complete! Take the 3-question skill check to finish and unlock the next lesson.
      </p>
      <Link
        to={`/lesson/${lessonId}/skill-check`}
        onClick={onClose}
        className={buttonVariants({ variant: 'primary', className: 'w-full' })}
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
      <p className="rounded-2xl bg-night-50 px-4 py-3 text-sm text-night-700">
        Interactive content for this lesson is coming soon.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-night-700">
        {inProgress
          ? 'Pick up where you left off, then finish with a short skill check.'
          : 'Work through interactive problems, then prove it with 3 no-hint questions.'}
      </p>
      <Link
        to={`/lesson/${lessonId}`}
        onClick={onClose}
        className={buttonVariants({ variant: 'primary', className: 'w-full' })}
      >
        {inProgress ? 'Continue lesson' : 'Start lesson'}
      </Link>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-night-50 px-3 py-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-night-600">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
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
