import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cx } from './cx'
import { DUR, EASE, SPRING } from '../../lib/motion'
import { usePrefersReducedMotion } from '../lesson/interactions/usePrefersReducedMotion'

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
} as const

type ModalProps = {
  open: boolean
  /** Esc, backdrop click and the focus-trap all route through this. */
  onClose: () => void
  children: ReactNode
  role?: 'dialog' | 'alertdialog'
  labelledBy?: string
  describedBy?: string
  size?: keyof typeof sizes
  /** Tall content (e.g. an explanation) that should scroll inside the panel. */
  scrollable?: boolean
  /** Element to focus on open; falls back to the first focusable, then the panel. */
  initialFocusRef?: RefObject<HTMLElement | null>
  /** Restore focus to whatever was focused before the modal opened. */
  restoreFocus?: boolean
  /** Extra classes for the dialog panel. */
  className?: string
}

/**
 * Shared modal: backdrop + focus trap + Esc/backdrop close + a token'd spring
 * entrance. Replaces the per-modal copies; reduced-motion shows it instantly.
 */
export function Modal({
  open,
  onClose,
  children,
  role = 'dialog',
  labelledBy,
  describedBy,
  size = 'sm',
  scrollable = false,
  initialFocusRef,
  restoreFocus = true,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (!open) return
    const previouslyFocused = restoreFocus ? (document.activeElement as HTMLElement | null) : null

    const focusTarget =
      initialFocusRef?.current ??
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      dialogRef.current
    focusTarget?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key !== 'Tab' || !dialogRef.current) return

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
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
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [open, onClose, initialFocusRef, restoreFocus])

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          role="presentation"
          onClick={onClose}
        >
          <motion.div
            className="absolute inset-0 bg-night-950/45 backdrop-blur-[2px]"
            aria-hidden
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: reduced ? 0 : DUR.quick, ease: EASE.exit } }}
            transition={{ duration: reduced ? 0 : DUR.quick, ease: EASE.standard }}
          />

          <motion.div
            ref={dialogRef}
            role={role}
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            tabIndex={-1}
            className={cx(
              'relative w-full rounded-panel border border-night-900/10 bg-white p-6 shadow-modal focus:outline-none',
              sizes[size],
              scrollable && 'max-h-[85vh] overflow-y-auto',
              className,
            )}
            onClick={(e) => e.stopPropagation()}
            initial={reduced ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: reduced ? 0 : 6,
              scale: reduced ? 1 : 0.98,
              transition: { duration: reduced ? 0 : DUR.quick, ease: EASE.exit },
            }}
            transition={reduced ? { duration: 0 } : SPRING}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
