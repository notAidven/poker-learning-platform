import { onAuthStateChanged, onIdTokenChanged, type User } from 'firebase/auth'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { auth } from '../lib/firebase'
import { E2E_BYPASS_AUTH, E2E_MOCK_PROFILE } from '../lib/e2eBypass'
import {
  getProviderIds,
  hasPasswordProvider,
  needsPasswordSetup as deriveNeedsPasswordSetup,
} from '../lib/authProviders'
import { type UserProfile } from '../lib/userProfile'
import { useProgressStore } from '../lib/progress/ProgressContext'
import {
  AuthService,
  createFirebaseAuthPort,
  createFirebaseProfilePort,
  shouldReconcileEmailOnToken,
  type AuthIdentity,
  type TokenSnapshot,
} from '../lib/auth'
import { AuthContext } from './useAuth'

/**
 * The deep, framework-free auth module. AuthContext is a THIN adapter over it: this
 * provider only binds React state, subscribes to Firebase's auth listeners, and wires
 * the ProgressStore seam — all the auth orchestration lives in `AuthService`, behind a
 * clean interface that fakes can drive in unit tests. The service is a stateless
 * singleton: its ports read the live `auth` handle / Firestore on each call.
 */
const authService = new AuthService(createFirebaseAuthPort(auth), createFirebaseProfilePort())

/** The framework-free snapshot the service reasons about, taken from a Firebase user. */
function identityOf(user: User | null): AuthIdentity | null {
  if (!user) return null
  return { uid: user.uid, email: user.email, providerIds: getProviderIds(user) }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // E2E bypass seeds auth/profile/loading synchronously here (no listeners run
  // below), so the test harness lands on a signed-in, finished-loading state on
  // the very first render instead of via a setState inside the effect.
  const [user, setUser] = useState<User | null>(
    E2E_BYPASS_AUTH ? ({ uid: 'e2e-user' } as User) : null,
  )
  const [profile, setProfile] = useState<UserProfile | null>(
    E2E_BYPASS_AUTH ? E2E_MOCK_PROFILE : null,
  )
  const [loading, setLoading] = useState(!E2E_BYPASS_AUTH)
  // Linked sign-in providers (e.g. ['google.com', 'password']). Tracked in state
  // (not derived from `user`) because linking a credential mutates the existing
  // User instance in place, so the banner/profile UI need an explicit re-render.
  const [providerIds, setProviderIds] = useState<string[]>([])
  const progressStore = useProgressStore()

  const refreshProfile = useCallback(async () => {
    if (E2E_BYPASS_AUTH) {
      setProfile(E2E_MOCK_PROFILE)
      return
    }
    setProfile(await authService.loadProfile(identityOf(auth.currentUser)))
  }, [])

  useEffect(() => {
    // E2E bypass: user/profile/loading were seeded from the bypass flag in the
    // useState initialisers above, so there are no Firebase listeners to wire up.
    if (E2E_BYPASS_AUTH) return

    // onAuthStateChanged drives the heavy init. It fires on sign-in, sign-out,
    // and full app load (a new uid), but NOT on a silent background token refresh.
    const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)
      setProviderIds(getProviderIds(nextUser))
      // Guard the whole init sequence: if a Firestore read (profile fetch /
      // progress sync) throws or rejects, we must STILL reach setLoading(false),
      // otherwise every route is stuck on the full-screen PageLoader forever
      // (a blank/hung app on load). Failing soft to "no profile" lets the
      // protected routes redirect sanely instead of hanging.
      try {
        if (nextUser) {
          setProfile(await authService.loadProfile(identityOf(nextUser)))
          await progressStore.syncOnAuth(nextUser.uid)
        } else {
          setProfile(null)
          await progressStore.syncOnAuth(null)
        }
      } catch (err) {
        console.error('Auth initialization failed; continuing without profile:', err)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })

    // After `verifyBeforeUpdateEmail`, the auth email claim can flip on a silent
    // background token refresh — onIdTokenChanged fires for that, onAuthStateChanged
    // does NOT. Without this, users/{uid}.email + usernames/{name}.email stay stale
    // until the next full sign-in/reload, locking the account out of username login
    // on other devices in the meantime. We reconcile here on the refresh window.
    //
    // No double-run / race with onAuthStateChanged: the two listeners handle
    // DISJOINT events. `lastToken` (a per-subscription closure var) + the pure
    // `shouldReconcileEmailOnToken` rule let us act ONLY when the SAME uid arrives
    // with a CHANGED email — i.e. a pure token refresh. A uid transition or an
    // unchanged email is left to onAuthStateChanged / is a no-op.
    let lastToken: TokenSnapshot = null
    const unsubscribeToken = onIdTokenChanged(auth, async (nextUser) => {
      const prev = lastToken
      const next: TokenSnapshot = nextUser
        ? { uid: nextUser.uid, email: nextUser.email ? nextUser.email.toLowerCase() : null }
        : null
      lastToken = next

      if (!shouldReconcileEmailOnToken(prev, next)) return

      try {
        setProfile(await authService.loadProfile(identityOf(nextUser)))
      } catch (err) {
        console.warn('Could not reconcile the updated email after a token refresh:', err)
      }
    })

    return () => {
      unsubscribeAuth()
      unsubscribeToken()
    }
  }, [progressStore])

  useEffect(() => {
    function onGamificationUpdated() {
      void refreshProfile()
    }
    window.addEventListener('gamification-updated', onGamificationUpdated)
    return () => window.removeEventListener('gamification-updated', onGamificationUpdated)
  }, [refreshProfile])

  const signUpWithEmail = useCallback(
    (email: string, password: string) => authService.signUpWithEmail(email, password),
    [],
  )

  const signInWithUsername = useCallback(
    (username: string, password: string) => authService.signInWithUsername(username, password),
    [],
  )

  const signInWithGoogle = useCallback(() => authService.signInWithGoogle(), [])

  const resetPassword = useCallback(
    (identifier: string) => authService.resetPassword(identifier),
    [],
  )

  const linkEmailPassword = useCallback(async (password: string) => {
    await authService.linkEmailPassword(password)
    // The link mutated/reloaded the live User in place, so push the new provider
    // list into state to flip `needsPasswordSetup` off (hides the banner + form).
    setUser(auth.currentUser)
    setProviderIds(getProviderIds(auth.currentUser))
  }, [])

  const reauthenticate = useCallback(
    (password?: string) => authService.reauthenticate(password),
    [],
  )

  const changeEmail = useCallback((newEmail: string) => authService.changeEmail(newEmail), [])

  const changePassword = useCallback(
    (newPassword: string) => authService.changePassword(newPassword),
    [],
  )

  const logOut = useCallback(async () => {
    await authService.signOut()
    // Shared-device safety: drop this user's local state immediately so the next
    // account can't inherit or upload it (H1). The auth listener also clears via
    // syncOnAuth(null), but we do it here too so it happens synchronously on the
    // explicit logout path.
    progressStore.resetLocalUserState()
    setProfile(null)
  }, [progressStore])

  const needsPasswordSetup = useMemo(
    () => deriveNeedsPasswordSetup(providerIds),
    [providerIds],
  )

  const hasPassword = useMemo(
    () => hasPasswordProvider(providerIds),
    [providerIds],
  )

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      needsPasswordSetup,
      hasPassword,
      refreshProfile,
      signUpWithEmail,
      signInWithUsername,
      signInWithGoogle,
      resetPassword,
      linkEmailPassword,
      reauthenticate,
      changeEmail,
      changePassword,
      logOut,
    }),
    [
      user,
      profile,
      loading,
      needsPasswordSetup,
      hasPassword,
      refreshProfile,
      signUpWithEmail,
      signInWithUsername,
      signInWithGoogle,
      resetPassword,
      linkEmailPassword,
      reauthenticate,
      changeEmail,
      changePassword,
      logOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
