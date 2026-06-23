import { useEffect, useRef } from 'react'
import type { VennDiagramConfig } from '../../types/lesson'
import { MathContent } from './MathContent'
import { VennDiagram } from './VennDiagram'

type WhyExplanationModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  content: string
  venn?: VennDiagramConfig
}

export function WhyExplanationModal({
  open,
  onClose,
  title = 'Why?',
  content,
  venn,
}: WhyExplanationModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()

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
        role="dialog"
        aria-modal="true"
        aria-labelledby="why-modal-title"
        aria-describedby="why-modal-desc"
        className="relative max-h-[85vh] w-full max-w-lg animate-[fadeIn_0.2s_ease-out] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="why-modal-title" className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close explanation"
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div id="why-modal-desc" className="mt-4 space-y-5">
          {venn && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-4">
              <VennDiagram config={venn} />
            </div>
          )}
          <MathContent className="text-sm">{content}</MathContent>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 sm:w-auto"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
