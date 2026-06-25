/**
 * Phase 2 "AI casino tables" — the 5 playable tables on the Casino Floor.
 *
 * Two features sit on top of the same hand engine:
 *  - Feature 1 ("coached"): opponents play via the synchronous rule AI (`decideAI`),
 *    and an AI coach (`getCoachTip`) talks the hero through each decision. Three
 *    tables walk the rule-AI tiers 1 → 2 → 3 (with 2 / 3 / 3 opponents).
 *  - Feature 2 ("ai"): opponents are driven by the guard-railed LLM
 *    (`decideWithLLM`, falling back to Tier-3 `decideAI` when AI is off), and the
 *    hero gets the always-on rule-based hint bar (`getHint`) — NO coach. Two
 *    tables: a heads-up duel, then a multiway table.
 *
 * Everything still works with AI un-provisioned: coached opponents are already
 * rule-based, and the AI opponents transparently use the injected Tier-3 fallback.
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
  /** Rule-AI difficulty tier for the opponents (Feature 2 also seeds its fallback). */
  tier: 1 | 2 | 3
  /** The opponents seated at the table (the hero is added by the runtime). */
  opponents: { name: string; persona?: string }[]
  smallBlind: number
  bigBlind: number
  startingStack: number
  /** Lesson id or table id that must be cleared/completed before this unlocks. */
  prereqId: string
}

export const tables: TableConfig[] = [
  // --- Feature 1: Coached tables (rule AI + AI coach), tiers 1 → 2 → 3 ---------
  {
    id: 'tbl-coached-1',
    title: 'The Kitchen Table',
    subtitle: 'Coached · 2 loose opponents',
    feature: 'coached',
    tier: 1,
    opponents: [
      { name: 'Sticky Pete', persona: 'a friendly calling station who hates folding' },
      { name: 'Lucky Lou', persona: 'a loose recreational player chasing every draw' },
    ],
    smallBlind: 5,
    bigBlind: 10,
    startingStack: 500,
    // The capstone arena opens once the whole 8-lesson course is complete.
    prereqId: '8',
  },
  {
    id: 'tbl-coached-2',
    title: 'The Card Room',
    subtitle: 'Coached · 3 solid opponents',
    feature: 'coached',
    tier: 2,
    opponents: [
      { name: 'Steady Sam', persona: 'a tight-aggressive regular who respects position' },
      { name: 'Math Maria', persona: 'a disciplined player who only continues with the odds' },
      { name: 'Patient Priya', persona: 'a thoughtful grinder who value-bets strong hands' },
    ],
    smallBlind: 5,
    bigBlind: 10,
    startingStack: 600,
    prereqId: 'tbl-coached-1',
  },
  {
    id: 'tbl-coached-3',
    title: 'The High Limit Room',
    subtitle: 'Coached · 3 sharp opponents',
    feature: 'coached',
    tier: 3,
    opponents: [
      { name: 'Sharp Eddie', persona: 'a position-aware shark who punishes weakness' },
      { name: 'Cool Hand Yu', persona: 'a balanced pro who mixes value and bluffs' },
      { name: 'The Closer', persona: 'a relentless tournament killer' },
    ],
    smallBlind: 10,
    bigBlind: 20,
    startingStack: 1000,
    prereqId: 'tbl-coached-2',
  },

  // --- Feature 2: AI tables (LLM opponents + rule hint bar) --------------------
  {
    id: 'tbl-ai-1',
    title: 'Heads-Up Arena',
    subtitle: 'AI opponent · heads-up duel',
    feature: 'ai',
    tier: 3,
    opponents: [{ name: 'Ace', persona: 'a confident heads-up specialist who applies relentless pressure' }],
    smallBlind: 10,
    bigBlind: 20,
    startingStack: 1000,
    prereqId: 'tbl-coached-3',
  },
  {
    id: 'tbl-ai-2',
    title: 'The Main Event',
    subtitle: 'AI opponents · 4-handed',
    feature: 'ai',
    tier: 3,
    opponents: [
      { name: 'Viktor', persona: 'a fearless aggressor who loves to three-bet' },
      { name: 'Nadia', persona: 'a tricky pro who traps with monsters' },
      { name: 'Sol', persona: 'a steady veteran who grinds out small edges' },
    ],
    smallBlind: 10,
    bigBlind: 20,
    startingStack: 1200,
    prereqId: 'tbl-ai-1',
  },
]

export function getTable(id: string): TableConfig | undefined {
  return tables.find((t) => t.id === id)
}

/** Every table id (handy for path/unlock lookups). */
export function isTableId(id: string): boolean {
  return tables.some((t) => t.id === id)
}
