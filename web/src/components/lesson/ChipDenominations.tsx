type ChipSwatch = {
  name: string
  value: string
  /** Tailwind classes for the chip face background. */
  face: string
  /** Tailwind classes for the dashed edge ring. */
  edge: string
  /** Tailwind classes for the value text. */
  text: string
}

/**
 * Standard casino chip denominations, ordered low to high. Self-contained and
 * presentational (plain Tailwind, no shared card kit) so it can illustrate the
 * Betting Basics "reading the chips" concept page without pulling in any widget.
 */
const CHIPS: ChipSwatch[] = [
  { name: 'White', value: '$1', face: 'bg-white', edge: 'border-slate-300', text: 'text-slate-800' },
  { name: 'Red', value: '$5', face: 'bg-rose-600', edge: 'border-white/75', text: 'text-white' },
  { name: 'Green', value: '$25', face: 'bg-green-600', edge: 'border-white/75', text: 'text-white' },
  { name: 'Black', value: '$100', face: 'bg-slate-900', edge: 'border-white/60', text: 'text-white' },
  { name: 'Purple', value: '$500', face: 'bg-violet-600', edge: 'border-white/75', text: 'text-white' },
  { name: 'Orange', value: '$1000', face: 'bg-orange-500', edge: 'border-white/75', text: 'text-white' },
]

export function ChipDenominations() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-3 sm:gap-x-6">
        {CHIPS.map((chip) => (
          <li key={chip.name} className="flex w-14 flex-col items-center gap-1.5">
            <span
              className={`grid h-12 w-12 place-items-center rounded-full border-2 border-dashed shadow-sm ring-1 ring-inset ring-black/10 ${chip.face} ${chip.edge}`}
            >
              <span className={`tnum text-[11px] font-bold leading-none ${chip.text}`}>
                {chip.value}
              </span>
            </span>
            <span className="text-xs font-medium text-slate-500">{chip.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
