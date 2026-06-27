/**
 * Per-account play-money bankroll for the Phase 2 casino tables.
 *
 * These are LEARNING chips — no real money. The bankroll is the hero's buy-in at
 * a table; after each hand its value follows the hero's stack, and a "Rebuy" tops
 * it back up so play-money can never hard-lock.
 *
 * Persistence mirrors the existing gamification pattern (see `gamification.ts` /
 * `gamificationFirestore.ts`): for a signed-in user the source of truth is the
 * Firestore user doc (`users/{uid}.chips` / `.bankrollGranted`), surfaced via the
 * auth profile and refreshed through the `gamification-updated` event. Every write
 * is also mirrored to `localStorage`. Signed-out / E2E sessions use `localStorage`
 * only. A `bankroll-updated` CustomEvent lets `useBankroll` re-render immediately.
 */
import { useEffect, useState } from 'react'
import { doc, runTransaction } from 'firebase/firestore'
import { db } from './firebase'
import { notifyGamificationUpdated } from './gamification'
import { E2E_BYPASS_AUTH } from './e2eBypass'
import { useAuth } from '../contexts/AuthContext'

/** Play-money chips granted once when the Casino Floor unlocks. */
export const STARTING_BANKROLL = 1000

// --- Casino buy-in / cash-out math (pure, unit-tested) -----------------------
// The shared bankroll is the hero's "pocket". Sitting at a casino table moves a
// fixed buy-in from the pocket onto the table; the table stack then floats with
// the hero's play. When the session ends (cash-out or bust) the remaining table
// stack returns to the pocket and the signed net (final stack − buy-in) is what
// gets recorded to the House Standings leaderboard. These helpers keep that math
// in one obvious place so the page just wires them to `setBankroll` / `rebuy`.

/** True when the shared bankroll can cover a table's buy-in. */
export function canCoverBuyIn(bankroll: number, buyIn: number): boolean {
  return buyIn > 0 && bankroll >= buyIn
}

/** Pocket (off-table) chips left after moving `buyIn` onto the table. */
export function pocketAfterBuyIn(bankroll: number, buyIn: number): number {
  return Math.max(0, Math.round(bankroll) - Math.round(buyIn))
}

/** Bankroll after a session ends and the remaining table stack returns to the pocket. */
export function bankrollAfterCashOut(pocket: number, tableStack: number): number {
  return Math.max(0, Math.round(pocket)) + Math.max(0, Math.round(tableStack))
}

/** Signed net result of a finished session — recorded to the leaderboard. */
export function sessionNet(finalTableStack: number, buyIn: number): number {
  return Math.round(finalTableStack) - Math.round(buyIn)
}

const CHIPS_KEY = 'bankroll-chips'
const GRANTED_KEY = 'bankroll-granted'

// --- localStorage mirror (guarded so the module is import-safe in any env) ----

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

function readLocalChips(): number | null {
  if (!hasStorage()) return null
  try {
    const raw = localStorage.getItem(CHIPS_KEY)
    if (raw == null) return null
    const n = Number(raw)
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null
  } catch {
    return null
  }
}

function readLocalGranted(): boolean {
  if (!hasStorage()) return false
  try {
    return localStorage.getItem(GRANTED_KEY) === 'true'
  } catch {
    return false
  }
}

function writeLocalRaw(chips: number, granted: boolean): void {
  if (!hasStorage()) return
  try {
    localStorage.setItem(CHIPS_KEY, String(Math.max(0, Math.round(chips))))
    localStorage.setItem(GRANTED_KEY, granted ? 'true' : 'false')
  } catch {
    // Ignore storage errors (private mode / disabled storage): play still works.
  }
}

export function notifyBankrollUpdated(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('bankroll-updated'))
}

function writeLocal(chips: number, granted: boolean): void {
  writeLocalRaw(chips, granted)
  notifyBankrollUpdated()
}

/** Drop the local mirror (used by the shared-device progress wipe). */
export function clearLocalBankroll(): void {
  if (!hasStorage()) return
  try {
    localStorage.removeItem(CHIPS_KEY)
    localStorage.removeItem(GRANTED_KEY)
  } catch {
    // Ignore storage errors.
  }
}

/** Synchronous snapshot of the local mirror (handy for non-hook callers + tests). */
export function getLocalBankroll(): { chips: number; granted: boolean } {
  return { chips: readLocalChips() ?? 0, granted: readLocalGranted() }
}

// --- persistence -------------------------------------------------------------

/** E2E bypass sessions have a fake uid; treat them as local-only. */
function effectiveUid(uid: string | null | undefined): string | null {
  if (E2E_BYPASS_AUTH) return null
  return uid ?? null
}

async function persistFirestore(uid: string, chips: number, granted: boolean): Promise<void> {
  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, 'users', uid)
      const snap = await tx.get(ref)
      if (!snap.exists()) return
      tx.update(ref, { chips: Math.max(0, Math.round(chips)), bankrollGranted: granted })
    })
    notifyGamificationUpdated()
  } catch (err) {
    console.warn('Failed to persist bankroll:', err)
  }
}

/**
 * Grant the starting bankroll exactly once, idempotently. For signed-in users the
 * Firestore `bankrollGranted` flag is the authoritative guard (so multiple devices
 * or re-renders never double-grant); locally the `bankroll-granted` flag guards.
 */
export async function grantBankroll(
  uid: string | null | undefined,
  opts?: { profileGranted?: boolean },
): Promise<void> {
  const eid = effectiveUid(uid)

  // Local / E2E: localStorage flag is the source of truth.
  if (!eid) {
    if (readLocalGranted()) return
    writeLocal(STARTING_BANKROLL, true)
    return
  }

  // Already granted on this account — nothing to do (the profile carries chips).
  if (opts?.profileGranted) return

  try {
    const result = await runTransaction(db, async (tx) => {
      const ref = doc(db, 'users', eid)
      const snap = await tx.get(ref)
      if (!snap.exists()) return null
      const data = snap.data()
      if (data.bankrollGranted === true) {
        return typeof data.chips === 'number' ? data.chips : STARTING_BANKROLL
      }
      tx.update(ref, { chips: STARTING_BANKROLL, bankrollGranted: true })
      return STARTING_BANKROLL
    })
    if (result != null) {
      writeLocalRaw(result, true)
      notifyGamificationUpdated()
      notifyBankrollUpdated()
    }
  } catch (err) {
    console.warn('Failed to grant bankroll:', err)
  }
}

/** Persist an absolute chip total (called after each hand settles, and on rebuy). */
export async function setBankroll(uid: string | null | undefined, chips: number): Promise<void> {
  const safe = Math.max(0, Math.round(chips))
  const eid = effectiveUid(uid)
  if (!eid) {
    writeLocal(safe, true)
    return
  }
  writeLocalRaw(safe, true) // optimistic mirror
  notifyBankrollUpdated()
  await persistFirestore(eid, safe, true)
}

/** Rebuy safety: reset to the starting bankroll so play-money never hard-locks. */
export async function rebuy(uid: string | null | undefined): Promise<void> {
  await setBankroll(uid, STARTING_BANKROLL)
}

// --- React hook --------------------------------------------------------------

export type BankrollView = { chips: number; granted: boolean }

/**
 * Current bankroll for the active account. Signed-in users read the value from
 * their auth profile (Firestore-backed, refreshed via `gamification-updated`);
 * signed-out / E2E sessions read the local mirror. Re-renders on bankroll/gamification
 * updates and cross-tab storage changes.
 */
export function useBankroll(): BankrollView {
  const { user, profile } = useAuth()
  const usesLocal = E2E_BYPASS_AUTH || !user
  const [, force] = useState(0)

  useEffect(() => {
    const refresh = () => force((n) => n + 1)
    window.addEventListener('bankroll-updated', refresh)
    window.addEventListener('gamification-updated', refresh)
    const onStorage = (e: StorageEvent) => {
      if (e.key === CHIPS_KEY || e.key === GRANTED_KEY || e.key === null) refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('bankroll-updated', refresh)
      window.removeEventListener('gamification-updated', refresh)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Mirror the signed-in account's chips to localStorage so the value survives a
  // reload before the profile re-fetches. Display still reads the profile, so this
  // write never dispatches (no render loop).
  useEffect(() => {
    if (usesLocal) return
    if (profile && typeof profile.chips === 'number') {
      writeLocalRaw(profile.chips, Boolean(profile.bankrollGranted))
    }
  }, [usesLocal, profile])

  if (usesLocal) {
    return { chips: readLocalChips() ?? 0, granted: readLocalGranted() }
  }
  return {
    chips: typeof profile?.chips === 'number' ? profile.chips : 0,
    granted: Boolean(profile?.bankrollGranted),
  }
}
