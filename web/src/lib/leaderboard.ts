/**
 * House Standings leaderboard (Phase 3 Casino Floor).
 *
 * Two writes, one transaction, after every finished table session:
 *   1. users/{uid}.casinoNetWinnings  — the player's authoritative lifetime net
 *      (the owner-only source of truth, whitelisted in firestore.rules).
 *   2. leaderboard/{uid}              — a small, world-readable projection
 *      { uid, username, profileAnimal, netWinnings, updatedAt } the board reads
 *      and ranks by `netWinnings` desc.
 *
 * Play-money + client-written by design (no server). Security comes from the rules:
 * a player may only read the board when signed in, and may only write THEIR OWN
 * leaderboard doc with a validated shape. Signed-out / E2E sessions are a no-op.
 */
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { E2E_BYPASS_AUTH } from './e2eBypass'

const LEADERBOARD_COLLECTION = 'leaderboard'

export type LeaderboardEntry = {
  uid: string
  username: string
  profileAnimal: string | null
  netWinnings: number
  updatedAt: Timestamp | null
}

/** The signed-in uid, or null for signed-out / E2E sessions (treated as no-op). */
function activeUid(): string | null {
  if (E2E_BYPASS_AUTH) return null
  return auth.currentUser?.uid ?? null
}

/**
 * Fold a finished session's signed net into the player's lifetime total and refresh
 * their public board row. Signed-out: no-op. Never throws — a failed write is
 * swallowed (logged) so a missed leaderboard update can't break the table flow.
 */
export async function recordCasinoResult(netChips: number): Promise<void> {
  const uid = activeUid()
  if (!uid) return

  const net = Number.isFinite(netChips) ? Math.round(netChips) : 0

  try {
    await runTransaction(db, async (tx) => {
      const userRef = doc(db, 'users', uid)
      const snap = await tx.get(userRef)
      if (!snap.exists()) return

      const data = snap.data()
      const prev = typeof data.casinoNetWinnings === 'number' ? data.casinoNetWinnings : 0
      const total = prev + net
      const username =
        typeof data.username === 'string' && data.username.length > 0 ? data.username : 'Anonymous'
      const profileAnimal = typeof data.profileAnimal === 'string' ? data.profileAnimal : null

      tx.update(userRef, { casinoNetWinnings: total })
      tx.set(doc(db, LEADERBOARD_COLLECTION, uid), {
        uid,
        username,
        profileAnimal,
        netWinnings: total,
        updatedAt: serverTimestamp(),
      })
    })
  } catch (err) {
    console.warn('Failed to record casino result:', err)
  }
}

/** Defensive parse of a board doc (untrusted shape from Firestore). */
function sanitizeEntry(id: string, data: Record<string, unknown>): LeaderboardEntry {
  return {
    uid: typeof data.uid === 'string' ? data.uid : id,
    username: typeof data.username === 'string' ? data.username : 'Anonymous',
    profileAnimal: typeof data.profileAnimal === 'string' ? data.profileAnimal : null,
    netWinnings: typeof data.netWinnings === 'number' ? data.netWinnings : 0,
    updatedAt: (data.updatedAt as Timestamp | undefined) ?? null,
  }
}

/**
 * The top `topN` players by lifetime net winnings (descending). A single-field
 * `orderBy` needs only Firestore's automatic index (no composite index). Signed-out
 * sessions and any error resolve to an empty board rather than throwing.
 */
export async function fetchLeaderboard(topN = 20): Promise<LeaderboardEntry[]> {
  if (!activeUid()) return []
  const n = Math.max(1, Math.min(100, Math.round(topN)))
  try {
    const q = query(
      collection(db, LEADERBOARD_COLLECTION),
      orderBy('netWinnings', 'desc'),
      limit(n),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => sanitizeEntry(d.id, d.data()))
  } catch (err) {
    console.warn('Failed to fetch leaderboard:', err)
    return []
  }
}
