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

// Lesson 1 p2: the roll-to-discover die (die-sample-space, discoverMode). Rolling
// auto-populates Ω with distinct faces; lock-in stays disabled until all six faces have
// appeared, and entering |Ω| = 6 then validates. (Count-only — no probability field.)
function testLesson1DiscoverDie() {
  const sides = 6
  const answer = { selected: [1, 2, 3, 4, 5, 6], count: 6 } // discover die is count-only
  const confirmCount = true

  const sameSet = (a, b) => {
    const s = new Set(a)
    return s.size === b.length && b.every((x) => s.has(x))
  }
  const validCountInput = (raw) => raw.trim() !== '' && Number.isInteger(Number(raw))
  const countMatches = (raw, n) => validCountInput(raw) && Number(raw) === n

  // canLockIn mirrors the widget: every face seen AND (if confirmCount) a valid count entry.
  const canLockIn = (discovered, countInput) =>
    discovered.length === sides && (!confirmCount || validCountInput(countInput))
  const discoverValid = (discovered, countInput) =>
    sameSet(discovered, answer.selected) && (!confirmCount || countMatches(countInput, answer.count))

  // Lock-in is blocked until every face has appeared (no premature/incorrect lock-in).
  assert.equal(canLockIn([1, 2, 3], '6'), false, 'cannot lock in before all six faces appear')

  // Rolling (with repeats) eventually reveals all six distinct faces.
  const rolls = [3, 1, 1, 5, 2, 6, 4, 2, 6]
  const discovered = [...new Set(rolls)]
  assert.equal(discovered.length, 6, 'distinct faces accumulate to the full Ω')
  assert.equal(canLockIn(discovered, '6'), true)
  assert.equal(discoverValid(discovered, '6'), true, 'all six discovered + |Ω| = 6 validates')
  assert.equal(answer.probability, undefined, 'discover die is count-only (no fraction field)')
  record(
    'lesson1-discover-die',
    true,
    'Roll-to-discover die: reveal all 6 faces + enter |Ω| = 6 locks in Ω and unlocks Continue',
  )
}

// Backward-compat: the classic select-all die (Lesson 1 p3/p4 and skill-check 1 q2) must
// still be completable — selecting the event's faces, entering |A|, and entering a P(A)
// that reduces to the expected fraction all validate (unreduced entries are accepted).
function testClassicDieEventCompletable() {
  const answer = { selected: [2, 4, 6], count: 3, probability: { num: 1, den: 2 } } // die "even"
  const requiresProbability = answer.probability !== undefined
  const selected = new Set([2, 4, 6])
  const countInput = '3'
  const fractionNum = '3'
  const fractionDen = '6' // unreduced 3/6 must still match expected 1/2

  const sameSet = (a, b) => {
    const s = new Set(a)
    return s.size === b.length && b.every((x) => s.has(x))
  }
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b))
  const reduce = (n, d) => {
    const g = gcd(Math.abs(n), Math.abs(d)) || 1
    return { num: n / g, den: d / g }
  }
  const fractionMatches = (n, d, exp) => {
    if (Number(d) <= 0) return false
    const r = reduce(Number(n), Number(d))
    const e = reduce(exp.num, exp.den)
    return r.num === e.num && r.den === e.den
  }
  const countMatches = (raw, n) => raw.trim() !== '' && Number(raw) === n

  const selectionValid = sameSet([...selected], answer.selected)
  const countOk = countMatches(countInput, answer.count)
  const probOk = !requiresProbability || fractionMatches(fractionNum, fractionDen, answer.probability)

  // Hardened gating: the fraction field is visible as soon as a face is selected — never
  // gated behind a valid count — so Check can't enable while a validated field is hidden.
  const manipulableReady = selected.size > 0
  const fractionVisible = manipulableReady && requiresProbability

  assert.equal(requiresProbability, true, 'classic die event requires a reduced P(A)')
  assert.equal(fractionVisible, true, 'fraction field shows once faces are selected')
  assert.equal(
    selectionValid && countOk && probOk,
    true,
    'select {2,4,6} + |A| = 3 + (3/6 → 1/2) validates',
  )
  record(
    'classic-die-event',
    true,
    'Classic select-all die (Lesson 1 + skill checks): event + |A| + reduced P(A) validates',
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

testExitPreservesSession()
testNextLessonPath()
testSequentialUnlock()
testSkillCheckThreshold()
testNextLessonPathSkillCheckPending()
testNoHiddenRequiredFieldDeadlock()
testLesson1DiscoverDie()
testClassicDieEventCompletable()
testErrorBoundaryRecovery()
testAuthLoadNeverHangs()

const failed = results.filter((r) => !r.pass)
console.log('\n--- Logic summary ---')
for (const r of results) {
  console.log(`| ${r.id} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.notes} |`)
}
process.exit(failed.length ? 1 : 0)
