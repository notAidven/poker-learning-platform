import { Link } from 'react-router-dom'
import type { CasinoTableConfig } from '../../data/casinoTables'
import { casinoTierProfile } from '../../lib/poker/casinoAi'
import { canCoverBuyIn } from '../../lib/bankroll'
import { cx } from '../ui/cx'
import { LockIcon } from '../icons'
import { DifficultyBadge } from './DifficultyBadge'

/**
 * A single table on the floor, rendered as an oval-felt vignette: the room name as
 * a wide-tracked brass label, the buy-in as a big brass numeral on the felt, the
 * blinds + table feel, an AI-difficulty badge, and the seat count. Affordable tables
 * are a focusable link to the seat; tables the bankroll can't cover are shown but
 * not clickable, with the exact shortfall (the buy-in guard, surfaced in the lobby).
 */
export function CasinoTableCard({
  table,
  bankroll,
}: {
  table: CasinoTableConfig
  bankroll: number
}) {
  const affordable = canCoverBuyIn(bankroll, table.buyIn)
  const seats = table.opponents.length + 1
  const profile = casinoTierProfile(table.aiTier)
  const ember = table.accent === 'ember'
  const shortfall = Math.max(0, table.buyIn - Math.max(0, Math.round(bankroll)))

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="casino-label text-sm">{table.name}</h3>
          <p className="mt-1.5 max-w-[24ch] text-sm leading-snug text-casino-bone/70">
            {table.tagline}
          </p>
        </div>
        <DifficultyBadge tier={table.aiTier} className="shrink-0" />
      </div>

      {/* The felt: an oval table-top carrying the buy-in. */}
      <div
        className={cx(
          'relative mt-4 grid min-h-[8.5rem] place-items-center rounded-[46%] px-6 py-6 text-center',
          ember ? 'casino-oval--ember' : 'casino-oval',
        )}
      >
        <span className="casino-label text-[0.5625rem] text-casino-bone/70">Buy-in</span>
        <span className="casino-numeral mt-0.5 text-[2.75rem] leading-none sm:text-5xl">
          {table.buyIn.toLocaleString()}
        </span>
        <span className="mt-2 inline-flex items-center gap-1.5" aria-label={`${seats} seats`}>
          {Array.from({ length: seats }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={cx(
                'h-1.5 w-1.5 rounded-full',
                ember ? 'bg-casino-ember/70' : 'bg-casino-brass/70',
              )}
            />
          ))}
          <span className="ml-1 text-[0.65rem] font-semibold uppercase tracking-wide text-casino-bone/60">
            {seats} seats
          </span>
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-casino-brass/15 bg-black/25 px-3 py-2 text-center">
          <dt className="casino-label text-[0.5rem] text-casino-bone/55">Blinds</dt>
          <dd className="casino-numeral mt-0.5 text-lg">
            {table.smallBlind}/{table.bigBlind}
          </dd>
        </div>
        <div className="rounded-xl border border-casino-brass/15 bg-black/25 px-3 py-2 text-center">
          <dt className="casino-label text-[0.5rem] text-casino-bone/55">Table</dt>
          <dd className="mt-1 text-[0.8rem] font-semibold leading-tight text-casino-bone/85">
            {profile.blurb}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        {affordable ? (
          <span className="block rounded-xl border border-casino-brass/40 bg-casino-brass/10 px-4 py-2.5 text-center text-sm font-bold text-casino-brass-bright transition group-hover:bg-casino-brass/20">
            Take a seat →
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2 rounded-xl border border-casino-bone/15 bg-black/25 px-4 py-2.5 text-center text-xs font-semibold text-casino-bone/55">
            <LockIcon className="h-3.5 w-3.5" />
            Need {shortfall.toLocaleString()} more to sit
          </span>
        )}
      </div>
    </>
  )

  const cardClass = cx(
    'casino-card group flex flex-col rounded-2xl border border-casino-brass/20 bg-casino-midnight/70 p-4 shadow-xl backdrop-blur-sm',
    !affordable && 'opacity-75',
  )

  if (!affordable) {
    return (
      <div className={cardClass} aria-disabled="true">
        {inner}
      </div>
    )
  }

  return (
    <Link
      to={`/casino/${table.id}`}
      aria-label={`${table.name}: buy in ${table.buyIn.toLocaleString()} chips, blinds ${table.smallBlind}/${table.bigBlind}, ${profile.label} difficulty, ${seats} seats`}
      className={cx(
        cardClass,
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-casino-brass focus-visible:ring-offset-2 focus-visible:ring-offset-casino-midnight',
      )}
    >
      {inner}
    </Link>
  )
}
