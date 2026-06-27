import { describe, expect, it } from 'vitest'
import { lessons } from '../data/lessons'
import {
  GATED_SECTIONS,
  areSectionLessonsComplete,
  buildCoursePathNodes,
  gateId,
  isGateId,
  isGatePassed,
  isSectionComplete,
  isSectionTestedOut,
  isSectionUnlocked,
  isTestOutAvailable,
  priorGatedSection,
  sectionIdForGateId,
  sectionLessonIds,
  type StatsByLesson,
} from './sectionGates'
import { isLessonUnlocked } from './progress/selectors'
import { defaultLessonStats, type LessonStats } from './progress/types'

function stats(overrides: Partial<LessonStats>): LessonStats {
  return { ...defaultLessonStats(), ...overrides }
}

/** Build a statsByLesson map marking the given ids completed (gate ids included). */
function completed(ids: string[]): StatsByLesson {
  const map: StatsByLesson = {}
  for (const id of ids) map[id] = stats({ completed: true })
  return map
}

describe('sectionGates — ids and section membership', () => {
  it('names a gate per gated section and round-trips its id', () => {
    expect(GATED_SECTIONS).toEqual(['foundations', 'playing', 'math'])
    expect(gateId('foundations')).toBe('gate-foundations')
    expect(isGateId('gate-foundations')).toBe(true)
    expect(isGateId('1')).toBe(false)
    expect(sectionIdForGateId('gate-playing')).toBe('playing')
    expect(sectionIdForGateId('gate-casino')).toBeNull() // casino is not gated
  })

  it('lists each section\u2019s interactive lessons (casino tables excluded)', () => {
    expect(sectionLessonIds('foundations')).toEqual(['1', '2'])
    expect(sectionLessonIds('playing')).toEqual(['3', '4', 'preflop'])
    expect(sectionLessonIds('math')).toEqual(['5', '6', '7', '8'])
    expect(priorGatedSection('foundations')).toBeNull()
    expect(priorGatedSection('playing')).toBe('foundations')
    expect(priorGatedSection('math')).toBe('playing')
  })
})

describe('sectionGates — section unlock + completion progression', () => {
  it('unlocks the first section always; later sections only once the prior gate is passed', () => {
    const none: StatsByLesson = {}
    expect(isSectionUnlocked(none, 'foundations')).toBe(true)
    expect(isSectionUnlocked(none, 'playing')).toBe(false)
    expect(isSectionUnlocked(none, 'math')).toBe(false)

    const afterFoundations = completed([gateId('foundations')])
    expect(isSectionUnlocked(afterFoundations, 'playing')).toBe(true)
    expect(isSectionUnlocked(afterFoundations, 'math')).toBe(false)

    const afterPlaying = completed([gateId('foundations'), gateId('playing')])
    expect(isSectionUnlocked(afterPlaying, 'math')).toBe(true)
  })

  it('a section is complete exactly when its gate is passed', () => {
    expect(isSectionComplete({}, 'foundations')).toBe(false)
    const passedGate = completed([gateId('foundations')])
    expect(isGatePassed(passedGate, 'foundations')).toBe(true)
    expect(isSectionComplete(passedGate, 'foundations')).toBe(true)
  })

  it('flags a tested-out section from its gate doc', () => {
    const testedOut: StatsByLesson = {
      [gateId('foundations')]: stats({ completed: true, testedOut: true }),
    }
    expect(isSectionTestedOut(testedOut, 'foundations')).toBe(true)
    const earned = completed([gateId('foundations')])
    expect(isSectionTestedOut(earned, 'foundations')).toBe(false)
  })
})

describe('sectionGates — test-out availability', () => {
  it('offers test-out only on an unlocked, not-yet-complete section whose lessons are not all done', () => {
    // Fresh Foundations: unlocked, no lessons done → test-out available.
    expect(isTestOutAvailable({}, [], 'foundations')).toBe(true)

    // All Foundations lessons done → it is a normal end-of-section gate, not a skip.
    expect(areSectionLessonsComplete(['1', '2'], 'foundations')).toBe(true)
    expect(isTestOutAvailable(completed(['1', '2']), ['1', '2'], 'foundations')).toBe(false)

    // Locked section → no test-out.
    expect(isTestOutAvailable({}, [], 'playing')).toBe(false)

    // Already passed → no test-out.
    const passed = completed([gateId('foundations')])
    expect(isTestOutAvailable(passed, [gateId('foundations')], 'foundations')).toBe(false)
  })
})

describe('sectionGates — isLessonUnlocked across the gate boundaries', () => {
  it('keeps within-section sequential unlock but gates the first lesson of each section behind the prior gate', () => {
    // Foundations: 1 always open, 2 needs 1.
    expect(isLessonUnlocked('1', [])).toBe(true)
    expect(isLessonUnlocked('2', [])).toBe(false)
    expect(isLessonUnlocked('2', ['1'])).toBe(true)

    // Playing a Hand's first lesson ('3') needs the FOUNDATIONS GATE, not just lesson 2.
    expect(isLessonUnlocked('3', ['1', '2'])).toBe(false)
    expect(isLessonUnlocked('3', ['1', '2', gateId('foundations')])).toBe(true)

    // Within Playing a Hand, sequential again: 4 needs 3, preflop needs 4.
    const playingOpen = ['1', '2', gateId('foundations')]
    expect(isLessonUnlocked('4', playingOpen)).toBe(false)
    expect(isLessonUnlocked('4', [...playingOpen, '3'])).toBe(true)
    expect(isLessonUnlocked('preflop', [...playingOpen, '3'])).toBe(false)
    expect(isLessonUnlocked('preflop', [...playingOpen, '3', '4'])).toBe(true)

    // The Math's first lesson ('5') needs the PLAYING gate.
    const playingDone = [...playingOpen, '3', '4', 'preflop']
    expect(isLessonUnlocked('5', playingDone)).toBe(false)
    expect(isLessonUnlocked('5', [...playingDone, gateId('playing')])).toBe(true)
  })

  it('leaves the casino AI tables on their own (position-based) prerequisite', () => {
    // room-1 follows lesson '8' in the array; its lesson-sequence fallback is unchanged.
    expect(isLessonUnlocked('room-1', [])).toBe(false)
    expect(isLessonUnlocked('room-1', ['8'])).toBe(true)
  })
})

describe('sectionGates — buildCoursePathNodes', () => {
  it('weaves a gate node after each gated section, leaving the casino ungated', () => {
    const nodes = buildCoursePathNodes(lessons)
    expect(nodes.map((n) => n.id)).toEqual([
      '1',
      '2',
      'gate-foundations',
      '3',
      '4',
      'preflop',
      'gate-playing',
      '5',
      '6',
      '7',
      '8',
      'gate-math',
      'room-1',
      'room-2',
    ])
    // Gate nodes carry kind 'gate' and belong to the section they close.
    const foundationsGate = nodes.find((n) => n.id === 'gate-foundations')
    expect(foundationsGate?.kind).toBe('gate')
    expect(foundationsGate?.section).toBe('foundations')
    // No gate after the casino section.
    expect(nodes.some((n) => n.id === 'gate-casino')).toBe(false)
  })
})
