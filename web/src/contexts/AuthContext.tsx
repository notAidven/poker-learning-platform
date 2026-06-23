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
import {
  getEmailForUsername,
  getUserProfile,
  type UserProfile,
} from '../lib/userProfile'
import { syncProgressOnAuth } from '../lib/progressSync'

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
    const current = auth.currentUser
    if (!current) {
      setProfile(null)
      return
    }
    const data = await getUserProfile(current.uid)
    setProfile(data)
  }, [])

  useEffect(() => {
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
      throw new Error('No account found with that username.')
    }
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider)
  }, [])

  const logOut = useCallback(async () => {
    await signOut(auth)
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
