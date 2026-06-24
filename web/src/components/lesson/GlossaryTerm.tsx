import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type GlossaryTermProps = {
  /** The term as written in the prose (preserves casing). */
  term: string
  definition: string
}

type Placement = 'top' | 'bottom'

type Coords = {
  top: number
  left: number
  placement: Placement
  /** Horizontal offset of the arrow within the popover, in px. */
  arrowLeft: number
}

const GAP = 8 // space between the word and the popover
const MARGIN = 8 // minimum gap from the viewport edge
const ARROW = 10 // arrow square size in px
const CLOSE_DELAY = 120 // ms grace period to move the pointer from the word into the popover

/**
 * A subtly-blue, dotted-underline term that opens a small definition popover
 * *above* the word. On pointer (mouse) devices it opens on **hover** and on
 * keyboard **focus**; a click/tap always **toggles** it, so touch devices — where
 * hover never fires — keep working. It closes on outside-click / Escape, and (for
 * hover) a short delay after the pointer leaves so you can move into the popover.
 * Hovering never steals focus. The popover flips below and clamps horizontally to
 * stay on screen (mobile-friendly), and is rendered into a portal so it is never
 * clipped by an overflow container. The entrance animation is automatically
 * suppressed under `prefers-reduced-motion` by the global stylesheet rule.
 */
export function GlossaryTerm({ term, definition }: GlossaryTermProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<Coords | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const popoverId = useId()
  const closeTimer = useRef<number | null>(null)
  // True only for the brief window between a pointerdown and the focus it triggers,
  // so pointer-driven focus (mouse click / touch tap → the click toggles) is treated
  // differently from keyboard focus (Tab → open).
  const pointerFocus = useRef(false)
  // Set when Escape closes the popover and returns focus to the button, so that
  // focus does not immediately re-open it.
  const suppressFocusOpen = useRef(false)

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const show = useCallback(() => {
    clearCloseTimer()
    setOpen(true)
  }, [clearCloseTimer])

  const close = useCallback(() => {
    clearCloseTimer()
    setOpen(false)
  }, [clearCloseTimer])

  // Close after a short grace period so the pointer can travel the gap from the
  // word into the popover (or between popover and word) without it vanishing.
  const scheduleClose = useCallback(() => {
    clearCloseTimer()
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null
      setOpen(false)
    }, CLOSE_DELAY)
  }, [clearCloseTimer])

  // Never leave a pending timer running after unmount.
  useEffect(() => clearCloseTimer, [clearCloseTimer])

  // Mark the focus that a pointerdown is about to trigger as pointer-driven, then
  // release the mark on the next tick (the focus fires synchronously in between).
  const markPointerFocus = useCallback(() => {
    pointerFocus.current = true
    window.setTimeout(() => {
      pointerFocus.current = false
    }, 0)
  }, [])

  const handleFocus = useCallback(() => {
    if (suppressFocusOpen.current) {
      suppressFocusOpen.current = false
      return
    }
    if (pointerFocus.current) return // mouse click / touch tap — let the click toggle decide
    show() // keyboard focus (Tab)
  }, [show])

  const updatePosition = useCallback(() => {
    const button = buttonRef.current
    const popover = popoverRef.current
    if (!button || !popover) return

    const rect = button.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const popWidth = popover.offsetWidth
    const popHeight = popover.offsetHeight

    // Horizontal: center on the word, then clamp inside the viewport.
    const wordCenter = rect.left + rect.width / 2
    const left = Math.max(MARGIN, Math.min(wordCenter - popWidth / 2, viewportWidth - popWidth - MARGIN))

    // Vertical: prefer above; flip below when there isn't room.
    const roomAbove = rect.top - GAP - MARGIN
    const roomBelow = viewportHeight - rect.bottom - GAP - MARGIN
    let placement: Placement
    let top: number
    if (popHeight <= roomAbove) {
      placement = 'top'
      top = rect.top - popHeight - GAP
    } else if (popHeight <= roomBelow) {
      placement = 'bottom'
      top = rect.bottom + GAP
    } else if (roomAbove >= roomBelow) {
      placement = 'top'
      top = Math.max(MARGIN, rect.top - popHeight - GAP)
    } else {
      placement = 'bottom'
      top = rect.bottom + GAP
    }

    const arrowCenter = Math.max(ARROW, Math.min(wordCenter - left, popWidth - ARROW))
    setCoords({ top, left, placement, arrowLeft: arrowCenter - ARROW / 2 })
  }, [])

  // Measure + place once mounted, then keep in sync while open.
  useLayoutEffect(() => {
    if (open) updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const handle = () => updatePosition()
    window.addEventListener('scroll', handle, true)
    window.addEventListener('resize', handle)
    return () => {
      window.removeEventListener('scroll', handle, true)
      window.removeEventListener('resize', handle)
    }
  }, [open, updatePosition])

  // Dismiss on outside pointer-down or Escape.
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      close()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        suppressFocusOpen.current = true
        close()
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="glossary-term"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-describedby={open ? popoverId : undefined}
        onClick={() => {
          clearCloseTimer()
          setOpen((value) => !value)
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') show()
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') scheduleClose()
        }}
        onPointerDown={markPointerFocus}
        onFocus={handleFocus}
        onBlur={scheduleClose}
      >
        {term}
      </button>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-label={`Definition: ${term}`}
            className="glossary-popover"
            data-placement={coords?.placement ?? 'top'}
            style={{
              top: coords ? `${coords.top}px` : 0,
              left: coords ? `${coords.left}px` : 0,
              visibility: coords ? 'visible' : 'hidden',
            }}
            onPointerEnter={clearCloseTimer}
            onPointerLeave={(event) => {
              if (event.pointerType === 'mouse') scheduleClose()
            }}
          >
            <span className="glossary-popover__term">{term}</span>
            <span className="glossary-popover__def">{definition}</span>
            <span
              className="glossary-popover__arrow"
              aria-hidden
              style={coords ? { left: `${coords.arrowLeft}px` } : undefined}
            />
          </div>,
          document.body,
        )}
    </>
  )
}
