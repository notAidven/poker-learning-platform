/**
 * Lazy accessor for the Firebase Functions SDK instance.
 *
 * Kept deliberately separate from `firebase.ts` (the core config / auth wiring) so
 * the secure OpenAI proxy provider can reach the `aiChat` callable WITHOUT changing
 * any auth/profile/config files. It reuses the already-initialized `app` and never
 * throws — a failure to construct the instance resolves to `null`, letting AI
 * callers fall back to rule-based logic.
 */
import { getFunctions, type Functions } from 'firebase/functions'
import { app } from './firebase'

let functionsInstance: Functions | null = null
let resolved = false

/**
 * Returns the default-region Firebase Functions instance, or `null` if it cannot be
 * constructed. The `aiChat` callable is deployed to the default region
 * (us-central1); the client uses the same default so client and server stay matched.
 */
export function getAiFunctions(): Functions | null {
  if (resolved) return functionsInstance
  resolved = true
  try {
    functionsInstance = getFunctions(app)
  } catch {
    functionsInstance = null
  }
  return functionsInstance
}
