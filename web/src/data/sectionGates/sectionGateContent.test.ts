/**
 * Validates the authored Section Gate content so a wrong hand can never ship:
 *  - every lesson in a section is represented (coverage),
 *  - the pass bar matches ~70% for the authored sizes,
 *  - engine-graded questions (outs / identify-category / board-by-street / pot-odds /
 *    decision) actually agree with the pure evaluator the widgets grade against, and
 *  - no gate prompt is copied verbatim from an existing skill check (brand-new questions).
 */
import { describe, expect, it } from 'vitest'
import { gateFoundations } from './gate-foundations'
import { gatePlaying } from './gate-playing'
import { gateMath } from './gate-math'
import { gateAdvanced } from './gate-advanced'
import type { SectionGateDefinition, SectionGateQuestion } from './types'
import type {
  BoardDealerStep,
  HandRankerStep,
  OutsOddsStep,
  PokerStreet,
} from '../../types/lesson'
import type { HandCategory } from '../../types/poker'
import { countOuts, evaluateBest, evaluateHoldem } from '../../lib/poker/handEvaluator'
import { GATED_SECTIONS, sectionLessonIds } from '../../lib/sectionGates'
import { gatePassMark } from '../../lib/gamification'

// Existing skill checks — used only to assert the gate questions are NOT reused.
import { skillCheck1 } from '../skillChecks/skill-check-1'
import { skillCheck2 } from '../skillChecks/skill-check-2'
import { skillCheck3 } from '../skillChecks/skill-check-3'
import { skillCheck4 } from '../skillChecks/skill-check-4'
import { skillCheckPreflop } from '../skillChecks/skill-check-preflop'
import { skillCheck5 } from '../skillChecks/skill-check-5'
import { skillCheck6 } from '../skillChecks/skill-check-6'
import { skillCheck7 } from '../skillChecks/skill-check-7'
import { skillCheck8 } from '../skillChecks/skill-check-8'

const gates: SectionGateDefinition[] = [gateFoundations, gatePlaying, gateMath, gateAdvanced]

/** Mirror of OutsOdds widget's draw-label → category mapping. */
function deriveTarget(drawLabel: string): HandCategory | undefined {
  const s = drawLabel.toLowerCase()
  if (s.includes('straight')) return 'straight'
  if (s.includes('flush')) return 'flush'
  if (s.includes('full')) return 'full-house'
  if (s.includes('quad') || s.includes('four of a kind')) return 'quads'
  if (s.includes('trip') || s.includes('set') || s.includes('three of a kind')) return 'trips'
  if (s.includes('two pair')) return 'two-pair'
  if (s.includes('pair') || s.includes('overcard')) return 'pair'
  return undefined
}

/** Mirror of OutsOdds widget's Rule of 2 & 4 estimate (with the big-draw correction). */
function ruleEstimate(outs: number, street: 'flop' | 'turn'): number {
  if (street === 'turn') return outs * 2
  const raw = outs * 4
  return outs > 8 ? raw - (outs - 8) : raw
}

const STREET_BOARD_LEN: Record<PokerStreet, number> = { preflop: 0, flop: 3, turn: 4, river: 5 }

describe('section gate content — coverage + pass bar', () => {
  it('defines a gate for every gated section, each covering all its lessons', () => {
    expect(gates.map((g) => g.sectionId)).toEqual(GATED_SECTIONS)
    for (const gate of gates) {
      const covered = new Set(gate.questions.map((q) => q.lessonId))
      for (const lessonId of sectionLessonIds(gate.sectionId)) {
        expect(covered.has(lessonId)).toBe(true)
      }
      // ~2 questions per lesson.
      expect(gate.questions.length).toBe(sectionLessonIds(gate.sectionId).length * 2)
    }
  })

  it('uses the authored sizes whose ~70% pass bars are 3/4, 5/6, 6/8', () => {
    expect(gateFoundations.questions.length).toBe(4)
    expect(gatePassMark(4)).toBe(3)
    expect(gatePlaying.questions.length).toBe(6)
    expect(gatePassMark(6)).toBe(5)
    expect(gateMath.questions.length).toBe(8)
    expect(gatePassMark(8)).toBe(6)
  })

  it('gives every question a unique id within its gate', () => {
    for (const gate of gates) {
      const ids = gate.questions.map((q) => q.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})

describe('section gate content — engine agreement (authored answers are accurate)', () => {
  for (const gate of gates) {
    for (const question of gate.questions) {
      it(`${gate.sectionId} · ${question.id} (${question.interaction}) grades against the evaluator`, () => {
        if (question.interaction === 'outs-odds') {
          const { config, answer } = question as unknown as OutsOddsStep
          const target = deriveTarget(config.drawLabel)
          const outs = countOuts(config.hole, config.board, target).count

          if (config.ask.includes('outs') && answer.outs !== undefined) {
            expect(outs).toBe(answer.outs)
          }
          if (config.ask.includes('equity') && answer.equityPercent !== undefined) {
            // A learner using the taught Rule of 2 & 4 must land within tolerance.
            const ruleValue = config.street === 'turn' ? outs * 2 : outs * 4
            const tol = answer.equityTolerance ?? 3
            expect(Math.abs(ruleValue - answer.equityPercent)).toBeLessThanOrEqual(tol)
          }
          if (config.ask.includes('potOdds') && config.pot != null && config.betToCall != null) {
            const required = (config.betToCall / (config.pot + config.betToCall)) * 100
            if (answer.potOddsPercent !== undefined) {
              expect(Math.abs(required - answer.potOddsPercent)).toBeLessThanOrEqual(1)
            }
          }
          if (config.ask.includes('decision') && answer.decision !== undefined) {
            const required =
              config.pot != null && config.betToCall != null
                ? (config.betToCall / (config.pot + config.betToCall)) * 100
                : 0
            const equity = ruleEstimate(outs, config.street)
            const decision = equity >= required ? 'call' : 'fold'
            expect(decision).toBe(answer.decision)
          }
        } else if (question.interaction === 'hand-ranker') {
          const { config, answer } = question as unknown as HandRankerStep
          if (config.mode === 'identify-category' && config.cards) {
            const category = evaluateBest(config.cards).category
            expect(category).toBe(answer.category)
            // The correct category must be offered as a choice.
            if (config.categories) expect(config.categories).toContain(answer.category)
          }
        } else if (question.interaction === 'board-dealer') {
          const { config, answer } = question as unknown as BoardDealerStep
          if (answer.bestHandByStreet && config.hole !== 'random' && Array.isArray(config.board)) {
            const hole = config.hole as [string, string]
            for (const [street, expected] of Object.entries(answer.bestHandByStreet)) {
              const len = STREET_BOARD_LEN[street as PokerStreet]
              const category = evaluateHoldem(hole, config.board.slice(0, len)).category
              expect(category).toBe(expected)
            }
          }
        } else {
          // preflop-hand / compare-events / betting-round grade against an authored answer
          // (a human judgment call), so there is nothing for the evaluator to cross-check.
          expect(question.answer).toBeDefined()
        }
      })
    }
  }
})

describe('section gate content — brand-new (no skill-check reuse)', () => {
  it('does not copy any prompt verbatim from an existing skill check', () => {
    const existingPrompts = new Set(
      [
        skillCheck1,
        skillCheck2,
        skillCheck3,
        skillCheck4,
        skillCheckPreflop,
        skillCheck5,
        skillCheck6,
        skillCheck7,
        skillCheck8,
      ].flatMap((sc) => sc.questions.map((q: { prompt: string }) => q.prompt.trim())),
    )

    const gatePrompts: string[] = gates.flatMap((g) =>
      g.questions.map((q: SectionGateQuestion) => q.prompt.trim()),
    )
    for (const prompt of gatePrompts) {
      expect(existingPrompts.has(prompt)).toBe(false)
    }
  })
})
