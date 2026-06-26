import { useRef } from 'react'
import { Modal } from '../ui/Modal'

type LessonCompleteModalProps = {
  open: boolean
  onStartSkillCheck: () => void
  /** Dismiss (Escape / backdrop / "Later") — defer the skill check (#11). */
  onClose: () => void
}

export function LessonCompleteModal({ open, onStartSkillCheck, onClose }: LessonCompleteModalProps) {
  const startRef = useRef<HTMLButtonElement>(null)

  return (
    <Modal
      open={open}
      onClose={onClose}
      role="alertdialog"
      labelledBy="lesson-complete-title"
      describedBy="lesson-complete-desc"
      initialFocusRef={startRef}
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
    </Modal>
  )
}
