/**
 * Builds the interleaved Review queue.
 *
 * `buildReviewQueue` is a pure, deterministic transform: given a pool of reviewable
 * items and the concepts due today, it keeps the items that train a due concept,
 * INTERLEAVES them round-robin across concepts (so a session never drills one concept
 * back-to-back), and caps the result. Randomness is confined to an injectable `rng`
 * with a stable seeded default, so the same inputs always yield the same queue.
 *
 * `collectReviewPool` is the one impure helper: it reads the lesson + skill-check
 * registries to assemble every reviewable question. It only READS that authored
 * content; it never mutates a registry.
 */
import { conceptsForLesson } from '../../data/concepts'
import { lessons } from '../../data/lessons'
import { loadLesson } from '../../data/lessonContent'
import { loadSkillCheck } from '../../data/skillCheckContent'
import type { ConceptId } from '../../types/concept'
import { isProblemStep } from '../../types/lesson'
import type { ReviewItem } from './types'

export type { ReviewItem } from './types'

/** Default seed for the queue's RNG (golden-ratio constant). Stable across runs. */
const DEFAULT_SEED = 0x9e3779b9

/**
 * Small, fast, seedable PRNG (mulberry32). Returns a generator of floats in [0, 1).
 * Exported so callers/tests can build a deterministic queue from a chosen seed.
 */
export function makeSeededRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates shuffle driven by the injected rng (does not mutate the input). */
function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

/**
 * Keep the pool items that train at least one due concept, then interleave them
 * round-robin across concepts and cap at `limit`.
 *
 * Each eligible item is bucketed under the FIRST due concept it trains (in
 * `dueConceptIds` order), so an item tagged with several due concepts appears exactly
 * once. Buckets are shuffled internally with `rng` (which question of a concept comes
 * first), then drained one item per concept per round — so consecutive items come from
 * different concepts whenever more than one concept still has items left.
 *
 * Pure and deterministic: with the default seeded rng the same inputs always produce
 * the same queue (the default rng is re-seeded per call, so repeated calls match).
 */
export function buildReviewQueue(
  pool: ReviewItem[],
  dueConceptIds: ConceptId[],
  limit: number,
  rng: () => number = makeSeededRng(DEFAULT_SEED),
): ReviewItem[] {
  if (limit <= 0 || dueConceptIds.length === 0) return []

  const buckets = new Map<ConceptId, ReviewItem[]>()
  for (const conceptId of dueConceptIds) {
    if (!buckets.has(conceptId)) buckets.set(conceptId, [])
  }

  for (const item of pool) {
    const key = dueConceptIds.find((conceptId) => item.concepts.includes(conceptId))
    if (key === undefined) continue // trains no due concept → filtered out
    buckets.get(key)!.push(item)
  }

  const order = [...buckets.values()]
    .map((bucket) => shuffle(bucket, rng))
    .filter((bucket) => bucket.length > 0)

  const queue: ReviewItem[] = []
  let round = 0
  let progressed = true
  while (queue.length < limit && progressed) {
    progressed = false
    for (const bucket of order) {
      if (round < bucket.length) {
        queue.push(bucket[round])
        progressed = true
        if (queue.length >= limit) break
      }
    }
    round += 1
  }
  return queue
}

/**
 * The concepts an answer to a review item GRADES. An item is ADMITTED to the queue
 * when ANY of its concepts is due (see `buildReviewQueue`); answering it then
 * re-schedules ALL of them, so concepts trained together stay in sync. Co-locating
 * this with the admission rule keeps both halves of "which concepts a due item
 * touches" in one place (and assertable) instead of trapped in a component loop.
 */
export function conceptsGradedBy(item: ReviewItem): ConceptId[] {
  return item.concepts
}

/**
 * Assemble every reviewable question from the authored course content: each problem
 * step of every (non-table) lesson plus every skill-check question. A question's
 * concepts are its explicit `concepts` when tagged, else the lesson's default concepts
 * (`conceptsForLesson`), so untagged content still enters the pool. Reads the
 * registries only — never mutates them.
 */
export async function collectReviewPool(): Promise<ReviewItem[]> {
  const lessonIds = lessons.filter((lesson) => lesson.kind !== 'ai-table').map((lesson) => lesson.id)
  const items: ReviewItem[] = []

  for (const lessonId of lessonIds) {
    const fallback = conceptsForLesson(lessonId)

    const lesson = await loadLesson(lessonId)
    if (lesson) {
      for (const step of lesson.steps) {
        if (!isProblemStep(step)) continue
        items.push({
          questionId: `${lessonId}:${step.id}`,
          lessonId,
          concepts: step.concepts ?? fallback,
          question: step,
        })
      }
    }

    const skillCheck = await loadSkillCheck(lessonId)
    if (skillCheck) {
      for (const question of skillCheck.questions) {
        items.push({
          questionId: `${lessonId}:sc:${question.id}`,
          lessonId,
          concepts: question.concepts ?? fallback,
          question,
        })
      }
    }
  }

  return items
}
