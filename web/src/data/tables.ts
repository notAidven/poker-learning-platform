/**
 * Phase 2 "Casino Floor" — exactly TWO rooms, both on the same hand engine.
 *
 *  - Room 1 ("coached"): opponents play via the synchronous rule AI (`decideAI`),
 *    and an AI coach (`getCoachTip`) talks the hero through each spot AND reacts to
 *    every play. Built so it works fully with AI off (the coach falls back to the
 *    rule-based read, and reactions are derived from the rule logic).
 *  - Room 2 ("ai"): opponents are driven by the guard-railed LLM (`decideWithLLM`,
 *    falling back to the Tier-3 `decideAI` when AI is off), and the hero gets the
 *    always-on rule-based hint bar (`getHint`) — NO coach.
 *
 * Everything still works with AI un-provisioned: Room 1's opponents are already
 * rule-based, and Room 2's opponents transparently use the injected Tier-3 fallback.
 *
 * This module is pure data with no imports, so it can be consumed anywhere
 * (the course path, the table page, the runtime adapter) without cycles.
 */

export type TableFeature = 'coached' | 'ai'

export type TableConfig = {
  id: string
  title: string
  subtitle?: string
  feature: TableFeature
  /** Rule-AI difficulty tier for the opponents (Room 2 also seeds its fallback). */
  tier: 1 | 2 | 3
  /** The opponents seated at the table (the hero is added by the runtime). */
  opponents: { name: string; persona?: string }[]
  smallBlind: number
  bigBlind: number
  startingStack: number
  /**
   * What must clear before this room unlocks. Room 1's prereq is a lesson id, so it
   * opens once the whole course is complete (the all-lessons gate). Room 2's prereq
   * is Room 1's table id, so it opens only after Room 1 is cleared.
   */
  prereqId: string
}

export const tables: TableConfig[] = [
  // --- Room 1: coached (rule AI opponents + an AI coach that also reacts) -------
  {
    id: 'room-1',
    title: 'The Coaching Room',
    subtitle: 'Coach on · friendly rule-based opponents',
    feature: 'coached',
    tier: 2,
    opponents: [
      { name: 'Sticky Pete', persona: 'a friendly calling station who hates folding' },
      { name: 'Steady Sam', persona: 'a tight player who respects position' },
    ],
    smallBlind: 5,
    bigBlind: 10,
    startingStack: 500,
    // Opens once the whole course is complete (a lesson id, so it is not a table gate).
    prereqId: '8',
  },

  // --- Room 2: AI opponents + the rule-based hint bar (no coach) ----------------
  {
    id: 'room-2',
    title: 'The AI Lounge',
    subtitle: 'AI opponents · strategy hint bar',
    feature: 'ai',
    tier: 3,
    opponents: [
      { name: 'Ace', persona: 'a confident pro who applies relentless pressure' },
      { name: 'Nadia', persona: 'a tricky player who traps with monster hands' },
      { name: 'Sol', persona: 'a steady veteran who grinds out small edges' },
    ],
    smallBlind: 10,
    bigBlind: 20,
    startingStack: 1000,
    prereqId: 'room-1',
  },
]

export function getTable(id: string): TableConfig | undefined {
  return tables.find((t) => t.id === id)
}

/** Every table id (handy for path/unlock lookups). */
export function isTableId(id: string): boolean {
  return tables.some((t) => t.id === id)
}
