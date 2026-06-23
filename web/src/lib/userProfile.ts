import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { ProfileAnimalId } from '../data/animals'

export type UserProfile = {
  email: string
  username: string | null
  profileAnimal: ProfileAnimalId | null
  profileComplete: boolean
  level: number
  totalXp: number
  streak: number
  /** Last CAT calendar day (YYYY-MM-DD) with a qualifying lesson completion */
  lastActivityDate: string | null
  createdAt?: Timestamp
}

function normalizeUserProfile(data: Record<string, unknown>): UserProfile {
  return {
    email: typeof data.email === 'string' ? data.email : '',
    username: typeof data.username === 'string' ? data.username : null,
    profileAnimal:
      typeof data.profileAnimal === 'string'
        ? (data.profileAnimal as ProfileAnimalId)
        : null,
    profileComplete: Boolean(data.profileComplete),
    level: typeof data.level === 'number' ? data.level : 1,
    totalXp: typeof data.totalXp === 'number' ? data.totalXp : 0,
    streak: typeof data.streak === 'number' ? data.streak : 0,
    lastActivityDate:
      typeof data.lastActivityDate === 'string' ? data.lastActivityDate : null,
    createdAt: data.createdAt as Timestamp | undefined,
  }
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/

export function validateUsername(username: string): string | null {
  const trimmed = username.trim()
  if (trimmed.length < 3) return 'Username must be at least 3 characters.'
  if (trimmed.length > 20) return 'Username must be at most 20 characters.'
  if (!USERNAME_PATTERN.test(trimmed)) {
    return 'Use only letters, numbers, and underscores.'
  }
  return null
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return normalizeUserProfile(snap.data())
}

export async function getEmailForUsername(username: string): Promise<string | null> {
  const key = normalizeUsername(username)
  const snap = await getDoc(doc(db, 'usernames', key))
  if (!snap.exists()) return null
  const data = snap.data() as { email?: string }
  return data.email ?? null
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const key = normalizeUsername(username)
  const snap = await getDoc(doc(db, 'usernames', key))
  return !snap.exists()
}

export async function completeProfileSetup(
  uid: string,
  email: string,
  username: string,
  profileAnimal: ProfileAnimalId,
): Promise<void> {
  const usernameError = validateUsername(username)
  if (usernameError) throw new Error(usernameError)

  const usernameKey = normalizeUsername(username)
  const displayUsername = username.trim()

  const userRef = doc(db, 'users', uid)
  const usernameRef = doc(db, 'usernames', usernameKey)

  await runTransaction(db, async (transaction) => {
    const usernameSnap = await transaction.get(usernameRef)
    if (usernameSnap.exists()) {
      throw new Error('Username is already taken.')
    }

    const userSnap = await transaction.get(userRef)
    const base: UserProfile = {
      email,
      username: displayUsername,
      profileAnimal,
      profileComplete: true,
      level: 1,
      totalXp: 0,
      streak: 0,
      lastActivityDate: null,
    }

    if (userSnap.exists()) {
      transaction.update(userRef, {
        username: displayUsername,
        profileAnimal,
        profileComplete: true,
      })
    } else {
      transaction.set(userRef, {
        ...base,
        createdAt: serverTimestamp(),
      })
    }

    transaction.set(usernameRef, { uid, email })
  })
}
