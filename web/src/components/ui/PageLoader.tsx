import { BrandMark } from './Logo'

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <span className="relative grid h-14 w-14 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-brand-500/20" aria-hidden />
        <BrandMark className="relative h-12 w-12 animate-pulse" />
      </span>
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  )
}
