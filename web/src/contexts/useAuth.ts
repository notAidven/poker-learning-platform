import { createContext, useContext } from 'react'
import { type User } from 'firebase/auth'
import { type UserProfile } from '../lib/userProfile'

export type AuthContextValue = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  /**
   * True for accounts created with Google that have no email/password
   * credential yet, so they should "set a password" to enable email sign-in.
   */
  needsPasswordSetup: boolean
  /** True when an email/password credential is linked (email sign-in works). */
  hasPassword: boolean
  refreshProfile: () => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithUsername: (username: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  /**
   * Send a password-reset email. Accepts EITHER the account email (a reset link
   * is sent straight to it) or a username (resolved to its email via the same
   * public lookup sign-in uses). Intentionally generic: it NEVER reveals whether
   * the account exists (a no-match is a silent success), so the UI can show one
   * "if an account exists, we emailed a link" message either way and login
   * enumeration (L1) stays closed. NOTE: Firebase only delivers a link to
   * email/password accounts — Google-only accounts have no password to reset.
   */
  resetPassword: (identifier: string) => Promise<void>
  /**
   * Link an Email/Password credential to the signed-in account so the user can
   * subsequently sign in with their email + this password (Google stays linked
   * too). Re-authenticates with Google automatically if Firebase requires a
   * fresh login before the link.
   */
  linkEmailPassword: (password: string) => Promise<void>
  /**
   * The single re-authentication flow shared by the email + password changes.
   * Pass the current password for accounts that have one; Google-only accounts
   * re-auth through a Google popup (the `password` arg is ignored). Throws the
   * raw Firebase error so callers can map it via `getAuthErrorMessage(_, 'reauth')`.
   */
  reauthenticate: (password?: string) => Promise<void>
  /**
   * Start an email change. Sends a confirmation link to the NEW address via
   * `verifyBeforeUpdateEmail`; the account email only changes after the user
   * opens that link. May throw `auth/requires-recent-login` — re-auth and retry.
   */
  changeEmail: (newEmail: string) => Promise<void>
  /** Set a new password (caller must `reauthenticate` first). */
  changePassword: (newPassword: string) => Promise<void>
  logOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
