/**
 * The framework-free auth module: a deep service that owns ALL the auth
 * orchestration that used to be welded into `AuthContext.tsx`. Its only dependencies
 * are two ports (`AuthPort` over Firebase Auth, `ProfilePort` over the Firestore
 * profile), so the whole security-sensitive surface — enumeration-safe reset,
 * reauth-retry linking, re-auth, email/password change, and verify-before-update
 * email reconciliation — is exercisable through this interface with fakes, no React
 * harness and no live Firebase. `AuthContext` is a thin adapter that binds it to state.
 */
import { planPasswordReset } from '../resetIdentifier'
import { hasGoogleProvider, hasPasswordProvider } from '../authProviders'
import type { UserProfile } from '../userProfile'
import type { AuthIdentity, AuthPort, ProfilePort } from './ports'

/** Firebase asks for a fresh sign-in before sensitive ops like linking a credential. */
function isRecentLoginError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'auth/requires-recent-login'
  )
}

/**
 * A reset-email failure that would CONFIRM the account does not exist. Swallowed by
 * `resetPassword` so the response stays generic (enumeration safety, L1); any other
 * failure (e.g. `auth/too-many-requests`, network) is surfaced instead.
 */
function isUserNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'auth/user-not-found'
  )
}

export class AuthService {
  private readonly auth: AuthPort
  private readonly profiles: ProfilePort

  constructor(auth: AuthPort, profiles: ProfilePort) {
    this.auth = auth
    this.profiles = profiles
  }

  /** Create a brand-new email/password account (the email is trimmed, as at signup). */
  async signUpWithEmail(email: string, password: string): Promise<void> {
    await this.auth.createUserWithEmailAndPassword(email.trim(), password)
  }

  /**
   * Sign in with a USERNAME: resolve it to its account email via the public index,
   * then sign in with email + password. A username with no match throws the SAME
   * generic error as a wrong password, so the response never reveals whether the
   * username exists (L1 — login enumeration).
   */
  async signInWithUsername(username: string, password: string): Promise<void> {
    const email = await this.profiles.getEmailForUsername(username)
    if (!email) {
      throw new Error('Incorrect username or password.')
    }
    await this.auth.signInWithEmailAndPassword(email, password)
  }

  async signInWithGoogle(): Promise<void> {
    await this.auth.signInWithGoogle()
  }

  /**
   * Send a password-reset email for either an account email or a username.
   * Enumeration-safe (L1): a username with no match is a SILENT success (we send
   * nothing and return), and a Firebase `user-not-found` is swallowed — so the caller
   * can always show the same generic "if an account exists, we emailed a link"
   * confirmation. Other failures (rate limiting, network) are surfaced.
   */
  async resetPassword(identifier: string): Promise<void> {
    const plan = planPasswordReset(identifier)
    if (plan.kind === 'empty') {
      throw new Error('Enter your email or username to reset your password.')
    }

    let email: string
    if (plan.kind === 'email') {
      email = plan.email
    } else {
      const resolved = await this.profiles.getEmailForUsername(plan.username)
      if (!resolved) return
      email = resolved
    }

    try {
      await this.auth.sendPasswordResetEmail(email)
    } catch (err) {
      if (isUserNotFoundError(err)) return
      throw err
    }
  }

  /**
   * Link an email/password credential to the signed-in account so the user can later
   * sign in with their email + this password. The credential always uses the account's
   * existing email, so it resolves to the SAME account on a later sign-in. Linking is
   * sensitive: if the last sign-in is too old, Firebase demands a fresh login, so we
   * re-auth with Google (their existing provider) and retry once. Finally we reload the
   * user so the caller can observe the new provider list.
   */
  async linkEmailPassword(password: string): Promise<void> {
    const current = this.auth.getCurrentUser()
    if (!current) {
      throw new Error('You need to be signed in to set a password.')
    }
    const email = current.email
    if (!email) {
      throw new Error('Your account has no email address to attach a password to.')
    }

    try {
      await this.auth.linkPassword(email, password)
    } catch (err) {
      if (isRecentLoginError(err)) {
        await this.auth.reauthenticateWithGoogle()
        await this.auth.linkPassword(email, password)
      } else {
        throw err
      }
    }

    // Refresh the local user so its `providerData` reflects the new credential. A
    // failed reload is non-fatal: the link already succeeded server-side.
    try {
      await this.auth.reloadCurrentUser()
    } catch {
      // ignore — providerData is updated locally even if the reload fails.
    }
  }

  /**
   * The single re-authentication flow shared by the email + password changes. Accounts
   * with a password re-auth with it (the user types it); Google-only accounts re-auth
   * through a Google popup (the `password` arg is ignored). Throws the raw error so
   * callers can map it via `getAuthErrorMessage(_, 'reauth')`.
   */
  async reauthenticate(password?: string): Promise<void> {
    const current = this.auth.getCurrentUser()
    if (!current) {
      throw new Error('You need to be signed in to do that.')
    }
    const ids = current.providerIds
    if (hasPasswordProvider(ids)) {
      if (!current.email) {
        throw new Error('Your account has no email address.')
      }
      if (!password) {
        throw new Error('Enter your current password to continue.')
      }
      await this.auth.reauthenticateWithPassword(current.email, password)
    } else if (hasGoogleProvider(ids)) {
      await this.auth.reauthenticateWithGoogle()
    } else {
      throw new Error('Re-authentication is not available for this account.')
    }
  }

  /**
   * Start an email change. The account email only changes after the user opens the
   * confirmation link sent to the NEW address. May throw `auth/requires-recent-login`
   * — the caller re-authenticates and retries.
   */
  async changeEmail(newEmail: string): Promise<void> {
    if (!this.auth.getCurrentUser()) {
      throw new Error('You need to be signed in to change your email.')
    }
    await this.auth.verifyBeforeUpdateEmail(newEmail.trim())
  }

  /** Set a new password (the caller must `reauthenticate` first). */
  async changePassword(newPassword: string): Promise<void> {
    if (!this.auth.getCurrentUser()) {
      throw new Error('You need to be signed in to change your password.')
    }
    await this.auth.updatePassword(newPassword)
  }

  async signOut(): Promise<void> {
    await this.auth.signOut()
  }

  /**
   * Read the current session's profile, reconciling a lagging email along the way.
   * Used by the initial auth load, the token-refresh email reconcile, and the manual
   * `refreshProfile`. A null identity (signed out) resolves to a null profile.
   */
  async loadProfile(identity: AuthIdentity | null): Promise<UserProfile | null> {
    if (!identity) return null
    const profile = await this.profiles.getUserProfile(identity.uid)
    return this.reconcileProfileEmail(identity, profile)
  }

  /**
   * When the live auth email no longer matches the stored profile email, write the new
   * address back to `users/{uid}` + the `usernames` lookup so username + password
   * sign-in keeps working, and return the refreshed profile. Best-effort: a failure
   * leaves the prior profile and never throws.
   */
  private async reconcileProfileEmail(
    identity: AuthIdentity,
    profile: UserProfile | null,
  ): Promise<UserProfile | null> {
    const email = identity.email
    if (!profile || !email || !profile.username || profile.email === email.toLowerCase()) {
      return profile
    }
    try {
      await this.profiles.syncProfileEmail(identity.uid, profile.username, email)
      return await this.profiles.getUserProfile(identity.uid)
    } catch (err) {
      console.warn('Could not sync the updated email into the profile:', err)
      return profile
    }
  }
}
