/** Standard pip positions on a 3×3 grid (indices 0–8, row-major). */
const PIP_POSITIONS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 3, 6, 2, 5, 8],
}

export type DieFaceSize = 'xs' | 'sm' | 'md' | 'lg'

type DieFaceProps = {
  value: number | '?' | null
  size?: DieFaceSize
  className?: string
  /** Visually muted (e.g. unknown roll before first throw). */
  muted?: boolean
}

function showPips(value: number | '?' | null): value is number {
  return typeof value === 'number' && value >= 1 && value <= 6
}

export function DieFace({ value, size = 'md', className = '', muted = false }: DieFaceProps) {
  const pipValue = showPips(value) ? value : null
  const positions = pipValue !== null ? PIP_POSITIONS[pipValue] : []
  const displayNumeral =
    value === '?' || value === null ? '?' : pipValue === null ? String(value) : null

  return (
    <div
      className={[
        'die-face',
        `die-face--${size}`,
        muted ? 'die-face--muted' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden={value === null}
    >
      {pipValue !== null ? (
        <div className="die-face__pips" role="presentation">
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              className={positions.includes(i) ? 'die-pip' : 'die-pip die-pip--empty'}
            />
          ))}
        </div>
      ) : (
        <span className="die-face__numeral">{displayNumeral}</span>
      )}
    </div>
  )
}
