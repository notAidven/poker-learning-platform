import { describe, expect, it } from 'vitest'
import { needsEmailReconcile, shouldReconcileEmailOnToken } from './emailReconcile'
import type { AuthIdentity } from './ports'
import type { UserProfile } from '../userProfile'

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    email: 'maya@example.com',
    username: 'maya',
    profileAnimal: null,
    profileComplete: true,
    level: 1,
    totalXp: 0,
    streak: 0,
    lastActivityDate: null,
    chips: 0,
    bankrollGranted: false,
    casinoNetWinnings: 0,
    ...overrides,
  }
}

function identity(overrides: Partial<AuthIdentity> = {}): AuthIdentity {
  return { uid: 'u1', email: 'maya@example.com', providerIds: ['password'], ...overrides }
}

describe('shouldReconcileEmailOnToken', () => {
  it('reconciles ONLY when the same uid arrives with a changed email (the verify-link refresh)', () => {
    expect(
      shouldReconcileEmailOnToken(
        { uid: 'u1', email: 'old@example.com' },
        { uid: 'u1', email: 'new@example.com' },
      ),
    ).toBe(true)
  })

  it('ignores the first event (no prior token) — sign-in is owned by onAuthStateChanged', () => {
    expect(shouldReconcileEmailOnToken(null, { uid: 'u1', email: 'new@example.com' })).toBe(false)
  })

  it('ignores a uid transition (sign-in/out/account switch)', () => {
    expect(
      shouldReconcileEmailOnToken(
        { uid: 'u1', email: 'a@example.com' },
        { uid: 'u2', email: 'b@example.com' },
      ),
    ).toBe(false)
  })

  it('is a no-op for an unchanged email (an ordinary hourly refresh)', () => {
    expect(
      shouldReconcileEmailOnToken(
        { uid: 'u1', email: 'same@example.com' },
        { uid: 'u1', email: 'same@example.com' },
      ),
    ).toBe(false)
  })

  it('does nothing when there is no signed-in user or no email on the token', () => {
    expect(shouldReconcileEmailOnToken({ uid: 'u1', email: 'a@example.com' }, null)).toBe(false)
    expect(
      shouldReconcileEmailOnToken(
        { uid: 'u1', email: 'a@example.com' },
        { uid: 'u1', email: null },
      ),
    ).toBe(false)
  })
})

describe('needsEmailReconcile', () => {
  it('is true when the stored profile email lags the proven auth email', () => {
    expect(needsEmailReconcile(identity({ email: 'new@example.com' }), profile())).toBe(true)
  })

  it('is false when the stored email already matches (case-insensitively)', () => {
    expect(needsEmailReconcile(identity({ email: 'MAYA@example.com' }), profile())).toBe(false)
  })

  it('is false without a profile, a username, or a live auth email', () => {
    expect(needsEmailReconcile(identity({ email: 'new@example.com' }), null)).toBe(false)
    expect(
      needsEmailReconcile(identity({ email: 'new@example.com' }), profile({ username: null })),
    ).toBe(false)
    expect(needsEmailReconcile(identity({ email: null }), profile())).toBe(false)
  })
})
