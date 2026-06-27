import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../lesson/interactions/usePrefersReducedMotion'

/**
 * Animate a number from its previous value up to `target` with an ease-out, for the
 * House Standings figures that "count up on load". Honors reduced motion: when the
 * user prefers reduced motion the final value is shown immediately (no animation).
 * Works for signed targets too (net winnings can be negative).
 */
export function useCountUp(target: number, durationMs = 850): number {
  const reduced = usePrefersReducedMotion()
  const animatable = !reduced && typeof requestAnimationFrame !== 'undefined'
  const [animated, setAnimated] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!animatable) return
    const from = fromRef.current
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / Math.max(1, durationMs))
      const eased = 1 - Math.pow(1 - t, 3)
      // setState lives in the async rAF callback (never synchronously in the effect).
      setAnimated(Math.round(from + (target - from) * eased))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [target, durationMs, animatable])

  // Reduced motion (or no rAF): show the final value immediately — derived, so there
  // is never a synchronous setState inside the effect.
  return animatable ? animated : target
}
