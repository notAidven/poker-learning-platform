/**
 * Production `AuthPort` adapter: binds the framework-free auth service to the real
 * Firebase Auth handle. This is the ONLY place in the auth module that imports
 * `firebase/auth`; every flow stays in `AuthService`, so this file is pure wiring.
 */
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword as fbCreateUser,
  linkWithCredential as fbLink,
  reauthenticateWithCredential as fbReauthCredential,
  reauthenticateWithPopup as fbReauthPopup,
  sendPasswordResetEmail as fbSendReset,
  signInWithEmailAndPassword as fbSignIn,
  signInWithPopup as fbSignInPopup,
  signOut as fbSignOut,
  updatePassword as fbUpdatePassword,
  verifyBeforeUpdateEmail as fbVerifyBeforeUpdateEmail,
  type Auth,
} from 'firebase/auth'
import { getProviderIds } from '../authProviders'
import type { AuthPort } from './ports'

export function createFirebaseAuthPort(
  auth: Auth,
  googleProvider: GoogleAuthProvider = new GoogleAuthProvider(),
): AuthPort {
  /**
   * User-scoped Firebase ops need the live `User` instance (not just our snapshot).
   * `AuthService` always guards "is anyone signed in?" before invoking these, so a
   * missing user here is a defensive invariant rather than a user-facing path.
   */
  function requireCurrentUser() {
    const current = auth.currentUser
    if (!current) {
      throw new Error('No authenticated user.')
    }
    return current
  }

  return {
    getCurrentUser() {
      const user = auth.currentUser
      if (!user) return null
      return { uid: user.uid, email: user.email, providerIds: getProviderIds(user) }
    },
    async createUserWithEmailAndPassword(email, password) {
      await fbCreateUser(auth, email, password)
    },
    async signInWithEmailAndPassword(email, password) {
      await fbSignIn(auth, email, password)
    },
    async signInWithGoogle() {
      await fbSignInPopup(auth, googleProvider)
    },
    async signOut() {
      await fbSignOut(auth)
    },
    async sendPasswordResetEmail(email) {
      await fbSendReset(auth, email)
    },
    async linkPassword(email, password) {
      // Build the credential fresh per attempt — a credential can only be consumed once.
      await fbLink(requireCurrentUser(), EmailAuthProvider.credential(email, password))
    },
    async reauthenticateWithPassword(email, password) {
      await fbReauthCredential(requireCurrentUser(), EmailAuthProvider.credential(email, password))
    },
    async reauthenticateWithGoogle() {
      await fbReauthPopup(requireCurrentUser(), googleProvider)
    },
    async reloadCurrentUser() {
      await requireCurrentUser().reload()
    },
    async verifyBeforeUpdateEmail(newEmail) {
      await fbVerifyBeforeUpdateEmail(requireCurrentUser(), newEmail)
    },
    async updatePassword(newPassword) {
      await fbUpdatePassword(requireCurrentUser(), newPassword)
    },
  }
}
