/**
 * The two seams the framework-free `AuthService` orchestrates over.
 *
 * `AuthService` owns the deep auth logic (username->email sign-in, enumeration-safe
 * reset, reauth-retry linking, re-auth, email/password change, verify-before-update
 * email reconciliation). It NEVER imports `firebase/*` or React directly — it only
 * ever touches these two ports, so the service interface is the test surface: a
 * fake `AuthPort` + `ProfilePort` stand in for Firebase Auth + Firestore in unit
 * tests, exactly as `InMemoryProgressBackend` stands in for Firestore for progress.
 *
 * `FirebaseAuthPort` / `FirebaseProfilePort` are the production adapters; `AuthContext`
 * is the thin React adapter that binds the service to state.
 */
import type { UserProfile } from '../userProfile'

/**
 * A framework-free snapshot of the signed-in user — the slice of Firebase's `User`
 * the auth logic actually reasons about. Mirrors `auth.currentUser` at call time.
 */
export type AuthIdentity = {
  readonly uid: string
  /** The account email (Firebase normalizes this to lowercase), or null. */
  readonly email: string | null
  /** Linked sign-in providers, e.g. `['google.com', 'password']`. */
  readonly providerIds: readonly string[]
}

/**
 * The Firebase Auth capabilities the service needs, expressed as small primitives
 * so the deep flows (the reauth-retry on link, enumeration-safe reset) compose them
 * in the SERVICE rather than hiding inside the adapter. User-scoped operations act
 * on the current user; the service guards "is anyone signed in?" before calling them.
 */
export interface AuthPort {
  /** Snapshot of the signed-in user, or null. */
  getCurrentUser(): AuthIdentity | null

  createUserWithEmailAndPassword(email: string, password: string): Promise<void>
  signInWithEmailAndPassword(email: string, password: string): Promise<void>
  signInWithGoogle(): Promise<void>
  signOut(): Promise<void>

  sendPasswordResetEmail(email: string): Promise<void>

  /**
   * Link an email/password credential to the current user (a SINGLE attempt). May
   * reject with `auth/requires-recent-login`; the service handles the reauth-retry.
   */
  linkPassword(email: string, password: string): Promise<void>
  /** Re-authenticate the current user with their password. */
  reauthenticateWithPassword(email: string, password: string): Promise<void>
  /** Re-authenticate the current user through the Google popup. */
  reauthenticateWithGoogle(): Promise<void>
  /** Reload the current user from the server (refreshes `providerData`). */
  reloadCurrentUser(): Promise<void>

  /** Start an email change: a confirmation link is sent to the NEW address. */
  verifyBeforeUpdateEmail(newEmail: string): Promise<void>
  /** Set a new password on the current user. */
  updatePassword(newPassword: string): Promise<void>
}

/**
 * The Firestore profile/username-index capabilities the service needs. These are the
 * exact public functions `userProfile.ts` already exposes, named here so the service
 * depends on the seam rather than on Firestore.
 */
export interface ProfilePort {
  /** Resolve a username to its account email via the `usernames` index, or null. */
  getEmailForUsername(username: string): Promise<string | null>
  /** Read the `users/{uid}` profile doc, or null when it does not exist. */
  getUserProfile(uid: string): Promise<UserProfile | null>
  /** Reconcile the stored email after a Firebase Auth email change took effect. */
  syncProfileEmail(uid: string, username: string | null, authEmail: string): Promise<void>
}
