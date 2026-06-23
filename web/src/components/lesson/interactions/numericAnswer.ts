/** Parse learner-entered whole-number count; invalid input returns null. */
export function parseCountInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null
  return n
}

export function hasValidCountInput(raw: string): boolean {
  return parseCountInput(raw) !== null
}

export function countMatches(raw: string, expected: number): boolean {
  const entered = parseCountInput(raw)
  return entered !== null && entered === expected
}
