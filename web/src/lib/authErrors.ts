/**
 * Where the error happened, so a shared code can read more naturally per flow.
 * `'reauth'` is used when confirming the CURRENT password (no username in play),
 * so a wrong entry should say "Incorrect password." not "username or password".
 */
export type AuthErrorContext = 'reauth'

export function getAuthErrorMessage(
  error: unknown,
  context?: AuthErrorContext,
): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : ''

  // Re-authentication asks only for the current password, so the generic
  // login-style "username or password" copy would be confusing here.
  if (
    context === 'reauth' &&
    (code === 'auth/wrong-password' || code === 'auth/invalid-credential')
  ) {
    return 'Incorrect password. Please try again.'
  }

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. If you used Google to sign up, choose "Continue with Google" to sign in. You can add a password later from your profile.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect username or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Allow pop-ups and try again.'
    // --- Linking an email/password credential to an existing account ---------
    case 'auth/provider-already-linked':
      return 'A password is already set for this account.'
    case 'auth/credential-already-in-use':
      return 'That email and password are already linked to another account.'
    case 'auth/account-exists-with-different-credential':
      return 'This email is already registered with a different sign-in method. Use "Continue with Google" to sign in, then set a password from your profile.'
    case 'auth/requires-recent-login':
      return 'Please confirm it\u2019s you and try again.'
    default:
      // A coded error we don't explicitly map (an unexpected Firebase Auth or
      // Firestore code) must NOT surface its raw "Firebase: Error (...)" string:
      // it's noisy and can leak internals. Only pass through messages from our
      // OWN plain Errors (which carry no `code`) — e.g. the deliberately generic
      // "Incorrect username or password." thrown by signInWithUsername.
      if (!code && error instanceof Error && error.message) return error.message
      return 'Something went wrong. Please try again.'
  }
}
