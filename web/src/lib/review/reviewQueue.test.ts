import { describe, expect, it } from 'vitest'
import type { ConceptId } from '../../types/concept'
import { buildReviewQueue, collectReviewPool, conceptsGradedBy, makeSeededRng } from './reviewQueue'
import type { ReviewItem } from './types'

const A = 'deck-basics' as ConceptId
const B = 'hand-rankings' as ConceptId
const C = 'showdown' as ConceptId
const OTHER = 'equity' as ConceptId

/** A minimal ReviewItem with a stub skill-check question (config/answer unused here). */
function item(id: string, concepts: ConceptId[]): ReviewItem {
  return {
    questionId: id,
    lessonId: 'L',
    concepts,
    question: { id, prompt: id, interaction: 'card-deck', config: {}, answer: {} },
  }
}

/** RNG that maps Fisher–Yates to the identity permutation (keeps authored order). */
const identityRng = () => 0.999

const conceptsOf = (queue: ReviewItem[]) => queue.map((q) => q.concepts[0])
const idsOf = (queue: ReviewItem[]) => queue.map((q) => q.questionId)

describe('buildReviewQueue — interleaving', () => {
  it('drains one concept per round, round-robin across concepts', () => {
    const pool = [
      item('a1', [A]),
      item('a2', [A]),
      item('a3', [A]),
      item('b1', [B]),
      item('b2', [B]),
      item('c1', [C]),
      item('c2', [C]),
      item('c3', [C]),
    ]

    const queue = buildReviewQueue(pool, [A, B, C], 99, identityRng)

    // Round 0: a1,b1,c1 — round 1: a2,b2,c2 — round 2: a3,(B drained),c3.
    expect(idsOf(queue)).toEqual(['a1', 'b1', 'c1', 'a2', 'b2', 'c2', 'a3', 'c3'])
    // Concepts cycle rather than grouping all of one concept together.
    expect(conceptsOf(queue)).toEqual([A, B, C, A, B, C, A, C])
  })

  it('never places the same concept back-to-back while >1 concept has items', () => {
    const pool = [item('a1', [A]), item('a2', [A]), item('a3', [A]), item('b1', [B]), item('b2', [B])]
    const queue = buildReviewQueue(pool, [A, B], 99, identityRng)
    // a1,b1,a2,b2,a3 — only the trailing a3 is unavoidable once B is empty.
    expect(idsOf(queue)).toEqual(['a1', 'b1', 'a2', 'b2', 'a3'])
  })
})

describe('buildReviewQueue — due filtering', () => {
  it('drops items that train no due concept', () => {
    const pool = [item('a1', [A]), item('x', [OTHER]), item('b1', [B])]
    const queue = buildReviewQueue(pool, [A, B], 99, identityRng)
    expect(idsOf(queue)).toEqual(['a1', 'b1'])
    expect(idsOf(queue)).not.toContain('x')
  })

  it('buckets a multi-concept item once, under its first due concept', () => {
    const pool = [item('x', [A, B]), item('b1', [B])]
    const queue = buildReviewQueue(pool, [A, B], 99, identityRng)
    // x is bucketed under A (first due match) → drained before B's b1; appears once.
    expect(idsOf(queue)).toEqual(['x', 'b1'])
    expect(idsOf(queue).filter((id) => id === 'x')).toHaveLength(1)
  })

  it('returns an empty queue when nothing is due or the limit is non-positive', () => {
    const pool = [item('a1', [A])]
    expect(buildReviewQueue(pool, [], 5, identityRng)).toEqual([])
    expect(buildReviewQueue(pool, [A], 0, identityRng)).toEqual([])
  })
})

describe('buildReviewQueue — limit', () => {
  it('caps the queue at the limit', () => {
    const pool = [item('a1', [A]), item('a2', [A]), item('b1', [B]), item('b2', [B])]
    const queue = buildReviewQueue(pool, [A, B], 3, identityRng)
    expect(queue).toHaveLength(3)
    expect(idsOf(queue)).toEqual(['a1', 'b1', 'a2'])
  })

  it('never exceeds the available eligible items', () => {
    const pool = [item('a1', [A]), item('b1', [B])]
    const queue = buildReviewQueue(pool, [A, B], 50, identityRng)
    expect(queue).toHaveLength(2)
  })
})

describe('buildReviewQueue — determinism', () => {
  const pool = [
    item('a1', [A]),
    item('a2', [A]),
    item('a3', [A]),
    item('b1', [B]),
    item('b2', [B]),
    item('c1', [C]),
  ]

  it('is deterministic with the default seeded rng across repeated calls', () => {
    const first = idsOf(buildReviewQueue(pool, [A, B, C], 99))
    const second = idsOf(buildReviewQueue(pool, [A, B, C], 99))
    expect(first).toEqual(second)
  })

  it('is deterministic for a given explicit seed and varies by seed', () => {
    const seedX = idsOf(buildReviewQueue(pool, [A, B, C], 99, makeSeededRng(1)))
    const seedXAgain = idsOf(buildReviewQueue(pool, [A, B, C], 99, makeSeededRng(1)))
    const seedY = idsOf(buildReviewQueue(pool, [A, B, C], 99, makeSeededRng(2)))
    expect(seedX).toEqual(seedXAgain)
    // The two seeds order the same items (a permutation), just differently overall.
    expect([...seedX].sort()).toEqual([...seedY].sort())
  })
})

describe('conceptsGradedBy — the admission/grading seam', () => {
  it('grades every concept the item trains (a superset of the due one that admitted it)', () => {
    // x is admitted because A is due; answering it re-schedules A AND its sibling B.
    const x = item('x', [A, B])
    const queue = buildReviewQueue([x, item('b1', [B])], [A], 99, identityRng)
    expect(idsOf(queue)).toContain('x') // admitted on the due concept A
    const graded = conceptsGradedBy(x)
    expect(graded).toContain(A) // the due concept that admitted it is graded
    expect(graded).toEqual([A, B]) // and so are its siblings
  })

  it('returns an item with a single concept as just that concept', () => {
    expect(conceptsGradedBy(item('a1', [A]))).toEqual([A])
  })
})

describe('collectReviewPool — integration (reads authored content)', () => {
  it('assembles reviewable items from lessons + skill checks, each with concepts', async () => {
    const pool = await collectReviewPool()

    expect(pool.length).toBeGreaterThan(0)
    for (const reviewItem of pool) {
      expect(typeof reviewItem.questionId).toBe('string')
      expect(reviewItem.questionId.length).toBeGreaterThan(0)
      expect(typeof reviewItem.lessonId).toBe('string')
      expect(Array.isArray(reviewItem.concepts)).toBe(true)
      expect(reviewItem.question).toBeTruthy()
      expect(typeof reviewItem.question.id).toBe('string')
    }
    // questionIds are unique across the whole pool.
    const ids = pool.map((p) => p.questionId)
    expect(new Set(ids).size).toBe(ids.length)
    // Includes both lesson-step items and skill-check (`:sc:`) items.
    expect(pool.some((p) => p.questionId.includes(':sc:'))).toBe(true)
    expect(pool.some((p) => !p.questionId.includes(':sc:'))).toBe(true)
    // Authored lessons all have default concepts, so at least some items are tagged.
    expect(pool.some((p) => p.concepts.length > 0)).toBe(true)
  })
})
