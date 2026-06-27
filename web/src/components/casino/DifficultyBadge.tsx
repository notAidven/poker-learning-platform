import { casinoTierProfile, type CasinoAiTier } from '../../lib/poker/casinoAi'
import { cx } from '../ui/cx'

/**
 * The AI-difficulty badge shown on table cards + table chrome. Color escalates with
 * the band (brass → bright brass → ember) so the floor reads as a difficulty ramp.
 */
export function DifficultyBadge({ tier, className }: { tier: CasinoAiTier; className?: string }) {
  const { label } = casinoTierProfile(tier)
  const tone =
    tier === 'sharp'
      ? 'border-casino-ember/60 bg-casino-ember/15 text-casino-ember'
      : tier === 'solid'
        ? 'border-casino-brass-bright/50 bg-casino-brass-bright/12 text-casino-brass-bright'
        : 'border-casino-brass/40 bg-casino-brass/10 text-casino-brass'
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.18em]',
        tone,
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
