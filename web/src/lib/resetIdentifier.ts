/**
 * What a password-reset request should do with the raw text the user typed.
 * Login is username-based, but people instinctively type their *email* to reset
 * a password — and the reset link can only ever be delivered to an email — so the
 * reset form accepts either. `planPasswordReset` decides which, without doing any
 * I/O (so it stays trivially testable); `AuthContext.resetPassword` executes it.
 */
export type ResetPlan =
  | { kind: 'empty' }
  | { kind: 'email'; email: string }
  | { kind: 'username'; username: string }

/**
 * A reset identifier is an email iff it contains "@". Usernames are validated to
 * `[a-zA-Z0-9_]{3,20}` (see `validateUsername`), so they can never contain "@" —
 * which makes the "@" test unambiguous.
 */
export function looksLikeEmail(value: string): boolean {
  return value.includes('@')
}

/**
 * Decide how to handle the reset input:
 * - blank → `empty` (caller should prompt for input, send nothing)
 * - contains "@" → `email` (send the reset link straight to it; trimmed + lowercased
 *   to match how Firebase normalizes and how we store emails)
 * - otherwise → `username` (resolve to an email via the usernames index first;
 *   case is preserved because `getEmailForUsername` lower-cases the lookup key itself)
 */
export function planPasswordReset(rawInput: string): ResetPlan {
  const trimmed = rawInput.trim()
  if (!trimmed) return { kind: 'empty' }
  if (looksLikeEmail(trimmed)) return { kind: 'email', email: trimmed.toLowerCase() }
  return { kind: 'username', username: trimmed }
}
