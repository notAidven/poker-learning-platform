/**
 * The auth orchestration, exercised through the SERVICE INTERFACE — the whole point
 * of lifting it out of React. Fake `AuthPort` + `ProfilePort` stand in for Firebase
 * Auth + Firestore (mirroring how `InMemoryProgressBackend` stands in for the progress
 * backend), so the security-sensitive flows — enumeration-safe reset, reauth-retry
 * linking, re-auth branching, verify-before-update email reconciliation — are asserted
 * with no React harness and no live Firebase.
 */
import { describe, expect, it } from 'vitest'
import { AuthService } from './AuthService'
import type { AuthIdentity, AuthPort, ProfilePort } from './ports'
import type { UserProfile } from '../userProfile'

const RECENT_LOGIN = { code: 'auth/requires-recent-login' }
const USER_NOT_FOUND = { code: 'auth/user-not-found' }

class FakeAuthPort implements AuthPort {
  current: AuthIdentity | null = null

  createdUser: { email: string; password: string } | null = null
  signedInWith: { email: string; password: string } | null = null
  signInGoogleCount = 0
  signOutCount = 0
  sentResetTo: string[] = []
  linkedWith: Array<{ email: string; password: string }> = []
  reauthPasswordWith: { email: string; password: string } | null = null
  reauthGoogleCount = 0
  reloadCount = 0
  verifiedEmail: string | null = null
  updatedPassword: string | null = null

  /** Errors to throw from successive `linkPassword` attempts (shifted per call). */
  linkPasswordErrors: unknown[] = []
  sendResetError: unknown = null
  reloadError: unknown = null

  getCurrentUser() {
    return this.current
  }
  async createUserWithEmailAndPassword(email: string, password: string) {
    this.createdUser = { email, password }
  }
  async signInWithEmailAndPassword(email: string, password: string) {
    this.signedInWith = { email, password }
  }
  async signInWithGoogle() {
    this.signInGoogleCount += 1
  }
  async signOut() {
    this.signOutCount += 1
  }
  async sendPasswordResetEmail(email: string) {
    if (this.sendResetError) throw this.sendResetError
    this.sentResetTo.push(email)
  }
  async linkPassword(email: string, password: string) {
    const err = this.linkPasswordErrors.shift()
    if (err) throw err
    this.linkedWith.push({ email, password })
  }
  async reauthenticateWithPassword(email: string, password: string) {
    this.reauthPasswordWith = { email, password }
  }
  async reauthenticateWithGoogle() {
    this.reauthGoogleCount += 1
  }
  async reloadCurrentUser() {
    this.reloadCount += 1
    if (this.reloadError) throw this.reloadError
  }
  async verifyBeforeUpdateEmail(newEmail: string) {
    this.verifiedEmail = newEmail
  }
  async updatePassword(newPassword: string) {
    this.updatedPassword = newPassword
  }
}

class FakeProfilePort implements ProfilePort {
  emailByUsername = new Map<string, string>()
  profilesByUid = new Map<string, UserProfile>()
  syncCalls: Array<{ uid: string; username: string | null; authEmail: string }> = []
  syncError: unknown = null
  getUserProfileError: unknown = null
  /** Optional hook to mutate the stored profile as part of a successful sync. */
  onSync: ((uid: string) => void) | null = null

  async getEmailForUsername(username: string) {
    return this.emailByUsername.get(username) ?? null
  }
  async getUserProfile(uid: string) {
    if (this.getUserProfileError) throw this.getUserProfileError
    return this.profilesByUid.get(uid) ?? null
  }
  async syncProfileEmail(uid: string, username: string | null, authEmail: string) {
    this.syncCalls.push({ uid, username, authEmail })
    if (this.syncError) throw this.syncError
    this.onSync?.(uid)
  }
}

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
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

function setup() {
  const auth = new FakeAuthPort()
  const profiles = new FakeProfilePort()
  const service = new AuthService(auth, profiles)
  return { auth, profiles, service }
}

describe('signUpWithEmail', () => {
  it('creates an account with the trimmed email', async () => {
    const { auth, service } = setup()
    await service.signUpWithEmail('  maya@example.com  ', 'hunter2')
    expect(auth.createdUser).toEqual({ email: 'maya@example.com', password: 'hunter2' })
  })
})

describe('signInWithUsername', () => {
  it('resolves the username to its email, then signs in', async () => {
    const { auth, profiles, service } = setup()
    profiles.emailByUsername.set('maya', 'maya@example.com')
    await service.signInWithUsername('maya', 'hunter2')
    expect(auth.signedInWith).toEqual({ email: 'maya@example.com', password: 'hunter2' })
  })

  it('throws the SAME generic error as a wrong password for an unknown username (L1) and never signs in', async () => {
    const { auth, service } = setup()
    await expect(service.signInWithUsername('ghost', 'hunter2')).rejects.toThrow(
      'Incorrect username or password.',
    )
    expect(auth.signedInWith).toBeNull()
  })
})

describe('signInWithGoogle', () => {
  it('delegates to the Google popup', async () => {
    const { auth, service } = setup()
    await service.signInWithGoogle()
    expect(auth.signInGoogleCount).toBe(1)
  })
})

describe('resetPassword (enumeration-safe)', () => {
  it('rejects blank input', async () => {
    const { auth, service } = setup()
    await expect(service.resetPassword('   ')).rejects.toThrow(
      'Enter your email or username to reset your password.',
    )
    expect(auth.sentResetTo).toEqual([])
  })

  it('sends straight to a typed email (trimmed + lowercased)', async () => {
    const { auth, service } = setup()
    await service.resetPassword('  Maya@Example.COM ')
    expect(auth.sentResetTo).toEqual(['maya@example.com'])
  })

  it('resolves a username to its email, then sends', async () => {
    const { auth, profiles, service } = setup()
    profiles.emailByUsername.set('maya', 'maya@example.com')
    await service.resetPassword('maya')
    expect(auth.sentResetTo).toEqual(['maya@example.com'])
  })

  it('is a SILENT success for a username with no match (sends nothing)', async () => {
    const { auth, service } = setup()
    await expect(service.resetPassword('ghost')).resolves.toBeUndefined()
    expect(auth.sentResetTo).toEqual([])
  })

  it('swallows user-not-found so the response cannot confirm the account is gone', async () => {
    const { auth, service } = setup()
    auth.sendResetError = USER_NOT_FOUND
    await expect(service.resetPassword('maya@example.com')).resolves.toBeUndefined()
  })

  it('surfaces other failures (rate limiting, network)', async () => {
    const { auth, service } = setup()
    auth.sendResetError = { code: 'auth/too-many-requests' }
    await expect(service.resetPassword('maya@example.com')).rejects.toEqual({
      code: 'auth/too-many-requests',
    })
  })
})

describe('linkEmailPassword (reauth-retry)', () => {
  it('requires a signed-in user with an email', async () => {
    const { auth, service } = setup()
    auth.current = null
    await expect(service.linkEmailPassword('hunter2')).rejects.toThrow(
      'You need to be signed in to set a password.',
    )

    auth.current = identity({ email: null })
    await expect(service.linkEmailPassword('hunter2')).rejects.toThrow(
      'Your account has no email address to attach a password to.',
    )
  })

  it('links with the account email, then reloads (happy path)', async () => {
    const { auth, service } = setup()
    auth.current = identity({ email: 'maya@example.com' })
    await service.linkEmailPassword('hunter2')
    expect(auth.linkedWith).toEqual([{ email: 'maya@example.com', password: 'hunter2' }])
    expect(auth.reauthGoogleCount).toBe(0)
    expect(auth.reloadCount).toBe(1)
  })

  it('re-authenticates with Google and retries once on requires-recent-login', async () => {
    const { auth, service } = setup()
    auth.current = identity({ email: 'maya@example.com', providerIds: ['google.com'] })
    auth.linkPasswordErrors = [RECENT_LOGIN]
    await service.linkEmailPassword('hunter2')
    expect(auth.reauthGoogleCount).toBe(1)
    expect(auth.linkedWith).toEqual([{ email: 'maya@example.com', password: 'hunter2' }])
    expect(auth.reloadCount).toBe(1)
  })

  it('rethrows a non-recent-login error without re-authenticating', async () => {
    const { auth, service } = setup()
    auth.current = identity({ email: 'maya@example.com' })
    auth.linkPasswordErrors = [{ code: 'auth/credential-already-in-use' }]
    await expect(service.linkEmailPassword('hunter2')).rejects.toEqual({
      code: 'auth/credential-already-in-use',
    })
    expect(auth.reauthGoogleCount).toBe(0)
    expect(auth.linkedWith).toEqual([])
  })

  it('treats a failed reload as non-fatal (the link already succeeded)', async () => {
    const { auth, service } = setup()
    auth.current = identity({ email: 'maya@example.com' })
    auth.reloadError = new Error('reload failed')
    await expect(service.linkEmailPassword('hunter2')).resolves.toBeUndefined()
    expect(auth.linkedWith).toHaveLength(1)
    expect(auth.reloadCount).toBe(1)
  })
})

describe('reauthenticate', () => {
  it('requires a signed-in user', async () => {
    const { auth, service } = setup()
    auth.current = null
    await expect(service.reauthenticate('pw')).rejects.toThrow(
      'You need to be signed in to do that.',
    )
  })

  it('uses the password path for accounts that have one', async () => {
    const { auth, service } = setup()
    auth.current = identity({ email: 'maya@example.com', providerIds: ['password'] })
    await service.reauthenticate('hunter2')
    expect(auth.reauthPasswordWith).toEqual({ email: 'maya@example.com', password: 'hunter2' })
    expect(auth.reauthGoogleCount).toBe(0)
  })

  it('requires an email and a password on the password path', async () => {
    const { auth, service } = setup()
    auth.current = identity({ email: null, providerIds: ['password'] })
    await expect(service.reauthenticate('hunter2')).rejects.toThrow(
      'Your account has no email address.',
    )

    auth.current = identity({ email: 'maya@example.com', providerIds: ['password'] })
    await expect(service.reauthenticate()).rejects.toThrow(
      'Enter your current password to continue.',
    )
  })

  it('uses the Google popup for Google-only accounts (password ignored)', async () => {
    const { auth, service } = setup()
    auth.current = identity({ providerIds: ['google.com'] })
    await service.reauthenticate()
    expect(auth.reauthGoogleCount).toBe(1)
    expect(auth.reauthPasswordWith).toBeNull()
  })

  it('refuses when no supported provider is linked', async () => {
    const { auth, service } = setup()
    auth.current = identity({ providerIds: [] })
    await expect(service.reauthenticate()).rejects.toThrow(
      'Re-authentication is not available for this account.',
    )
  })
})

describe('changeEmail', () => {
  it('requires a signed-in user', async () => {
    const { auth, service } = setup()
    auth.current = null
    await expect(service.changeEmail('new@example.com')).rejects.toThrow(
      'You need to be signed in to change your email.',
    )
  })

  it('sends the verify-before-update link to the trimmed new address', async () => {
    const { auth, service } = setup()
    auth.current = identity()
    await service.changeEmail('  New@Example.com  ')
    expect(auth.verifiedEmail).toBe('New@Example.com')
  })
})

describe('changePassword', () => {
  it('requires a signed-in user', async () => {
    const { auth, service } = setup()
    auth.current = null
    await expect(service.changePassword('hunter2')).rejects.toThrow(
      'You need to be signed in to change your password.',
    )
  })

  it('updates the password for a signed-in user', async () => {
    const { auth, service } = setup()
    auth.current = identity()
    await service.changePassword('hunter2')
    expect(auth.updatedPassword).toBe('hunter2')
  })
})

describe('signOut', () => {
  it('delegates to the auth port', async () => {
    const { auth, service } = setup()
    await service.signOut()
    expect(auth.signOutCount).toBe(1)
  })
})

describe('loadProfile (read + email reconcile)', () => {
  it('returns null for a signed-out session', async () => {
    const { service } = setup()
    expect(await service.loadProfile(null)).toBeNull()
  })

  it('returns the stored profile unchanged when the email already matches', async () => {
    const { profiles, service } = setup()
    profiles.profilesByUid.set('u1', makeProfile({ email: 'maya@example.com' }))
    const result = await service.loadProfile(identity({ email: 'maya@example.com' }))
    expect(result?.email).toBe('maya@example.com')
    expect(profiles.syncCalls).toEqual([])
  })

  it('writes the proven email back and returns the refreshed profile when it drifted', async () => {
    const { profiles, service } = setup()
    profiles.profilesByUid.set('u1', makeProfile({ email: 'maya@example.com', username: 'maya' }))
    // A successful sync updates the stored doc; the reconcile re-reads it.
    profiles.onSync = (uid) => {
      profiles.profilesByUid.set(uid, makeProfile({ email: 'maya.new@example.com', username: 'maya' }))
    }
    const result = await service.loadProfile(identity({ email: 'maya.new@example.com' }))
    expect(profiles.syncCalls).toEqual([
      { uid: 'u1', username: 'maya', authEmail: 'maya.new@example.com' },
    ])
    expect(result?.email).toBe('maya.new@example.com')
  })

  it('does not reconcile without a username on the profile', async () => {
    const { profiles, service } = setup()
    profiles.profilesByUid.set('u1', makeProfile({ email: 'maya@example.com', username: null }))
    const result = await service.loadProfile(identity({ email: 'maya.new@example.com' }))
    expect(profiles.syncCalls).toEqual([])
    expect(result?.email).toBe('maya@example.com')
  })

  it('keeps the prior profile when the reconcile write fails (best-effort, never throws)', async () => {
    const { profiles, service } = setup()
    const original = makeProfile({ email: 'maya@example.com', username: 'maya' })
    profiles.profilesByUid.set('u1', original)
    profiles.syncError = new Error('firestore unavailable')
    const result = await service.loadProfile(identity({ email: 'maya.new@example.com' }))
    expect(profiles.syncCalls).toHaveLength(1)
    expect(result).toBe(original)
  })

  it('surfaces a profile-read failure (the adapter decides how to fail soft)', async () => {
    const { profiles, service } = setup()
    profiles.getUserProfileError = new Error('firestore unavailable')
    await expect(service.loadProfile(identity())).rejects.toThrow('firestore unavailable')
  })
})
