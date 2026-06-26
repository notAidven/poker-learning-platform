/**
 * Pure sanitizers for persisted lesson-progress shapes (localStorage + backend).
 * Dependency-free so the store, the selectors, and every backend adapter can share
 * them without creating an import cycle.
 */

/** Keep only the string entries of an unknown value; non-arrays become `[]`. */
export function sanitizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((id): id is string => typeof id === 'string')
    : []
}

/**
 * Keep only the positive-number submit counts from an unknown problem-attempts map.
 * A missing / non-object value becomes `undefined`; callers map it to `null` where
 * their persisted shape uses null for "none".
 */
export function sanitizeProblemAttempts(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== 'object') return undefined
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0,
    ),
  )
}
