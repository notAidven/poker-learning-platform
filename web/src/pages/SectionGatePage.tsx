import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ExitLessonModal } from '../components/ExitLessonModal'
import { SectionGatePlayer } from '../components/lesson/SectionGatePlayer'
import { hasSectionGate, loadSectionGate } from '../data/sectionGates'
import { sections, type SectionId } from '../data/lessons'
import {
  areSectionLessonsComplete,
  GATED_SECTIONS,
  sectionLessonIds,
} from '../lib/sectionGates'
import { gatePassMark } from '../lib/gamification'
import type { SectionGateDefinition } from '../data/sectionGates'
import { useActivityExitGuard } from '../hooks/useActivityExitGuard'
import { useProgress } from '../lib/progress'
import { Badge } from '../components/ui/Badge'

function isGatedSectionId(value: string): value is SectionId {
  return (GATED_SECTIONS as string[]).includes(value)
}

export function SectionGatePage() {
  const { sectionId = '' } = useParams()
  const valid = isGatedSectionId(sectionId)
  const meta = valid ? sections.find((s) => s.id === sectionId) : undefined
  const { completedIds, isSectionUnlocked, isGatePassed } = useProgress()

  const [gate, setGate] = useState<SectionGateDefinition | undefined>()
  // Track which section the loaded gate belongs to, so switching sections re-loads
  // without a synchronous loading flag (state is only ever set from the async result).
  const [loadedSectionId, setLoadedSectionId] = useState<string | null>(null)
  const [gateActive, setGateActive] = useState(false)

  useEffect(() => {
    if (!valid || !hasSectionGate(sectionId)) return

    let cancelled = false
    void loadSectionGate(sectionId).then((loaded) => {
      if (cancelled) return
      setGate(loaded)
      setLoadedSectionId(sectionId)
    })

    return () => {
      cancelled = true
    }
  }, [valid, sectionId])

  const gateReady = Boolean(gate) && loadedSectionId === sectionId

  // Warn only while actively answering (mirrors the skill-check exit guard).
  const { modalOpen, stay, confirmExit } = useActivityExitGuard({
    when: Boolean(gate) && gateActive,
  })

  if (!valid || !meta) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-xl font-bold">Section gate not found</h1>
        <Link to="/course" className="mt-4 inline-block text-brand-600">
          ← Back to course
        </Link>
      </div>
    )
  }

  // Locked on direct URLs: the prior section's gate must be passed first.
  if (!isSectionUnlocked(sectionId)) {
    return <Navigate to="/course" replace />
  }

  if (!gateReady || !gate) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-sm text-night-600" aria-live="polite">
        Loading section gate…
      </div>
    )
  }

  const lessonsDone = areSectionLessonsComplete(completedIds, sectionId)
  const alreadyPassed = isGatePassed(sectionId)
  const mode: 'test-out' | 'gate' = lessonsDone ? 'gate' : 'test-out'
  const firstLessonId = sectionLessonIds(sectionId)[0] ?? ''
  const total = gate.questions.length
  const passMark = gatePassMark(total)

  const eyebrow = alreadyPassed
    ? 'Section gate · Retake'
    : mode === 'test-out'
      ? 'Section gate · Test out'
      : 'Section gate'

  return (
    <>
      <div className="space-y-4">
        <div className="mx-auto max-w-lg">
          <Link to="/course" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            ← Course path
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
            {eyebrow}
          </p>
          <h1 className="text-xl font-bold text-ink sm:text-2xl">{meta.title} Gate</h1>
          <p className="mt-1 text-sm text-night-700">
            {total} questions covering the whole section — no hints. Pass with {passMark} of {total}.
          </p>

          {mode === 'test-out' && !alreadyPassed && (
            <div className="mt-3 rounded-2xl border border-gold-300 bg-gold-100/70 px-4 py-3 text-sm text-gold-900">
              <Badge tone="gold" className="mb-1.5">
                Test out
              </Badge>
              <p>
                Clear this gate to skip {meta.title}&rsquo;s lessons — they&rsquo;ll be marked
                complete and the next section unlocks. Earn fewer XP than doing the lessons, and if
                you don&rsquo;t pass, just work through them normally.
              </p>
            </div>
          )}
        </div>

        <SectionGatePlayer
          gate={gate}
          sectionTitle={meta.title}
          mode={mode}
          firstLessonId={firstLessonId}
          onActiveChange={setGateActive}
        />
      </div>

      <ExitLessonModal
        open={modalOpen}
        onStay={stay}
        onExit={confirmExit}
        title="Leave the section gate?"
        description="Your progress is saved. You can take the gate again any time."
      />
    </>
  )
}
