import { useState } from 'react'
import type { ProblemStep } from '../../types/lesson'
import type { SkillCheckQuestion } from '../../types/skillCheck'
import { InteractionRenderer } from './InteractionRenderer'
import { MathContent } from './MathContent'
import { Calculator } from './interactions/Calculator'

type SkillCheckStepViewProps = {
  question: SkillCheckQuestion
  onAnswered: (correct: boolean) => void
}

/**
 * Math skill-check questions get the same collapsible scratchpad Calculator the
 * math lessons show. There is no data flag on skill-check questions, so we infer
 * "math" from the interaction type — the arithmetic-heavy ones (outs/equity/pot
 * odds and EV/bet sizing) — mirroring how the math lessons set `showCalculator`.
 */
const MATH_INTERACTIONS: ReadonlySet<ProblemStep['interaction']> = new Set([
  'outs-odds',
  'betting-round',
])

export function SkillCheckStepView({ question, onAnswered }: SkillCheckStepViewProps) {
  const [result, setResult] = useState<'pending' | 'correct' | 'incorrect'>('pending')

  function handleCorrect() {
    if (result !== 'pending') return
    setResult('correct')
    onAnswered(true)
  }

  function handleIncorrect() {
    if (result !== 'pending') return
    setResult('incorrect')
    onAnswered(false)
  }

  const locked = result !== 'pending'
  const showCalculator = MATH_INTERACTIONS.has(question.interaction)

  return (
    <div className="space-y-5">
      <MathContent className="text-base font-medium text-slate-900">{question.prompt}</MathContent>

      {showCalculator && <Calculator />}

      <InteractionRenderer
        step={question as ProblemStep}
        onCorrect={handleCorrect}
        onIncorrect={handleIncorrect}
        disabled={locked}
        allowRetry={false}
      />

      {result === 'correct' && (
        <p className="text-sm font-semibold text-emerald-700" role="status">
          Correct!
        </p>
      )}

      {result === 'incorrect' && (
        <div className="text-sm font-semibold text-red-700" role="status">
          <MathContent>
            {question.incorrectFeedback ?? 'Not quite. Review the lesson and try the next one.'}
          </MathContent>
        </div>
      )}
    </div>
  )
}
