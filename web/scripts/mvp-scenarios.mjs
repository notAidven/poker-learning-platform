/**
 * MVP scenario smoke tests against local dev server.
 * Run: node scripts/mvp-scenarios.mjs
 *
 * NOTE: Lesson 1 and Skill Check 1 were migrated to new interactions —
 * a flip-to-discover coin (no number distractors), the auto-logging die,
 * and the card-deck (the loaded-die / fairness-scale problem was removed).
 * The lesson-1 / skill-check-1 helpers below were updated to match, but this
 * Playwright suite needs a running dev server + Firebase and was NOT executed
 * in the content pass — revalidate selectors/timing before relying on it.
 */
import { chromium } from 'playwright'

const BASE = process.env.MVP_TEST_URL ?? 'http://localhost:5175'
const results = []

function record(id, pass, notes) {
  results.push({ id, pass, notes })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${id}: ${notes}`)
}

async function waitForHome(page) {
  await page.waitForSelector('text=Continue learning', { timeout: 30000 })
}

async function signUpAndSetup(page) {
  if (process.env.MVP_E2E_BYPASS === '1') {
    await page.goto(`${BASE}/`)
    await waitForHome(page)
    return
  }
  const stamp = Date.now()
  const email = `mvp_test_${stamp}@example.com`
  const username = `mvp_${stamp}`.slice(0, 20)

  await page.goto(`${BASE}/signup`)
  await page.fill('input[type="email"]', email)
  await page.locator('input[type="password"]').nth(0).fill('testpass123')
  await page.locator('input[type="password"]').nth(1).fill('testpass123')
  await page.click('button:has-text("Continue")')

  await page.waitForURL('**/setup-profile', { timeout: 30000 })
  await page.fill('input[type="text"]', username)
  await page.locator('button[aria-pressed]').first().click()
  await page.click('button:has-text("Start learning")')
  await page.waitForURL(`${BASE}/`, { timeout: 30000 })
}

async function waitForLessonReady(page) {
  await page.waitForSelector('text=Loading lesson…', { state: 'detached', timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(300)
}

async function clearProgress(page) {
  await page.evaluate(() => {
    localStorage.clear()
  })
}

async function advanceConcept(page) {
  const cont = page.locator('button:has-text("Continue")')
  if (await cont.isVisible()) await cont.click()
}

// --- Card helpers (lesson 1/2/6 now use the card-deck interaction) ---
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const RANK_NAMES = {
  A: 'Ace', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven',
  8: 'Eight', 9: 'Nine', 10: 'Ten', J: 'Jack', Q: 'Queen', K: 'King',
}
const SUIT_NAMES = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' }

// CardDeck buttons expose aria-label = cardLabel(id), e.g. "Ace of spades".
function cardAria(rank, suit) {
  return `${RANK_NAMES[rank]} of ${SUIT_NAMES[suit]}`
}

async function clickCards(page, cards) {
  for (const [rank, suit] of cards) {
    await page.locator(`button[aria-label="${cardAria(rank, suit)}"]`).click()
  }
}

async function fillCardCountAndProb(page, count, num, den) {
  await page.fill('input#card-deck-count', String(count))
  if (num != null) {
    await page.fill('input#card-deck-probability-num', String(num))
    await page.fill('input#card-deck-probability-den', String(den))
  }
  await page.click('button:has-text("Check answer")')
}

// Flip-to-discover coin (lesson 1 p1 + skill check 1 q1): flip until both faces
// appear, enter |Ω| = 2, then lock in. The flip animation is ~520ms and disables
// the button while running, so we wait between flips.
async function solveDiscoverCoin(page) {
  for (let i = 0; i < 18; i += 1) {
    await page.locator('button[aria-label="Flip coin"]').click()
    await page.waitForTimeout(560)
  }
  await page.fill('input#numeric-count-answer', '2')
  await page.click('button:has-text("lock in")')
}

async function solveDieSampleSpace(page, sides) {
  const faces = Array.from({ length: sides }, (_, i) => i + 1)
  for (const face of faces) {
    await page.locator(`button[aria-label="Face ${face}"]`).click()
  }
  await page.fill(`input[id="die-count-${sides}"]`, String(sides))
  const prob = page.locator(`input[id="die-probability-${sides}-num"]`)
  if (await prob.isVisible()) {
    await prob.fill('1')
    await page.fill(`input[id="die-probability-${sides}-den"]`, String(sides))
  }
  await page.click('button:has-text("Check answer")')
}

async function completeLesson1(page, { wrongFirst = false } = {}) {
  await page.goto(`${BASE}/lesson/1`)
  await waitForLessonReady(page)
  await page.waitForSelector('text=Start with the experiment', { timeout: 15000 })
  await advanceConcept(page) // c1

  // p1 — flip-to-discover coin (no number distractors anymore)
  if (wrongFirst) {
    // Lock in Ω before discovering both faces to exercise the incorrect path.
    await page.locator('button[aria-label="Flip coin"]').click()
    await page.waitForTimeout(560)
    await page.fill('input#numeric-count-answer', '1')
    await page.click('button:has-text("lock in")')
    await page.waitForSelector('[role="alert"]').catch(() => {})
    const hint = page.locator('button:has-text("Get hint")')
    if (await hint.isVisible().catch(() => false)) await hint.click()
    const retry = page.locator('button:has-text("Try again")')
    if (await retry.isVisible().catch(() => false)) await retry.click()
  }
  await solveDiscoverCoin(page)
  await advanceConcept(page)

  // p2 — six-sided die (sample space + P = 1/6), now with an automatic roll log
  await solveDieSampleSpace(page, 6)
  await advanceConcept(page)

  // p3 — deck: single-card count (Ace of spades), |A| = 1 in |Ω| = 52
  await clickCards(page, [['A', 'S']])
  await fillCardCountAndProb(page, 1, null, null)
  await advanceConcept(page) // c2 concept

  // p4 — deck: single-card probability (Queen of hearts) = 1/52
  await clickCards(page, [['Q', 'H']])
  await fillCardCountAndProb(page, 1, 1, 52)
  await advanceConcept(page)

  // p5 — deck: red event (26 cards) = 1/2
  const reds = []
  for (const suit of ['H', 'D']) for (const r of RANKS) reds.push([r, suit])
  await clickCards(page, reds)
  await fillCardCountAndProb(page, 26, 1, 2)
  await advanceConcept(page)

  // p6 — deck: spades event (13 cards) = 1/4
  await clickCards(page, RANKS.map((r) => [r, 'S']))
  await fillCardCountAndProb(page, 13, 1, 4)

  await page.click('button:has-text("Finish lesson")')
  await page.waitForSelector('text=Lesson complete!', { timeout: 10000 })
}

async function completeSkillCheck1(page) {
  await page.click('button:has-text("Start skill check")')
  await page.waitForURL('**/skill-check', { timeout: 10000 })

  // q1 — flip-to-discover coin
  await solveDiscoverCoin(page)
  await page.click('button:has-text("Next question")')

  // q2 — six-sided die, P = 1/6
  await solveDieSampleSpace(page, 6)
  await page.click('button:has-text("Next question")')

  // q3 — deck: P(Ace of spades) = 1/52
  await clickCards(page, [['A', 'S']])
  await fillCardCountAndProb(page, 1, 1, 52)
  await page.click('button:has-text("Finish skill check")')

  await page.waitForSelector('text=Skill check complete', { timeout: 15000 })
}

async function getSessionStepIndex(page, lessonId) {
  return page.evaluate((id) => {
    const raw = localStorage.getItem(`lesson-session-${id}`)
    return raw ? JSON.parse(raw).stepIndex : 0
  }, lessonId)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await signUpAndSetup(page)
    await clearProgress(page)
    await page.reload()
    await waitForHome(page)
    record('setup', true, 'Signed up and reached home')

    // Scenario 1: E2E lesson with wrong answers + recovery + skill check
    try {
      await completeLesson1(page, { wrongFirst: true })
      await completeSkillCheck1(page)
      record(
        '1',
        true,
        'Lesson 1 completed with wrong answer recovery, hints, and skill check',
      )
    } catch (err) {
      record('1', false, String(err))
    }

    // Scenario 2: Interactive manipulation + visual response (flip-to-discover coin)
    try {
      await page.goto(`${BASE}/lesson/1`)
      await waitForLessonReady(page)
      await page.waitForSelector('text=Start with the experiment', { timeout: 15000 })
      await advanceConcept(page)
      const coin = page.locator('button[aria-label="Flip coin"]')
      await coin.click()
      await page.waitForTimeout(700)
      await coin.click()
      await page.waitForTimeout(700)
      // Flipping should populate Ω and a tally — discovered chips appear.
      const chips = await page.locator('.chip-3d').count()
      record('2', chips > 0, `Flip-to-discover coin responds (${chips} chips rendered)`)
    } catch (err) {
      record('2', false, String(err))
    }

    // Scenario 3: Mid-lesson leave + return (fresh attempt on lesson 2)
    try {
      await page.evaluate(() => {
        localStorage.removeItem('lesson-session-2')
      })
      await page.goto(`${BASE}/lesson/2`)
      await page.waitForSelector('button:has-text("Continue")', { timeout: 15000 })
      await page.click('button:has-text("Continue")')
      await page.waitForTimeout(500)
      const stepBefore = await getSessionStepIndex(page, '2')

      await page.click('text=Course path')
      await page.waitForSelector('text=Leave this lesson?', { timeout: 5000 })
      await page.click('button:has-text("Leave")')
      await page.waitForURL('**/course', { timeout: 10000 })

      const stepAfterExit = await getSessionStepIndex(page, '2')
      await page.goto(`${BASE}/lesson/2`)
      await page.waitForTimeout(1000)
      const stepAfterReturn = await getSessionStepIndex(page, '2')
      const persisted = stepBefore > 0 && stepAfterExit === stepBefore && stepAfterReturn === stepBefore

      const xpBefore = await page.evaluate(() => {
        return document.body.innerText.match(/XP\s*\n?\s*(\d+)/)?.[1] ?? '0'
      })
      record(
        '3',
        persisted,
        `Mid-lesson step persisted (${stepBefore}→${stepAfterExit}→${stepAfterReturn}); XP on home=${xpBefore}`,
      )
    } catch (err) {
      record('3', false, String(err))
    }

    // Scenario 4: Path recommends next step
    try {
      await page.goto(`${BASE}/`)
      const continueHref = await page.locator('a:has-text("Continue learning")').getAttribute('href')
      await page.goto(`${BASE}/course`)
      await page.locator('button[aria-label*="Lesson 2"]').click()
      await page.waitForSelector('#lesson-modal-title', { timeout: 5000 })
      const modalText = await page.locator('#lesson-modal-title').innerText()
      const ok =
        continueHref === '/lesson/2' &&
        modalText.includes('Events') &&
        (await page.locator('button[aria-label*="Lesson 2"]').count()) > 0
      record(
        '4',
        ok,
        `Continue learning → ${continueHref}; course modal shows "${modalText}"`,
      )
    } catch (err) {
      record('4', false, String(err))
    }

    // Scenario 5: Phone-sized screen
    try {
      await page.setViewportSize({ width: 375, height: 812 })
      for (const path of ['/', '/course', '/lesson/2']) {
        await page.goto(`${BASE}${path}`)
        await page.waitForTimeout(800)
      }
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      const buttons = await page.locator('button, a').evaluateAll((els) =>
        els.slice(0, 20).map((el) => {
          const r = el.getBoundingClientRect()
          return { w: r.width, h: r.height }
        }),
      )
      const smallTargets = buttons.filter((b) => b.w < 40 || b.h < 32).length
      record(
        '5',
        !metrics.overflow && smallTargets <= 5,
        `375px overflow=${metrics.overflow} (${metrics.scrollWidth}/${metrics.clientWidth}); small targets=${smallTargets}`,
      )
    } catch (err) {
      record('5', false, String(err))
    }
  } catch (err) {
    console.error('Fatal:', err)
  } finally {
    await browser.close()
  }

  const failed = results.filter((r) => !r.pass)
  console.log('\n--- Summary ---')
  for (const r of results) {
    console.log(`| ${r.id} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.notes} |`)
  }
  process.exit(failed.length ? 1 : 0)
}

main()
