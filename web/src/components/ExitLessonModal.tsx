import { useRef } from 'react'
import { Modal } from './ui/Modal'

type ExitLessonModalProps = {
  open: boolean
  onStay: () => void
  onExit: () => void
  title?: string
  description?: string
  stayLabel?: string
  exitLabel?: string
}

export function ExitLessonModal({
  open,
  onStay,
  onExit,
  title = 'Leave this lesson?',
  description = 'Your progress is saved. You can pick up right where you left off anytime.',
  stayLabel = 'Stay',
  exitLabel = 'Leave',
}: ExitLessonModalProps) {
  const stayRef = useRef<HTMLButtonElement>(null)

  return (
    <Modal
      open={open}
      onClose={onStay}
      role="alertdialog"
      labelledBy="exit-lesson-title"
      describedBy="exit-lesson-desc"
      initialFocusRef={stayRef}
    >
      <h2 id="exit-lesson-title" className="text-lg font-bold text-slate-900">
        {title}
      </h2>
      <p id="exit-lesson-desc" className="mt-2 text-sm text-slate-600">
        {description}
      </p>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          ref={stayRef}
          type="button"
          onClick={onStay}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {stayLabel}
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {exitLabel}
        </button>
      </div>
    </Modal>
  )
}
