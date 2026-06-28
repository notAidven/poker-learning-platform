/**
 * Pure decision logic for the verify-before-update email reconciliation, lifted out
 * of the React provider so it can be asserted without a harness.
 *
 * After `verifyBeforeUpdateEmail`, the live auth email claim flips only once the user
 * opens the confirmation link — usually surfaced on a SILENT background token refresh,
 * which fires `onIdTokenChanged` but NOT `onAuthStateChanged`. The two listeners must
 * therefore handle DISJOINT events, and the rule that keeps them disjoint is this one.
 */
import type { AuthIdentity } from './ports'
import type { UserProfile } from '../userProfile'

/**
 * A minimal id-token snapshot: which account, and the email its token currently
 * asserts (lowercased to match how Firebase + the stored profile normalize it).
 */
export type TokenSnapshot = { uid: string; email: string | null } | null

/**
 * Should an `onIdTokenChanged` event reconcile the profile email? Only when the SAME
 * uid arrives with a CHANGED email — i.e. a pure token refresh after the user opened
 * the verify link. Everything else is left to `onAuthStateChanged`:
 *  - no user / no email -> nothing to reconcile
 *  - a uid transition (sign-in/out/first load) -> `onAuthStateChanged` owns it
 *  - an unchanged email (an ordinary hourly refresh) -> a no-op (no extra read)
 */
export function shouldReconcileEmailOnToken(prev: TokenSnapshot, next: TokenSnapshot): boolean {
  if (!next || !next.email) return false
  if (!prev || prev.uid !== next.uid) return false
  if (prev.email === next.email) return false
  return true
}

/**
 * Does the stored profile's email lag the proven auth email? True only when there is
 * a profile with a username and the live auth email differs (case-insensitively) from
 * the one on record — the precondition for writing the new address back to Firestore.
 */
export function needsEmailReconcile(
  identity: AuthIdentity,
  profile: UserProfile | null,
): boolean {
  if (!profile || !identity.email || !profile.username) return false
  return profile.email !== identity.email.toLowerCase()
}
