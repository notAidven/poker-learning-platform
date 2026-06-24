import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { ChipIcon } from '../icons'

export function Footer({ signedIn }: { signedIn: boolean }) {
  return (
    <footer className="mt-16 border-t border-night-900/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-night-800/70">
            Texas Hold&apos;em you learn by dealing, drawing and betting. Eight hands-on
            lessons with instant feedback.
          </p>
          <p className="mt-3 flex items-center gap-2.5 text-lg leading-none" aria-hidden>
            <span className="text-night-900/55">&spades;</span>
            <span className="text-brand-600">&hearts;</span>
            <span className="text-brand-600">&diams;</span>
            <span className="text-night-900/55">&clubs;</span>
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:items-end">
          {signedIn && (
            <nav className="flex items-center gap-5 text-sm font-medium text-night-800/70">
              <Link to="/" className="transition hover:text-brand-700">
                Home
              </Link>
              <Link to="/course" className="transition hover:text-brand-700">
                Course path
              </Link>
              <Link to="/profile" className="transition hover:text-brand-700">
                Profile
              </Link>
            </nav>
          )}
          <p className="inline-flex items-center gap-1.5 rounded-full bg-night-900/[0.05] px-3 py-1 text-xs font-semibold text-night-800/70 ring-1 ring-inset ring-night-900/10">
            <ChipIcon className="h-3.5 w-3.5 text-gold-600" /> Play money · no real wagering
          </p>
        </div>
      </div>
    </footer>
  )
}
