export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : ''

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
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
      return 'Sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Allow pop-ups and try again.'
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
