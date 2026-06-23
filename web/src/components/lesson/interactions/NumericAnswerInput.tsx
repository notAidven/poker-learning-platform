type NumericAnswerInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
}

export function NumericAnswerInput({
  label,
  value,
  onChange,
  disabled = false,
  id = 'numeric-count-answer',
}: NumericAnswerInputProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold tabular-nums text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50"
        placeholder="Enter a whole number"
      />
    </div>
  )
}
