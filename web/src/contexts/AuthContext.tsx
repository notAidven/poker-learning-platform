import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
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
  getEmailForUsername,
  getUserProfile,
  type UserProfile,
} from '../lib/userProfile'
import { syncProgressOnAuth } from '../lib/progressSync'
import { clearLocalProgress } from '../lib/lessonProgressStore'

type AuthContextValue = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithUsername: (username: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

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
    setProfile(data)
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
      if (nextUser) {
        const data = await getUserProfile(nextUser.uid)
        setProfile(data)
        await syncProgressOnAuth(nextUser.uid)
      } else {
        setProfile(null)
        await syncProgressOnAuth(null)
      }
      setLoading(false)
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

  const logOut = useCallback(async () => {
    await signOut(auth)
    // Shared-device safety: drop this user's local progress immediately so the
    // next account can't inherit or upload it (H1). The auth listener also
    // clears via syncProgressOnAuth(null), but we do it here too so it happens
    // synchronously on the explicit logout path.
    clearLocalProgress()
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile,
      signUpWithEmail,
      signInWithUsername,
      signInWithGoogle,
      logOut,
    }),
    [
      user,
      profile,
      loading,
      refreshProfile,
      signUpWithEmail,
      signInWithUsername,
      signInWithGoogle,
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
