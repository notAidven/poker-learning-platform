import { describe, expect, it } from 'vitest'
import type { User } from 'firebase/auth'
import {
  GOOGLE_PROVIDER_ID,
  PASSWORD_PROVIDER_ID,
  getProviderIds,
  hasGoogleProvider,
  hasPasswordProvider,
  needsPasswordSetup,
} from './authProviders'

/** Minimal stand-in for a Firebase User; only `providerData` matters here. */
function userWith(...providerIds: string[]): User {
  return {
    providerData: providerIds.map((providerId) => ({ providerId })),
  } as unknown as User
}

describe('getProviderIds', () => {
  it('returns [] for a null/undefined user', () => {
    expect(getProviderIds(null)).toEqual([])
    expect(getProviderIds(undefined)).toEqual([])
  })

  it('maps providerData to their provider ids', () => {
    expect(getProviderIds(userWith(GOOGLE_PROVIDER_ID))).toEqual(['google.com'])
    expect(getProviderIds(userWith(GOOGLE_PROVIDER_ID, PASSWORD_PROVIDER_ID))).toEqual([
      'google.com',
      'password',
    ])
  })
})

describe('provider predicates', () => {
  it('detects a linked password credential', () => {
    expect(hasPasswordProvider([GOOGLE_PROVIDER_ID, PASSWORD_PROVIDER_ID])).toBe(true)
    expect(hasPasswordProvider([GOOGLE_PROVIDER_ID])).toBe(false)
  })

  it('detects a linked Google provider', () => {
    expect(hasGoogleProvider([GOOGLE_PROVIDER_ID])).toBe(true)
    expect(hasGoogleProvider([PASSWORD_PROVIDER_ID])).toBe(false)
  })
})

describe('needsPasswordSetup', () => {
  it('is true ONLY for a Google account with no password (the bug case)', () => {
    expect(needsPasswordSetup([GOOGLE_PROVIDER_ID])).toBe(true)
  })

  it('is false once a password credential is also linked', () => {
    expect(needsPasswordSetup([GOOGLE_PROVIDER_ID, PASSWORD_PROVIDER_ID])).toBe(false)
  })

  it('is false for an email/password-only account', () => {
    expect(needsPasswordSetup([PASSWORD_PROVIDER_ID])).toBe(false)
  })

  it('is false when there are no providers (signed out / unknown)', () => {
    expect(needsPasswordSetup([])).toBe(false)
  })
})
