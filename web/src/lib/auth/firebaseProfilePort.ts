/**
 * Production `ProfilePort` adapter: the auth service's view of the Firestore profile
 * is exactly the public functions `userProfile.ts` already exposes. Keeping this as a
 * named adapter (rather than passing the functions ad hoc) means the seam has one
 * obvious production wiring and one obvious place to fake in tests.
 */
import { getEmailForUsername, getUserProfile, syncProfileEmail } from '../userProfile'
import type { ProfilePort } from './ports'

export function createFirebaseProfilePort(): ProfilePort {
  return { getEmailForUsername, getUserProfile, syncProfileEmail }
}
