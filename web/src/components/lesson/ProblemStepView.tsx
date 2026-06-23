import { useState } from 'react'
import type { ProblemStep } from '../../types/lesson'
import { MathContent } from './MathContent'
import { WhyExplanationModal } from './WhyExplanationModal'
import { CoinEventGrid } from './interactions/CoinEventGrid'
import { CoinFlipLab } from './interactions/CoinFlipLab'
import { CountingProduct } from './interactions/CountingProduct'
import { DieSampleSpace } from './interactions/DieSampleSpace'
import { FairnessScale } from './interactions/FairnessScale'
import { SeatPermutation } from './interactions/SeatPermutation'
import { SelectCombination } from './interactions/SelectCombination'
import { CoinFlipProbability } from './interactions/CoinFlipProbability'
import { BirthdaySimulation } from './interactions/BirthdaySimulation'
import { DerangementMatch } from './interactions/DerangementMatch'
import { VennDiagram } from './interactions/VennDiagram'
import { TwoDiceGrid } from './interactions/TwoDiceGrid'

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

  const interactionProps = {
    onCorrect: handleCorrect,
    onIncorrect: handleIncorrect,
    onAttemptReset: handleAttemptReset,
    disabled: locked,
    initialSolved: alreadySolved,
  }

  return (
    <div className="space-y-5">
      <MathContent className="text-base font-medium text-slate-900">{step.prompt}</MathContent>

      {step.interaction === 'coin-flip-lab' && (
        <CoinFlipLab key={step.id} config={step.config} answer={step.answer} {...interactionProps} />
      )}
      {step.interaction === 'die-sample-space' && (
        <DieSampleSpace key={step.id} config={step.config} answer={step.answer} {...interactionProps} />
      )}
      {step.interaction === 'fairness-scale' && (
        <FairnessScale key={step.id} config={step.config} answer={step.answer} {...interactionProps} />
      )}
      {step.interaction === 'two-dice-grid' && (
        <TwoDiceGrid key={step.id} config={step.config} answer={step.answer} {...interactionProps} />
      )}
      {step.interaction === 'coin-event-grid' && (
        <CoinEventGrid key={step.id} config={step.config} answer={step.answer} {...interactionProps} />
      )}
      {step.interaction === 'counting-product' && (
        <CountingProduct key={step.id} config={step.config} answer={step.answer} {...interactionProps} />
      )}
      {step.interaction === 'seat-permutation' && (
        <SeatPermutation key={step.id} config={step.config} answer={step.answer} {...interactionProps} />
      )}
      {step.interaction === 'select-combination' && (
        <SelectCombination key={step.id} config={step.config} answer={step.answer} {...interactionProps} />
      )}
      {step.interaction === 'coin-flip-probability' && (
        <CoinFlipProbability key={step.id} config={step.config} answer={step.answer} {...interactionProps} />
      )}
      {step.interaction === 'birthday-simulation' && (
        <BirthdaySimulation key={step.id} config={step.config} answer={step.answer} {...interactionProps} />
      )}
      {step.interaction === 'derangement-match' && (
        <DerangementMatch key={step.id} config={step.config} answer={step.answer} {...interactionProps} />
      )}
      {step.interaction === 'venn-diagram' && (
        <VennDiagram key={step.id} config={step.config} answer={step.answer} {...interactionProps} />
      )}

      {showIncorrect && !solved && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          <MathContent>{step.feedback.incorrect}</MathContent>
        </div>
      )}

      {solved && (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          <p className="font-semibold">Correct!</p>
          <MathContent className="mt-1">{step.feedback.correct}</MathContent>
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
        venn={step.feedback.venn}
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
              className="rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-slate-700"
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
