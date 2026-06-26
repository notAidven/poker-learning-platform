import { useState } from 'react'
import { motion } from 'motion/react'
import type { ProblemStep } from '../../types/lesson'
import { DUR, EASE } from '../../lib/motion'
import { usePrefersReducedMotion } from './interactions/usePrefersReducedMotion'
import { MathContent } from './MathContent'
import { WhyExplanationModal } from './WhyExplanationModal'
import { InteractionRenderer } from './InteractionRenderer'
import { Calculator } from './interactions/Calculator'

/** A check mark that draws itself in — the "correct" affirmation. */
function CheckDraw({ reduced }: { reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-5 w-5 shrink-0 text-success-600"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <motion.path
        d="M5 13l4 4L19 7"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduced ? { duration: 0 } : { duration: DUR.base, ease: EASE.standard }}
      />
    </svg>
  )
}

type ProblemStepViewProps = {
  step: ProblemStep
  alreadySolved: boolean
  onSolved: () => void
  onFirstSubmit?: (correct: boolean) => void
  onAttemptSubmit?: () => void
}

export function ProblemStepView({
  step,
  alreadySolved,
  onSolved,
  onFirstSubmit,
  onAttemptSubmit,
}: ProblemStepViewProps) {
  const reduced = usePrefersReducedMotion()
  const [solved, setSolved] = useState(alreadySolved)
  const [hintsShown, setHintsShown] = useState(0)
  const [showIncorrect, setShowIncorrect] = useState(false)
  const [firstSubmitRecorded, setFirstSubmitRecorded] = useState(alreadySolved)
  const [whyOpen, setWhyOpen] = useState(false)

  function recordAttemptSubmit() {
    onAttemptSubmit?.()
  }

  function recordFirstSubmit(correct: boolean) {
    if (firstSubmitRecorded) return
    setFirstSubmitRecorded(true)
    onFirstSubmit?.(correct)
  }

  function handleCorrect() {
    if (solved) return
    recordAttemptSubmit()
    recordFirstSubmit(true)
    setSolved(true)
    setShowIncorrect(false)
    onSolved()
  }

  function handleIncorrect() {
    recordAttemptSubmit()
    recordFirstSubmit(false)
    setShowIncorrect(true)
  }

  function handleAttemptReset() {
    setShowIncorrect(false)
  }

  function revealHint() {
    setHintsShown((n) => Math.min(n + 1, step.feedback.hints.length))
  }

  const visibleHints = step.feedback.hints.slice(0, hintsShown)
  const canShowMoreHints = hintsShown < step.feedback.hints.length
  const locked = solved || alreadySolved
  const whyContent = step.feedback.why ?? step.feedback.correct

  return (
    <div className="space-y-5">
      <MathContent className="text-base font-medium text-ink">{step.prompt}</MathContent>

      {step.showCalculator && <Calculator />}

      <InteractionRenderer
        step={step}
        onCorrect={handleCorrect}
        onIncorrect={handleIncorrect}
        onAttemptReset={handleAttemptReset}
        disabled={locked}
        initialSolved={alreadySolved}
      />

      {showIncorrect && !solved && (
        <motion.div
          className="answer-wrong rounded-2xl border px-4 py-3 text-sm"
          role="alert"
          initial={reduced ? false : { x: 0 }}
          animate={reduced ? undefined : { x: [0, -6, 6, -5, 5, -2, 2, 0] }}
          transition={reduced ? undefined : { duration: DUR.base * 1.4, ease: EASE.standard }}
        >
          <MathContent>{step.feedback.incorrect}</MathContent>
        </motion.div>
      )}

      {solved && (
        <div className="answer-correct flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm" role="status">
          <CheckDraw reduced={reduced} />
          <div>
            <p className="font-semibold">Correct!</p>
            <MathContent className="mt-1">{step.feedback.correct}</MathContent>
          </div>
        </div>
      )}

      {firstSubmitRecorded && (
        <button
          type="button"
          onClick={() => setWhyOpen(true)}
          className="text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Why?
        </button>
      )}

      <WhyExplanationModal
        open={whyOpen}
        onClose={() => setWhyOpen(false)}
        content={whyContent}
      />

      {!solved && (
        <div className="space-y-3">
          {canShowMoreHints && (
            <button
              type="button"
              onClick={revealHint}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Get hint ({hintsShown}/{step.feedback.hints.length})
            </button>
          )}

          {visibleHints.map((hint, i) => (
            <div
              key={i}
              className="rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-night-700"
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
                Hint {i + 1}
              </p>
              <MathContent>{hint}</MathContent>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
