/**
 * The ProgressBackend contract, exercised against the in-memory adapter (the same
 * contract the Firestore adapter implements). Encodes the behaviour of record of
 * the former `awardLessonCompletion` / `touchStreakForActivity` transactions:
 * idempotent XP, streak-once-per-CAT-day, and the deleteField session drop.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryProgressBackend } from './InMemoryProgressBackend'
import { defaultLessonStats, type LessonStats } from './types'
import type { LessonXpBreakdown } from '../gamification'

function statsWith(overrides: Partial<LessonStats>): LessonStats {
  return { ...defaultLessonStats(), ...overrides }
}

const FIRST_TRY: LessonXpBreakdown = { base: 100, bonus: 50, total: 150 }
const completedStats = statsWith({ attempted: true, lessonFinished: true, completed: true })

describe('InMemoryProgressBackend — loadAll / writeLesson round-trip', () => {
  let backend: InMemoryProgressBackend

  beforeEach(() => {
    backend = new InMemoryProgressBackend()
  })

  it('returns an empty map for an unknown user', async () => {
    expect(await backend.loadAll('nobody')).toEqual({})
  })

  it('persists stats and keeps an ACTIVE session', async () => {
    await backend.writeLesson('u', '1', {
      stats: statsWith({ attempted: true }),
      session: { stepIndex: 2, solvedStepIds: ['a'], problemAttempts: { a: 1 } },
    })

    const all = await backend.loadAll('u')
    expect(all['1'].stats.attempted).toBe(true)
    expect(all['1'].session).toEqual({ stepIndex: 2, solvedStepIds: ['a'], problemAttempts: { a: 1 } })
  })

  it('drops an INACTIVE session (deleteField semantics under merge)', async () => {
    await backend.writeLesson('u', '1', {
      stats: statsWith({ attempted: true }),
      session: { stepIndex: 3, solvedStepIds: ['a'] },
    })
    // A later write with an empty session must REMOVE the stored one, not leave it.
    await backend.writeLesson('u', '1', {
      stats: statsWith({ attempted: true, lessonFinished: true }),
      session: { stepIndex: 0, solvedStepIds: [] },
    })

    const all = await backend.loadAll('u')
    expect(all['1'].session).toBeUndefined()
    expect(all['1'].stats.lessonFinished).toBe(true)
  })
})

describe('InMemoryProgressBackend — completeLesson (atomic, idempotent)', () => {
  let backend: InMemoryProgressBackend
  let today: string

  beforeEach(() => {
    today = '2026-01-10'
    backend = new InMemoryProgressBackend({ today: () => today })
  })

  it('awards first-completion XP exactly once; a retake awards 0 but still advances the streak', async () => {
    backend.seedUser('u', { totalXp: 0, level: 1, streak: 0, lastActivityDate: null })

    const first = await backend.completeLesson('u', '1', FIRST_TRY, completedStats)
    expect(first?.xpAwarded).toBe(150)
    expect(first?.totalXp).toBe(150)
    expect(first?.streak).toBe(1)
    expect(backend.getUser('u')).toMatchObject({ totalXp: 150, streak: 1, lastActivityDate: '2026-01-10' })

    // Same-day retake: no XP, streak unchanged (already credited today).
    const retakeSameDay = await backend.completeLesson('u', '1', FIRST_TRY, completedStats)
    expect(retakeSameDay?.xpAwarded).toBe(0)
    expect(backend.getUser('u')).toMatchObject({ totalXp: 150, streak: 1 })

    // Next-day retake: still no XP, but the streak advances once for the new day.
    today = '2026-01-11'
    const retakeNextDay = await backend.completeLesson('u', '1', FIRST_TRY, completedStats)
    expect(retakeNextDay?.xpAwarded).toBe(0)
    expect(backend.getUser('u')).toMatchObject({ totalXp: 150, streak: 2, lastActivityDate: '2026-01-11' })
  })

  it('computes level from the new total XP and reports leveledUp', async () => {
    backend.seedUser('u', { totalXp: 0, level: 1 })
    const award = await backend.completeLesson('u', '1', FIRST_TRY, completedStats)
    // 150 XP: level 1 needs 100, then 50 into level 2 (needs 125) → level 2.
    expect(award?.level).toBe(2)
    expect(award?.leveledUp).toBe(true)
  })

  it('records completion but awards nothing when the user doc is missing (returns null)', async () => {
    const award = await backend.completeLesson('ghost', '1', FIRST_TRY, completedStats)
    expect(award).toBeNull()
    const all = await backend.loadAll('ghost')
    expect(all['1'].stats.completed).toBe(true)
  })

  it('drops a stale session on completion', async () => {
    backend.seedUser('u')
    await backend.writeLesson('u', '1', {
      stats: statsWith({ attempted: true }),
      session: { stepIndex: 2, solvedStepIds: ['a'] },
    })
    await backend.completeLesson('u', '1', FIRST_TRY, completedStats)
    const all = await backend.loadAll('u')
    expect(all['1'].session).toBeUndefined()
  })
})

describe('InMemoryProgressBackend — streak CAT-day math', () => {
  it('resets the streak to 1 after a missed day', async () => {
    let today = '2026-03-01'
    const backend = new InMemoryProgressBackend({ today: () => today })
    backend.seedUser('u', { streak: 5, lastActivityDate: '2026-02-20' })

    await backend.completeLesson('u', '1', FIRST_TRY, completedStats)
    expect(backend.getUser('u')).toMatchObject({ streak: 1, lastActivityDate: '2026-03-01' })

    // Consecutive day → +1.
    today = '2026-03-02'
    await backend.completeLesson('u', '2', FIRST_TRY, completedStats)
    expect(backend.getUser('u')).toMatchObject({ streak: 2 })
  })
})

describe('InMemoryProgressBackend — touchStreak (review activity, no XP)', () => {
  it('advances the streak once per day without awarding XP, and is a no-op when already credited', async () => {
    const today = '2026-04-02'
    const backend = new InMemoryProgressBackend({ today: () => today })
    backend.seedUser('u', { totalXp: 300, streak: 1, lastActivityDate: '2026-04-01' })

    await backend.touchStreak('u')
    expect(backend.getUser('u')).toMatchObject({ totalXp: 300, streak: 2, lastActivityDate: '2026-04-02' })

    // Same day again → unchanged.
    await backend.touchStreak('u')
    expect(backend.getUser('u')).toMatchObject({ streak: 2 })

    // Unknown user → no throw, no effect.
    await expect(backend.touchStreak('ghost')).resolves.toBeUndefined()
  })
})

describe('InMemoryProgressBackend — clear', () => {
  it('drops all of a user\'s remote progress', async () => {
    const backend = new InMemoryProgressBackend()
    await backend.writeLesson('u', '1', { stats: statsWith({ completed: true }) })
    await backend.clear('u')
    expect(await backend.loadAll('u')).toEqual({})
  })
})
