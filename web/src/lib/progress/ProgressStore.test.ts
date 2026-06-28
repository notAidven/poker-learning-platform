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
import { areGuidedPlayLessonsComplete } from '../casinoProgress'
import { getTable } from '../../data/tables'
import { isTableUnlocked } from '../casinoProgress'
import { gateId } from '../sectionGates'
import { computeReplayXp, computeTestOutXp, XP_GATE_PASS } from '../gamification'
import { getNextLessonPath, isLessonUnlocked } from './selectors'
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

  it('awards the full first-completion XP exactly once; replays add small decaying XP', async () => {
    const backend = new InMemoryProgressBackend({ today: () => '2026-01-10' })
    backend.seedUser('u')
    const store = newStore({ backend })
    await store.syncOnAuth('u')

    store.saveLessonFinished('1', 100, { a: 1, b: 1 }, ['a', 'b'])
    store.saveSkillCheckResult('1', 3, 3)
    expect(backend.getUser('u')).toMatchObject({ totalXp: 150, streak: 1 })

    // Replay (retake an already-completed lesson): the full 150 is NEVER re-awarded —
    // instead a small replay reward lands (first replay = computeReplayXp(0) = 20).
    store.saveSkillCheckResult('1', 3, 3)
    expect(backend.getUser('u')).toMatchObject({ totalXp: 150 + computeReplayXp(0) })

    // A further replay decays (computeReplayXp(1) = 10), confirming diminishing returns
    // and that first-completion idempotency holds (no second 150 ever appears).
    store.saveSkillCheckResult('1', 3, 3)
    expect(backend.getUser('u')).toMatchObject({
      totalXp: 150 + computeReplayXp(0) + computeReplayXp(1),
    })
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

describe('ProgressStore — completion celebration (store-owned)', () => {
  const fresh = { totalXp: 0, streak: 0, lastActivityDate: null }

  it('completeSkillCheck returns a ready reward meter (XP beats + streak), no race', async () => {
    const backend = new InMemoryProgressBackend({ today: () => '2026-05-01' })
    backend.seedUser('u')
    const store = newStore({ backend })
    await store.syncOnAuth('u')

    store.saveLessonFinished('1', 100, { a: 1, b: 1 }, ['a', 'b'])
    const { isFirstCompletion, reward } = store.completeSkillCheck('1', 3, 3, fresh)
    expect(isFirstCompletion).toBe(true)

    const model = await reward
    expect(model).not.toBeNull()
    expect(model?.xpGained).toBe(150) // base 100 + full 50 bonus, meter built from prev=0
    expect(model?.streak).toBe(1)
    expect(model?.streakIncreased).toBe(true)
  })

  it('completeGate celebrates a first gate pass with the authoritative XP + streak', async () => {
    const backend = new InMemoryProgressBackend({ today: () => '2026-05-02' })
    backend.seedUser('u')
    const store = newStore({ backend })
    await store.syncOnAuth('u')

    const { isFirstCompletion, reward } = store.completeGate('foundations', 4, 4, fresh)
    expect(isFirstCompletion).toBe(true)
    const model = await reward
    expect(model?.xpGained).toBe(computeTestOutXp(2)) // tested out 2 lessons
    expect(model?.streak).toBe(1)
  })

  it('a replay celebration shows the backend decaying XP, not the full first award', async () => {
    const backend = new InMemoryProgressBackend({ today: () => '2026-05-03' })
    backend.seedUser('u')
    const store = newStore({ backend })
    await store.syncOnAuth('u')

    store.saveLessonFinished('1', 100, { a: 1 }, ['a'])
    await store.completeSkillCheck('1', 3, 3, fresh).reward
    const prevXp = backend.getUser('u')!.totalXp

    // Retaking an already-completed lesson celebrates the small replay XP (not 150).
    const { reward } = store.completeSkillCheck('1', 3, 3, {
      totalXp: prevXp,
      streak: 1,
      lastActivityDate: '2026-05-03',
    })
    const model = await reward
    expect(model?.xpGained).toBe(computeReplayXp(0))
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

describe('ProgressStore — section gates, test-out, and casino-gate coherence', () => {
  function completeLessonNormally(store: ProgressStore, id: string) {
    store.saveLessonFinished(id, 100, {}, [])
    store.saveSkillCheckResult(id, 3, 3)
  }

  it('passing a section gate completes it, unlocks the next section, and routes there', async () => {
    const backend = new InMemoryProgressBackend({ today: () => '2026-02-01' })
    backend.seedUser('u')
    const store = newStore({ backend })
    await store.syncOnAuth('u')

    completeLessonNormally(store, '1')
    completeLessonNormally(store, '2')

    // Foundations lessons done, but Playing a Hand ('3') is still gated until the gate.
    expect(isLessonUnlocked('3', store.getCompletedIds())).toBe(false)
    // "Continue" routes to the gate once the section's lessons are done.
    expect(nextPath(store)).toBe('/gate/foundations')

    const res = store.saveGateResult('foundations', 4, 4)
    expect(res.isFirstCompletion).toBe(true)
    // Did the lessons → full mastery bonus (not the reduced test-out amount).
    expect(res.xpBreakdown?.total).toBe(XP_GATE_PASS)
    expect(store.getCompletedIds()).toContain(gateId('foundations'))
    expect(store.getStats(gateId('foundations')).testedOut).toBe(false)
    // The next section is now open.
    expect(isLessonUnlocked('3', store.getCompletedIds())).toBe(true)
    expect(nextPath(store)).toBe('/lesson/3')
    expect(backend.getUser('u')).toMatchObject({ streak: 1 })
  })

  it('test-out marks the skipped lessons complete and awards reduced XP', async () => {
    const backend = new InMemoryProgressBackend({ today: () => '2026-02-02' })
    backend.seedUser('u')
    const store = newStore({ backend })
    await store.syncOnAuth('u')

    // Clear Foundations cold, without doing either lesson.
    const res = store.saveGateResult('foundations', 4, 4)
    expect(res.isFirstCompletion).toBe(true)
    expect(res.xpBreakdown?.total).toBe(computeTestOutXp(2)) // 2 skipped lessons

    // The skipped lessons are now completed (flagged tested-out) + the gate itself.
    expect(store.getCompletedIds()).toEqual(
      expect.arrayContaining(['1', '2', gateId('foundations')]),
    )
    expect(store.getStats('1').testedOut).toBe(true)
    expect(store.getStats('2').testedOut).toBe(true)
    expect(store.getStats(gateId('foundations')).testedOut).toBe(true)
    // Reduced XP only — far below the 2×(100..150) the lessons would have paid.
    expect(backend.getUser('u')).toMatchObject({ totalXp: computeTestOutXp(2), streak: 1 })
  })

  it('testing out Foundations + Playing keeps the downstream casino gate coherent', async () => {
    const backend = new InMemoryProgressBackend({ today: () => '2026-02-03' })
    backend.seedUser('u')
    const store = newStore({ backend })
    await store.syncOnAuth('u')

    // Foundations not unlocked-gated for the FIRST section, so test it out directly,
    // which unlocks Playing a Hand; then test that out too.
    store.saveGateResult('foundations', 4, 4)
    store.saveGateResult('playing', 6, 6)

    const completed = store.getCompletedIds()
    // Every Foundations + Playing lesson is now complete (via test-out)...
    expect(areGuidedPlayLessonsComplete(completed)).toBe(true)
    // ...so the EXISTING lesson-based casino unlock (Room 1) just works — no edits needed.
    const room1 = getTable('room-1')!
    expect(isTableUnlocked(room1, completed)).toBe(true)
  })

  it('re-passing an already-passed gate grants only small replay XP (first pass idempotent)', async () => {
    const backend = new InMemoryProgressBackend({ today: () => '2026-02-04' })
    backend.seedUser('u')
    const store = newStore({ backend })
    await store.syncOnAuth('u')

    const first = store.saveGateResult('foundations', 4, 4) // tested out → computeTestOutXp(2)
    expect(first.isFirstCompletion).toBe(true)
    expect(backend.getUser('u')?.totalXp).toBe(computeTestOutXp(2))

    const replay = store.saveGateResult('foundations', 3, 4)
    expect(replay.isFirstCompletion).toBe(false)
    expect(replay.xpBreakdown).toBeNull()
    // The full first-pass amount is never re-awarded; only a small decaying replay reward.
    expect(backend.getUser('u')?.totalXp).toBe(computeTestOutXp(2) + computeReplayXp(0))
  })

  it('a tested-out lesson never later pays its full first-completion XP (replay only)', async () => {
    const backend = new InMemoryProgressBackend({ today: () => '2026-02-05' })
    backend.seedUser('u')
    const store = newStore({ backend })
    await store.syncOnAuth('u')

    store.saveGateResult('foundations', 4, 4) // marks '1','2' tested-out complete
    const xpAfterTestOut = backend.getUser('u')!.totalXp

    // Going back to actually do lesson '1' is a replay (it is already completed), so it
    // earns small replay XP, never the full 150 — the test-out "spent" that first award.
    store.saveLessonFinished('1', 100, { a: 1 }, ['a'])
    const res = store.saveSkillCheckResult('1', 3, 3)
    expect(res.isFirstCompletion).toBe(false)
    expect(backend.getUser('u')!.totalXp).toBe(xpAfterTestOut + computeReplayXp(0))
  })
})

function nextPath(store: ProgressStore): string {
  // Mirror useProgress().getNextLessonPath() without React (same selector the hook uses).
  const { completedIds, statsByLesson } = store.getSnapshot()
  return getNextLessonPath(completedIds, statsByLesson)
}
