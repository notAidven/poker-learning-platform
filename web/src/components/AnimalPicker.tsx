import type { ProfileAnimalId } from '../data/animals'
import { profileAnimals } from '../data/animals'

type AnimalPickerProps = {
  value: ProfileAnimalId | null
  onChange: (id: ProfileAnimalId) => void
}

export function AnimalPicker({ value, onChange }: AnimalPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {profileAnimals.map((animal) => {
        const selected = value === animal.id
        return (
          <button
            key={animal.id}
            type="button"
            onClick={() => onChange(animal.id)}
            className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition ${
              selected
                ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600'
                : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/50'
            }`}
            aria-pressed={selected}
            aria-label={animal.label}
          >
            <span className="text-2xl" aria-hidden>
              {animal.emoji}
            </span>
            <span className="text-xs font-medium text-slate-600">{animal.label}</span>
          </button>
        )
      })}
    </div>
  )
}
