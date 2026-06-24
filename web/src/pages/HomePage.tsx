import { Link } from 'react-router-dom'
import { course } from '../data/course'
import { lessons } from '../data/lessons'
import { hasLessonContent } from '../data/lessonContent'
import { useAuth } from '../contexts/AuthContext'
import { useCompletedLessons } from '../hooks/useCompletedLessons'
import { getEffectiveStreak, getLevelProgress } from '../lib/gamification'
import { getNextLessonPath } from '../lib/lessonProgress'
import { Badge } from '../components/ui/Badge'
import { buttonVariants } from '../components/ui/Button'
import { NightPanel } from '../components/ui/NightPanel'
import { StatToken } from '../components/ui/StatToken'
import { cx } from '../components/ui/cx'
import {
  CheckIcon,
  FlameIcon,
  LockIcon,
  SpadeIcon,
  StarIcon,
  TrendingUpIcon,
} from '../components/icons'

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

  const nextIndex = lessons.findIndex(
    (lesson, index) =>
      lessonUnlocked(index) && hasLessonContent(lesson.id) && !completedIds.includes(lesson.id),
  )
  const completedCount = lessons.filter((l) => completedIds.includes(l.id)).length
  const startedJourney = completedCount > 0 || streak > 0 || totalXp > 0

  return (
    <div className="space-y-10">
      <NightPanel className="p-6 sm:p-9 lg:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div className="anim-fade-up">
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
          </div>

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
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              Your course
            </h2>
            <p className="mt-1 text-sm text-night-700/70">{course.courseSummary}</p>
          </div>
          <Link
            to="/course"
            className="text-sm font-semibold text-brand-600 transition hover:text-brand-700"
          >
            View path →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              index={index}
              unlocked={lessonUnlocked(index) && hasLessonContent(lesson.id)}
              done={completedIds.includes(lesson.id)}
              isNext={index === nextIndex}
              hasContent={hasLessonContent(lesson.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

type LessonCardProps = {
  lesson: (typeof lessons)[number]
  index: number
  unlocked: boolean
  done: boolean
  isNext: boolean
  hasContent: boolean
}

function LessonCard({ lesson, index, unlocked, done, isNext, hasContent }: LessonCardProps) {
  const chip = (
    <span
      className={cx(
        'grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-lg font-bold',
        done && 'bg-emerald-500 text-white shadow-[0_2px_0_#047353]',
        !done && unlocked && 'bg-brand-600 text-white shadow-[0_2px_0_var(--color-brand-800)]',
        !done && !unlocked && 'bg-night-900/5 text-night-700/40 ring-1 ring-inset ring-night-900/10',
      )}
      aria-hidden
    >
      {done ? <CheckIcon className="h-6 w-6" /> : unlocked ? lesson.id : <LockIcon className="h-5 w-5" />}
    </span>
  )

  const badge = done ? (
    <Badge tone="emerald">Completed</Badge>
  ) : isNext ? (
    <Badge tone="gold">Up next</Badge>
  ) : unlocked ? (
    <Badge tone="brand">Open</Badge>
  ) : hasContent ? (
    <Badge tone="slate">Locked</Badge>
  ) : (
    <Badge tone="slate">Coming soon</Badge>
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

  const baseCard = 'anim-fade-up flex flex-col rounded-2xl border p-5 shadow-card'

  if (unlocked) {
    return (
      <Link
        to={`/lesson/${lesson.id}`}
        className={cx(
          baseCard,
          'group border-night-900/10 bg-white transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
        )}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {inner}
      </Link>
    )
  }

  return (
    <article
      className={cx(baseCard, 'border-night-900/10 bg-white/55')}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {inner}
    </article>
  )
}
