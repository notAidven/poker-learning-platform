import { Children, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { DUR, EASE } from '../../lib/motion'
import { usePrefersReducedMotion } from '../lesson/interactions/usePrefersReducedMotion'

type StaggerProps = {
  children: ReactNode
  className?: string
  /** Seconds between each child's entrance. */
  step?: number
  /** Seconds before the first child enters. */
  delay?: number
  /** Distance (px) each child translates up from as it fades in. */
  y?: number
}

/**
 * Entrance-stagger primitive: fades + translates its direct children up in sequence,
 * replacing the inline `index * 60ms` animation-delay pattern. The wrapper renders the
 * layout container (pass grid/flex classes via `className`); reduced-motion drops the
 * animation and renders the children in place.
 */
export function Stagger({ children, className, step = 0.06, delay = 0, y = 12 }: StaggerProps) {
  const reduced = usePrefersReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: step, delayChildren: delay } } }}
    >
      {Children.map(children, (child) => (
        <motion.div
          className="h-full"
          variants={{
            hidden: { opacity: 0, y },
            show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.deal } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
