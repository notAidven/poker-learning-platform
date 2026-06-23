import type { VennDiagramConfig } from '../../types/lesson'

type VennDiagramProps = {
  config: VennDiagramConfig
}

function OutcomeChip({
  label,
  variant,
}: {
  label: string
  variant: 'default' | 'event' | 'outside'
}) {
  const styles = {
    default: 'border-slate-200 bg-white text-slate-700',
    event: 'border-brand-300 bg-brand-50 text-brand-800 font-semibold',
    outside: 'border-slate-100 bg-slate-50 text-slate-500',
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg border px-2 py-1 text-xs ${styles[variant]}`}
    >
      {label}
    </span>
  )
}

function OutcomeGrid({
  items,
  variant,
}: {
  items: string[]
  variant: 'default' | 'event' | 'outside'
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {items.map((item) => (
        <OutcomeChip key={item} label={item} variant={variant} />
      ))}
    </div>
  )
}

function SampleSpaceDiagram({ config }: { config: VennDiagramConfig }) {
  const outcomes = config.outcomes ?? []
  const label = config.labelOmega ?? 'Ω'

  return (
    <figure className="mx-auto w-full max-w-sm">
      <svg viewBox="0 0 320 200" className="h-auto w-full" role="img" aria-labelledby="venn-title">
        <title id="venn-title">Sample space {label}</title>
        <rect
          x="16"
          y="24"
          width="288"
          height="152"
          rx="12"
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth="2"
        />
        <text x="28" y="48" className="fill-slate-700 text-sm font-bold" fontSize="14">
          {label}
        </text>
        <foreignObject x="28" y="58" width="264" height="108">
          <div className="flex h-full items-center justify-center">
            <OutcomeGrid items={outcomes} variant="default" />
          </div>
        </foreignObject>
      </svg>
      {config.caption && (
        <figcaption className="mt-2 text-center text-xs text-slate-500">{config.caption}</figcaption>
      )}
    </figure>
  )
}

function EventSubsetDiagram({ config }: { config: VennDiagramConfig }) {
  const allOutcomes = config.outcomes ?? []
  const eventSet = new Set(config.eventOutcomes ?? [])
  const inEvent = config.eventOutcomes ?? []
  const outsideEvent = allOutcomes.filter((o) => !eventSet.has(o))
  const labelOmega = config.labelOmega ?? 'Ω'
  const labelA = config.labelA ?? 'A'

  return (
    <figure className="mx-auto w-full max-w-sm">
      <svg viewBox="0 0 320 220" className="h-auto w-full" role="img" aria-labelledby="venn-event-title">
        <title id="venn-event-title">Event {labelA} as a subset of {labelOmega}</title>
        <rect
          x="12"
          y="20"
          width="296"
          height="180"
          rx="12"
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth="2"
        />
        <text x="24" y="42" className="fill-slate-700 text-sm font-bold" fontSize="13">
          {labelOmega}
        </text>
        <ellipse cx="160" cy="118" rx="88" ry="62" fill="#eef6ff" stroke="#93c5fd" strokeWidth="2" />
        <text x="160" y="82" textAnchor="middle" className="fill-brand-700 font-semibold" fontSize="13">
          {labelA}
        </text>
        <foreignObject x="88" y="88" width="144" height="72">
          <div className="flex h-full items-center justify-center">
            <OutcomeGrid items={inEvent} variant="event" />
          </div>
        </foreignObject>
        {outsideEvent.length > 0 && (
          <foreignObject x="24" y="148" width="272" height="44">
            <div className="flex items-center justify-center">
              <OutcomeGrid items={outsideEvent} variant="outside" />
            </div>
          </foreignObject>
        )}
      </svg>
      {config.caption && (
        <figcaption className="mt-2 text-center text-xs text-slate-500">{config.caption}</figcaption>
      )}
    </figure>
  )
}

function TwoEventsDiagram({ config }: { config: VennDiagramConfig }) {
  const labelOmega = config.labelOmega ?? 'Ω'
  const labelA = config.labelA ?? 'A'
  const labelB = config.labelB ?? 'B'
  const inA = config.eventOutcomes ?? []
  const inB = config.outcomes?.filter((o) => !inA.includes(o)) ?? []

  return (
    <figure className="mx-auto w-full max-w-sm">
      <svg viewBox="0 0 320 220" className="h-auto w-full" role="img" aria-labelledby="venn-two-title">
        <title id="venn-two-title">Events {labelA} and {labelB} in {labelOmega}</title>
        <rect
          x="12"
          y="20"
          width="296"
          height="180"
          rx="12"
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth="2"
        />
        <text x="24" y="42" className="fill-slate-700 text-sm font-bold" fontSize="13">
          {labelOmega}
        </text>
        <ellipse cx="128" cy="118" rx="72" ry="58" fill="#eef6ff" fillOpacity="0.9" stroke="#93c5fd" strokeWidth="2" />
        <ellipse cx="192" cy="118" rx="72" ry="58" fill="#fef3c7" fillOpacity="0.85" stroke="#fcd34d" strokeWidth="2" />
        <text x="108" y="78" textAnchor="middle" className="fill-brand-700 font-semibold" fontSize="12">
          {labelA}
        </text>
        <text x="212" y="78" textAnchor="middle" className="fill-amber-800 font-semibold" fontSize="12">
          {labelB}
        </text>
        {inA.length > 0 && (
          <foreignObject x="56" y="96" width="88" height="56">
            <div className="flex h-full items-center justify-center">
              <OutcomeGrid items={inA} variant="event" />
            </div>
          </foreignObject>
        )}
        {inB.length > 0 && (
          <foreignObject x="176" y="96" width="88" height="56">
            <div className="flex h-full items-center justify-center">
              <OutcomeGrid items={inB} variant="outside" />
            </div>
          </foreignObject>
        )}
      </svg>
      {config.caption && (
        <figcaption className="mt-2 text-center text-xs text-slate-500">{config.caption}</figcaption>
      )}
    </figure>
  )
}

export function VennDiagram({ config }: VennDiagramProps) {
  if (config.type === 'sample-space') {
    return <SampleSpaceDiagram config={config} />
  }
  if (config.type === 'event-subset') {
    return <EventSubsetDiagram config={config} />
  }
  return <TwoEventsDiagram config={config} />
}
