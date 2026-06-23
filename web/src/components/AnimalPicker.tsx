import type { ProfileAnimalId } from '../data/animals'
import { profileAnimals } from '../data/animals'
import { AnimalAvatar } from './AnimalAvatar'
import { cx } from './ui/cx'
import { CheckIcon } from './icons'

type AnimalPickerProps = {
  value: ProfileAnimalId | null
  onChange: (id: ProfileAnimalId) => void
}

export function AnimalPicker({ value, onChange }: AnimalPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
      {profileAnimals.map((animal) => {
        const selected = value === animal.id
        return (
          <button
            key={animal.id}
            type="button"
            onClick={() => onChange(animal.id)}
            className={cx(
              'group relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
              selected
                ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500'
                : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/50',
            )}
            aria-pressed={selected}
            aria-label={animal.label}
          >
            {selected && (
              <span
                className="anim-pop absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-white"
                aria-hidden
              >
                <CheckIcon className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
            <AnimalAvatar
              id={animal.id}
              size="md"
              className={cx(
                'transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-110',
                selected && 'scale-105',
              )}
            />
            <span
              className={cx(
                'text-xs font-semibold',
                selected ? 'text-brand-700' : 'text-slate-600',
              )}
            >
              {animal.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
