import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../contexts/useAuth'
import { DUR, EASE } from '../lib/motion'
import { buttonVariants } from './ui/buttonVariants'
import { usePrefersReducedMotion } from './lesson/interactions/usePrefersReducedMotion'
import { LockIcon } from './icons'

/**
 * Routes where the nudge is redundant or out of place: the profile (where they
 * set the password) and the auth/profile-setup flows.
 */
const HIDDEN_ON = new Set(['/profile', '/setup-profile', '/login', '/signup'])

/**
 * Top-of-screen banner nudging Google-authenticated users who have not set a
 * password yet to add one in their profile, so they can also sign in with
 * email + password. Disappears automatically once a password is linked
 * (`needsPasswordSetup` flips false).
 */
export function SetPasswordBanner() {
  const { user, profile, needsPasswordSetup } = useAuth()
  const location = useLocation()
  const reduced = usePrefersReducedMotion()

  const signedIn = Boolean(user && profile?.profileComplete)
  if (!signedIn || !needsPasswordSetup || HIDDEN_ON.has(location.pathname)) {
    return null
  }

  return (
    <motion.div
      className="overflow-hidden border-b border-gold-300 bg-gold-200/60"
      initial={reduced ? false : { height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      transition={{ duration: reduced ? 0 : DUR.base, ease: EASE.deal }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-300/80 text-night-900">
          <LockIcon className="h-4 w-4" />
        </span>
        <p className="min-w-0 flex-1 text-sm text-night-800">
          <span className="font-semibold">Set a password</span> so you can sign in with your
          email too, not just Google.
        </p>
        <Link
          to="/profile"
          className={buttonVariants({ variant: 'primary', size: 'sm', className: 'shrink-0' })}
        >
          Set password
        </Link>
      </div>
    </motion.div>
  )
}
