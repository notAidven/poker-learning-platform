import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  verifyBeforeUpdateEmail,
  type User,
} from 'firebase/auth'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { auth } from '../lib/firebase'
import { E2E_BYPASS_AUTH, E2E_MOCK_PROFILE } from '../lib/e2eBypass'
import {
  getProviderIds,
  hasPasswordProvider,
  hasGoogleProvider,
  needsPasswordSetup as deriveNeedsPasswordSetup,
} from '../lib/authProviders'
import {
  getEmailForUsername,
  getUserProfile,
  syncProfileEmail,
  type UserProfile,
} from '../lib/userProfile'
import { syncProgressOnAuth } from '../lib/progressSync'
import { clearLocalProgress } from '../lib/lessonProgressStore'

type AuthContextValue = {
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

const AuthContext = createContext<AuthContextValue | null>(null)

const googleProvider = new GoogleAuthProvider()

/** Firebase asks for a fresh sign-in before sensitive ops like linking. */
function isRecentLoginError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'auth/requires-recent-login'
  )
}

/**
 * After `verifyBeforeUpdateEmail`, the auth email flips only once the user opens
 * the confirmation link (usually surfaced on the next load with a fresh token).
 * When we notice the live auth email no longer matches the stored profile email,
 * reconcile Firestore so the profile + username-login lookup track the new
 * address. Best-effort: a failure just leaves the prior profile and never throws.
 */
async function reconcileProfileEmail(
  user: User,
  profile: UserProfile | null,
): Promise<UserProfile | null> {
  if (
    !profile ||
    !user.email ||
    !profile.username ||
    profile.email === user.email.toLowerCase()
  ) {
    return profile
  }
  try {
    await syncProfileEmail(user.uid, profile.username, user.email)
    return await getUserProfile(user.uid)
  } catch (err) {
    console.warn('Could not sync the updated email into the profile:', err)
    return profile
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  // Linked sign-in providers (e.g. ['google.com', 'password']). Tracked in state
  // (not derived from `user`) because `linkWithCredential` mutates the existing
  // User instance in place, so the banner/profile UI need an explicit re-render.
  const [providerIds, setProviderIds] = useState<string[]>([])

  const refreshProfile = useCallback(async () => {
    if (E2E_BYPASS_AUTH) {
      setProfile(E2E_MOCK_PROFILE)
      return
    }
    const current = auth.currentUser
    if (!current) {
      setProfile(null)
      return
    }
    const data = await getUserProfile(current.uid)
    setProfile(await reconcileProfileEmail(current, data))
  }, [])

  useEffect(() => {
    if (E2E_BYPASS_AUTH) {
      setUser({ uid: 'e2e-user' } as User)
      setProfile(E2E_MOCK_PROFILE)
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)
      setProviderIds(getProviderIds(nextUser))
      // Guard the whole init sequence: if a Firestore read (profile fetch /
      // progress sync) throws or rejects, we must STILL reach setLoading(false),
      // otherwise every route is stuck on the full-screen PageLoader forever
      // (a blank/hung app on load). Failing soft to "no profile" lets the
      // protected routes redirect sanely instead of hanging.
      try {
        if (nextUser) {
          const data = await getUserProfile(nextUser.uid)
          setProfile(await reconcileProfileEmail(nextUser, data))
          await syncProgressOnAuth(nextUser.uid)
        } else {
          setProfile(null)
          await syncProgressOnAuth(null)
        }
      } catch (err) {
        console.error('Auth initialization failed; continuing without profile:', err)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    function onGamificationUpdated() {
      void refreshProfile()
    }
    window.addEventListener('gamification-updated', onGamificationUpdated)
    return () => window.removeEventListener('gamification-updated', onGamificationUpdated)
  }, [refreshProfile])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email.trim(), password)
  }, [])

  const signInWithUsername = useCallback(async (username: string, password: string) => {
    const email = await getEmailForUsername(username)
    if (!email) {
      // Same generic message as a wrong password so we never reveal whether the
      // username exists (L1 — login enumeration).
      throw new Error('Incorrect username or password.')
    }
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider)
  }, [])

  const linkEmailPassword = useCallback(async (password: string) => {
    const current = auth.currentUser
    if (!current) {
      throw new Error('You need to be signed in to set a password.')
    }
    const email = current.email
    if (!email) {
      throw new Error('Your account has no email address to attach a password to.')
    }

    // The email/password credential always uses the account's existing email so
    // it resolves to the SAME account on a later `signInWithEmailAndPassword`.
    // Build it fresh per attempt (a credential can only be consumed once).
    const makeCredential = () => EmailAuthProvider.credential(email, password)

    try {
      await linkWithCredential(current, makeCredential())
    } catch (err) {
      // Linking is sensitive: if the last sign-in is too old, Firebase demands a
      // fresh login. Re-auth with Google (their existing provider) and retry once
      // so the user never hits a dead end.
      if (isRecentLoginError(err)) {
        await reauthenticateWithPopup(current, googleProvider)
        await linkWithCredential(current, makeCredential())
      } else {
        throw err
      }
    }

    // `linkWithCredential` updated the same User instance in place, so refresh it
    // from the server and push the new provider list into state to flip
    // `needsPasswordSetup` off (hides the banner + the set-password form).
    try {
      await current.reload()
    } catch {
      // A failed reload is non-fatal: providerData is already updated locally.
    }
    setUser(auth.currentUser)
    setProviderIds(getProviderIds(auth.currentUser))
  }, [])

  const reauthenticate = useCallback(async (password?: string) => {
    const current = auth.currentUser
    if (!current) {
      throw new Error('You need to be signed in to do that.')
    }
    const ids = getProviderIds(current)
    // Prefer the password path when the account has one (the user typed it).
    if (hasPasswordProvider(ids)) {
      if (!current.email) {
        throw new Error('Your account has no email address.')
      }
      if (!password) {
        throw new Error('Enter your current password to continue.')
      }
      const credential = EmailAuthProvider.credential(current.email, password)
      await reauthenticateWithCredential(current, credential)
    } else if (hasGoogleProvider(ids)) {
      await reauthenticateWithPopup(current, googleProvider)
    } else {
      throw new Error('Re-authentication is not available for this account.')
    }
  }, [])

  const changeEmail = useCallback(async (newEmail: string) => {
    const current = auth.currentUser
    if (!current) {
      throw new Error('You need to be signed in to change your email.')
    }
    // Firebase normalizes the address; the change only applies once the user
    // opens the confirmation link sent to the NEW address.
    await verifyBeforeUpdateEmail(current, newEmail.trim())
  }, [])

  const changePassword = useCallback(async (newPassword: string) => {
    const current = auth.currentUser
    if (!current) {
      throw new Error('You need to be signed in to change your password.')
    }
    await updatePassword(current, newPassword)
  }, [])

  const logOut = useCallback(async () => {
    await signOut(auth)
    // Shared-device safety: drop this user's local progress immediately so the
    // next account can't inherit or upload it (H1). The auth listener also
    // clears via syncProgressOnAuth(null), but we do it here too so it happens
    // synchronously on the explicit logout path.
    clearLocalProgress()
    setProfile(null)
  }, [])

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
      linkEmailPassword,
      reauthenticate,
      changeEmail,
      changePassword,
      logOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
