/**
 * Casino Floor (Phase 2) "cleared-tables" store — kept entirely OUT of the lesson
 * XP economy. A room is "cleared" the first time a hand reaches showdown (or the
 * hero wins one); there is no XP and no skill check.
 *
 * Unlock gating (two-room model):
 *  - The whole Casino Floor opens only once EVERY lesson is complete.
 *  - Room 1 (coached) then opens immediately (its prereq is a lesson id).
 *  - Room 2 (AI) opens only after Room 1 has been cleared (its prereq is Room 1).
 *
 * Consumers read these synchronously during render; a table is only ever cleared on
 * the table page (off the course path), so a fresh read on the next mount reflects it.
 */
import { lessons } from '../data/lessons'
import { isTableId, tables, type TableConfig } from '../data/tables'

const CLEARED_TABLES_KEY = 'cleared-table-ids'

/** True when every interactive lesson (kind !== 'ai-table') is in the completed set. */
export function areAllLessonsComplete(completedLessonIds: string[]): boolean {
  return lessons
    .filter((l) => l.kind !== 'ai-table')
    .every((l) => completedLessonIds.includes(l.id))
}

/** True once the learner has cleared the coached room (Room 1). */
export function hasClearedAnyCoachedTable(): boolean {
  const cleared = getClearedTableIds()
  return tables.some((t) => t.feature === 'coached' && cleared.includes(t.id))
}

export function getClearedTableIds(): string[] {
  try {
    const raw = localStorage.getItem(CLEARED_TABLES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function isTableCleared(tableId: string): boolean {
  return getClearedTableIds().includes(tableId)
}

/** Mark a table cleared (idempotent). */
export function markTableCleared(tableId: string): void {
  const current = getClearedTableIds()
  if (current.includes(tableId)) return
  const next = [...current, tableId]
  try {
    localStorage.setItem(CLEARED_TABLES_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage errors (private mode / disabled storage): play still works.
  }
}

/**
 * Whether a casino room is unlocked (two-room model).
 *
 *  - Nothing in the casino opens until ALL lessons are complete.
 *  - Room 1's prereq is a lesson id (so the all-lessons gate alone opens it).
 *  - Room 2's prereq is Room 1 (a table id), so it opens once Room 1 is cleared.
 */
export function isTableUnlocked(table: TableConfig, completedLessonIds: string[]): boolean {
  if (!areAllLessonsComplete(completedLessonIds)) return false
  if (!isTableId(table.prereqId)) return true
  return isTableCleared(table.prereqId)
}

/** Drop the local cleared-tables list (used by the shared-device H1 reset). */
export function clearClearedTables(): void {
  try {
    localStorage.removeItem(CLEARED_TABLES_KEY)
  } catch {
    // Ignore storage errors.
  }
}
