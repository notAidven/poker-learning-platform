/**
 * Tests for the play-money bankroll + the refined casino unlock gating, all on the
 * signed-out / local path (no Firestore): a stubbed in-memory localStorage stands
 * in for the browser store.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STARTING_BANKROLL, getLocalBankroll, grantBankroll, rebuy, setBankroll } from './bankroll'
import {
  areAllLessonsComplete,
  hasClearedAnyCoachedTable,
  isTableUnlocked,
} from './lessonProgress'
import { lessons } from '../data/lessons'
import { getTable } from '../data/tables'

function makeStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v))
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size
    },
  }
}

const ALL_LESSON_IDS = lessons.filter((l) => l.kind !== 'ai-table').map((l) => l.id)

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('bankroll (local / signed-out path)', () => {
  it('grants the starting bankroll exactly once and never double-grants', async () => {
    expect(getLocalBankroll()).toEqual({ chips: 0, granted: false })

    await grantBankroll(null)
    expect(getLocalBankroll()).toEqual({ chips: STARTING_BANKROLL, granted: true })

    // Spend some chips, then a second grant must NOT reset the bankroll (idempotent).
    await setBankroll(null, 300)
    expect(getLocalBankroll().chips).toBe(300)

    await grantBankroll(null)
    expect(getLocalBankroll()).toEqual({ chips: 300, granted: true })
  })

  it('skips the grant when the account already has it (profileGranted)', async () => {
    await grantBankroll('user-1', { profileGranted: true })
    // No Firestore in tests; the local mirror must stay untouched (no fake grant).
    expect(getLocalBankroll()).toEqual({ chips: 0, granted: false })
  })

  it('clamps the bankroll at zero and rebuys back to the starting stack', async () => {
    await grantBankroll(null)

    await setBankroll(null, -50)
    expect(getLocalBankroll().chips).toBe(0)

    await rebuy(null)
    expect(getLocalBankroll().chips).toBe(STARTING_BANKROLL)
  })
})

describe('casino unlock gating (two rooms)', () => {
  it('areAllLessonsComplete ignores ai-table nodes', () => {
    expect(areAllLessonsComplete(ALL_LESSON_IDS)).toBe(true)
    expect(areAllLessonsComplete(ALL_LESSON_IDS.slice(0, -1))).toBe(false)
    expect(areAllLessonsComplete([])).toBe(false)
  })

  it('Room 1 opens once every lesson is complete', () => {
    const room1 = getTable('room-1')!
    expect(isTableUnlocked(room1, [])).toBe(false)
    expect(isTableUnlocked(room1, ALL_LESSON_IDS)).toBe(true)
  })

  it('Room 2 needs ALL lessons AND Room 1 cleared', () => {
    const room2 = getTable('room-2')!

    expect(hasClearedAnyCoachedTable()).toBe(false)
    // All lessons done, but Room 1 is not cleared yet → still locked.
    expect(isTableUnlocked(room2, ALL_LESSON_IDS)).toBe(false)

    localStorage.setItem('cleared-table-ids', JSON.stringify(['room-1']))
    expect(hasClearedAnyCoachedTable()).toBe(true)
    expect(isTableUnlocked(room2, ALL_LESSON_IDS)).toBe(true)

    // …but only once every lesson is complete.
    expect(isTableUnlocked(room2, [])).toBe(false)
  })
})
