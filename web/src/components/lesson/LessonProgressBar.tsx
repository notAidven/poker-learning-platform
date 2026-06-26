import { useEffect, useRef } from 'react'
import { useAnimate } from 'motion/react'
import { DUR, EASE } from '../../lib/motion'
import { usePrefersReducedMotion } from './interactions/usePrefersReducedMotion'

type LessonProgressBarProps = {
  current: number
  total: number
}

export function LessonProgressBar({ current, total }: LessonProgressBarProps) {
  const pct = total > 0 ? Math.round(((current + 1) / total) * 100) : 0
  const reduced = usePrefersReducedMotion()
  const [scope, animate] = useAnimate()
  const prevCurrent = useRef(current)

  // A quick "breath" of the track each time the learner advances a step.
  useEffect(() => {
    const advanced = current > prevCurrent.current
    prevCurrent.current = current
    if (reduced || !advanced || !scope.current) return
    void animate(scope.current, { scaleY: [1, 1.8, 1] }, { duration: DUR.base, ease: EASE.chip })
  }, [current, reduced, animate, scope])

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-night-600">
        Step {current + 1} of {total}
      </div>
      <div
        ref={scope}
        className="h-2 overflow-hidden rounded-full bg-night-200"
        style={{ transformOrigin: 'center' }}
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
