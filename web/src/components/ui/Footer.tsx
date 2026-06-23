import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { SparkleIcon } from '../icons'

export function Footer({ signedIn }: { signedIn: boolean }) {
  return (
    <footer className="mt-16 border-t border-slate-200/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Probability you learn by rolling, flipping, and counting — six interactive
            lessons with instant feedback.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:items-end">
          {signedIn && (
            <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
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
          <p className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            <SparkleIcon className="h-3.5 w-3.5 text-brand-500" /> No AI — just practice
          </p>
        </div>
      </div>
    </footer>
  )
}
