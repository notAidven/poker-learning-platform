import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
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
  // Firebase Auth normalizes the account email to lowercase, so
  // `request.auth.token.email` is always lowercase. firestore.rules pins the
  // usernames doc to `email == request.auth.token.email`, so we must write the
  // lowercased form or the hardened rule rejects the whole transaction.
  const normalizedEmail = email.trim().toLowerCase()

  const userRef = doc(db, 'users', uid)
  const usernameRef = doc(db, 'usernames', usernameKey)

  await runTransaction(db, async (transaction) => {
    const usernameSnap = await transaction.get(usernameRef)
    if (usernameSnap.exists()) {
      throw new Error('Username is already taken.')
    }

    const userSnap = await transaction.get(userRef)
    const base: UserProfile = {
      email: normalizedEmail,
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

    transaction.set(usernameRef, { uid, email: normalizedEmail })
  })
}

/** Update only the profile avatar on users/{uid}. */
export async function updateProfileAnimal(
  uid: string,
  profileAnimal: ProfileAnimalId,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { profileAnimal })
}

/**
 * Change the signed-in user's username, atomically releasing the old
 * `usernames/{old}` doc and claiming `usernames/{new}` while updating
 * `users/{uid}.username`. Uses the SAME validation + uniqueness rules as signup.
 *
 * `authEmail` MUST be the caller's current Firebase Auth email — firestore.rules
 * pins each `usernames` doc to `email == request.auth.token.email`, so writing a
 * stale profile email would be rejected.
 *
 * Atomicity: the whole release+claim+rename runs in ONE Firestore transaction, so
 * the username is never double-claimed and the old one is never orphaned. The
 * `usernames/{new}` existence check inside the transaction (re-checked by the
 * `create` security rule) rejects names that are already taken.
 */
export async function changeUsername(
  uid: string,
  authEmail: string,
  newUsername: string,
  currentUsername: string | null,
): Promise<void> {
  const usernameError = validateUsername(newUsername)
  if (usernameError) throw new Error(usernameError)

  const newKey = normalizeUsername(newUsername)
  const newDisplay = newUsername.trim()
  const oldKey = currentUsername ? normalizeUsername(currentUsername) : null
  const normalizedEmail = authEmail.trim().toLowerCase()

  const userRef = doc(db, 'users', uid)

  // Case-only edit (e.g. "maya" -> "Maya"): the index key is unchanged, so there
  // is nothing to release/claim and Firestore forbids two writes to one doc in a
  // single transaction. Just update the displayed name.
  if (oldKey && oldKey === newKey) {
    if (newDisplay === currentUsername) return
    await updateDoc(userRef, { username: newDisplay })
    return
  }

  const newRef = doc(db, 'usernames', newKey)

  await runTransaction(db, async (transaction) => {
    // All reads must precede writes in a transaction.
    const newSnap = await transaction.get(newRef)
    if (newSnap.exists()) {
      throw new Error('Username is already taken.')
    }

    if (oldKey) {
      transaction.delete(doc(db, 'usernames', oldKey))
    }
    transaction.set(newRef, { uid, email: normalizedEmail })
    transaction.update(userRef, { username: newDisplay })
  })
}

/**
 * Reconcile the stored email after a Firebase Auth email change has taken effect
 * (`verifyBeforeUpdateEmail` only flips the auth email once the user opens the
 * confirmation link, typically reflected on the next load). Keeps
 * `users/{uid}.email` AND the `usernames/{name}` lookup doc pointing at the new,
 * lowercased address so username + password sign-in keeps working.
 *
 * Both writes are pinned by firestore.rules to `request.auth.token.email`, so the
 * profile can only ever be reconciled to the address the user actually proved.
 */
export async function syncProfileEmail(
  uid: string,
  username: string | null,
  authEmail: string,
): Promise<void> {
  const normalizedEmail = authEmail.trim().toLowerCase()
  const batch = writeBatch(db)
  batch.update(doc(db, 'users', uid), { email: normalizedEmail })
  if (username) {
    batch.update(doc(db, 'usernames', normalizeUsername(username)), {
      email: normalizedEmail,
    })
  }
  await batch.commit()
}
