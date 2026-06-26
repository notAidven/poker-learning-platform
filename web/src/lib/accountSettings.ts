/**
 * Pure, Firebase-free validators for the Account settings flows. Kept separate
 * from `userProfile.ts` (which touches Firestore) so they can be unit-tested in
 * isolation, and so the username/password rules stay IDENTICAL to signup.
 */

/** Mirrors signup: Firebase rejects shorter, and SetPasswordCard uses the same. */
export const MIN_PASSWORD_LENGTH = 6

/** Lowercase + trim, matching how signup normalizes the account email. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

// Deliberately permissive shape check (real verification happens via the link
// Firebase emails to the address). Just blocks obviously malformed input.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate a requested new email. Returns an error string, or null when valid.
 * Rejects a no-op change to the user's current address (case-insensitive).
 */
export function validateEmailChange(
  currentEmail: string | null | undefined,
  nextEmail: string,
): string | null {
  const trimmed = nextEmail.trim()
  if (!trimmed) return 'Enter your new email address.'
  if (!EMAIL_PATTERN.test(trimmed)) return 'Please enter a valid email address.'
  if (currentEmail && normalizeEmail(trimmed) === normalizeEmail(currentEmail)) {
    return 'That is already your email address.'
  }
  return null
}

/**
 * Validate a new password + its confirmation, matching signup's rules exactly
 * (minimum length + the two entries must match). Returns an error string, or
 * null when valid.
 */
export function validateNewPassword(
  password: string,
  confirmPassword: string,
): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.'
  }
  return null
}
