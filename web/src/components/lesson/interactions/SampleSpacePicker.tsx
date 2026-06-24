import { useMemo, useRef, useState } from 'react'
import type { SampleSpacePickerAnswer, SampleSpacePickerConfig } from '../../../types/lesson'
import type { InteractionProps } from './types'
import { CheckPanel } from './CheckPanel'
import { CoinFlipAnimation } from './CoinFlipAnimation'
import { NumericAnswerInput } from './NumericAnswerInput'
import { countMatches, hasValidCountInput } from './numericAnswer'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

type SampleSpacePickerProps = InteractionProps & {
  config: SampleSpacePickerConfig
  answer: SampleSpacePickerAnswer
}

function setsEqual(list: string[], expected: string[]) {
  const set = new Set(list)
  if (set.size !== expected.length) return false
  for (const item of expected) if (!set.has(item)) return false
  return true
}

export function SampleSpacePicker({
  config,
  answer,
  onCorrect,
  onIncorrect,
  onAttemptReset,
  disabled = false,
  initialSolved = false,
  allowRetry = true,
}: SampleSpacePickerProps) {
  const discoverMode = config.discoverMode ?? false

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(initialSolved)
  const [solved, setSolved] = useState(initialSolved)

  const [history, setHistory] = useState<('H' | 'T')[]>([])
  const historyRef = useRef<('H' | 'T')[]>([])
  const [showHeads, setShowHeads] = useState(true)
  const [flipping, setFlipping] = useState(false)

  // Discovery mode: Ω grows monotonically as distinct outcomes appear; the
  // tally counts every flip so learners see that repeats don't grow the set.
  const [discovered, setDiscovered] = useState<string[]>([])
  const discoveredRef = useRef<string[]>([])
  const [counts, setCounts] = useState<{ H: number; T: number }>({ H: 0, T: 0 })
  const [totalFlips, setTotalFlips] = useState(0)
  const [lastEvent, setLastEvent] = useState<{
    face: 'H' | 'T'
    isNew: boolean
    key: number
  } | null>(null)
  const [countInput, setCountInput] = useState('')

  const reducedMotion = usePrefersReducedMotion()

  const locked = disabled || submitted
  const listLabel = config.listLabel ?? (discoverMode ? 'Sample space Ω' : 'Your list (Ω)')
  const helperText =
    config.helperText ??
    'Tap options to add or remove outcomes. Only results that can happen belong in Ω.'
  const showCoinFlip = config.showCoinFlip ?? false

  const selectedList = useMemo(
    () => [...selected].sort((a, b) => config.options.indexOf(a) - config.options.indexOf(b)),
    [selected, config.options],
  )

  // Show Ω members in a stable, canonical order (answer order first).
  const discoveredList = useMemo(() => {
    const rank = (v: string) => {
      const i = answer.selected.indexOf(v)
      return i === -1 ? answer.selected.length : i
    }
    return [...discovered].sort((a, b) => rank(a) - rank(b))
  }, [discovered, answer.selected])

  function flip() {
    if (flipping) return
    if (discoverMode && locked) return

    const next: 'H' | 'T' = Math.random() < 0.5 ? 'H' : 'T'
    const nextHistory = [...historyRef.current, next].slice(-12)
    historyRef.current = nextHistory

    setHistory(nextHistory)
    setShowHeads(next === 'H')
    setFlipping(true)

    if (discoverMode) {
      const isNew = !discoveredRef.current.includes(next)
      if (isNew) {
        const nextDiscovered = [...discoveredRef.current, next]
        discoveredRef.current = nextDiscovered
        setDiscovered(nextDiscovered)
      }
      setCounts((c) => ({ ...c, [next]: c[next] + 1 }))
      setTotalFlips((n) => n + 1)
      setLastEvent({ face: next, isNew, key: Date.now() })
    }

    window.setTimeout(() => {
      setFlipping(false)
    }, 520)
  }

  function toggle(option: string) {
    if (locked) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(option)) next.delete(option)
      else next.add(option)
      return next
    })
  }

  function selectionValid() {
    return setsEqual([...selected], answer.selected)
  }

  function discoverValid() {
    if (!setsEqual(discoveredRef.current, answer.selected)) return false
    if (config.confirmCount && !countMatches(countInput, answer.selected.length)) return false
    return true
  }

  function handleSubmit() {
    if (locked || flipping) return
    setSubmitted(true)
    const ok = discoverMode ? discoverValid() : selectionValid()
    if (ok) {
      setSolved(true)
      onCorrect()
    } else {
      onIncorrect?.()
    }
  }

  function handleRetry() {
    onAttemptReset?.()
    historyRef.current = []
    setHistory([])
    setShowHeads(true)
    setFlipping(false)
    setSubmitted(false)
    setSolved(false)
    setSelected(new Set())
    discoveredRef.current = []
    setDiscovered([])
    setCounts({ H: 0, T: 0 })
    setTotalFlips(0)
    setLastEvent(null)
    setCountInput('')
  }

  const canSubmit = selected.size > 0 && !locked && !flipping

  const chipPicker = (
    <>
      <div className="scene-3d flex flex-wrap justify-center gap-3">
        {config.options.map((option) => {
          const active = selected.has(option)
          const showOk = submitted && answer.selected.includes(option)
          const showBad = submitted && active && !answer.selected.includes(option)

          let cls =
            'chip-3d flex h-14 min-w-14 items-center justify-center rounded-2xl border-2 px-4 text-lg font-bold'
          if (showOk) cls += ' border-emerald-500 bg-emerald-100 chip-3d--active'
          else if (showBad) cls += ' border-red-400 bg-red-50'
          else if (active) cls += ' border-brand-600 bg-brand-100 chip-3d--active'
          else cls += ' border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50'

          return (
            <button
              key={option}
              type="button"
              disabled={locked}
              onClick={() => toggle(option)}
              className={cls}
              aria-pressed={active}
            >
              {option}
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {listLabel}
        </p>
        {selectedList.length === 0 ? (
          <p className="text-sm text-slate-400">No outcomes selected yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedList.map((item) => (
              <span
                key={item}
                className="rounded-lg border border-brand-200 bg-white px-3 py-1 text-sm font-semibold text-brand-800"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  )

  if (discoverMode) {
    const discoverHelperText =
      config.discoverHelperText ??
      'Flip the coin and watch what lands face-up. Each new result you have never seen joins Ω — flipping a face you have already seen does not change the set. When you are sure you have seen every possible outcome, lock in Ω.'
    const countLabel = config.countLabel ?? 'How many distinct outcomes are in Ω? Enter |Ω|.'
    const lockInLabel = config.lockInLabel ?? "I've found every outcome — lock in Ω"

    const omegaSize = discovered.length
    const canLockIn =
      omegaSize > 0 &&
      !locked &&
      !flipping &&
      (!config.confirmCount || hasValidCountInput(countInput))

    let omegaBoxCls = 'rounded-2xl border-2 px-4 py-4 transition-colors'
    if (submitted && solved) omegaBoxCls += ' border-emerald-400 bg-emerald-50'
    else if (submitted && !solved) omegaBoxCls += ' border-amber-300 bg-amber-50'
    else omegaBoxCls += ' border-slate-200 bg-slate-50'

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-center text-sm font-semibold text-slate-700">Flip to discover</p>
          <CoinFlipAnimation
            history={history}
            showHeads={showHeads}
            flipping={flipping}
            locked={locked}
            onFlip={flip}
          />
        </div>

        <div className="flex min-h-7 items-center justify-center" aria-live="polite">
          {lastEvent && (
            <span
              key={lastEvent.key}
              style={reducedMotion ? undefined : { animation: 'fadeIn 0.25s ease' }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                lastEvent.isNew
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {lastEvent.isNew
                ? `New outcome! ${lastEvent.face} joins Ω`
                : `${lastEvent.face} again — already in Ω, so Ω is unchanged`}
            </span>
          )}
        </div>

        <div className="space-y-4 border-t border-slate-200 pt-6">
          <p className="text-center text-sm font-semibold text-slate-700">
            Build the sample space Ω
          </p>
          <p className="text-center text-sm text-slate-600">{discoverHelperText}</p>

          <div className={omegaBoxCls}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {listLabel}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                |Ω| = <span className="tabular-nums text-slate-800">{omegaSize}</span>
              </p>
            </div>
            {discoveredList.length === 0 ? (
              <p className="text-sm text-slate-400">
                Flip the coin — each distinct outcome you observe will appear here.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-lg font-bold text-slate-400">
                <span aria-hidden="true">{'{'}</span>
                {discoveredList.map((item) => {
                  const emphasize = !submitted && lastEvent?.isNew === true && lastEvent.face === item
                  let chipCls =
                    'chip-3d flex h-12 min-w-12 items-center justify-center rounded-2xl border-2 px-4 text-slate-700'
                  if (emphasize) chipCls += ' border-emerald-500 bg-emerald-100 chip-3d--active'
                  else chipCls += ' border-brand-300 bg-white'
                  return (
                    <span key={item} className={chipCls}>
                      {item}
                    </span>
                  )
                })}
                <span aria-hidden="true">{'}'}</span>
              </div>
            )}
          </div>

          {totalFlips > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tally of {totalFlips} flip{totalFlips === 1 ? '' : 's'}
              </p>
              <div className="space-y-1.5">
                {(['H', 'T'] as const).map((face) => {
                  const n = counts[face]
                  const pct = totalFlips > 0 ? (n / totalFlips) * 100 : 0
                  return (
                    <div key={face} className="flex items-center gap-3">
                      <span className="w-5 text-sm font-bold text-slate-700">{face}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            face === 'H' ? 'bg-amber-400' : 'bg-slate-400'
                          }`}
                          style={{
                            width: `${pct}%`,
                            transition: reducedMotion ? undefined : 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm font-semibold tabular-nums text-slate-600">
                        ×{n}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {config.confirmCount && discovered.length > 0 && (
            <NumericAnswerInput
              label={countLabel}
              value={countInput}
              onChange={setCountInput}
              disabled={locked}
            />
          )}
        </div>

        <CheckPanel
          canSubmit={canLockIn}
          submitted={submitted}
          solved={solved}
          onSubmit={handleSubmit}
          onRetry={handleRetry}
          submitLabel={lockInLabel}
          allowRetry={allowRetry}
        />
      </div>
    )
  }

  if (showCoinFlip) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-center text-sm font-semibold text-slate-700">Flip to explore</p>
          <CoinFlipAnimation
            history={history}
            showHeads={showHeads}
            flipping={flipping}
            locked={false}
            onFlip={flip}
          />
        </div>

        <div className="space-y-5 border-t border-slate-200 pt-6">
          <p className="text-center text-sm font-semibold text-slate-700">
            Build the sample space Ω
          </p>
          <p className="text-center text-sm text-slate-600">{helperText}</p>
          {chipPicker}
        </div>

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

  return (
    <div className="space-y-5">
      <p className="text-center text-sm text-slate-600">{helperText}</p>
      {chipPicker}
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
