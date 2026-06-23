import type { ReactNode } from 'react'
import type { IconProps } from './index'

/**
 * Profile animal avatars.
 *
 * A small set of friendly, geometric animal-face glyphs that share the same
 * language as the rest of the icon set: a 24×24 grid, `currentColor`, and a
 * 1.8px round-capped outline with a few solid accents (eyes / noses). Pair
 * them with a tinted chip (see `AnimalAvatar`) for a per-animal color identity.
 */

type AnimalIconBaseProps = IconProps & { children: ReactNode }

function AnimalBase({ className = 'h-5 w-5', children, ...props }: AnimalIconBaseProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

const SOLID = { fill: 'currentColor', stroke: 'none' } as const

/** Fox — pointed ears, narrow chin. */
export function FoxIcon(props: IconProps) {
  return (
    <AnimalBase {...props}>
      <path {...SOLID} d="M4 3.5 9.6 8 6 10.2 Z" />
      <path {...SOLID} d="M20 3.5 14.4 8 18 10.2 Z" />
      <path d="M6 8.6c2-1.6 10-1.6 12 0 -.4 5.4-2.9 9.9-6 11.9 -3.1-2-5.6-6.5-6-11.9Z" />
      <circle {...SOLID} cx="9.5" cy="12.6" r="0.95" />
      <circle {...SOLID} cx="14.5" cy="12.6" r="0.95" />
      <path {...SOLID} d="M11 15.4 13 15.4 12 17 Z" />
    </AnimalBase>
  )
}

/** Owl — ear tufts, big round eyes. */
export function OwlIcon(props: IconProps) {
  return (
    <AnimalBase {...props}>
      <path {...SOLID} d="M6 7.6 8 3.6 10 7.6 Z" />
      <path {...SOLID} d="M14 7.6 16 3.6 18 7.6 Z" />
      <ellipse cx="12" cy="13.2" rx="7.4" ry="7" />
      <circle cx="9.1" cy="12.2" r="2.3" />
      <circle cx="14.9" cy="12.2" r="2.3" />
      <circle {...SOLID} cx="9.1" cy="12.2" r="0.95" />
      <circle {...SOLID} cx="14.9" cy="12.2" r="0.95" />
      <path {...SOLID} d="M11 14.6 13 14.6 12 16.6 Z" />
    </AnimalBase>
  )
}

/** Bear — round ears, soft snout. */
export function BearIcon(props: IconProps) {
  return (
    <AnimalBase {...props}>
      <circle cx="7" cy="7.4" r="2.4" />
      <circle cx="17" cy="7.4" r="2.4" />
      <circle cx="12" cy="13.4" r="7" />
      <circle {...SOLID} cx="9.6" cy="12.4" r="0.95" />
      <circle {...SOLID} cx="14.4" cy="12.4" r="0.95" />
      <ellipse cx="12" cy="16.2" rx="2.7" ry="2" />
      <circle {...SOLID} cx="12" cy="15.2" r="0.95" />
    </AnimalBase>
  )
}

/** Cat — pointed ears, whiskers. */
export function CatIcon(props: IconProps) {
  return (
    <AnimalBase {...props}>
      <path d="M6.4 8.8 6 4 10.2 7.2" />
      <path d="M17.6 8.8 18 4 13.8 7.2" />
      <circle cx="12" cy="13.6" r="6.4" />
      <circle {...SOLID} cx="9.6" cy="13" r="0.95" />
      <circle {...SOLID} cx="14.4" cy="13" r="0.95" />
      <path {...SOLID} d="M11.2 15.2 12.8 15.2 12 16.3 Z" />
      <path d="M5 14.6 8.4 15.1M5.2 17 8.5 16.2M19 14.6 15.6 15.1M18.8 17 15.5 16.2" />
    </AnimalBase>
  )
}

/** Dog — floppy ears, round snout. */
export function DogIcon(props: IconProps) {
  return (
    <AnimalBase {...props}>
      <path {...SOLID} d="M6.6 7.8C3.8 8.3 3.2 12.8 5.2 15.6 6.7 14.4 7.2 11.6 7.6 9.2Z" />
      <path {...SOLID} d="M17.4 7.8C20.2 8.3 20.8 12.8 18.8 15.6 17.3 14.4 16.8 11.6 16.4 9.2Z" />
      <path d="M6.6 9C7.8 7.4 9.6 6.6 12 6.6s4.2.8 5.4 2.4c1 1.3 1.4 3.1 1.4 5 0 4.1-3 6.6-6.8 6.6S5.2 18.1 5.2 14c0-1.9.4-3.7 1.4-5Z" />
      <circle {...SOLID} cx="9.8" cy="12.2" r="0.95" />
      <circle {...SOLID} cx="14.2" cy="12.2" r="0.95" />
      <ellipse cx="12" cy="15.8" rx="2.5" ry="2" />
      <circle {...SOLID} cx="12" cy="14.9" r="0.95" />
    </AnimalBase>
  )
}

/** Rabbit — tall ears. */
export function RabbitIcon(props: IconProps) {
  return (
    <AnimalBase {...props}>
      <path d="M9.6 11.4C8.4 8.4 8.4 5 9.5 3.2 10.7 5 11 8.4 10.6 11.2Z" />
      <path d="M14.4 11.4C13.6 8.4 13.4 5 14.5 3.2 15.7 5 15.8 8.4 14.6 11.2Z" />
      <circle cx="12" cy="15" r="5.1" />
      <circle {...SOLID} cx="10" cy="14.4" r="0.9" />
      <circle {...SOLID} cx="14" cy="14.4" r="0.9" />
      <path {...SOLID} d="M11.3 16.2 12.7 16.2 12 17.2 Z" />
    </AnimalBase>
  )
}

/** Panda — solid ears + eye patches. */
export function PandaIcon(props: IconProps) {
  return (
    <AnimalBase {...props}>
      <circle {...SOLID} cx="6.6" cy="7.6" r="2.4" />
      <circle {...SOLID} cx="17.4" cy="7.6" r="2.4" />
      <circle cx="12" cy="13.4" r="7" />
      <ellipse {...SOLID} cx="9.2" cy="12.4" rx="1.7" ry="2.2" />
      <ellipse {...SOLID} cx="14.8" cy="12.4" rx="1.7" ry="2.2" />
      <circle {...SOLID} cx="12" cy="15.8" r="1.05" />
    </AnimalBase>
  )
}

/** Frog — eyes on top, wide smile. */
export function FrogIcon(props: IconProps) {
  return (
    <AnimalBase {...props}>
      <path d="M5 12c0-2.5 2-3.5 7-3.5s7 1 7 3.5c0 4-3 6.6-7 6.6S5 16 5 12Z" />
      <circle cx="8.6" cy="7.8" r="2.3" />
      <circle cx="15.4" cy="7.8" r="2.3" />
      <circle {...SOLID} cx="8.6" cy="7.8" r="0.95" />
      <circle {...SOLID} cx="15.4" cy="7.8" r="0.95" />
      <path d="M8.6 13.4c1.6 2 5.2 2 6.8 0" />
      <circle {...SOLID} cx="10.8" cy="11.4" r="0.6" />
      <circle {...SOLID} cx="13.2" cy="11.4" r="0.6" />
    </AnimalBase>
  )
}

/** Paw — neutral fallback when an animal id is unknown. */
export function PawIcon(props: IconProps) {
  return (
    <AnimalBase {...props}>
      <ellipse {...SOLID} cx="12" cy="15.5" rx="3.6" ry="3" />
      <circle {...SOLID} cx="7.6" cy="11" r="1.7" />
      <circle {...SOLID} cx="10.7" cy="8.4" r="1.7" />
      <circle {...SOLID} cx="13.3" cy="8.4" r="1.7" />
      <circle {...SOLID} cx="16.4" cy="11" r="1.7" />
    </AnimalBase>
  )
}
