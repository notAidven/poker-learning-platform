type FractionAnswerInputProps = {
  label: string
  numerator: string
  denominator: string
  onNumeratorChange: (value: string) => void
  onDenominatorChange: (value: string) => void
  disabled?: boolean
  id?: string
}

export function FractionAnswerInput({
  label,
  numerator,
  denominator,
  onNumeratorChange,
  onDenominatorChange,
  disabled = false,
  id = 'fraction-answer',
}: FractionAnswerInputProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label htmlFor={`${id}-num`} className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-2">
        <input
          id={`${id}-num`}
          type="text"
          inputMode="numeric"
          value={numerator}
          onChange={(e) => onNumeratorChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold tabular-nums text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50"
          placeholder="1"
          aria-label="Numerator"
        />
        <span className="text-2xl font-bold text-slate-400" aria-hidden="true">
          /
        </span>
        <input
          id={`${id}-den`}
          type="text"
          inputMode="numeric"
          value={denominator}
          onChange={(e) => onDenominatorChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold tabular-nums text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50"
          placeholder="6"
          aria-label="Denominator"
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Enter numerator and denominator, or type a combined fraction like{' '}
        <span className="font-mono">1/6</span> in the first field.
      </p>
    </div>
  )
}
