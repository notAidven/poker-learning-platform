import type { ProfileAnimalId } from '../data/animals'
import { getAnimalVisual } from '../data/animals'
import { cx } from './ui/cx'

type AvatarSize = 'sm' | 'md' | 'lg'

const sizeStyles: Record<AvatarSize, { chip: string; icon: string; radius: string }> = {
  sm: { chip: 'h-8 w-8', icon: 'h-5 w-5', radius: 'rounded-full' },
  md: { chip: 'h-11 w-11', icon: 'h-7 w-7', radius: 'rounded-2xl' },
  lg: { chip: 'h-16 w-16', icon: 'h-10 w-10', radius: 'rounded-2xl' },
}

type AnimalAvatarProps = {
  id: ProfileAnimalId | string | null | undefined
  size?: AvatarSize
  /** Extra classes on the chip (e.g. for hover transforms). */
  className?: string
}

/**
 * A profile animal rendered as a tinted chip with its designed icon. The chip
 * derives its background, icon color, and ring from the animal's accent so it
 * stays legible on both light surfaces and the dark "night" panels.
 */
export function AnimalAvatar({ id, size = 'md', className }: AnimalAvatarProps) {
  const { accent, Icon } = getAnimalVisual(id)
  const s = sizeStyles[size]
  return (
    <span
      className={cx('grid shrink-0 place-items-center', s.chip, s.radius, className)}
      style={{
        backgroundColor: `color-mix(in srgb, ${accent} 16%, white)`,
        color: accent,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 30%, transparent)`,
      }}
      aria-hidden
    >
      <Icon className={s.icon} />
    </span>
  )
}
