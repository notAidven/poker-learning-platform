import { Link } from 'react-router-dom'
import { course } from '../data/course'
import { lessonNumber, lessons } from '../data/lessons'
import { hasLessonContent } from '../data/lessonContent'
import { tables } from '../data/tables'
import { useAuth } from '../contexts/useAuth'
import { useProgress, useProgressStore } from '../lib/progress'
import { getEffectiveStreak, getLevelProgress } from '../lib/gamification'
import { isTableCleared, isTableUnlocked } from '../lib/casinoProgress'
import { accuracy, todayCAT } from '../lib/review/scheduler'
import { dueReviewConcepts, introducedConcepts } from '../lib/review/selectors'
import { conceptMeta } from '../data/concepts'
import type { ConceptId } from '../types/concept'
import { Badge } from '../components/ui/Badge'
import { buttonVariants } from '../components/ui/buttonVariants'
import { NightPanel } from '../components/ui/NightPanel'
import { StatToken } from '../components/ui/StatToken'
import { Stagger } from '../components/ui/Stagger'
import { cx } from '../components/ui/cx'
import {
  CheckIcon,
  ChipIcon,
  FlameIcon,
  LockIcon,
  SpadeIcon,
  StarIcon,
  TrendingUpIcon,
} from '../components/icons'

export function HomePage() {
  const { profile } = useAuth()
  const { completedIds, getNextLessonPath, isLessonUnlocked } = useProgress()
  const store = useProgressStore()
  const continueTo = getNextLessonPath()

  // Spaced-repetition Review: which learned concepts are due today, and the learner's
  // weakest concepts (lowest recall accuracy) for the Strengths & Leaks panel.
  const reviewStates = store.getAllReviewStates()
  const introducedConceptIds = introducedConcepts(completedIds)
  const dueReviewCount = dueReviewConcepts(reviewStates, completedIds, todayCAT()).length
  const leaks = introducedConceptIds
    .map((id) => ({ id, state: reviewStates[id] }))
    .filter((entry) => entry.state != null && entry.state.seen > 0)
    .sort((a, b) => accuracy(a.state) - accuracy(b.state))
    .slice(0, 3)
    .map((entry) => ({ id: entry.id, pct: Math.round(accuracy(entry.state) * 100) }))

  const totalXp = profile?.totalXp ?? 0
  const levelProgress = getLevelProgress(totalXp)
  const streak = getEffectiveStreak(profile?.streak ?? 0, profile?.lastActivityDate ?? null)

  // The home overview lists the interactive lessons only; casino tables live on
  // the course path and are excluded from the lesson completion math. Unlock uses the
  // shared selector so it matches the route guard (incl. the section-gate boundaries).
  const lessonNodes = lessons.filter((l) => l.kind !== 'ai-table')

  const lessonUnlocked = (lessonId: string) => isLessonUnlocked(lessonId)

  const nextIndex = lessonNodes.findIndex(
    (lesson) =>
      lessonUnlocked(lesson.id) && hasLessonContent(lesson.id) && !completedIds.includes(lesson.id),
  )
  const completedCount = lessonNodes.filter((l) => completedIds.includes(l.id)).length
  const startedJourney = completedCount > 0 || streak > 0 || totalXp > 0

  // Casino Floor entry: Room 1 is the door to the felt. Its unlock (all lessons
  // complete) and cleared state come straight from the shared progress helpers.
  const room1 = tables[0]
  const casinoUnlocked = room1 ? isTableUnlocked(room1, completedIds) : false
  const casinoCleared = room1 ? isTableCleared(room1.id) : false
  const lessonsRemaining = lessonNodes.length - completedCount

  return (
    <div className="space-y-10">
      <style>{upNextKeyframes}</style>
      <NightPanel className="p-6 sm:p-9 lg:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.35fr_1fr]">
          <Stagger delay={0.05} step={0.09} y={16}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold-300 ring-1 ring-inset ring-gold-400/25">
              <span aria-hidden>&spades;</span>
              {course.eyebrow}
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
              {course.heroLine}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              {course.heroDescription}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to={continueTo} className={buttonVariants({ variant: 'gold', size: 'lg' })}>
                {startedJourney ? 'Continue learning' : 'Start the course'}
                <span aria-hidden>→</span>
              </Link>
              <Link to="/course" className={buttonVariants({ variant: 'glass', size: 'lg' })}>
                View the path
              </Link>
            </div>
          </Stagger>

          <div
            className="anim-deal rounded-2xl border border-white/10 bg-white/[0.05] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-5"
            style={{ animationDelay: '120ms' }}
          >
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Your stack
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              <StatToken
                icon={<FlameIcon className="h-6 w-6" />}
                value={streak}
                label="Day streak"
                accent="gold"
                orientation="col"
                delayMs={180}
              />
              <StatToken
                icon={<TrendingUpIcon className="h-6 w-6" />}
                value={levelProgress.level}
                label="Level"
                accent="green"
                orientation="col"
                delayMs={260}
              />
              <StatToken
                icon={<StarIcon className="h-6 w-6" />}
                value={totalXp}
                label="Total XP"
                accent="wine"
                orientation="col"
                delayMs={340}
              />
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-night-950/40 p-4">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold text-white/85">Level {levelProgress.level}</span>
                <span className="tnum text-white/55">
                  {levelProgress.xpInLevel} / {levelProgress.xpToNext} XP to level{' '}
                  {levelProgress.level + 1}
                </span>
              </div>
              <div
                className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-night-950/70 ring-1 ring-inset ring-white/10"
                role="progressbar"
                aria-valuenow={levelProgress.progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Level ${levelProgress.level} progress`}
              >
                <div
                  className="xp-meter-fill h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${Math.max(levelProgress.progressPercent, 4)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </NightPanel>

      <section>
        <div className="mb-5">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Your course
          </h2>
          <p className="mt-1 text-sm text-night-700/70">{course.courseSummary}</p>
        </div>

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" delay={0.05} step={0.05} y={14}>
          {lessonNodes.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              unlocked={lessonUnlocked(lesson.id) && hasLessonContent(lesson.id)}
              done={completedIds.includes(lesson.id)}
              isNext={index === nextIndex}
              hasContent={hasLessonContent(lesson.id)}
            />
          ))}
        </Stagger>
      </section>

      {introducedConceptIds.length > 0 && (
        <section>
          <ReviewSection dueCount={dueReviewCount} leaks={leaks} />
        </section>
      )}

      {room1 && (
        <section>
          <CasinoCard
            roomPath={`/table/${room1.id}`}
            unlocked={casinoUnlocked}
            cleared={casinoCleared}
            lessonsRemaining={lessonsRemaining}
          />
        </section>
      )}
    </div>
  )
}

function ReviewSection({
  dueCount,
  leaks,
}: {
  dueCount: number
  leaks: { id: ConceptId; pct: number }[]
}) {
  const hasDue = dueCount > 0
  return (
    <div className="grid gap-4 rounded-2xl border border-night-900/10 bg-white p-5 shadow-card sm:grid-cols-[1.2fr_1fr] sm:p-6">
      <div className="flex flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Daily Review
        </p>
        <h3 className="mt-1 font-display text-lg font-bold text-ink">
          {hasDue ? 'Keep what you have learned' : 'All caught up'}
        </h3>
        <p className="mt-1 text-sm text-night-700/70">
          {hasDue
            ? `${dueCount} ${dueCount === 1 ? 'concept is' : 'concepts are'} due for a quick, spaced review. Recalling beats re-reading.`
            : 'Nothing is due right now. Spacing is working — check back tomorrow.'}
        </p>
        <div className="mt-4">
          <Link to="/review" className={buttonVariants({ variant: hasDue ? 'primary' : 'secondary' })}>
            {hasDue ? 'Start review' : 'Review anyway'}
            {hasDue && (
              <span className="ml-2 rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold">
                {dueCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="rounded-xl bg-night-900/[0.03] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-night-700/55">
          Strengths &amp; leaks
        </p>
        {leaks.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {leaks.map((leak) => (
              <li key={leak.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-night-800">{conceptMeta(leak.id).label}</span>
                <span
                  className={cx(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-bold',
                    leak.pct >= 80
                      ? 'bg-success-100 text-success-700'
                      : leak.pct >= 50
                        ? 'bg-gold-200/70 text-gold-700'
                        : 'bg-danger-100 text-danger-700',
                  )}
                >
                  {leak.pct}%
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-night-700/60">
            Answer a review and your weakest concepts will show up here.
          </p>
        )}
      </div>
    </div>
  )
}

type CasinoCardProps = {
  roomPath: string
  unlocked: boolean
  cleared: boolean
  lessonsRemaining: number
}

function CasinoCard({ roomPath, unlocked, cleared, lessonsRemaining }: CasinoCardProps) {
  const inner = (
    <>
      <span
        className={cx(
          'grid h-12 w-12 shrink-0 place-items-center rounded-xl',
          unlocked ? 'bg-gold-400 text-night-900' : 'bg-white/10 text-white/40',
        )}
        aria-hidden
      >
        {unlocked ? <ChipIcon className="h-7 w-7" /> : <LockIcon className="h-6 w-6" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-300">
          Casino Floor
        </p>
        <h3 className="mt-0.5 font-display text-lg font-bold text-white">
          {unlocked ? 'Play real hands at the table' : 'The felt is waiting'}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-white/70">
          {unlocked
            ? 'Put it all together against AI opponents, with a coach in your corner.'
            : lessonsRemaining > 0
              ? `Finish your ${lessonsRemaining} remaining ${lessonsRemaining === 1 ? 'lesson' : 'lessons'} to take a seat.`
              : 'Complete every lesson to take a seat.'}
        </p>
      </div>
      {unlocked ? (
        <span
          className="hidden shrink-0 items-center gap-1.5 self-center rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-night-900 transition group-hover:-translate-y-0.5 sm:inline-flex"
          aria-hidden
        >
          {cleared ? 'Play again' : 'Play'} <span>&rarr;</span>
        </span>
      ) : (
        <span className="shrink-0 self-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/60 ring-1 ring-inset ring-white/15">
          Locked
        </span>
      )}
    </>
  )

  const cardBase =
    'flex items-start gap-4 rounded-2xl border border-white/10 bg-night-900 p-5 shadow-card sm:items-center'

  if (unlocked) {
    return (
      <Link
        to={roomPath}
        aria-label="Casino Floor: play real hands at the table"
        className={cx(
          cardBase,
          'group transition hover:-translate-y-0.5 hover:border-gold-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2',
        )}
      >
        {inner}
      </Link>
    )
  }

  return (
    <article className={cardBase} aria-label="Casino Floor (locked)">
      {inner}
    </article>
  )
}

type LessonCardProps = {
  lesson: (typeof lessons)[number]
  unlocked: boolean
  done: boolean
  isNext: boolean
  hasContent: boolean
}

function LessonCard({ lesson, unlocked, done, isNext, hasContent }: LessonCardProps) {
  const chip = (
    <span
      className={cx(
        'grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-lg font-bold',
        done && 'bg-success-500 text-white shadow-[0_2px_0_var(--color-success-700)]',
        !done && unlocked && 'bg-brand-600 text-white shadow-[0_2px_0_var(--color-brand-800)]',
        !done && !unlocked && 'bg-night-900/5 text-night-700/40 ring-1 ring-inset ring-night-900/10',
      )}
      aria-hidden
    >
      {done ? (
        <CheckIcon className="h-6 w-6" />
      ) : unlocked ? (
        lessonNumber(lesson.id)
      ) : (
        <LockIcon className="h-5 w-5" />
      )}
    </span>
  )

  const badge = done ? (
    <Badge tone="success">Completed</Badge>
  ) : isNext ? (
    <Badge tone="gold">Up next</Badge>
  ) : unlocked ? (
    <Badge tone="brand">Open</Badge>
  ) : hasContent ? (
    <Badge tone="neutral">Locked</Badge>
  ) : (
    <Badge tone="neutral">Coming soon</Badge>
  )

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        {chip}
        {badge}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-night-700/50">
        {lesson.unit}
      </p>
      <h3 className="mt-1 text-base font-semibold leading-snug text-ink">{lesson.title}</h3>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-night-700/55">
        <SpadeIcon className="h-3.5 w-3.5 shrink-0 text-gold-600" />
        {lesson.primaryInteraction}
      </p>
    </>
  )

  const baseCard = 'relative flex h-full flex-col rounded-2xl border p-5 shadow-card'

  if (unlocked) {
    return (
      <Link
        to={`/lesson/${lesson.id}`}
        className={cx(
          baseCard,
          'group border-night-900/10 bg-white transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
          isNext && 'border-gold-400/70',
        )}
      >
        {isNext && <UpNextEmphasis />}
        {inner}
      </Link>
    )
  }

  return <article className={cx(baseCard, 'border-night-900/10 bg-white/55')}>{inner}</article>
}

/** Breathing ring + a slow brass shimmer sweep that pulls the eye to the next lesson.
 *  CSS-only, so the global reduced-motion kill-switch freezes it to a static gold ring. */
function UpNextEmphasis() {
  return (
    <>
      <span
        className="suited-upnext-ring pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-gold-400/70"
        aria-hidden
      />
      <span
        className="suited-upnext-shimmer pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        aria-hidden
      />
    </>
  )
}

const upNextKeyframes = `
@keyframes suitedUpNextRing {
  0%, 100% { opacity: 0.35; box-shadow: 0 0 0 0 rgba(212, 173, 87, 0); }
  50% { opacity: 1; box-shadow: 0 0 26px -4px rgba(212, 173, 87, 0.5); }
}
@keyframes suitedUpNextSweep {
  0% { transform: translateX(-130%); }
  60%, 100% { transform: translateX(130%); }
}
.suited-upnext-ring { animation: suitedUpNextRing 3.2s ease-in-out infinite; }
.suited-upnext-shimmer::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 38%, rgba(212, 173, 87, 0.16) 50%, transparent 62%);
  transform: translateX(-130%);
  animation: suitedUpNextSweep 3.6s var(--ease-standard) infinite;
}
`
