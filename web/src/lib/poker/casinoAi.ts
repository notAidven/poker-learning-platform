/**
 * Tiered casino opponents — the pure, deterministic policy layer that decides HOW
 * a Casino Floor opponent reaches a decision, without importing React, the hand
 * engine, or the AI client. The runtime adapter (`components/table/tableRuntime`)
 * consumes this to route each opponent turn to either the rule AI or the LLM.
 *
 * The bands intentionally trade cost for strength so low stakes stay cheap:
 *   - 'novice' → rule-based decisions only (no proxy calls). Weakest opponents,
 *                so beginners can win; AI is used only for light table-talk flavor.
 *   - 'solid'  → LLM decisions with a "loose" persona, but GATED: an LLM call is
 *                only spent on spots that matter (postflop, or any time a bet is
 *                faced). Trivial preflop folds/limps fall back to the rule AI, so
 *                the cheap Lounge never hammers the Worker proxy.
 *   - 'sharp'  → full-strength LLM decisions on every spot.
 *
 * Crucially, EVERY band remains fully playable with AI off: the LLM path is always
 * injected with a deterministic rule-based fallback (see `tableRuntime`), and the
 * 'novice' band never touches the LLM at all.
 */
import type { PokerStreet } from '../../types/poker'
import type { AITier } from './opponentAI'

export type CasinoAiTier = 'novice' | 'solid' | 'sharp'

/** Persona flavor folded into the LLM prompt for a given band. */
export type PersonaStyle = 'plain' | 'loose' | 'sharp'

export type CasinoTierProfile = {
  tier: CasinoAiTier
  /** Human-facing badge label for the lobby + table chrome. */
  label: string
  /** A one-word feel for the difficulty badge. */
  blurb: string
  /** Where an opponent's decision comes from. */
  source: 'rule' | 'llm'
  /** Rule-AI tier for rule decisions AND the injected LLM fallback. */
  ruleTier: AITier
  /** Persona shaping applied to LLM prompts at this band. */
  personaStyle: PersonaStyle
  /** Whether opponents may emit (light) AI table-talk flavor. */
  tableTalk: boolean
}

const PROFILES: Record<CasinoAiTier, CasinoTierProfile> = {
  novice: {
    tier: 'novice',
    label: 'Novice',
    blurb: 'Soft, rule-based opponents',
    source: 'rule',
    // Tier 1 = the "calling station": never bluffs, never folds a made hand. The
    // weakest, most exploitable band — exactly what low stakes should feel like.
    ruleTier: 1,
    personaStyle: 'loose',
    tableTalk: true,
  },
  solid: {
    tier: 'solid',
    label: 'Solid',
    blurb: 'Thinking LLM opponents',
    source: 'llm',
    // Tier 2 TAG is the fallback when an LLM call is skipped/unavailable.
    ruleTier: 2,
    personaStyle: 'loose',
    tableTalk: true,
  },
  sharp: {
    tier: 'sharp',
    label: 'Sharp',
    blurb: 'Full-strength LLM sharks',
    source: 'llm',
    // Tier 3 (tight, position-aware) is the strongest rule fallback.
    ruleTier: 3,
    personaStyle: 'sharp',
    tableTalk: true,
  },
}

/** The static policy profile for a casino difficulty band. */
export function casinoTierProfile(tier: CasinoAiTier): CasinoTierProfile {
  return PROFILES[tier]
}

/** Minimal spot facts needed to decide whether to spend an LLM call. */
export type CasinoSpot = {
  street: PokerStreet
  /** Chips the opponent must put in to continue (0 when they can check). */
  toCall: number
}

/**
 * Whether to actually query the LLM for THIS opponent decision (cost-aware gating).
 *
 *   - rule bands ('novice') never query the LLM.
 *   - 'sharp' queries on every spot.
 *   - 'solid' only queries on spots that matter — postflop, or any time a bet is
 *     faced — so the low-stakes Lounge spends calls where they change the line and
 *     falls back to the (deterministic) rule AI on trivial preflop spots.
 *
 * Pure + deterministic, so a re-fired effect can never flip the routing.
 */
export function shouldQueryLLM(tier: CasinoAiTier, spot: CasinoSpot): boolean {
  const profile = PROFILES[tier]
  if (profile.source !== 'llm') return false
  if (tier === 'sharp') return true
  // 'solid': spend a call only when the decision is non-trivial.
  return spot.toCall > 0 || spot.street !== 'preflop'
}

/**
 * Shape a base persona string for the band's LLM prompt. Adds a light, loose framing
 * for 'solid' and a relentless framing for 'sharp'; 'plain'/novice pass through.
 */
export function shapePersona(base: string | undefined, style: PersonaStyle): string | undefined {
  const trimmed = base?.trim()
  switch (style) {
    case 'loose':
      return trimmed
        ? `${trimmed}. You play a loose, somewhat unrefined game and are willing to gamble.`
        : 'a loose, gambling recreational player who is happy to mix it up'
    case 'sharp':
      return trimmed
        ? `${trimmed}. You are a world-class, ruthless professional who never makes a fundamental mistake.`
        : 'a ruthless, world-class professional who punishes every mistake'
    case 'plain':
    default:
      return trimmed || undefined
  }
}
