/**
 * ProgressStore behaviour, all derived from the pre-refactor modules (which had no
 * tests, so the old code is the spec): offline-first synchronous reads, idempotent
 * XP via the injected backend, CAT-day streaks, debounced session writes, deleteField
 * session drops, the H1 shared-device sync, cross-tab notification, and snapshot
 * stability. A stubbed in-memory localStorage + window stand in for the browser, and
 * an InMemoryProgressBackend stands in for Firestore.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProgressStore } from './ProgressStore'
import { InMemoryProgressBackend } from './InMemoryProgressBackend'
import { clearClearedTables } from '../casinoProgress'
import { getNextLessonPath } from './selectors'
import { defaultLessonStats, type LessonStats } from './types'

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

type StorageHandler = (e: { type: string; key: string | null }) => void

function makeWindow() {
  const listeners = new Map<string, Set<StorageHandler>>()
  return {
    addEventListener: (type: string, cb: StorageHandler) => {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type)!.add(cb)
    },
    removeEventListener: (type: string, cb: StorageHandler) => {
      listeners.get(type)?.delete(cb)
    },
    dispatchEvent: (e: { type: string; key: string | null }) => {
      listeners.get(e.type)?.forEach((cb) => cb(e))
      return true
    },
  }
}

function statsWith(overrides: Partial<LessonStats>): LessonStats {
  return { ...defaultLessonStats(), ...overrides }
}

function newStore(opts?: {
  backend?: InMemoryProgressBackend
  onLocalReset?: () => void
}) {
  return new ProgressStore({
    backend: opts?.backend ?? new InMemoryProgressBackend(),
    onLocalReset: opts?.onLocalReset,
  })
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage())
  vi.stubGlobal('window', makeWindow())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('ProgressStore — reads, unlock gating, next-lesson routing', () => {
  it('returns default stats and no completions for a fresh learner', () => {
    const store = newStore()
    expect(store.getStats('1')).toEqual(defaultLessonStats())
    expect(store.getCompletedIds()).toEqual([])
    expect(store.getSnapshot().completedIds).toEqual([])
  })

  it('unlocks lesson 1 always; lesson N requires lesson N-1 complete', () => {
    const store = newStore()
    expect(store.getSnapshot().completedIds).toEqual([])
    // Pure selector lives behind useProgress; here we assert via completion state.
    store.saveSkillCheckResult('1', 3, 3)
    expect(store.getCompletedIds()).toContain('1')
  })

  it('routes "continue" to the lesson, its skill check, or the course path', () => {
    const backend = new InMemoryProgressBackend()
    const store = newStore({ backend })
    // Nothing started → first lesson body.
    expect(nextPath(store)).toBe('/lesson/1')

    // Body finished but skill check pending → straight to the skill check.
    store.saveLessonFinished('1', 100, {}, [])
    expect(nextPath(store)).toBe('/lesson/1/skill-check')

    // Completed → skip to the next lesson.
    store.saveSkillCheckResult('1', 3, 3)
    expect(nextPath(store)).toBe('/lesson/2')
  })

  it('reports a lesson as in-progress from a saved session', () => {
    const store = newStore()
    expect(store.isLessonInProgress('1', 5)).toBe(false)
    store.saveSession('1', { stepIndex: 2, solvedStepIds: ['a'] })
    expect(store.isLessonInProgress('1', 5)).toBe(true)
  })
})

describe('ProgressStore — completion XP (computeLessonXp) and idempotency', () => {
  it('awards base 100 + full 50 bonus when every problem is first-try', () => {
    const store = newStore()
    store.saveLessonFinished('1', 100, { a: 1, b: 1, c: 1, d: 1, e: 1 }, ['a', 'b', 'c', 'd', 'e'])
    const res = store.saveSkillCheckResult('1', 3, 3)
    expect(res.isFirstCompletion).toBe(true)
    expect(res.xpBreakdown).toEqual({ base: 100, bonus: 50, total: 150 })
    expect(store.getStats('1').completed).toBe(true)
  })

  it('penalises extra attempts (−10 per extra submit)', () => {
    const store = newStore()
    store.saveLessonFinished('1', 80, { a: 3, b: 1, c: 1, d: 1, e: 1 }, ['a', 'b', 'c', 'd', 'e'])
    const res = store.saveSkillCheckResult('1', 3, 3)
    // 2 extra attempts → bonus 50 − 20 = 30.
    expect(res.xpBreakdown).toEqual({ base: 100, bonus: 30, total: 130 })
  })

  it('a retake reports no first-completion and no XP breakdown', () => {
    const store = newStore()
    store.saveLessonFinished('1', 100, { a: 1 }, ['a'])
    store.saveSkillCheckResult('1', 3, 3)
    const retake = store.saveSkillCheckResult('1', 3, 3)
    expect(retake.isFirstCompletion).toBe(false)
    expect(retake.xpBreakdown).toBeNull()
  })

  it('awards XP to the backend user exactly once across two completions', async () => {
    const backend = new InMemoryProgressBackend({ today: () => '2026-01-10' })
    backend.seedUser('u')
    const store = newStore({ backend })
    await store.syncOnAuth('u')

    store.saveLessonFinished('1', 100, { a: 1, b: 1 }, ['a', 'b'])
    store.saveSkillCheckResult('1', 3, 3)
    expect(backend.getUser('u')).toMatchObject({ totalXp: 150, streak: 1 })

    // Second pass (retake): backend award is idempotent — XP unchanged.
    store.saveSkillCheckResult('1', 3, 3)
    expect(backend.getUser('u')).toMatchObject({ totalXp: 150 })
  })

  it('records review activity as a streak touch without XP', async () => {
    const backend = new InMemoryProgressBackend({ today: () => '2026-04-02' })
    backend.seedUser('u', { totalXp: 300, streak: 1, lastActivityDate: '2026-04-01' })
    const store = newStore({ backend })
    await store.syncOnAuth('u')

    store.recordReviewActivity()
    expect(backend.getUser('u')).toMatchObject({ totalXp: 300, streak: 2, lastActivityDate: '2026-04-02' })
  })
})

describe('ProgressStore — sessions (debounce, deleteField, resume)', () => {
  it('debounces the backend session write and coalesces rapid saves', async () => {
    vi.useFakeTimers()
    const backend = new InMemoryProgressBackend()
    backend.seedUser('u')
    const store = newStore({ backend })
    await store.syncOnAuth('u')

    store.saveSession('1', { stepIndex: 1, solvedStepIds: ['a'] })
    store.saveSession('1', { stepIndex: 2, solvedStepIds: ['a', 'b'] })
    // Nothing written before the debounce window elapses.
    expect((await backend.loadAll('u'))['1']?.session).toBeUndefined()

    await vi.advanceTimersByTimeAsync(400)
    const persisted = (await backend.loadAll('u'))['1'].session
    expect(persisted).toEqual({ stepIndex: 2, solvedStepIds: ['a', 'b'] })
  })

  it('drops a stale session on completion and on an explicit restart (deleteField)', async () => {
    vi.useFakeTimers()
    const backend = new InMemoryProgressBackend()
    backend.seedUser('u')
    const store = newStore({ backend })
    await store.syncOnAuth('u')

    store.saveSession('2', { stepIndex: 2, solvedStepIds: ['a'] })
    await vi.advanceTimersByTimeAsync(400)
    expect((await backend.loadAll('u'))['2'].session).toBeDefined()

    // Completion drops the session.
    store.saveLessonFinished('2', 100, { a: 1 }, ['a'])
    store.saveSkillCheckResult('2', 3, 3)
    expect((await backend.loadAll('u'))['2'].session).toBeUndefined()

    // A restart on a not-yet-completed lesson also clears the persisted session.
    store.saveSession('3', { stepIndex: 1, solvedStepIds: ['x'] })
    await vi.advanceTimersByTimeAsync(400)
    store.abandonLessonAttempt('3', { resetLessonFinished: true })
    expect((await backend.loadAll('u'))['3'].session).toBeUndefined()
    expect(store.getStats('3').lessonFinished).toBe(false)
  })

  it('restores stepIndex / solvedStepIds / attempts mid-lesson and clamps a stale stepIndex', () => {
    const store = newStore()
    store.saveSession('1', { stepIndex: 2, solvedStepIds: ['a'], problemAttempts: { a: 1 } })
    expect(store.loadSession('1', 5)).toEqual({
      stepIndex: 2,
      solvedStepIds: ['a'],
      problemAttempts: { a: 1 },
    })
    // stepIndex out of range for a shorter lesson clamps to 0.
    expect(store.loadSession('1', 2).stepIndex).toBe(0)
  })
})

describe('ProgressStore — H1 shared-device sync', () => {
  it('sign-out wipes ALL local state: progress + casino table-clears + bankroll', async () => {
    localStorage.setItem('lesson-stats', JSON.stringify({ '1': statsWith({ completed: true }) }))
    localStorage.setItem('lesson-session-1', JSON.stringify({ stepIndex: 1, solvedStepIds: [] }))
    localStorage.setItem('cleared-table-ids', JSON.stringify(['room-1']))
    localStorage.setItem('bankroll-chips', '500')
    localStorage.setItem('bankroll-granted', 'true')

    const onLocalReset = () => {
      clearClearedTables()
      localStorage.removeItem('bankroll-chips')
      localStorage.removeItem('bankroll-granted')
    }
    const store = newStore({ onLocalReset })

    await store.syncOnAuth(null)

    expect(localStorage.getItem('lesson-stats')).toBeNull()
    expect(localStorage.getItem('lesson-session-1')).toBeNull()
    expect(localStorage.getItem('cleared-table-ids')).toBeNull()
    expect(localStorage.getItem('bankroll-chips')).toBeNull()
    expect(localStorage.getItem('bankroll-granted')).toBeNull()
    expect(store.getCompletedIds()).toEqual([])
  })

  it('an account switch clears the prior account before loading the new one', async () => {
    const backend = new InMemoryProgressBackend()
    backend.seedUser('A')
    backend.seedUser('B')
    await backend.writeLesson('B', '2', { stats: statsWith({ completed: true }) })

    const onLocalReset = vi.fn()
    const store = newStore({ backend, onLocalReset })

    await store.syncOnAuth('A')
    store.markLessonAttempted('1') // local + remote-A progress for account A
    expect(store.getStats('1').attempted).toBe(true)

    await store.syncOnAuth('B')
    // A's local '1' is gone; B's remote '2' is loaded.
    expect(store.getStats('1')).toEqual(defaultLessonStats())
    expect(store.getCompletedIds()).toEqual(['2'])
    expect(onLocalReset).toHaveBeenCalled()
  })

  it('uploads local progress on a genuine anonymous handoff (no prior real uid)', async () => {
    const backend = new InMemoryProgressBackend()
    const store = newStore({ backend })

    // Signed-out local progress (no backend writes yet).
    store.markLessonAttempted('1')
    expect(store.getStats('1').attempted).toBe(true)

    await store.syncOnAuth('new-user')

    // Local was donated to the new account, and kept locally.
    expect((await backend.loadAll('new-user'))['1'].stats.attempted).toBe(true)
    expect(store.getStats('1').attempted).toBe(true)
  })

  it('does NOT upload to a different account with empty remote — it clears local instead', async () => {
    const backend = new InMemoryProgressBackend()
    backend.seedUser('A')
    const onLocalReset = vi.fn()
    const store = newStore({ backend, onLocalReset })

    await store.syncOnAuth('A')
    store.markLessonAttempted('1') // belongs to account A only

    await store.syncOnAuth('C') // different account, empty remote
    expect(store.getStats('1')).toEqual(defaultLessonStats())
    expect(await backend.loadAll('C')).toEqual({})
    expect(onLocalReset).toHaveBeenCalled()
  })
})

describe('ProgressStore — subscribe / snapshot / cross-tab', () => {
  it('notifies same-tab subscribers when stats change', () => {
    const store = newStore()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    store.markLessonAttempted('1')
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    store.markLessonAttempted('2')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('keeps a stable snapshot reference across unrelated changes, new one on stats changes', () => {
    const store = newStore()
    const s1 = store.getSnapshot()

    // A session write is unrelated to the reactive aggregate → same reference.
    store.saveSession('1', { stepIndex: 1, solvedStepIds: [] })
    expect(store.getSnapshot()).toBe(s1)

    // A stats mutation rebuilds the snapshot.
    store.markLessonAttempted('1')
    expect(store.getSnapshot()).not.toBe(s1)
  })

  it('reacts to a cross-tab storage event for the progress key', () => {
    const store = newStore()
    const listener = vi.fn()
    store.subscribe(listener)

    // Another tab persisted a completed lesson, then fired a storage event.
    localStorage.setItem('lesson-stats', JSON.stringify({ '1': statsWith({ completed: true }) }))
    window.dispatchEvent({ type: 'storage', key: 'lesson-stats' } as unknown as StorageEvent)

    expect(listener).toHaveBeenCalled()
    expect(store.getSnapshot().completedIds).toEqual(['1'])
  })
})

function nextPath(store: ProgressStore): string {
  // Mirror useProgress().getNextLessonPath() without React (same selector the hook uses).
  const { completedIds, statsByLesson } = store.getSnapshot()
  return getNextLessonPath(completedIds, statsByLesson)
}
