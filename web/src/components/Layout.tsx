import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAnimalEmoji } from '../data/animals'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/course', label: 'Course' },
]

export function Layout() {
  const location = useLocation()
  const { user, profile, loading } = useAuth()
  const signedIn = Boolean(user && profile?.profileComplete)

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
              π
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold sm:text-base">
                Brilliant Alpha
              </p>
              <p className="truncate text-xs text-slate-500">
                Probability & Random Variables
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {signedIn &&
              navItems.map((item) => {
                const active = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
          </nav>

          {!loading && (
            signedIn ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <span className="text-lg" aria-hidden>
                  {getAnimalEmoji(profile?.profileAnimal)}
                </span>
                <span className="hidden sm:inline">{profile?.username}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 sm:px-4"
              >
                Sign in
              </Link>
            )
          )}
        </div>

        {signedIn && (
          <nav className="flex gap-1 border-t border-slate-100 px-4 py-2 sm:hidden">
            {navItems.map((item) => {
              const active = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium ${
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
