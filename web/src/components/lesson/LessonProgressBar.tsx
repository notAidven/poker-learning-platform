type LessonProgressBarProps = {
  current: number
  total: number
}

export function LessonProgressBar({ current, total }: LessonProgressBarProps) {
  const pct = total > 0 ? Math.round(((current + 1) / total) * 100) : 0

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-slate-500">
        Step {current + 1} of {total}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
