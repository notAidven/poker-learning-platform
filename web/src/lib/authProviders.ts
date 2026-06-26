import type { User } from 'firebase/auth'

/**
 * Firebase Auth provider IDs the app cares about.
 *
 * A Firebase account can have several linked sign-in providers. `user.providerData`
 * lists one entry per provider, each carrying a `providerId`. Google sign-in adds
 * `'google.com'`; an email/password credential adds `'password'`.
 */
export const PASSWORD_PROVIDER_ID = 'password'
export const GOOGLE_PROVIDER_ID = 'google.com'

/** The provider IDs linked to a user, e.g. `['google.com', 'password']`. */
export function getProviderIds(user: User | null | undefined): string[] {
  if (!user) return []
  return user.providerData.map((info) => info.providerId)
}

/** True when an email/password credential is linked (email sign-in will work). */
export function hasPasswordProvider(providerIds: readonly string[]): boolean {
  return providerIds.includes(PASSWORD_PROVIDER_ID)
}

/** True when Google is a linked sign-in provider for the account. */
export function hasGoogleProvider(providerIds: readonly string[]): boolean {
  return providerIds.includes(GOOGLE_PROVIDER_ID)
}

/**
 * True when the account can sign in with Google but has no email/password
 * credential yet. These users currently CANNOT use the email + password form
 * (there is no password on the account), so we nudge them to "set a password"
 * which links an Email/Password credential to the same account.
 */
export function needsPasswordSetup(providerIds: readonly string[]): boolean {
  return hasGoogleProvider(providerIds) && !hasPasswordProvider(providerIds)
}
