import { useState } from 'react'
import { Link } from 'react-router-dom'
import { saveSkillCheckResult } from '../../lib/lessonProgress'
import type { SkillCheckDefinition } from '../../types/skillCheck'
import { MathContent } from './MathContent'

type SkillCheckPlayerProps = {
  skillCheck: SkillCheckDefinition
  lessonTitle: string
  onFinished?: () => void
}

export function SkillCheckPlayer({ skillCheck, lessonTitle, onFinished }: SkillCheckPlayerProps) {
  const total = skillCheck.questions.length
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [xpBreakdown, setXpBreakdown] = useState<{ base: number; bonus: number; total: number } | null>(
    null,
  )

  const question = skillCheck.questions[questionIndex]
  const isCorrect = selectedId === question.correctChoiceId

  function onSubmitAnswer() {
    if (!selectedId || submitted) return
    const gotIt = selectedId === question.correctChoiceId
    setSubmitted(true)
    const newCorrect = correctCount + (gotIt ? 1 : 0)
    setCorrectCount(newCorrect)

    if (questionIndex >= total - 1) {
      const result = saveSkillCheckResult(skillCheck.lessonId, newCorrect, total)
      if (result.isFirstCompletion && result.xpBreakdown) {
        setXpBreakdown(result.xpBreakdown)
      }
      setFinished(true)
      onFinished?.()
    }
  }

  function onContinue() {
    setQuestionIndex((i) => i + 1)
    setSelectedId(null)
    setSubmitted(false)
  }

  if (finished) {
    const percent = Math.round((correctCount / total) * 100)
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm">
          <p className="text-4xl" aria-hidden>
            {percent === 100 ? '★' : percent >= 67 ? '✓' : '↻'}
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Skill check complete</h2>
          <p className="mt-2 text-sm text-slate-600">
            You scored{' '}
            <span className="font-bold text-emerald-700">
              {correctCount}/{total}
            </span>{' '}
            ({percent}%) on the {lessonTitle} skill check.
          </p>
          {xpBreakdown && (
            <p className="mt-3 rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold text-brand-700">+{xpBreakdown.total} XP</span>
              {' '}
              ({xpBreakdown.base} base
              {xpBreakdown.bonus > 0 ? ` + ${xpBreakdown.bonus} first-try bonus` : ''})
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/course"
              className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Back to course path
            </Link>
            <Link
              to={`/lesson/${skillCheck.lessonId}`}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Review lesson
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
        <span className="font-semibold text-brand-600">Skill check</span>
        <span>
          Question {questionIndex + 1} of {total}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${((questionIndex + (submitted ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <MathContent className="text-base font-medium text-slate-900">{question.prompt}</MathContent>

        <div className="mt-6 space-y-3" role="radiogroup" aria-label="Answer choices">
          {question.choices.map((choice) => {
            const selected = selectedId === choice.id
            const showResult = submitted
            const isChoiceCorrect = choice.id === question.correctChoiceId

            let ring = 'border-slate-200 hover:border-brand-300'
            if (selected && !showResult) ring = 'border-brand-500 bg-brand-50'
            if (showResult && isChoiceCorrect) ring = 'border-emerald-500 bg-emerald-50'
            if (showResult && selected && !isChoiceCorrect) ring = 'border-red-400 bg-red-50'

            return (
              <button
                key={choice.id}
                type="button"
                disabled={submitted}
                onClick={() => setSelectedId(choice.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${ring} disabled:cursor-default`}
                role="radio"
                aria-checked={selected}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                    selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {choice.id.toUpperCase()}
                </span>
                <MathContent className="text-sm text-slate-800">{choice.label}</MathContent>
              </button>
            )
          })}
        </div>

        {submitted && (
          <p
            className={`mt-4 text-sm font-semibold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}
            role="status"
          >
            {isCorrect ? 'Correct!' : 'Not quite — the correct answer is highlighted.'}
          </p>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        {!submitted ? (
          <button
            type="button"
            onClick={onSubmitAnswer}
            disabled={!selectedId}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
          >
            Submit answer
          </button>
        ) : questionIndex < total - 1 ? (
          <button
            type="button"
            onClick={onContinue}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Next question
          </button>
        ) : null}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        No hints — answer from memory.
      </p>
    </div>
  )
}
