import { useRef } from 'react'
import { Modal } from '../ui/Modal'
import { MathContent } from './MathContent'

type WhyExplanationModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  content: string
}

export function WhyExplanationModal({
  open,
  onClose,
  title = 'Why?',
  content,
}: WhyExplanationModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      scrollable
      labelledBy="why-modal-title"
      describedBy="why-modal-desc"
      initialFocusRef={closeRef}
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
    </Modal>
  )
}
