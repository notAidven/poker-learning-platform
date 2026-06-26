import { Link } from 'react-router-dom'
import { course } from '../data/course'
import { lessonNumber, lessons } from '../data/lessons'
import { hasLessonContent } from '../data/lessonContent'
import { useAuth } from '../contexts/AuthContext'
import { useProgress } from '../lib/progress'
import { getEffectiveStreak, getLevelProgress } from '../lib/gamification'
import { Badge } from '../components/ui/Badge'
import { buttonVariants } from '../components/ui/Button'
import { NightPanel } from '../components/ui/NightPanel'
import { StatToken } from '../components/ui/StatToken'
import { Stagger } from '../components/ui/Stagger'
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
  const { completedIds, getNextLessonPath } = useProgress()
  const continueTo = getNextLessonPath()

  const totalXp = profile?.totalXp ?? 0
  const levelProgress = getLevelProgress(totalXp)
  const streak = getEffectiveStreak(profile?.streak ?? 0, profile?.lastActivityDate ?? null)

  // The home overview lists the interactive lessons only; casino tables live on
  // the course path and are excluded from the lesson completion math.
  const lessonNodes = lessons.filter((l) => l.kind !== 'ai-table')

  function lessonUnlocked(index: number) {
    if (index === 0) return true
    return completedIds.includes(lessonNodes[index - 1].id)
  }

  const nextIndex = lessonNodes.findIndex(
    (lesson, index) =>
      lessonUnlocked(index) && hasLessonContent(lesson.id) && !completedIds.includes(lesson.id),
  )
  const completedCount = lessonNodes.filter((l) => completedIds.includes(l.id)).length
  const startedJourney = completedCount > 0 || streak > 0 || totalXp > 0

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
              unlocked={lessonUnlocked(index) && hasLessonContent(lesson.id)}
              done={completedIds.includes(lesson.id)}
              isNext={index === nextIndex}
              hasContent={hasLessonContent(lesson.id)}
            />
          ))}
        </Stagger>
      </section>
    </div>
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
