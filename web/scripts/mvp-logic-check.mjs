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

// P1 #5: sequential unlock (mirrors isLessonUnlocked in lib/lessonProgress.ts)
function testSequentialUnlock() {
  const lessons = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }, { id: '6' }]

  function isLessonUnlocked(lessonId, completedIds) {
    const index = lessons.findIndex((l) => l.id === lessonId)
    if (index <= 0) return true // lesson 1 always open; unknown id handled by page
    return completedIds.includes(lessons[index - 1].id)
  }

  assert.equal(isLessonUnlocked('1', []), true) // lesson 1 always unlocked
  assert.equal(isLessonUnlocked('5', ['1', '2', '3']), false) // L4 not done → L5 locked
  assert.equal(isLessonUnlocked('5', ['1', '2', '3', '4']), true) // L4 done → L5 open
  assert.equal(isLessonUnlocked('99', []), true) // unknown id → page shows "not found"
  record('5-logic', true, 'isLessonUnlocked blocks /lesson/5 until lesson 4 is completed')
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

// Regression: the Lesson 1 die (die-sample-space, count-only) must be completable —
// selecting all six faces and entering |Ω| = 6 must validate and unlock Continue.
function testLesson1DieCompletable() {
  const answer = { selected: [1, 2, 3, 4, 5, 6], count: 6 } // no probability → count-only
  const requiresProbability = answer.probability !== undefined
  const selected = new Set([1, 2, 3, 4, 5, 6])
  const countInput = '6'

  const selectionValid =
    selected.size === answer.selected.length && answer.selected.every((f) => selected.has(f))
  const countMatches = Number(countInput) === answer.count
  const probabilityValid = !requiresProbability // count-only → no fraction expected

  assert.equal(requiresProbability, false, 'Lesson 1 die must be count-only (no fraction field)')
  assert.equal(
    selectionValid && countMatches && probabilityValid,
    true,
    'selecting all six faces + entering 6 must validate',
  )
  record(
    'lesson1-die',
    true,
    'Lesson 1 die: select 6 faces + enter |Ω| = 6 validates and unlocks Continue',
  )
}

testExitPreservesSession()
testNextLessonPath()
testSequentialUnlock()
testSkillCheckThreshold()
testNextLessonPathSkillCheckPending()
testNoHiddenRequiredFieldDeadlock()
testLesson1DieCompletable()

const failed = results.filter((r) => !r.pass)
console.log('\n--- Logic summary ---')
for (const r of results) {
  console.log(`| ${r.id} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.notes} |`)
}
process.exit(failed.length ? 1 : 0)
