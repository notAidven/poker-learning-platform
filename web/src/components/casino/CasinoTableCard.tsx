import { Link } from 'react-router-dom'
import type { CasinoTableConfig } from '../../data/casinoTables'
import { casinoTierProfile } from '../../lib/poker/casinoAi'
import { canCoverBuyIn } from '../../lib/bankroll'
import { Chip } from '../lesson/interactions/cards/PlayingCardKit'
import { cx } from '../ui/cx'
import { LockIcon, SpadeIcon } from '../icons'
import { DifficultyBadge } from './DifficultyBadge'

/**
 * A single table on the floor, styled as a white app card to match the course's
 * lesson cards: the room name + difficulty badge, its tagline, a featured buy-in,
 * the blinds/seats, and the opponent feel. Affordable tables are a focusable link to
 * the seat; tables the bankroll can't cover are shown faded and non-clickable, with
 * the exact shortfall (the buy-in guard, surfaced in the lobby). The Vault (ember
 * accent) gets a quiet gold frame to mark it as the premium, high-limit seat.
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
  const premium = table.accent === 'ember'
  const shortfall = Math.max(0, table.buyIn - Math.max(0, Math.round(bankroll)))

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-bold leading-tight text-ink">{table.name}</h3>
        <DifficultyBadge tier={table.aiTier} className="shrink-0" />
      </div>
      <p className="mt-1.5 text-sm leading-snug text-night-700/70">{table.tagline}</p>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-night-900/[0.03] px-4 py-3 ring-1 ring-inset ring-night-900/10">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-night-700/50">
          Buy-in
        </span>
        <span className="inline-flex items-center gap-2 font-display text-2xl font-bold tabular-nums text-ink">
          <Chip size={18} tone="gold" />
          {table.buyIn.toLocaleString()}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-night-900/[0.03] px-3 py-2 text-center ring-1 ring-inset ring-night-900/10">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-night-700/50">
            Blinds
          </dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-ink">
            {table.smallBlind}/{table.bigBlind}
          </dd>
        </div>
        <div className="rounded-xl bg-night-900/[0.03] px-3 py-2 text-center ring-1 ring-inset ring-night-900/10">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-night-700/50">
            Seats
          </dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-ink">{seats}</dd>
        </div>
      </dl>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-night-700/55">
        <SpadeIcon className="h-3.5 w-3.5 shrink-0 text-gold-600" />
        {profile.blurb}
      </p>

      <div className="mt-auto pt-4">
        {affordable ? (
          <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-night-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_0_var(--color-gold-600)] transition group-hover:bg-gold-300">
            Take a seat <span aria-hidden>→</span>
          </span>
        ) : (
          <span className="flex w-full items-center justify-center gap-2 rounded-xl border border-night-900/10 bg-night-900/[0.03] px-4 py-2.5 text-xs font-semibold text-night-700/55">
            <LockIcon className="h-3.5 w-3.5" />
            Need {shortfall.toLocaleString()} more to sit
          </span>
        )}
      </div>
    </>
  )

  const base = 'relative flex h-full flex-col rounded-2xl border p-5 shadow-card'

  if (!affordable) {
    return (
      <div
        className={cx(base, 'border-night-900/10 bg-white/60')}
        aria-disabled="true"
      >
        {inner}
      </div>
    )
  }

  return (
    <Link
      to={`/casino/${table.id}`}
      aria-label={`${table.name}: buy in ${table.buyIn.toLocaleString()} chips, blinds ${table.smallBlind}/${table.bigBlind}, ${profile.label} difficulty, ${seats} seats`}
      className={cx(
        base,
        'group bg-white transition hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
        premium ? 'border-gold-400/60 hover:border-gold-400' : 'border-night-900/10 hover:border-brand-300',
      )}
    >
      {inner}
    </Link>
  )
}
