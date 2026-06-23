import { useMemo, useState } from 'react'
import type { VennDiagramAnswer, VennDiagramInteractionConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { NumericAnswerInput } from './NumericAnswerInput'
import { countMatches, hasValidCountInput } from './numericAnswer'

type VennRegion = 'aOnly' | 'bOnly' | 'ab' | 'outside'

type VennDiagramProps = InteractionProps & {
  config: VennDiagramInteractionConfig
  answer: VennDiagramAnswer
}

const REGION_LABELS: Record<VennRegion, string> = {
  aOnly: 'A only',
  bOnly: 'B only',
  ab: 'A ∩ B',
  outside: 'Outside both',
}

export function VennDiagram({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: VennDiagramProps) {
  const setA = config.setALabel ?? 'A'
  const setB = config.setBLabel ?? 'B'
  const { sizeA, sizeB, intersection, task } = config

  const aOnly = sizeA - intersection
  const bOnly = sizeB - intersection
  const union = sizeA + sizeB - intersection
  const outside =
    config.universeSize !== undefined ? config.universeSize - union : undefined

  const [selected, setSelected] = useState<Set<VennRegion>>(new Set())
  const [countInput, setCountInput] = useState('')
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const locked = disabled || submitted
  const isSelectTask = task === 'select-intersection' || task === 'select-union'
  const isEnterTask = task === 'enter-union' || task === 'enter-complement'

  const countLabel =
    config.countLabel ??
    (task === 'enter-complement'
      ? `Enter |${setA}ᶜ| — outcomes in the universe but not in ${setA}:`
      : `Enter |${setA} ∪ ${setB}| using inclusion–exclusion:`)

  const expectedRegions = useMemo(() => {
    if (task === 'select-intersection') return ['ab'] as VennRegion[]
    if (task === 'select-union') return ['aOnly', 'bOnly', 'ab'] as VennRegion[]
    return []
  }, [task])

  function toggleRegion(region: VennRegion) {
    if (locked || !isSelectTask) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(region)) next.delete(region)
      else next.add(region)
      return next
    })
  }

  function regionsMatch() {
    if (expectedRegions.length === 0) return true
    if (selected.size !== expectedRegions.length) return false
    return expectedRegions.every((r) => selected.has(r))
  }

  const canSubmit =
    !locked &&
    ((isSelectTask && selected.size > 0) ||
      (isEnterTask && hasValidCountInput(countInput)))

  function handleSubmit() {
    if (locked) return
    setSubmitted(true)
    let ok = false
    if (isSelectTask) {
      ok = regionsMatch()
    } else if (task === 'enter-union') {
      ok = countMatches(countInput, answer.count ?? union)
    } else if (task === 'enter-complement') {
      ok = countMatches(countInput, answer.count ?? (config.universeSize ?? 0) - sizeA)
    }
    if (ok) {
      setSolved(true)
      onCorrect()
    } else {
      onIncorrect?.()
    }
  }

  function handleRetry() {
    onAttemptReset?.()
    setSubmitted(false)
    setSolved(false)
    setSelected(new Set())
    setCountInput('')
  }

  function regionClass(_region: VennRegion, active: boolean) {
    const base =
      'absolute cursor-pointer rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
    if (active) return `${base} bg-brand-400/70 ring-2 ring-brand-600`
    return `${base} bg-brand-200/40 hover:bg-brand-300/60`
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
        <p>
          |{setA}| = {sizeA} · |{setB}| = {sizeB} · |{setA} ∩ {setB}| = {intersection}
        </p>
        {config.universeSize !== undefined && (
          <p className="mt-1">|Ω| = {config.universeSize}</p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Regions: {setA} only = {aOnly}, {setB} only = {bOnly}, overlap = {intersection}
          {outside !== undefined && `, outside = ${outside}`}
        </p>
      </div>

      <div className="relative mx-auto h-56 w-full max-w-md">
        <svg viewBox="0 0 400 220" className="h-full w-full" aria-hidden>
          <rect x="8" y="8" width="384" height="204" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
          <circle cx="155" cy="115" r="72" fill="#dbeafe" fillOpacity="0.5" stroke="#93c5fd" />
          <circle cx="245" cy="115" r="72" fill="#fce7f3" fillOpacity="0.5" stroke="#f9a8d4" />
          <text x="95" y="50" className="fill-slate-700 text-sm font-bold">
            {setA}
          </text>
          <text x="285" y="50" className="fill-slate-700 text-sm font-bold">
            {setB}
          </text>
        </svg>

        {isSelectTask && (
          <>
            <button
              type="button"
              aria-label={REGION_LABELS.aOnly}
              disabled={locked}
              onClick={() => toggleRegion('aOnly')}
              className={`${regionClass('aOnly', selected.has('aOnly'))} left-[12%] top-[38%] h-16 w-16`}
            />
            <button
              type="button"
              aria-label={REGION_LABELS.bOnly}
              disabled={locked}
              onClick={() => toggleRegion('bOnly')}
              className={`${regionClass('bOnly', selected.has('bOnly'))} right-[12%] top-[38%] h-16 w-16`}
            />
            <button
              type="button"
              aria-label={REGION_LABELS.ab}
              disabled={locked}
              onClick={() => toggleRegion('ab')}
              className={`${regionClass('ab', selected.has('ab'))} left-1/2 top-[38%] h-14 w-14 -translate-x-1/2`}
            />
            {config.universeSize !== undefined && (
              <button
                type="button"
                aria-label={REGION_LABELS.outside}
                disabled={locked}
                onClick={() => toggleRegion('outside')}
                className={`${regionClass('outside', selected.has('outside'))} right-4 top-4 h-10 w-16 rounded-lg`}
              />
            )}
          </>
        )}
      </div>

      {isSelectTask && (
        <p className="text-center text-xs text-slate-500">
          Tap the region(s) that match the prompt, then check
        </p>
      )}

      {isEnterTask && (
        <NumericAnswerInput
          id={`venn-${task}-${sizeA}-${sizeB}`}
          label={countLabel}
          value={countInput}
          onChange={setCountInput}
          disabled={locked}
        />
      )}

      <CheckPanel
        canSubmit={canSubmit}
        submitted={submitted}
        solved={solved}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        allowRetry={allowRetry}
      />
    </div>
  )
}
