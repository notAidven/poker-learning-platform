import { describe, expect, it } from 'vitest'
import { getAuthErrorMessage } from './authErrors'

/** Shape Firebase Auth errors carry: a `code` plus a raw `message`. */
function fbError(code: string): { code: string; message: string } {
  return { code, message: `Firebase: Error (${code}).` }
}

describe('getAuthErrorMessage: account-linking + reauth cases', () => {
  it('explains an already-linked password', () => {
    expect(getAuthErrorMessage(fbError('auth/provider-already-linked'))).toBe(
      'A password is already set for this account.',
    )
  })

  it('explains a credential already tied to another account', () => {
    expect(getAuthErrorMessage(fbError('auth/credential-already-in-use'))).toBe(
      'That email and password are already linked to another account.',
    )
  })

  it('guides the user when the email belongs to a different sign-in method', () => {
    const message = getAuthErrorMessage(fbError('auth/account-exists-with-different-credential'))
    expect(message).toContain('different sign-in method')
    expect(message).toContain('set a password')
  })

  it('asks for a fresh login on requires-recent-login', () => {
    expect(getAuthErrorMessage(fbError('auth/requires-recent-login'))).toContain('try again')
  })

  it('treats a cancelled popup like a cancelled sign-in', () => {
    expect(getAuthErrorMessage(fbError('auth/cancelled-popup-request'))).toBe(
      'Sign-in was cancelled.',
    )
  })
})

describe('getAuthErrorMessage: reauth context', () => {
  it('says "Incorrect password" for a wrong current password (no username in play)', () => {
    expect(getAuthErrorMessage(fbError('auth/wrong-password'), 'reauth')).toBe(
      'Incorrect password. Please try again.',
    )
    expect(getAuthErrorMessage(fbError('auth/invalid-credential'), 'reauth')).toBe(
      'Incorrect password. Please try again.',
    )
  })

  it('keeps the generic login copy when no reauth context is given', () => {
    expect(getAuthErrorMessage(fbError('auth/wrong-password'))).toBe(
      'Incorrect username or password.',
    )
  })

  it('still maps non-password codes normally inside the reauth context', () => {
    expect(getAuthErrorMessage(fbError('auth/popup-closed-by-user'), 'reauth')).toBe(
      'Sign-in was cancelled.',
    )
    expect(getAuthErrorMessage(fbError('auth/email-already-in-use'), 'reauth')).toBe(
      'An account with this email already exists.',
    )
  })
})

describe('getAuthErrorMessage: never leaks raw Firebase strings', () => {
  it('falls back to a generic message for unmapped coded errors', () => {
    const message = getAuthErrorMessage(fbError('auth/some-future-code'))
    expect(message).toBe('Something went wrong. Please try again.')
    expect(message).not.toContain('Firebase')
  })

  it('passes through our own plain Error messages (no code)', () => {
    expect(getAuthErrorMessage(new Error('You need to be signed in to set a password.'))).toBe(
      'You need to be signed in to set a password.',
    )
  })
})
