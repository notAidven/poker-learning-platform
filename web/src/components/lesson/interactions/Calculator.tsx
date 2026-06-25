import { useId, useState, type KeyboardEvent } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * A compact, collapsible 4-function scratchpad calculator for the math lessons.
 *
 * It exists so learners can divide/multiply for pot odds, equity, and EV without doing
 * the arithmetic in their head. It is a TOOL ONLY: it keeps all of its state locally and
 * never reads, writes, or validates the lesson answer, so it can never affect grading or
 * auto-fill a response. Collapsed by default to keep the question uncluttered; expand it
 * with the "Calculator" toggle. Keyboard-accessible (every key is a real button, and you
 * can also type digits/operators once a key is focused) and reduced-motion aware.
 */

type Op = '+' | '-' | '*' | '/'

const OP_SYMBOL: Record<Op, string> = { '+': '+', '-': '\u2212', '*': '\u00d7', '/': '\u00f7' }

function compute(a: number, b: number, op: Op): number {
  switch (op) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '*':
      return a * b
    case '/':
      return b === 0 ? NaN : a / b
  }
}

/** Trim binary-float noise and keep the readout to a sensible width. */
function formatResult(n: number): string {
  if (!Number.isFinite(n)) return 'Error'
  const rounded = Math.round((n + Number.EPSILON) * 1e9) / 1e9
  const s = String(rounded)
  if (s.replace('-', '').replace('.', '').length > 12) return String(Number(rounded.toPrecision(10)))
  return s
}

const CALC_STYLES = `
.calc-anim { animation: calc-in 0.18s ease-out; }
@keyframes calc-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}
.calc-display {
  background:
    radial-gradient(120% 140% at 50% -20%, rgba(16,135,99,0.18) 0%, transparent 60%),
    linear-gradient(160deg, #0f7a5a 0%, #0b6349 55%, #084c39 100%);
}
`

type Variant = 'digit' | 'op' | 'equals' | 'clear' | 'util'

const VARIANT_CLASS: Record<Variant, string> = {
  digit: 'border-slate-200 bg-white text-slate-800 hover:border-brand-300 hover:bg-slate-50',
  op: 'border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-300 hover:bg-brand-100',
  equals: 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600',
  clear: 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100',
  util: 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100',
}

function Key({
  label,
  ariaLabel,
  onPress,
  variant = 'digit',
  span = 1,
  disabled = false,
}: {
  label: string
  ariaLabel?: string
  onPress: () => void
  variant?: Variant
  span?: 1 | 2
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`flex min-h-11 items-center justify-center rounded-xl border-2 text-base font-bold tabular-nums transition focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASS[variant]} ${span === 2 ? 'col-span-2' : ''}`}
    >
      {label}
    </button>
  )
}

export function Calculator() {
  const reduceMotion = usePrefersReducedMotion()
  const panelId = useId()

  const [open, setOpen] = useState(false)
  const [display, setDisplay] = useState('0')
  const [accumulator, setAccumulator] = useState<number | null>(null)
  const [pendingOp, setPendingOp] = useState<Op | null>(null)
  // When true, the next digit starts a fresh number instead of appending.
  const [overwrite, setOverwrite] = useState(true)

  const errored = display === 'Error'

  function reset() {
    setDisplay('0')
    setAccumulator(null)
    setPendingOp(null)
    setOverwrite(true)
  }

  function inputDigit(d: string) {
    setDisplay((prev) => {
      if (overwrite || prev === 'Error') return d
      if (prev === '0') return d
      if (prev.replace('-', '').replace('.', '').length >= 12) return prev
      return prev + d
    })
    setOverwrite(false)
  }

  function inputDot() {
    setDisplay((prev) => {
      if (overwrite || prev === 'Error') return '0.'
      return prev.includes('.') ? prev : prev + '.'
    })
    setOverwrite(false)
  }

  function chooseOp(next: Op) {
    if (errored) return
    const current = Number(display)
    if (pendingOp !== null && accumulator !== null && !overwrite) {
      const result = compute(accumulator, current, pendingOp)
      if (!Number.isFinite(result)) {
        setDisplay('Error')
        setAccumulator(null)
        setPendingOp(null)
        setOverwrite(true)
        return
      }
      setDisplay(formatResult(result))
      setAccumulator(result)
    } else {
      setAccumulator(current)
    }
    setPendingOp(next)
    setOverwrite(true)
  }

  function equals() {
    if (errored || pendingOp === null || accumulator === null) return
    const current = Number(display)
    const result = compute(accumulator, current, pendingOp)
    setDisplay(formatResult(result))
    setAccumulator(null)
    setPendingOp(null)
    setOverwrite(true)
  }

  function backspace() {
    if (overwrite || errored) return
    setDisplay((prev) => {
      if (prev.length <= 1 || (prev.length === 2 && prev.startsWith('-'))) return '0'
      return prev.slice(0, -1)
    })
  }

  // Let learners type once a key has focus. Enter is intentionally left to the browser so
  // it activates whichever key is focused (avoids a double "=" press); use the "=" key for
  // equals instead.
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const k = e.key
    if (k >= '0' && k <= '9') {
      inputDigit(k)
    } else if (k === '.') {
      inputDot()
    } else if (k === '+') {
      chooseOp('+')
    } else if (k === '-') {
      chooseOp('-')
    } else if (k === '*' || k === 'x' || k === 'X') {
      chooseOp('*')
    } else if (k === '/') {
      chooseOp('/')
    } else if (k === '=') {
      equals()
    } else if (k === 'Backspace') {
      backspace()
    } else if (k === 'Escape' || k === 'Delete') {
      reset()
    } else {
      return
    }
    e.preventDefault()
  }

  const runningExpr =
    accumulator !== null && pendingOp !== null ? `${formatResult(accumulator)} ${OP_SYMBOL[pendingOp]}` : ''

  return (
    <div>
      <style>{CALC_STYLES}</style>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <line x1="8" y1="7" x2="16" y2="7" />
          <line x1="8" y1="11" x2="8" y2="11" />
          <line x1="12" y1="11" x2="12" y2="11" />
          <line x1="16" y1="11" x2="16" y2="11" />
          <line x1="8" y1="15" x2="8" y2="15" />
          <line x1="12" y1="15" x2="12" y2="15" />
          <line x1="16" y1="15" x2="16" y2="15" />
        </svg>
        <span>Calculator</span>
        <svg
          viewBox="0 0 20 20"
          className="h-3.5 w-3.5 text-slate-400"
          fill="currentColor"
          aria-hidden="true"
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: reduceMotion ? undefined : 'transform 0.18s ease',
          }}
        >
          <path d="M5.5 7.5 10 12l4.5-4.5z" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label="Scratchpad calculator"
          onKeyDown={onKeyDown}
          className={`mt-2 max-w-xs rounded-2xl border border-slate-200 bg-white p-3 shadow-sm ${
            reduceMotion ? '' : 'calc-anim'
          }`}
        >
          <p className="mb-2 text-[0.7rem] text-slate-400">
            Scratchpad only. It will not fill in or check your answer.
          </p>
          <div className="calc-display mb-3 rounded-xl px-4 py-3 text-right text-white shadow-inner">
            <div className="h-4 text-xs font-medium text-emerald-100/70 tabular-nums" aria-hidden="true">
              {runningExpr}
            </div>
            <output
              className="block overflow-x-auto text-2xl font-bold tabular-nums"
              aria-live="polite"
              aria-label={`Result ${display}`}
            >
              {display}
            </output>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <Key label="AC" ariaLabel="Clear all" onPress={reset} variant="clear" span={2} />
            <Key label={'\u232b'} ariaLabel="Backspace" onPress={backspace} variant="util" />
            <Key label={OP_SYMBOL['/']} ariaLabel="Divide" onPress={() => chooseOp('/')} variant="op" />

            <Key label="7" onPress={() => inputDigit('7')} />
            <Key label="8" onPress={() => inputDigit('8')} />
            <Key label="9" onPress={() => inputDigit('9')} />
            <Key label={OP_SYMBOL['*']} ariaLabel="Multiply" onPress={() => chooseOp('*')} variant="op" />

            <Key label="4" onPress={() => inputDigit('4')} />
            <Key label="5" onPress={() => inputDigit('5')} />
            <Key label="6" onPress={() => inputDigit('6')} />
            <Key label={OP_SYMBOL['-']} ariaLabel="Subtract" onPress={() => chooseOp('-')} variant="op" />

            <Key label="1" onPress={() => inputDigit('1')} />
            <Key label="2" onPress={() => inputDigit('2')} />
            <Key label="3" onPress={() => inputDigit('3')} />
            <Key label={OP_SYMBOL['+']} ariaLabel="Add" onPress={() => chooseOp('+')} variant="op" />

            <Key label="0" onPress={() => inputDigit('0')} span={2} />
            <Key label="." ariaLabel="Decimal point" onPress={inputDot} />
            <Key label="=" ariaLabel="Equals" onPress={equals} variant="equals" />
          </div>
        </div>
      )}
    </div>
  )
}
