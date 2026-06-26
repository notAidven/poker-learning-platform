/**
 * Tests for the play-money bankroll + the refined casino unlock gating, all on the
 * signed-out / local path (no Firestore): a stubbed in-memory localStorage stands
 * in for the browser store.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STARTING_BANKROLL, getLocalBankroll, grantBankroll, rebuy, setBankroll } from './bankroll'
import {
  areAllLessonsComplete,
  areGuidedPlayLessonsComplete,
  getClearedTableIds,
  hasClearedAnyCoachedTable,
  isTableCleared,
  isTableUnlocked,
  markTableCleared,
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
// Foundations + Playing a Hand — the first two sections that open the coached room.
const GUIDED_PLAY_IDS = lessons
  .filter((l) => l.kind !== 'ai-table' && (l.section === 'foundations' || l.section === 'playing'))
  .map((l) => l.id)
const FOUNDATIONS_IDS = lessons
  .filter((l) => l.kind !== 'ai-table' && l.section === 'foundations')
  .map((l) => l.id)

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

  it('areGuidedPlayLessonsComplete needs only the first two sections', () => {
    // The first two sections are enough, and they are a strict subset of the
    // whole course, so a finished course also satisfies the guided-play gate.
    expect(areGuidedPlayLessonsComplete(GUIDED_PLAY_IDS)).toBe(true)
    expect(areGuidedPlayLessonsComplete(ALL_LESSON_IDS)).toBe(true)
    // Foundations alone (Playing a Hand unfinished) is not enough.
    expect(areGuidedPlayLessonsComplete(FOUNDATIONS_IDS)).toBe(false)
    expect(areGuidedPlayLessonsComplete([])).toBe(false)
  })

  it('Room 1 opens after the first two sections, before The Math is done', () => {
    const room1 = getTable('room-1')!
    expect(isTableUnlocked(room1, [])).toBe(false)
    expect(isTableUnlocked(room1, FOUNDATIONS_IDS)).toBe(false)
    // Reaches guided play without having finished The Math section.
    expect(isTableUnlocked(room1, GUIDED_PLAY_IDS)).toBe(true)
    // A fully-finished course keeps Room 1 open too (gates stay coherent).
    expect(isTableUnlocked(room1, ALL_LESSON_IDS)).toBe(true)
  })

  it('Room 2 needs the first two sections AND Room 1 cleared', () => {
    const room2 = getTable('room-2')!

    expect(hasClearedAnyCoachedTable()).toBe(false)
    // Guided-play sections done, but Room 1 is not cleared yet → still locked.
    expect(isTableUnlocked(room2, GUIDED_PLAY_IDS)).toBe(false)

    markTableCleared('room-1')
    expect(hasClearedAnyCoachedTable()).toBe(true)
    expect(isTableCleared('room-1')).toBe(true)
    expect(getClearedTableIds()).toContain('room-1')
    expect(isTableUnlocked(room2, GUIDED_PLAY_IDS)).toBe(true)

    // …but only once the first two sections are complete.
    expect(isTableUnlocked(room2, FOUNDATIONS_IDS)).toBe(false)
    expect(isTableUnlocked(room2, [])).toBe(false)
  })
})
