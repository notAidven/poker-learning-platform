import { useEffect, useRef } from 'react'

type ExitLessonModalProps = {
  open: boolean
  onStay: () => void
  onExit: () => void
}

export function ExitLessonModal({ open, onStay, onExit }: ExitLessonModalProps) {
  const stayRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    stayRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onStay()
        return
      }

      if (e.key !== 'Tab' || !dialogRef.current) return

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onStay])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="presentation"
      onClick={onStay}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" aria-hidden />

      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="exit-lesson-title"
        aria-describedby="exit-lesson-desc"
        className="relative w-full max-w-sm animate-[fadeIn_0.2s_ease-out] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="exit-lesson-title" className="text-lg font-bold text-slate-900">
          Leave this lesson?
        </h2>
        <p id="exit-lesson-desc" className="mt-2 text-sm text-slate-600">
          If you leave now, you will lose any XP earned in this attempt and have to restart the
          lesson from the beginning.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={stayRef}
            type="button"
            onClick={onStay}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Exit lesson
          </button>
        </div>
      </div>
    </div>
  )
}
