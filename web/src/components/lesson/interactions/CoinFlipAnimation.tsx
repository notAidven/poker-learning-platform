import { CheckIcon } from '../../icons'

export function CoinFlipAnimation({
  history,
  showHeads,
  flipping,
  locked,
  onFlip,
  requireBothFaces,
}: {
  history: ('H' | 'T')[]
  showHeads: boolean
  flipping: boolean
  locked: boolean
  onFlip: () => void
  requireBothFaces?: boolean
}) {
  const flips = history.length
  const sawH = history.includes('H')
  const sawT = history.includes('T')

  return (
    <div className="space-y-4">
      <div className="scene-3d coin-scene">
        <button
          type="button"
          onClick={onFlip}
          disabled={locked || flipping}
          className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-4 disabled:opacity-60"
          aria-label="Flip coin"
        >
          <div
            className={`coin-3d ${flipping ? 'coin-3d--flip' : ''}`}
            style={
              flipping
                ? undefined
                : { transform: showHeads ? 'rotateY(0deg)' : 'rotateY(180deg)' }
            }
          >
            <div className="coin-face coin-face--heads">H</div>
            <div className="coin-face coin-face--tails">T</div>
          </div>
        </button>
      </div>

      <p className="text-center text-sm font-medium text-slate-600">
        Showing: <span className="font-bold text-amber-800">{showHeads ? 'H' : 'T'}</span>
        {' · '}
        Flips: <span className="font-bold text-brand-700">{flips}</span>
        {requireBothFaces && (
          <span className="ml-1 inline-flex items-center gap-1 text-slate-500">
            · H{' '}
            {sawH ? (
              <CheckIcon className="inline-block h-3.5 w-3.5 text-emerald-600" strokeWidth={3} />
            ) : (
              '—'
            )}{' '}
            · T{' '}
            {sawT ? (
              <CheckIcon className="inline-block h-3.5 w-3.5 text-emerald-600" strokeWidth={3} />
            ) : (
              '—'
            )}
          </span>
        )}
      </p>

      {history.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {history.map((h, i) => (
            <span
              key={`${i}-${h}`}
              className={`chip-3d flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                h === 'H' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {h}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
