import { useEffect, useRef } from 'react'

type LessonCompleteModalProps = {
  open: boolean
  onStartSkillCheck: () => void
  /** Dismiss (Escape / backdrop / "Later") — defer the skill check (#11). */
  onClose: () => void
}

export function LessonCompleteModal({ open, onStartSkillCheck, onClose }: LessonCompleteModalProps) {
  const startRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    startRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
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
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" aria-hidden />

      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="lesson-complete-title"
        aria-describedby="lesson-complete-desc"
        className="relative w-full max-w-sm animate-[fadeIn_0.2s_ease-out] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="lesson-complete-title" className="text-lg font-bold text-slate-900">
          Lesson complete!
        </h2>
        <p id="lesson-complete-desc" className="mt-2 text-sm text-slate-600">
          You finished all the steps in this lesson. Next up is a 3-question skill check with no
          hints. Pass 2 of 3 to complete the lesson and unlock the next one.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Later
          </button>
          <button
            ref={startRef}
            type="button"
            onClick={onStartSkillCheck}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Start skill check
          </button>
        </div>
      </div>
    </div>
  )
}
