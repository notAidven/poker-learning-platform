/**
 * The write-through local-cache primitive shared by the ProgressStore's aggregates.
 *
 * Both the lesson-stats map and the per-concept review map are offline-first mirrors:
 * a plain `Record<string, T>` JSON-encoded under one localStorage key, read back
 * (optionally sanitizing each entry), and re-read on a cross-tab `storage` event.
 * This is that cache machinery written ONCE, so the next aggregate rides the same
 * primitive instead of duplicating read/persist for itself. Pure and storage-only
 * (no React, no backend) — the interface is the test surface.
 */

/**
 * Read a `Record<string, T>` mirror from localStorage. A missing/invalid blob reads
 * as `{}`. When `sanitizeEntry` is given, each value is run through it and dropped if
 * it returns null (so a corrupt entry is skipped, never thrown).
 */
export function readMirror<T>(
  key: string,
  sanitizeEntry?: (value: unknown) => T | null,
): Record<string, T> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    if (!sanitizeEntry) return parsed as Record<string, T>
    const out: Record<string, T> = {}
    for (const [entryKey, value] of Object.entries(parsed)) {
      const entry = sanitizeEntry(value)
      if (entry) out[entryKey] = entry
    }
    return out
  } catch {
    return {}
  }
}

/** Write a `Record<string, T>` mirror to localStorage; storage errors are swallowed. */
export function persistMirror<T>(key: string, map: Record<string, T>): void {
  try {
    localStorage.setItem(key, JSON.stringify(map))
  } catch {
    // Ignore storage errors (private mode / disabled storage): reads still work.
  }
}
