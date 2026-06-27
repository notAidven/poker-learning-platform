/**
 * Section Gates — the pure progression rules layered on top of the lesson aggregate.
 *
 * A "section gate" is a per-section mastery quiz that sits at the end of each lesson
 * section (Foundations, Playing a Hand, The Math). A section is COMPLETE iff its gate
 * is passed, and the next section unlocks only once the prior gate is passed. Two ways
 * to pass a gate:
 *   • do the section's lessons, then clear the gate, or
 *   • TEST OUT — clear the gate cold, which also marks the section's lessons complete
 *     so the existing lesson-based casino gates (`areGuidedPlayLessonsComplete`,
 *     `isCasinoFloorUnlocked`, `isTableUnlocked`) stay coherent with no edits to
 *     `casinoProgress.ts`.
 *
 * Gate state is persisted as an ordinary progress doc under a synthetic id
 * `gate-<sectionId>` (so it rides the same backend, idempotent-XP, and replay paths
 * as lessons). This module is PURE — it reads a `statsByLesson` map / a `completedIds`
 * list and never touches the store, so the route guards, the course path, and the
 * tests all share one set of rules.
 */
import { lessons, sections, type LessonMeta, type SectionId } from '../data/lessons'
import type { LessonStats } from './progress/types'

export type StatsByLesson = Record<string, LessonStats>

/** The sections that have lessons AND a gate, in path order (the casino is not gated). */
export const GATED_SECTIONS: SectionId[] = ['foundations', 'playing', 'math']

const GATE_ID_PREFIX = 'gate-'

/** The synthetic progress-doc / path-node id for a section's gate, e.g. `gate-foundations`. */
export function gateId(sectionId: SectionId): string {
  return `${GATE_ID_PREFIX}${sectionId}`
}

/** True when an id is a section-gate id (so the lesson math / route guards can skip it). */
export function isGateId(id: string): boolean {
  return id.startsWith(GATE_ID_PREFIX)
}

/** The section a gate id belongs to, or null when it is not a (gated) gate id. */
export function sectionIdForGateId(id: string): SectionId | null {
  if (!isGateId(id)) return null
  const sectionId = id.slice(GATE_ID_PREFIX.length) as SectionId
  return GATED_SECTIONS.includes(sectionId) ? sectionId : null
}

/** True when this section has a gate (i.e. it is one of the gated lesson sections). */
export function isGatedSection(sectionId: SectionId): boolean {
  return GATED_SECTIONS.includes(sectionId)
}

/** The interactive lesson ids that belong to a section (casino tables excluded). */
export function sectionLessonIds(sectionId: SectionId): string[] {
  return lessons.filter((l) => l.kind !== 'ai-table' && l.kind !== 'gate' && l.section === sectionId).map((l) => l.id)
}

function statsFor(statsByLesson: StatsByLesson, id: string): LessonStats | undefined {
  return statsByLesson[id]
}

/** True once a section's gate has been passed (whether after the lessons or via test-out). */
export function isGatePassed(statsByLesson: StatsByLesson, sectionId: SectionId): boolean {
  return statsFor(statsByLesson, gateId(sectionId))?.completed === true
}

/** A section is COMPLETE exactly when its gate is passed (the core gating rule). */
export function isSectionComplete(statsByLesson: StatsByLesson, sectionId: SectionId): boolean {
  return isGatePassed(statsByLesson, sectionId)
}

/** True when the section was cleared via test-out (gate doc flagged tested-out). */
export function isSectionTestedOut(statsByLesson: StatsByLesson, sectionId: SectionId): boolean {
  return statsFor(statsByLesson, gateId(sectionId))?.testedOut === true
}

/** True once every interactive lesson in the section is completed (worked through or tested out). */
export function areSectionLessonsComplete(completedIds: string[], sectionId: SectionId): boolean {
  const ids = sectionLessonIds(sectionId)
  return ids.length > 0 && ids.every((id) => completedIds.includes(id))
}

/** The gated section immediately before this one in path order, or null for the first. */
export function priorGatedSection(sectionId: SectionId): SectionId | null {
  const index = GATED_SECTIONS.indexOf(sectionId)
  if (index <= 0) return null
  return GATED_SECTIONS[index - 1]
}

/**
 * A gated section is UNLOCKED when the prior section's gate has been passed (the first
 * gated section is always unlocked). Non-gated sections (the casino) are governed by
 * `casinoProgress` instead, so they are reported as unlocked here.
 */
export function isSectionUnlocked(statsByLesson: StatsByLesson, sectionId: SectionId): boolean {
  if (!isGatedSection(sectionId)) return true
  const prior = priorGatedSection(sectionId)
  if (!prior) return true
  return isGatePassed(statsByLesson, prior)
}

/**
 * Whether the gate quiz can be opened at all: the section must be unlocked. (You can
 * take it after finishing the lessons, retake it after passing for replay XP, or take
 * it cold as a test-out — all require the section to be unlocked.)
 */
export function isGateAvailable(statsByLesson: StatsByLesson, sectionId: SectionId): boolean {
  return isGatedSection(sectionId) && isSectionUnlocked(statsByLesson, sectionId)
}

/**
 * Whether the "Test out / Skip section" affordance applies: the section is unlocked,
 * not yet complete, and the learner has NOT already finished all its lessons (in which
 * case the gate is a normal end-of-section gate, not a skip).
 */
export function isTestOutAvailable(
  statsByLesson: StatsByLesson,
  completedIds: string[],
  sectionId: SectionId,
): boolean {
  return (
    isGateAvailable(statsByLesson, sectionId) &&
    !isGatePassed(statsByLesson, sectionId) &&
    !areSectionLessonsComplete(completedIds, sectionId)
  )
}

/** The lessons in a section that are NOT yet completed (the ones a test-out would skip). */
export function pendingSectionLessonIds(completedIds: string[], sectionId: SectionId): string[] {
  return sectionLessonIds(sectionId).filter((id) => !completedIds.includes(id))
}

// ---------------------------------------------------------------------------
// Path-node synthesis: gate nodes are NOT in the `lessons` array (so they never
// count toward lesson completion). They are woven into the path here, each placed
// right after the last lesson of the section it gates.
// ---------------------------------------------------------------------------

const SECTION_TITLE: Record<SectionId, string> = sections.reduce(
  (acc, s) => {
    acc[s.id] = s.title
    return acc
  },
  {} as Record<SectionId, string>,
)

/** The synthetic path-node for a section's gate (kind `'gate'`). */
export function gateNode(sectionId: SectionId): LessonMeta {
  const title = SECTION_TITLE[sectionId] ?? sectionId
  return {
    id: gateId(sectionId),
    title: `${title} Gate`,
    section: sectionId,
    unit: `${title} · Section gate`,
    primaryInteraction: 'Prove the whole section — no hints',
    kind: 'gate',
  }
}

/**
 * Weave gate nodes into the path: each gated section's lessons are followed by that
 * section's gate node, preserving the original order otherwise (so the casino tables
 * stay at the end, ungated). Used by the course path layout.
 */
export function buildCoursePathNodes(nodes: LessonMeta[]): LessonMeta[] {
  const out: LessonMeta[] = []
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i]
    out.push(node)
    const next = nodes[i + 1]
    const section = node.section
    // Insert the section gate after the LAST lesson of a gated section — i.e. when
    // the next node leaves this section (or the path ends) and this is a gated section.
    const isLastOfSection = !next || next.section !== section
    if (isLastOfSection && isGatedSection(section) && node.kind !== 'gate') {
      out.push(gateNode(section))
    }
  }
  return out
}
