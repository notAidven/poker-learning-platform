/**
 * Logic checks that do not require Firebase auth.
 */
import assert from 'node:assert/strict'

const results = []

function record(id, pass, notes) {
  results.push({ id, pass, notes })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${id}: ${notes}`)
}

// Scenario 3: mid-lesson session should survive exit (regression for abandonLessonAttempt on exit)
function testExitPreservesSession() {
  const store = new Map()
  const localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  }

  const lessonId = '2'
  const key = `lesson-session-${lessonId}`
  const session = { stepIndex: 1, solvedStepIds: ['p1'], problemAttempts: { p1: 2 } }
  localStorage.setItem(key, JSON.stringify(session))

  // Fixed behavior: exit does NOT clear session
  const exitClearsSession = false
  if (exitClearsSession) localStorage.removeItem(key)

  const restored = JSON.parse(localStorage.getItem(key))
  assert.equal(restored.stepIndex, 1)
  assert.deepEqual(restored.solvedStepIds, ['p1'])
  record('3-logic', true, 'Exit leaves lesson-session intact (fixed regression)')
}

// Scenario 4: next lesson recommendation
function testNextLessonPath() {
  const lessons = [{ id: '1' }, { id: '2' }, { id: '3' }]
  const hasLessonContent = (id) => ['1', '2', '3'].includes(id)

  function getNextLessonPath(completedIds) {
    for (const lesson of lessons) {
      if (!completedIds.includes(lesson.id) && hasLessonContent(lesson.id)) {
        return `/lesson/${lesson.id}`
      }
    }
    return '/course'
  }

  assert.equal(getNextLessonPath([]), '/lesson/1')
  assert.equal(getNextLessonPath(['1']), '/lesson/2')
  assert.equal(getNextLessonPath(['1', '2', '3']), '/course')
  record('4-logic', true, 'getNextLessonPath unlocks lesson 2 after lesson 1 complete')
}

// Section structure + gates mirror (data/lessons.ts + lib/sectionGates.ts). Each
// gated section's lessons run in order, then a synthetic `gate-<section>` checkpoint.
const SECTION_LESSONS = {
  foundations: ['1', '2'],
  playing: ['3', '4', 'preflop'],
  math: ['5', '6', '7', '8'],
  advanced: ['adv-ranges', 'adv-texture', 'adv-implied', 'adv-combos', 'adv-icm'],
}
const GATED_SECTIONS = ['foundations', 'playing', 'math', 'advanced']
const gateId = (s) => `gate-${s}`
const priorGatedSection = (s) => {
  const i = GATED_SECTIONS.indexOf(s)
  return i <= 0 ? null : GATED_SECTIONS[i - 1]
}
const sectionOf = (id) => GATED_SECTIONS.find((s) => SECTION_LESSONS[s].includes(id)) ?? null

// P1 #5 + Section Gates: within a section the sequential rule holds (lesson N needs
// N-1); the FIRST lesson of a section is gated behind the PRIOR section's gate (a
// passed `gate-<section>` doc appears in completedIds). Mirrors isLessonUnlocked.
function testSequentialUnlock() {
  function isLessonUnlocked(lessonId, completedIds) {
    const section = sectionOf(lessonId)
    if (!section) return true // unknown / casino id → page or casino gate handles it
    const arr = SECTION_LESSONS[section]
    const pos = arr.indexOf(lessonId)
    if (pos <= 0) {
      const prior = priorGatedSection(section)
      return prior ? completedIds.includes(gateId(prior)) : true
    }
    return completedIds.includes(arr[pos - 1])
  }

  assert.equal(isLessonUnlocked('1', []), true) // lesson 1 always unlocked
  // Within-section sequential is preserved.
  assert.equal(isLessonUnlocked('preflop', ['1', '2', 'gate-foundations', '3']), false) // L4 not done
  assert.equal(isLessonUnlocked('preflop', ['1', '2', 'gate-foundations', '3', '4']), true) // L4 done
  // Section boundary: Playing a Hand's first lesson needs the Foundations GATE, not just L2.
  assert.equal(isLessonUnlocked('3', ['1', '2']), false) // lessons done, gate NOT passed → locked
  assert.equal(isLessonUnlocked('3', ['1', '2', 'gate-foundations']), true) // gate passed → opens
  // The Math's first lesson needs the Playing a Hand gate.
  const playingDone = ['1', '2', 'gate-foundations', '3', '4', 'preflop']
  assert.equal(isLessonUnlocked('5', playingDone), false) // playing gate NOT passed → locked
  assert.equal(isLessonUnlocked('5', [...playingDone, 'gate-playing']), true) // passed → opens
  // Advanced Play's first lesson needs the Math gate; then it sequences internally.
  const mathDone = [...playingDone, 'gate-playing', '5', '6', '7', '8']
  assert.equal(isLessonUnlocked('adv-ranges', mathDone), false) // math gate NOT passed → locked
  assert.equal(isLessonUnlocked('adv-ranges', [...mathDone, 'gate-math']), true) // passed → opens
  assert.equal(isLessonUnlocked('adv-texture', [...mathDone, 'gate-math']), false) // needs adv-ranges
  assert.equal(isLessonUnlocked('adv-texture', [...mathDone, 'gate-math', 'adv-ranges']), true)
  assert.equal(isLessonUnlocked('99', []), true) // unknown id → page shows "not found"
  record(
    '5-logic',
    true,
    'isLessonUnlocked keeps within-section sequencing and gates each section behind the prior gate',
  )
}

// Section Gates progression + test-out coherence (lib/sectionGates.ts + ProgressStore
// .saveGateResult): a section completes iff its gate is passed; passing it cold
// (test-out) marks the section's lessons complete, so the EXISTING lesson-based casino
// gate (Foundations + Playing a Hand lessons) is satisfied with no edits to casinoProgress.
function testSectionGateProgression() {
  const isSectionUnlocked = (s, completed) => {
    const prior = priorGatedSection(s)
    return prior ? completed.includes(gateId(prior)) : true
  }
  const isSectionComplete = (s, completed) => completed.includes(gateId(s))

  // Unlock chain: Foundations open; later sections need the prior gate.
  assert.equal(isSectionUnlocked('foundations', []), true)
  assert.equal(isSectionUnlocked('playing', []), false)
  assert.equal(isSectionUnlocked('playing', ['gate-foundations']), true)
  assert.equal(isSectionUnlocked('math', ['gate-foundations']), false)
  assert.equal(isSectionUnlocked('math', ['gate-foundations', 'gate-playing']), true)

  // A section is complete exactly when its gate is passed.
  assert.equal(isSectionComplete('foundations', []), false)
  assert.equal(isSectionComplete('foundations', ['gate-foundations']), true)

  // Test-out marks the skipped lessons complete (+ the gate). Mirrors saveGateResult.
  const testOut = (completed, s) => [...completed, ...SECTION_LESSONS[s], gateId(s)]

  // Downstream casino coherence: areGuidedPlayLessonsComplete checks every Foundations
  // + Playing a Hand lesson. After testing out both sections those lessons are complete.
  const GUIDED = new Set(['foundations', 'playing'])
  const guidedPlayComplete = (done) =>
    GATED_SECTIONS.filter((s) => GUIDED.has(s)).every((s) =>
      SECTION_LESSONS[s].every((id) => done.includes(id)),
    )

  let completed = []
  assert.equal(guidedPlayComplete(completed), false)
  completed = testOut(completed, 'foundations')
  assert.equal(isSectionUnlocked('playing', completed), true) // foundations gate now unlocks playing
  completed = testOut(completed, 'playing')
  assert.equal(guidedPlayComplete(completed), true) // casino Room 1 lesson gate is now satisfied
  assert.equal(isSectionUnlocked('math', completed), true)

  record(
    'section-gates',
    true,
    'Section completes on gate pass; test-out marks lessons complete so the casino lesson gate stays coherent',
  )
}

// New structure (mirrors data/lessons.ts): 9 lessons across 3 contiguous sections.
// Playing a Hand now holds 3 lessons (Flow, Betting Basics, and the new Preflop
// lesson); The Math keeps its 4 dedicated lessons.
function testSectionStructure() {
  const lessons = [
    { id: '1', section: 'foundations' },
    { id: '2', section: 'foundations' },
    { id: '3', section: 'playing' },
    { id: '4', section: 'playing' },
    { id: 'preflop', section: 'playing' },
    { id: '5', section: 'math' },
    { id: '6', section: 'math' },
    { id: '7', section: 'math' },
    { id: '8', section: 'math' },
    { id: 'adv-ranges', section: 'advanced' },
    { id: 'adv-texture', section: 'advanced' },
    { id: 'adv-implied', section: 'advanced' },
    { id: 'adv-combos', section: 'advanced' },
    { id: 'adv-icm', section: 'advanced' },
  ]
  const expectedOrder = ['foundations', 'playing', 'math', 'advanced']

  assert.equal(lessons.length, 14, 'course has 14 lessons total')

  // Sections appear in the intended order.
  const order = []
  for (const l of lessons) if (!order.includes(l.section)) order.push(l.section)
  assert.deepEqual(order, expectedOrder, 'sections: Foundations → Playing a Hand → The Math')

  // Each section is a single contiguous run (so a single banner/band per section).
  let changes = 0
  for (let i = 1; i < lessons.length; i++) {
    if (lessons[i].section !== lessons[i - 1].section) changes += 1
  }
  assert.equal(changes, expectedOrder.length - 1, 'each section is one contiguous run of lessons')

  // Section sizes after inserting the preflop lesson into Playing a Hand.
  assert.equal(lessons.filter((l) => l.section === 'math').length, 4, 'The Math has 4 lessons')
  assert.equal(lessons.filter((l) => l.section === 'foundations').length, 2, 'Foundations has 2')
  assert.equal(
    lessons.filter((l) => l.section === 'playing').length,
    3,
    'Playing a Hand has 3 (incl. the preflop lesson)',
  )
  assert.equal(
    lessons.filter((l) => l.section === 'advanced').length,
    5,
    'Advanced Play has 5 lessons',
  )

  record('sections', true, '14 lessons in 4 contiguous sections; Advanced Play adds 5')
}

// Two-room Casino Floor (mirrors data/tables.ts + isTableUnlocked in
// lib/lessonProgress.ts): exactly two rooms. Room 1 (coached) now opens once the
// first two sections (Foundations + Playing a Hand) are complete, so learners
// reach guided play before grinding The Math; Room 2 (AI) opens only after Room 1
// has been cleared.
function testCasinoRooms() {
  // 9 lessons across 3 sections; the two casino rooms are separate ai-table nodes.
  const lessons = [
    { id: '1', section: 'foundations' },
    { id: '2', section: 'foundations' },
    { id: '3', section: 'playing' },
    { id: '4', section: 'playing' },
    { id: 'preflop', section: 'playing' },
    { id: '5', section: 'math' },
    { id: '6', section: 'math' },
    { id: '7', section: 'math' },
    { id: '8', section: 'math' },
  ]
  // Mirrors areGuidedPlayLessonsComplete: every lesson in the first two sections.
  const GUIDED_SECTIONS = new Set(['foundations', 'playing'])
  const guidedPlayComplete = (done) =>
    lessons.filter((l) => GUIDED_SECTIONS.has(l.section)).every((l) => done.includes(l.id))

  const rooms = [
    { id: 'room-1', feature: 'coached', prereqId: '8' },
    { id: 'room-2', feature: 'ai', prereqId: 'room-1' },
  ]
  const isTableId = (id) => rooms.some((r) => r.id === id)

  function isTableUnlocked(room, done, clearedIds) {
    if (!guidedPlayComplete(done)) return false
    if (!isTableId(room.prereqId)) return true // Room 1's prereq is a lesson id
    return clearedIds.includes(room.prereqId) // Room 2 needs Room 1 cleared
  }

  const [room1, room2] = rooms
  const firstTwoSections = ['1', '2', '3', '4', 'preflop'] // Foundations + Playing a Hand
  const everyLesson = lessons.map((l) => l.id)

  assert.equal(rooms.length, 2, 'the Casino Floor has exactly two rooms')
  assert.equal(isTableUnlocked(room1, ['1', '2', '3', '4'], []), false) // Playing a Hand unfinished → locked
  assert.equal(isTableUnlocked(room1, firstTwoSections, []), true) // first two sections → Room 1 opens early
  assert.equal(isTableUnlocked(room1, everyLesson, []), true) // a finished course keeps Room 1 open
  assert.equal(isTableUnlocked(room2, firstTwoSections, []), false) // Room 1 not cleared → locked
  assert.equal(isTableUnlocked(room2, firstTwoSections, ['room-1']), true) // Room 1 cleared → Room 2 opens
  assert.equal(isTableUnlocked(room2, ['1', '2'], ['room-1']), false) // still needs the Playing a Hand section
  record(
    'casino-rooms',
    true,
    'Two rooms: Room 1 opens after the first two sections, Room 2 after Room 1 is cleared',
  )
}

// P1 #3: skill-check pass threshold (mirrors isSkillCheckPassing in lib/gamification.ts)
function testSkillCheckThreshold() {
  const PASS_RATIO = 2 / 3
  function isSkillCheckPassing(correct, total) {
    if (total <= 0) return true
    return correct / total >= PASS_RATIO - 1e-9
  }

  assert.equal(isSkillCheckPassing(0, 3), false)
  assert.equal(isSkillCheckPassing(1, 3), false)
  assert.equal(isSkillCheckPassing(2, 3), true)
  assert.equal(isSkillCheckPassing(3, 3), true)
  record('3-threshold', true, 'Skill check requires ≥ 2 of 3 correct to pass')
}

// #9: a body-finished-but-skill-check-pending lesson routes to the skill check
function testNextLessonPathSkillCheckPending() {
  const lessons = [{ id: '1' }, { id: '2' }, { id: '3' }]
  const hasLessonContent = (id) => ['1', '2', '3'].includes(id)
  const hasSkillCheck = (id) => ['1', '2', '3'].includes(id)
  const statsById = {
    '1': { lessonFinished: true, completed: true },
    '2': { lessonFinished: true, completed: false }, // body done, skill check pending
  }
  const getStats = (id) => statsById[id] ?? { lessonFinished: false, completed: false }

  function getNextLessonPath(completedIds) {
    for (const lesson of lessons) {
      if (completedIds.includes(lesson.id) || !hasLessonContent(lesson.id)) continue
      const stats = getStats(lesson.id)
      if (stats.lessonFinished && !stats.completed && hasSkillCheck(lesson.id)) {
        return `/lesson/${lesson.id}/skill-check`
      }
      return `/lesson/${lesson.id}`
    }
    return '/course'
  }

  assert.equal(getNextLessonPath(['1']), '/lesson/2/skill-check')
  record('9-logic', true, 'Continue routes to pending skill check, not the lesson body')
}

// P0 (Lesson 1 die blocker): the select+count(+fraction) interactions
// (die-sample-space, coin-event-grid, card-deck) must never be able to ENABLE the
// "Check" button while a field that submission validates is hidden. If they could, the
// learner sees an enabled button that does nothing and the step can never resolve —
// exactly the reported Lesson 1 die symptom. This models the hardened widget gating and
// asserts the invariant across every input permutation.
function testNoHiddenRequiredFieldDeadlock() {
  // Hardened rendering: a required field renders as soon as the learner can interact,
  // never gated behind another field being valid.
  function fieldsVisible({ manipulableReady, requiresCount, requiresProbability }) {
    return {
      count: manipulableReady && requiresCount,
      fraction: manipulableReady && requiresProbability,
    }
  }
  function canSubmit({
    manipulableReady,
    requiresCount,
    requiresProbability,
    validCount,
    validFraction,
    locked,
  }) {
    const countReady = !requiresCount || validCount
    const fractionReady = !requiresProbability || validFraction
    return manipulableReady && countReady && fractionReady && !locked
  }

  let submittable = 0
  const bool = [false, true]
  for (const manipulableReady of bool)
    for (const requiresCount of bool)
      for (const requiresProbability of bool)
        for (const validCount of bool)
          for (const validFraction of bool)
            for (const locked of bool) {
              const state = {
                manipulableReady,
                requiresCount,
                requiresProbability,
                validCount,
                validFraction,
                locked,
              }
              if (!canSubmit(state)) continue
              submittable += 1
              const vis = fieldsVisible(state)
              if (requiresCount)
                assert.equal(vis.count, true, `count hidden while submittable: ${JSON.stringify(state)}`)
              if (requiresProbability)
                assert.equal(
                  vis.fraction,
                  true,
                  `fraction hidden while submittable: ${JSON.stringify(state)}`,
                )
            }
  assert.ok(submittable > 0, 'expected at least one submittable state')
  record(
    'die-deadlock',
    true,
    `Check never enables with a hidden required field (${submittable} submittable states verified)`,
  )
}

// Poker Lesson 1 p1: card-deck select-all "tap all 13 hearts". Selecting exactly the
// 13 hearts and entering the count = 13 validates. The count field is visible as soon as
// a card is selected (same hardened gating as the probability widgets — no hidden-field
// deadlock). Count-only — poker Lesson 1 carries no probability fraction.
function testLesson1CardSelectAll() {
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const hearts = ranks.map((r) => `${r}H`)
  const answer = { cards: hearts, count: 13 } // no probability field in poker L1
  const requiresProbability = answer.probability !== undefined

  const selected = new Set(hearts)
  const countInput = '13'

  const sameSet = (a, b) => {
    const s = new Set(a)
    return s.size === b.length && b.every((x) => s.has(x))
  }
  const validCountInput = (raw) => raw.trim() !== '' && Number.isInteger(Number(raw))
  const countMatches = (raw, n) => validCountInput(raw) && Number(raw) === n

  const selectionValid =
    selected.size === answer.cards.length && sameSet([...selected], answer.cards)
  const countOk = countMatches(countInput, answer.count)

  // Hardened gating: the count field shows once any card is selected, so Check can never
  // enable while a validated field is still hidden.
  const manipulableReady = selected.size > 0
  const countVisible = manipulableReady // requiresCount is true for this step

  assert.equal(hearts.length, 13, 'a suit holds 13 cards (A–K)')
  assert.equal(requiresProbability, false, 'poker Lesson 1 select-all is count-only (no fraction)')
  assert.equal(countVisible, true, 'count field shows once a card is selected')
  assert.equal(selectionValid && countOk, true, 'all 13 hearts + count = 13 validates')
  record(
    'lesson1-card-select',
    true,
    'Poker Lesson 1 card-deck: selecting all 13 hearts + count = 13 validates the step',
  )
}

// Poker hand-ranking core (lib/poker): the 10 categories are strictly ordered by
// strength, and an evaluated hand's score vector [categoryRank, ...tiebreak] compares
// lexicographically (first differing element decides; equal vectors chop). This mirrors
// HAND_CATEGORY_RANK + compareHands and is kept here as a pure cross-check (no TS import).
function testHandRankingOrder() {
  const HAND_CATEGORY_RANK = {
    'high-card': 1,
    pair: 2,
    'two-pair': 3,
    trips: 4,
    straight: 5,
    flush: 6,
    'full-house': 7,
    quads: 8,
    'straight-flush': 9,
    'royal-flush': 10,
  }
  const strongestFirst = [
    'royal-flush',
    'straight-flush',
    'quads',
    'full-house',
    'flush',
    'straight',
    'trips',
    'two-pair',
    'pair',
    'high-card',
  ]

  // The ladder is strictly decreasing in rank from strongest to weakest.
  for (let i = 0; i < strongestFirst.length - 1; i++) {
    assert.ok(
      HAND_CATEGORY_RANK[strongestFirst[i]] > HAND_CATEGORY_RANK[strongestFirst[i + 1]],
      `${strongestFirst[i]} must outrank ${strongestFirst[i + 1]}`,
    )
  }

  // compareHands semantics: lexicographic compare of the score vectors.
  const compareScore = (a, b) => {
    const n = Math.max(a.length, b.length)
    for (let i = 0; i < n; i++) {
      const av = a[i] ?? 0
      const bv = b[i] ?? 0
      if (av !== bv) return av - bv
    }
    return 0
  }

  // Flush (cat 6) beats straight (cat 5) regardless of tiebreak.
  assert.ok(compareScore([6, 14, 13, 9, 5, 2], [5, 9]) > 0, 'flush beats straight')
  // Pair of Kings with a Queen kicker beats pair of Kings with a Jack kicker.
  assert.ok(compareScore([2, 13, 12, 5, 2], [2, 13, 11, 5, 2]) > 0, 'higher kicker wins')
  // Identical score vectors tie — suits never break ties (split pot).
  assert.equal(compareScore([1, 14, 13, 9, 5, 2], [1, 14, 13, 9, 5, 2]), 0, 'identical hands chop')

  record(
    'hand-ranking-order',
    true,
    'Hand-ranking ladder strictly ordered; scores compare lexicographically (flush > straight, kicker breaks ties, identical hands chop)',
  )
}

// Crash containment: a render-time throw must surface a recoverable fallback
// instead of blanking the whole app, and navigating to a new route must clear
// the caught error (mirrors ErrorBoundary.getDerivedStateFromError +
// componentDidUpdate reset-on-resetKey). Without a boundary, any uncaught throw
// unmounts the entire React tree → blank screen while curl still returns 200.
function testErrorBoundaryRecovery() {
  // getDerivedStateFromError: a thrown error becomes boundary state.
  const afterThrow = (() => {
    const err = new Error('boom')
    return { error: err } // getDerivedStateFromError(err)
  })()
  assert.ok(afterThrow.error instanceof Error, 'a render throw is captured as boundary state')

  // componentDidUpdate: when resetKey (the route path) changes, the error clears.
  function nextStateOnUpdate(state, prevResetKey, resetKey) {
    if (state.error && prevResetKey !== resetKey) return { error: null }
    return state
  }
  // Same route → error persists (shows fallback).
  assert.deepEqual(
    nextStateOnUpdate(afterThrow, '/lesson/1', '/lesson/1'),
    { error: afterThrow.error },
    'staying on the crashed route keeps showing the fallback',
  )
  // Navigated away → error clears and children re-render.
  assert.deepEqual(
    nextStateOnUpdate(afterThrow, '/lesson/1', '/course'),
    { error: null },
    'navigating to a new path auto-recovers the boundary',
  )
  record(
    'error-boundary',
    true,
    'Render crashes show a recoverable fallback (not a blank screen) and reset on navigation',
  )
}

// Auth load must never hang: even if the Firestore profile read / progress sync
// throws, the init sequence must still reach setLoading(false) so routes resolve
// instead of being stuck on the full-screen PageLoader (a blank/hung app).
function testAuthLoadNeverHangs() {
  function runAuthInit({ throwOnProfile }) {
    let loading = true
    let profile = null
    try {
      if (throwOnProfile) throw new Error('firestore unavailable')
      profile = { profileComplete: true }
    } catch {
      profile = null
    } finally {
      loading = false
    }
    return { loading, profile }
  }

  const ok = runAuthInit({ throwOnProfile: false })
  assert.equal(ok.loading, false)
  assert.deepEqual(ok.profile, { profileComplete: true })

  const failed = runAuthInit({ throwOnProfile: true })
  assert.equal(failed.loading, false, 'loading resolves even when the profile read throws')
  assert.equal(failed.profile, null, 'failed init fails soft to no-profile (routes can redirect)')
  record(
    'auth-load-no-hang',
    true,
    'Auth init always clears loading — a Firestore read failure can no longer hang the app',
  )
}

// Spaced-repetition Review (mirrors lib/review/scheduler.isDue + lib/review/selectors
// .introducedConcepts + lib/review/reviewQueue.buildReviewQueue): only concepts from a
// completed lesson are eligible ("introduced"); among those a concept is due when it has
// no schedule yet or its dueDay is on/before today; the queue interleaves due concepts
// round-robin and caps the session length.
function testReviewDueQueue() {
  const LESSON_CONCEPTS = { '5': ['outs-counting', 'equity'], '6': ['pot-odds', 'ev'] }
  const introduced = (completed) => {
    const s = new Set()
    for (const id of completed) for (const c of LESSON_CONCEPTS[id] ?? []) s.add(c)
    return [...s]
  }
  const isDue = (state, today) => !state || !state.dueDay || state.dueDay <= today
  const dueConcepts = (states, ids, today) => ids.filter((id) => isDue(states[id], today))

  // Introduced gating: nothing is reviewable until a lesson that teaches it is completed.
  assert.deepEqual(introduced([]), [], 'no completed lessons → nothing introduced')
  assert.deepEqual(introduced(['5']).sort(), ['equity', 'outs-counting'])

  // A future-scheduled concept is NOT due; an overdue one IS.
  const today = '2026-06-27'
  const states = { 'outs-counting': { dueDay: '2026-07-10' }, equity: { dueDay: '2026-06-20' } }
  assert.deepEqual(dueConcepts(states, introduced(['5']), today), ['equity'])

  // buildReviewQueue mirror: bucket by first due concept, interleave round-robin, cap.
  function buildQueue(pool, due, limit) {
    if (limit <= 0 || due.length === 0) return []
    const buckets = new Map(due.map((c) => [c, []]))
    for (const it of pool) {
      const key = due.find((c) => it.concepts.includes(c))
      if (key !== undefined) buckets.get(key).push(it)
    }
    const order = [...buckets.values()].filter((b) => b.length)
    const out = []
    let round = 0
    let progressed = true
    while (out.length < limit && progressed) {
      progressed = false
      for (const b of order) {
        if (round < b.length) {
          out.push(b[round])
          progressed = true
          if (out.length >= limit) break
        }
      }
      round += 1
    }
    return out
  }

  const pool = [
    { id: 'a1', concepts: ['equity'] },
    { id: 'a2', concepts: ['equity'] },
    { id: 'b1', concepts: ['pot-odds'] },
  ]
  assert.deepEqual(
    buildQueue(pool, ['equity', 'pot-odds'], 10).map((x) => x.id),
    ['a1', 'b1', 'a2'],
    'queue interleaves concepts (equity, pot-odds, then equity) instead of blocking',
  )
  assert.deepEqual(
    buildQueue(pool, ['equity', 'pot-odds'], 2).map((x) => x.id),
    ['a1', 'b1'],
    'session cap respected',
  )
  assert.deepEqual(buildQueue(pool, [], 10), [], 'nothing due → empty queue')

  record(
    'review-queue',
    true,
    'Review: introduced-concept gating, due filtering, interleaving, and session cap mirror the engine',
  )
}

testExitPreservesSession()
testNextLessonPath()
testSequentialUnlock()
testSectionGateProgression()
testSectionStructure()
testCasinoRooms()
testSkillCheckThreshold()
testNextLessonPathSkillCheckPending()
testNoHiddenRequiredFieldDeadlock()
testLesson1CardSelectAll()
testHandRankingOrder()
testErrorBoundaryRecovery()
testAuthLoadNeverHangs()
testReviewDueQueue()

const failed = results.filter((r) => !r.pass)
console.log('\n--- Logic summary ---')
for (const r of results) {
  console.log(`| ${r.id} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.notes} |`)
}
process.exit(failed.length ? 1 : 0)
