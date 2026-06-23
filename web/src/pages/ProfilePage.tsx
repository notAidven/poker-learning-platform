import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAnimalEmoji } from '../data/animals'
import { getEffectiveStreak, getLevelProgress } from '../lib/gamification'

export function ProfilePage() {
  const { user, profile, logOut } = useAuth()
  const levelProgress = getLevelProgress(profile?.totalXp ?? 0)
  const streak = getEffectiveStreak(profile?.streak ?? 0, profile?.lastActivityDate ?? null)

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-3xl">
            {getAnimalEmoji(profile?.profileAnimal)}
          </span>
          <div>
            <h1 className="text-2xl font-bold">{profile?.username ?? 'Learner'}</h1>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-3 gap-4">
          <Stat label="Level" value={levelProgress.level} />
          <Stat label="XP" value={profile?.totalXp ?? 0} />
          <Stat label="Streak" value={streak} />
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/course"
            className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Continue course
          </Link>
          <button
            type="button"
            onClick={() => logOut()}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-bold text-slate-900">{value}</dd>
    </div>
  )
}
