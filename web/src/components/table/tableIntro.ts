/**
 * Persistence for the one-time "how this table works" intro. Kept in its own
 * module (not the component file) so the component file only exports a component,
 * which keeps React Fast Refresh happy.
 */
const SEEN_KEY = 'seen-first-table-intro'

/** True once the learner has dismissed the table intro (persisted across sessions). */
export function hasSeenFirstTableIntro(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    // No storage (private mode / disabled): treat as already seen so the intro
    // never blocks play, and simply does not persist.
    return true
  }
}

export function markFirstTableIntroSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Ignore storage errors; the table still works without persisting the flag.
  }
}
