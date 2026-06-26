/**
 * JS mirror of the `--ease-*` / `--dur-*` motion tokens in `index.css`, for use with
 * `motion/react`. Keep these in sync with the CSS tokens so CSS keyframes and
 * orchestrated motion share one feel. All consumers must still gate animation on the
 * reduced-motion preference (`usePrefersReducedMotion` + the global CSS kill-switch).
 */

/** Cubic-bezier easings, typed as 4-tuples so they drop straight into motion's `ease`. */
export const EASE: Record<'standard' | 'deal' | 'chip' | 'rake' | 'exit', [number, number, number, number]> = {
  standard: [0.2, 0, 0, 1], // general UI
  deal: [0.2, 0.82, 0.3, 1], // card settle
  chip: [0.34, 1.4, 0.64, 1], // springy chip pop
  rake: [0.22, 1, 0.36, 1], // chips gliding to the stack / count-ups
  exit: [0.4, 0, 1, 1],
}

/** Durations in seconds (CSS tokens are ms). */
export const DUR = {
  quick: 0.15,
  base: 0.25,
  deal: 0.45,
  celebrate: 0.9,
} as const

/** Default spring for token'd surface entrances (modals, popovers). */
export const SPRING = { type: 'spring', stiffness: 320, damping: 26, mass: 0.9 } as const
