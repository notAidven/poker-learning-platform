/**
 * Seeded pseudo-random generator (mulberry32). Deterministic for a given seed, so
 * shuffles and deals are reproducible. Shared by the hand engine and the lesson
 * card widgets so a seed always yields the same sequence everywhere.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
