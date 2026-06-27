/**
 * Casino Floor (Phase 3) — the three high-limit tables of the after-hours floor.
 *
 * These are SEPARATE from the in-course practice rooms in `data/tables.ts`
 * (room-1 "The Coaching Room" + room-2 "The AI Lounge"), which stay exactly as
 * they were. The Casino Floor only opens once BOTH in-course tables are cleared
 * (see `lib/casinoProgress.isCasinoFloorUnlocked`).
 *
 * Each table declares a play-money buy-in, blinds, and an `aiTier` that controls
 * how its opponents think (see `lib/poker/casinoAi`):
 *   - 'novice' → rule-based decisions (cheap, weaker), light AI table-talk only.
 *   - 'solid'  → LLM decisions with a loose persona, gated so low stakes don't
 *                hammer the proxy (rule fallback otherwise).
 *   - 'sharp'  → full-strength LLM decisions.
 * Every tier keeps the deterministic rule-based fallback when AI is unconfigured.
 *
 * Pure data with no imports beyond the shared AI-tier type, so it can be consumed
 * anywhere (lobby, play page, runtime adapter, tests) without import cycles.
 */
import type { CasinoAiTier } from '../lib/poker/casinoAi'

export type CasinoAccent = 'brass' | 'ember'

export type CasinoTableConfig = {
  id: string
  /** Room name — rendered as a wide-tracked uppercase brass label. */
  name: string
  /** A short, evocative one-liner for the lobby vignette. */
  tagline: string
  /** Play-money chips moved from the shared bankroll onto the table on buy-in. */
  buyIn: number
  smallBlind: number
  bigBlind: number
  /** Opponents sit with this stack (the hero buys in with `buyIn`). */
  startingStack: number
  /** Difficulty band → opponent decision source + LLM gating. */
  aiTier: CasinoAiTier
  /** Visual treatment: brass by default, ember for the high-limit Vault. */
  accent: CasinoAccent
  /** Seated opponents (the hero is seat 0, added by the runtime). */
  opponents: { name: string; persona?: string }[]
}

export const casinoTables: CasinoTableConfig[] = [
  {
    id: 'parlor',
    name: 'The Parlor',
    tagline: 'Loose, low and friendly. A soft place to find your rhythm.',
    buyIn: 100,
    smallBlind: 1,
    bigBlind: 2,
    startingStack: 100,
    aiTier: 'novice',
    accent: 'brass',
    opponents: [
      { name: 'Sticky Rick', persona: 'a cheerful calling station who hates folding' },
      { name: 'Bingo Bea', persona: 'a loose-passive regular who limps in with anything' },
    ],
  },
  {
    id: 'lounge',
    name: 'The Lounge',
    tagline: 'Velvet booths and thinking players. The stakes start to bite.',
    buyIn: 500,
    smallBlind: 5,
    bigBlind: 10,
    startingStack: 500,
    aiTier: 'solid',
    accent: 'brass',
    opponents: [
      { name: 'Marcus', persona: 'a solid, position-aware regular who plays a tight-aggressive game' },
      { name: 'Lena', persona: 'a thoughtful player who mixes up her lines and avoids predictability' },
      { name: 'Dex', persona: 'a steady grinder who values pot control and rarely spews chips' },
    ],
  },
  {
    id: 'vault',
    name: 'The Vault',
    tagline: 'High-limit, hushed and merciless. Only the brave sit down.',
    buyIn: 2000,
    smallBlind: 25,
    bigBlind: 50,
    startingStack: 2000,
    aiTier: 'sharp',
    accent: 'ember',
    opponents: [
      { name: 'Vivian Cross', persona: 'a ruthless high-stakes pro who applies relentless, well-timed pressure' },
      { name: 'The Banker', persona: 'a cold, calculating player who never makes a math mistake' },
      { name: 'Sol Reyes', persona: 'a battle-hardened veteran shark who traps with monsters and reads opponents cold' },
    ],
  },
]

export function getCasinoTable(id: string): CasinoTableConfig | undefined {
  return casinoTables.find((t) => t.id === id)
}

/** Every casino table id (handy for path/route guards). */
export function isCasinoTableId(id: string): boolean {
  return casinoTables.some((t) => t.id === id)
}

/** The smallest buy-in on the floor — the minimum bankroll needed to sit anywhere. */
export function minCasinoBuyIn(): number {
  return casinoTables.reduce((min, t) => Math.min(min, t.buyIn), Infinity)
}
