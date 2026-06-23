type CheckPanelProps = {
  canSubmit: boolean
  submitted: boolean
  solved: boolean
  onSubmit: () => void
  onRetry: () => void
  submitLabel?: string
  allowRetry?: boolean
}

export function CheckPanel({
  canSubmit,
  submitted,
  solved,
  onSubmit,
  onRetry,
  submitLabel = 'Check answer',
  allowRetry = true,
}: CheckPanelProps) {
  return (
    <div className="space-y-3">
      {!submitted && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="min-h-11 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-40"
        >
          {submitLabel}
        </button>
      )}
      {submitted && !solved && allowRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Try again
        </button>
      )}
    </div>
  )
}
