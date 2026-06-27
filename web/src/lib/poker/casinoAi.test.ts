/**
 * Tiered casino opponents — the pure policy that decides rule-vs-LLM per band and
 * gates LLM calls so low stakes stay cheap. No Firebase / network needed.
 */
import { describe, expect, it } from 'vitest'
import {
  casinoTierProfile,
  shapePersona,
  shouldQueryLLM,
  type CasinoAiTier,
} from './casinoAi'

describe('casinoTierProfile', () => {
  it("'novice' is rule-based at the weakest tier, with light table-talk", () => {
    const p = casinoTierProfile('novice')
    expect(p.source).toBe('rule')
    expect(p.ruleTier).toBe(1)
    expect(p.tableTalk).toBe(true)
    expect(p.label).toBe('Novice')
  })

  it("'solid' uses the LLM with a Tier-2 rule fallback + loose persona", () => {
    const p = casinoTierProfile('solid')
    expect(p.source).toBe('llm')
    expect(p.ruleTier).toBe(2)
    expect(p.personaStyle).toBe('loose')
  })

  it("'sharp' uses the LLM with the strongest (Tier-3) rule fallback + sharp persona", () => {
    const p = casinoTierProfile('sharp')
    expect(p.source).toBe('llm')
    expect(p.ruleTier).toBe(3)
    expect(p.personaStyle).toBe('sharp')
  })
})

describe('shouldQueryLLM (cost-aware gating)', () => {
  it("'novice' NEVER queries the LLM (rule-only, no proxy calls)", () => {
    expect(shouldQueryLLM('novice', { street: 'preflop', toCall: 0 })).toBe(false)
    expect(shouldQueryLLM('novice', { street: 'river', toCall: 200 })).toBe(false)
  })

  it("'sharp' queries the LLM on every spot", () => {
    expect(shouldQueryLLM('sharp', { street: 'preflop', toCall: 0 })).toBe(true)
    expect(shouldQueryLLM('sharp', { street: 'preflop', toCall: 10 })).toBe(true)
    expect(shouldQueryLLM('sharp', { street: 'turn', toCall: 0 })).toBe(true)
  })

  it("'solid' spends an LLM call only on spots that matter (postflop or facing a bet)", () => {
    // Trivial preflop spot (can check, nothing to call) → rule fallback, no call.
    expect(shouldQueryLLM('solid', { street: 'preflop', toCall: 0 })).toBe(false)
    // Facing a bet preflop → worth a call.
    expect(shouldQueryLLM('solid', { street: 'preflop', toCall: 20 })).toBe(true)
    // Any postflop decision → worth a call, even when checked to.
    expect(shouldQueryLLM('solid', { street: 'flop', toCall: 0 })).toBe(true)
    expect(shouldQueryLLM('solid', { street: 'river', toCall: 0 })).toBe(true)
  })

  it('gating is deterministic for a fixed spot (a re-fired effect cannot flip it)', () => {
    const tiers: CasinoAiTier[] = ['novice', 'solid', 'sharp']
    for (const tier of tiers) {
      const spot = { street: 'flop' as const, toCall: 0 }
      expect(shouldQueryLLM(tier, spot)).toBe(shouldQueryLLM(tier, spot))
    }
  })
})

describe('shapePersona', () => {
  it('loose framing nudges toward a gambling style and keeps the base persona', () => {
    const shaped = shapePersona('a calling station who hates folding', 'loose')
    expect(shaped).toContain('a calling station who hates folding')
    expect(shaped?.toLowerCase()).toContain('loose')
  })

  it('sharp framing adds ruthless, world-class language', () => {
    const shaped = shapePersona('a tricky trapper', 'sharp')
    expect(shaped).toContain('a tricky trapper')
    expect(shaped?.toLowerCase()).toMatch(/ruthless|professional/)
  })

  it('plain passes the base through and supplies a default when empty', () => {
    expect(shapePersona('a steady grinder', 'plain')).toBe('a steady grinder')
    expect(shapePersona(undefined, 'plain')).toBeUndefined()
    expect(shapePersona(undefined, 'loose')).toBeTruthy()
    expect(shapePersona('   ', 'sharp')).toBeTruthy()
  })
})
