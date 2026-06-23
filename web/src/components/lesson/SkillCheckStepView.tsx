import { useState } from 'react'
import type { ProblemStep } from '../../types/lesson'
import type { SkillCheckQuestion } from '../../types/skillCheck'
import { InteractionRenderer } from './InteractionRenderer'
import { MathContent } from './MathContent'

type SkillCheckStepViewProps = {
  question: SkillCheckQuestion
  onAnswered: (correct: boolean) => void
}

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

  return (
    <div className="space-y-5">
      <MathContent className="text-base font-medium text-slate-900">{question.prompt}</MathContent>

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
        <p className="text-sm font-semibold text-red-700" role="status">
          <MathContent>
            {question.incorrectFeedback ?? 'Not quite — review the lesson and try the next one.'}
          </MathContent>
        </p>
      )}
    </div>
  )
}
