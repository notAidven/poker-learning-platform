/**
 * MVP scenario smoke tests against local dev server.
 * Run: node scripts/mvp-scenarios.mjs
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

async function solveSampleSpacePicker(page) {
  await page.locator('.chip-3d').filter({ hasText: /^H$/ }).click()
  await page.locator('.chip-3d').filter({ hasText: /^T$/ }).click()
  await page.click('button:has-text("Check answer"):not([disabled])')
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

async function solveFairnessScale(page) {
  await page.click('button:has-text("Split evenly across all 6 faces")')
  await page.fill('input[id="fairness-scale-percent"]', '17')
  await page.click('button:has-text("Check answer")')
}

async function completeLesson1(page, { wrongFirst = false } = {}) {
  await page.goto(`${BASE}/lesson/1`)
  await waitForLessonReady(page)
  await page.waitForSelector('text=Start with the experiment', { timeout: 15000 })
  await advanceConcept(page)

  if (wrongFirst) {
    await page.locator('.chip-3d').filter({ hasText: /^1$/ }).click()
    await page.click('button:has-text("Check answer"):not([disabled])')
    await page.waitForSelector('[role="alert"]')
    await page.click('button:has-text("Try again")')
    await page.click('button:has-text("Get hint")')
  }
  await solveSampleSpacePicker(page)
  await advanceConcept(page)
  await advanceConcept(page)

  await solveDieSampleSpace(page, 6)
  await advanceConcept(page)

  await solveFairnessScale(page)
  await advanceConcept(page)
  await advanceConcept(page)

  await solveDieSampleSpace(page, 8)
  await page.click('button:has-text("Finish lesson")')
  await page.waitForSelector('text=Lesson complete!', { timeout: 10000 })
}

async function solveSkillCheckCoin(page) {
  const chips = page.locator('button.font-mono.tracking-widest')
  await chips.nth(0).click()
  await chips.nth(1).click()
  await page.fill('input[id="coin-event-count-1"]', '2')
  await page.fill('input[id="coin-event-probability-1-num"]', '1')
  await page.fill('input[id="coin-event-probability-1-den"]', '2')
  await page.click('button:has-text("Check answer")')
  await page.waitForSelector('text=Correct!', { timeout: 5000 })
}

async function completeSkillCheck1(page) {
  await page.click('button:has-text("Start skill check")')
  await page.waitForURL('**/skill-check', { timeout: 10000 })

  await solveSkillCheckCoin(page)
  await page.click('button:has-text("Next question")')

  await solveDieSampleSpace(page, 6)
  await page.click('button:has-text("Next question")')

  await solveDieSampleSpace(page, 8)
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

    // Scenario 2: Interactive manipulation + visual response
    try {
      await page.goto(`${BASE}/lesson/1`)
      await waitForLessonReady(page)
      await page.waitForSelector('text=Start with the experiment', { timeout: 15000 })
      await advanceConcept(page)
      const coin = page.locator('.coin-3d').first()
      await coin.click()
      await page.waitForTimeout(600)
      await page.locator('.chip-3d').filter({ hasText: /^H$/ }).click()
      const chipActive = await page.locator('.chip-3d[aria-pressed="true"]').count()
      record(
        '2',
        chipActive > 0,
        `Coin flip + chip selection respond (${chipActive} selected)`,
      )
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
