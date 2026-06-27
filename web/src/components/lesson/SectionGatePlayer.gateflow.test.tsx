// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router-dom'
import { createElement, type ReactNode } from 'react'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: null }),
}))

import { SectionGatePlayer } from './SectionGatePlayer'
import { SectionGatePage } from '../../pages/SectionGatePage'
import { CoursePath } from '../CoursePath'
import { lessons } from '../../data/lessons'
import { ProgressStoreContext } from '../../lib/progress/ProgressContext'
import { ProgressStore } from '../../lib/progress/ProgressStore'
import { InMemoryProgressBackend } from '../../lib/progress/InMemoryProgressBackend'
import { gateId } from '../../lib/sectionGates'
import { gateAdvanced } from '../../data/sectionGates/gate-advanced'
import type { SectionGateDefinition } from '../../data/sectionGates'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function makeStore() {
  return new ProgressStore({ backend: new InMemoryProgressBackend() })
}

function renderPlayer(gate: SectionGateDefinition, store: ProgressStore): void {
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      MemoryRouter,
      null,
      createElement(ProgressStoreContext.Provider, { value: store }, children),
    )
  }
  render(
    createElement(SectionGatePlayer, {
      gate,
      sectionTitle: 'Test Section',
      mode: 'gate',
      firstLessonId: '1',
    }),
    { wrapper: Wrapper },
  )
}

beforeEach(() => {
  localStorage.clear()
  // jsdom has no matchMedia; force reduced motion so transitions are instant.
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  )
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
})

function completeLesson(store: ProgressStore, id: string) {
  store.saveLessonFinished(id, 100, {}, [])
  store.saveSkillCheckResult(id, 3, 3)
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const miniGate: SectionGateDefinition = {
  sectionId: 'foundations',
  title: 'Mini',
  questions: [
    {
      id: 't1',
      lessonId: '1',
      prompt: 'Pick the left one.',
      interaction: 'compare-events',
      config: { chooseLabel: 'Which?', eventA: { label: 'Left' }, eventB: { label: 'Right' } },
      answer: { more: 'a' },
    },
  ],
}

describe('SectionGatePlayer — passing records the gate completion (unlocks next section)', () => {
  it('a correct answer marks the gate completed in the store and shows "Section complete"', async () => {
    const store = makeStore()
    renderPlayer(miniGate, store)

    // The interaction widget loads lazily.
    const leftPanel = await screen.findByRole('button', { name: /Left/ })
    fireEvent.click(leftPanel)

    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))

    // The player surfaces a Finish button once the question is answered.
    const finishBtn = await screen.findByRole('button', { name: 'Finish gate' })
    fireEvent.click(finishBtn)

    await screen.findByText('Section complete')
    expect(store.getStats(gateId('foundations')).completed).toBe(true)
  })

  it('a wrong answer does NOT complete the gate (progression stays blocked)', async () => {
    const store = makeStore()
    renderPlayer(miniGate, store)

    const rightPanel = await screen.findByRole('button', { name: /Right/ })
    fireEvent.click(rightPanel)
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))
    const finishBtn = await screen.findByRole('button', { name: 'Finish gate' })
    fireEvent.click(finishBtn)

    await screen.findByText('Gate not cleared')
    expect(store.getStats(gateId('foundations')).completed).toBe(false)
  })
})

/** Answer one advanced-gate question (correctly or incorrectly), then advance. */
async function answerAdvanced(index: number, correct: boolean): Promise<void> {
  const isLast = index === gateAdvanced.questions.length - 1
  // Each tuple is [correctControl, wrongControl] selectors for the question.
  switch (index) {
    case 0: // a-q1 range-grid, inRange:false → Out of range
      fireEvent.click(await screen.findByRole('button', { name: correct ? 'Out of range' : 'In range' }))
      break
    case 1: // a-q2 betting-round choose-action: fold (facing a bet → call/raise/fold)
      fireEvent.click(await screen.findByRole('button', { name: correct ? 'Fold' : 'Raise' }))
      break
    case 2: // a-q3 compare-events more:'b'
      fireEvent.click(await screen.findByRole('button', { name: correct ? /6-5-4 with two spades/ : /A-K-4 rainbow/ }))
      break
    case 3: // a-q4 betting-round choose-action: check (no bet → check/bet)
      fireEvent.click(await screen.findByRole('button', { name: correct ? 'Check' : 'Bet' }))
      break
    case 4: // a-q5 compare-events more:'a'
      fireEvent.click(await screen.findByRole('button', { name: correct ? /High SPR/ : /Low SPR/ }))
      break
    case 5: { // a-q6 betting-round ev-of-call: 15
      const input = await screen.findByRole('textbox')
      fireEvent.change(input, { target: { value: correct ? '15' : '99' } })
      break
    }
    case 6: // a-q7 compare-events more:'a'
      fireEvent.click(await screen.findByRole('button', { name: correct ? /Pocket Jacks/ : /A-Q suited/ }))
      break
    case 7: // a-q8 compare-events more:'a'
      fireEvent.click(await screen.findByRole('button', { name: correct ? /Pocket Queens/ : /Pocket Aces/ }))
      break
    case 8: // a-q9 range-grid inRange:true
      fireEvent.click(await screen.findByRole('button', { name: correct ? 'In range' : 'Out of range' }))
      break
    case 9: // a-q10 compare-events more:'a'
      fireEvent.click(await screen.findByRole('button', { name: correct ? /Push or fold/ : /Small raises/ }))
      break
  }
  fireEvent.click(await screen.findByRole('button', { name: 'Check answer' }))
  fireEvent.click(
    await screen.findByRole('button', { name: isLast ? 'Finish gate' : 'Next question' }),
  )
}

/** Drive the advanced gate with exactly `numCorrect` of 10 answered correctly. */
async function driveAdvanced(numCorrect: number): Promise<void> {
  for (let i = 0; i < gateAdvanced.questions.length; i += 1) {
    await answerAdvanced(i, i < numCorrect)
  }
}

describe('SectionGatePlayer — real Advanced Play gate (10 questions, ~70% bar = 7/10)', () => {
  it('answering all 10 correctly completes gate-advanced', async () => {
    const store = makeStore()
    renderPlayer(gateAdvanced, store)
    await driveAdvanced(10)
    await screen.findByText('Section complete')
    await waitFor(() => expect(store.getStats(gateId('advanced')).completed).toBe(true))
  })

  it('exactly 7 of 10 correct PASSES (the displayed pass bar must match grading)', async () => {
    const store = makeStore()
    renderPlayer(gateAdvanced, store)
    await driveAdvanced(7)
    await screen.findByText('Section complete')
    await waitFor(() => expect(store.getStats(gateId('advanced')).completed).toBe(true))
  })

  it('6 of 10 correct FAILS (does not complete the section)', async () => {
    const store = makeStore()
    renderPlayer(gateAdvanced, store)
    await driveAdvanced(6)
    await screen.findByText('Gate not cleared')
    expect(store.getStats(gateId('advanced')).completed).toBe(false)
  })
})

function renderGatePage(sectionId: string, store: ProgressStore) {
  const router = createMemoryRouter(
    [
      {
        path: '/gate/:sectionId',
        element: createElement(
          ProgressStoreContext.Provider,
          { value: store },
          createElement(SectionGatePage),
        ),
      },
      { path: '/course', element: createElement('div', null, 'COURSE-PATH-MARKER') },
    ],
    { initialEntries: [`/gate/${sectionId}`] },
  )
  render(createElement(RouterProvider, { router }))
}

describe('SectionGatePage — route + guards + data load (incl. advanced)', () => {
  it('renders the Foundations gate (always unlocked) instead of redirecting', async () => {
    const store = makeStore()
    renderGatePage('foundations', store)
    expect(await screen.findByText('Foundations Gate')).toBeTruthy()
  })

  it('renders the Advanced gate once the Math gate is passed', async () => {
    const store = makeStore()
    store.saveGateResult('foundations', 4, 4)
    store.saveGateResult('playing', 6, 6)
    store.saveGateResult('math', 8, 8)
    renderGatePage('advanced', store)
    expect(await screen.findByText('Advanced Play Gate')).toBeTruthy()
  })

  it('redirects a locked section gate (advanced before math) back to the course path', async () => {
    const store = makeStore()
    renderGatePage('advanced', store)
    expect(await screen.findByText('COURSE-PATH-MARKER')).toBeTruthy()
  })
})

describe('CoursePath — the section gate node is reachable from the path', () => {
  function renderPath(store: ProgressStore) {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(
          ProgressStoreContext.Provider,
          { value: store },
          createElement(CoursePath, { lessons, completedIds: store.getCompletedIds() }),
        ),
      ),
    )
  }

  it('shows a clickable Foundations gate node whose modal links to /gate/foundations', async () => {
    const store = makeStore()
    completeLesson(store, '1')
    completeLesson(store, '2')
    renderPath(store)

    const gateNode = await screen.findByRole('button', { name: 'Section gate: Foundations Gate' })
    fireEvent.click(gateNode)

    const link = await screen.findByRole('link', {
      name: /Take the section gate|Test out of this section/,
    })
    expect(link.getAttribute('href')).toBe('/gate/foundations')
  })

  // Regression: the locked-lesson message must point a learner at the SECTION GATE
  // (the real blocker for a section's first lesson), not tell them to "redo the
  // previous lesson" they already finished — the misleading copy that reads as
  // "the section gates don't unlock anything".
  it('a locked first-of-section lesson points to the prior section gate (not the previous lesson)', async () => {
    const store = makeStore()
    renderPath(store)

    // Lesson 3 (Flow of a Hand) is the first Playing-a-Hand lesson — gated behind the
    // Foundations gate, NOT behind lesson 2.
    fireEvent.click(await screen.findByRole('button', { name: 'Lesson 3: Flow of a Hand' }))

    const link = await screen.findByRole('link', { name: /Go to the Foundations gate/ })
    expect(link.getAttribute('href')).toBe('/gate/foundations')
    expect(screen.queryByText(/Complete the previous lesson and its skill check/)).toBeNull()
  })

  it('a locked within-section lesson keeps the sequential "previous lesson" message', async () => {
    const store = makeStore()
    renderPath(store)

    // Lesson 4 (Betting Basics) is NOT a section boundary — it waits on lesson 3.
    fireEvent.click(await screen.findByRole('button', { name: 'Lesson 4: Betting Basics' }))

    expect(
      await screen.findByText(/Complete the previous lesson and its skill check/),
    ).toBeTruthy()
  })
})
