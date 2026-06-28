/**
 * The shared write-through cache primitive is the test surface here: read/persist
 * round-trips, the missing/corrupt-blob fallbacks, and per-entry sanitization (the
 * review map's safety net) — exercised once for the machinery both aggregates ride.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { persistMirror, readMirror } from './localMirror'

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
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage())
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('readMirror / persistMirror', () => {
  it('round-trips a record', () => {
    persistMirror('k', { a: 1, b: 2 })
    expect(readMirror<number>('k')).toEqual({ a: 1, b: 2 })
  })

  it('reads a missing or non-object blob as an empty record', () => {
    expect(readMirror('missing')).toEqual({})
    localStorage.setItem('k', '"a string, not an object"')
    expect(readMirror('k')).toEqual({})
    localStorage.setItem('k', '{ not json')
    expect(readMirror('k')).toEqual({})
  })

  it('drops entries the sanitizer rejects, keeps the rest', () => {
    localStorage.setItem('k', JSON.stringify({ good: 5, bad: -1, alsoGood: 9 }))
    const positiveOnly = (v: unknown): number | null =>
      typeof v === 'number' && v > 0 ? v : null
    expect(readMirror<number>('k', positiveOnly)).toEqual({ good: 5, alsoGood: 9 })
  })
})
