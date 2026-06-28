import { useEffect } from 'react'
import { CoursePath } from '../components/CoursePath'
import { Chip } from '../components/lesson/interactions/cards/PlayingCardKit'
import { course } from '../data/course'
import { lessons } from '../data/lessons'
import { useAuth } from '../contexts/useAuth'
import { useProgress } from '../lib/progress'
import { areAllLessonsComplete } from '../lib/casinoProgress'
import { grantBankroll, useBankroll } from '../lib/bankroll'

export function CoursePage() {
  const { completedIds } = useProgress()
  const { user, profile } = useAuth()
  const { chips: bankroll } = useBankroll()
  // Casino tables render on the path but are NOT part of the lesson completion math.
  const lessonNodes = lessons.filter((l) => l.kind !== 'ai-table')
  const total = lessonNodes.length
  const completedCount = lessonNodes.filter((l) => completedIds.includes(l.id)).length
  const percent = Math.round((completedCount / total) * 100)
  const casinoUnlocked = areAllLessonsComplete(completedIds)

  // Grant the starting bankroll once the whole course is complete (idempotent).
  useEffect(() => {
    if (casinoUnlocked) {
      void grantBankroll(user?.uid ?? null, { profileGranted: Boolean(profile?.bankrollGranted) })
    }
  }, [casinoUnlocked, user?.uid, profile?.bankrollGranted])

  return (
    <div className="mx-auto max-w-lg space-y-7">
      <header className="text-center sm:text-left">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Your learning path
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-night-700/80">{course.pathDescription}</p>
        {casinoUnlocked && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-night-900 px-3 py-1.5 text-sm font-bold text-gold-300 shadow-sm">
            <Chip size={16} tone="gold" />
            <span className="tabular-nums">{bankroll.toLocaleString()}</span>
            <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-white/50">
              casino bankroll
            </span>
          </div>
        )}
      </header>

      <div className="rounded-2xl border border-night-900/10 bg-white p-4 shadow-card sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">
            <span className="tnum">{completedCount}</span> of{' '}
            <span className="tnum">{total}</span> lessons complete
          </p>
          <span className="tnum text-sm font-bold text-success-600">{percent}%</span>
        </div>
        <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-night-900/[0.06] ring-1 ring-inset ring-night-900/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-success-400 to-success-500 transition-[width] duration-700"
            style={{ width: `${Math.max(percent, completedCount > 0 ? 6 : 0)}%` }}
          />
        </div>
      </div>

      <CoursePath lessons={lessons} completedIds={completedIds} />
    </div>
  )
}
