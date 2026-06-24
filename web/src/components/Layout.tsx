import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getEffectiveStreak } from '../lib/gamification'
import { ErrorBoundary } from './ErrorBoundary'
import { AnimalAvatar } from './AnimalAvatar'
import { buttonVariants } from './ui/Button'
import { Footer } from './ui/Footer'
import { Logo } from './ui/Logo'
import { cx } from './ui/cx'
import { FlameIcon } from './icons'

const navItems = [
  { to: '/', label: 'Home', match: (p: string) => p === '/' },
  {
    to: '/course',
    label: 'Course',
    match: (p: string) => p.startsWith('/course') || p.startsWith('/lesson'),
  },
]

export function Layout() {
  const location = useLocation()
  const { user, profile, loading } = useAuth()
  const signedIn = Boolean(user && profile?.profileComplete)
  const streak = getEffectiveStreak(profile?.streak ?? 0, profile?.lastActivityDate ?? null)

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <header className="sticky top-0 z-30 border-b border-night-900/10 bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex min-w-0 items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
          >
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {signedIn &&
              navItems.map((item) => {
                const active = item.match(location.pathname)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'rounded-lg px-3.5 py-2 text-sm font-semibold transition',
                      active
                        ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200/70'
                        : 'text-night-700/70 hover:bg-night-900/5 hover:text-night-900',
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
          </nav>

          {!loading &&
            (signedIn ? (
              <div className="flex items-center gap-2">
                {streak > 0 && (
                  <span
                    className="hidden items-center gap-1.5 rounded-full bg-gold-200/70 px-3 py-1.5 text-sm font-bold text-gold-600 ring-1 ring-inset ring-gold-300 sm:inline-flex"
                    title={`${streak}-day streak`}
                  >
                    <FlameIcon className="h-4 w-4" />
                    <span className="tnum">{streak}</span>
                  </span>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-full border border-night-900/12 bg-white py-1 pl-1 pr-3 text-sm font-semibold text-night-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
                >
                  <AnimalAvatar id={profile?.profileAnimal} size="sm" />
                  <span className="hidden max-w-[10rem] truncate sm:inline">
                    {profile?.username}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block">
                  <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                    Sign in
                  </Link>
                </div>
                <Link
                  to="/signup"
                  className={buttonVariants({ variant: 'primary', size: 'sm' })}
                >
                  Get started
                </Link>
              </div>
            ))}
        </div>

        {signedIn && (
          <nav className="px-4 pb-3 sm:hidden">
            <div className="flex gap-1 rounded-xl border border-night-900/10 bg-white/70 p-1 shadow-sm">
              {navItems.map((item) => {
                const active = item.match(location.pathname)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold transition',
                      active ? 'bg-brand-600 text-white shadow-sm' : 'text-night-700/70',
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        {/* Page-level guard: a crash in one route shows a recoverable fallback
            (not a blank screen) while keeping the header/nav, and auto-resets
            when the path changes. */}
        <ErrorBoundary resetKey={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>

      <Footer signedIn={signedIn} />
    </div>
  )
}
