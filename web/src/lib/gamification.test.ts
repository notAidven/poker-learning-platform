import { describe, expect, it } from 'vitest'
import {
  GATE_PASS_RATIO,
  XP_DRILL_AFTER_RETHINK,
  XP_DRILL_FIRST_TRY,
  XP_DRILL_SESSION_CAP,
  XP_GATE_PASS,
  XP_REPLAY_BASE,
  XP_REPLAY_MIN,
  XP_TESTOUT_PER_LESSON,
  accumulateDrillXp,
  computeReplayXp,
  computeTestOutXp,
  drillAccuracyPct,
  drillDecisionXp,
  gatePassMark,
  isGatePassing,
} from './gamification'

describe('gamification — section gate pass threshold (~70%)', () => {
  it('passes at or above 70%, fails below', () => {
    expect(GATE_PASS_RATIO).toBe(0.7)
    // Foundations gate (4 questions): need 3 of 4.
    expect(isGatePassing(2, 4)).toBe(false)
    expect(isGatePassing(3, 4)).toBe(true)
    // Playing a Hand gate (6 questions): need 5 of 6.
    expect(isGatePassing(4, 6)).toBe(false)
    expect(isGatePassing(5, 6)).toBe(true)
    // The Math gate (8 questions): need 6 of 8.
    expect(isGatePassing(5, 8)).toBe(false)
    expect(isGatePassing(6, 8)).toBe(true)
    // An exact 70% clears the bar (epsilon guard).
    expect(isGatePassing(7, 10)).toBe(true)
  })

  it('gatePassMark reports the smallest passing correct-count', () => {
    expect(gatePassMark(4)).toBe(3)
    expect(gatePassMark(6)).toBe(5)
    expect(gatePassMark(8)).toBe(6)
    expect(gatePassMark(10)).toBe(7)
  })
})

describe('gamification — test-out XP (reduced vs doing the lessons)', () => {
  it('scales a reduced flat amount per skipped lesson', () => {
    expect(computeTestOutXp(0)).toBe(0)
    expect(computeTestOutXp(2)).toBe(2 * XP_TESTOUT_PER_LESSON) // Foundations
    expect(computeTestOutXp(3)).toBe(3 * XP_TESTOUT_PER_LESSON) // Playing a Hand
    expect(computeTestOutXp(4)).toBe(4 * XP_TESTOUT_PER_LESSON) // The Math
  })

  it('is far below the lesson XP (100+ each) and below a single gate-pass bonus per lesson', () => {
    // 2 lessons done would pay at least 2×100 = 200 XP; testing out pays 40.
    expect(computeTestOutXp(2)).toBeLessThan(200)
    // Per skipped lesson, test-out XP is a small fraction of the gate mastery bonus.
    expect(XP_TESTOUT_PER_LESSON).toBeLessThan(XP_GATE_PASS)
  })
})

describe('gamification — replay XP (diminishing returns, floored)', () => {
  it('starts at XP_REPLAY_BASE and halves each replay down to a floor', () => {
    expect(computeReplayXp(0)).toBe(XP_REPLAY_BASE) // 20
    expect(computeReplayXp(1)).toBe(10)
    expect(computeReplayXp(2)).toBe(XP_REPLAY_MIN) // round(5) = 5 (floor)
    expect(computeReplayXp(3)).toBe(XP_REPLAY_MIN) // round(2.5)=3 → floored to 5
    expect(computeReplayXp(10)).toBe(XP_REPLAY_MIN)
  })

  it('is non-increasing and always at/above the floor (no farming, but always something)', () => {
    let prev = Infinity
    for (let n = 0; n <= 12; n += 1) {
      const xp = computeReplayXp(n)
      expect(xp).toBeGreaterThanOrEqual(XP_REPLAY_MIN)
      expect(xp).toBeLessThanOrEqual(prev)
      prev = xp
    }
  })

  it('a single replay is tiny next to a first completion (100–150 XP)', () => {
    expect(computeReplayXp(0)).toBeLessThan(100)
  })
})

describe('gamification — coached decision drill XP (modest, first-try earns more, capped)', () => {
  it('rewards a first-try-correct decision more than one after a rethink', () => {
    expect(drillDecisionXp(true)).toBe(XP_DRILL_FIRST_TRY)
    expect(drillDecisionXp(false)).toBe(XP_DRILL_AFTER_RETHINK)
    expect(XP_DRILL_FIRST_TRY).toBeGreaterThan(XP_DRILL_AFTER_RETHINK)
  })

  it('is modest next to a lesson completion (100–150 XP)', () => {
    expect(XP_DRILL_FIRST_TRY).toBeLessThan(20)
    expect(XP_DRILL_SESSION_CAP).toBeLessThan(100)
  })

  it('accumulates per decision but never exceeds the session cap (anti-farm)', () => {
    let xp = 0
    for (let i = 0; i < 100; i += 1) xp = accumulateDrillXp(xp, true)
    expect(xp).toBe(XP_DRILL_SESSION_CAP)
    // A single step also respects the ceiling.
    expect(accumulateDrillXp(XP_DRILL_SESSION_CAP, true)).toBe(XP_DRILL_SESSION_CAP)
  })

  it('computes best-on-first-try accuracy as a rounded percent', () => {
    expect(drillAccuracyPct(0, 0)).toBe(0) // no decisions yet
    expect(drillAccuracyPct(3, 4)).toBe(75)
    expect(drillAccuracyPct(2, 3)).toBe(67)
    expect(drillAccuracyPct(5, 5)).toBe(100)
  })
})
