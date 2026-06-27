import { casinoTierProfile, type CasinoAiTier } from '../../lib/poker/casinoAi'
import { Badge, type BadgeTone } from '../ui/Badge'

/**
 * The AI-difficulty badge shown on table cards + table chrome. Built from the shared
 * `Badge` so it reads as part of the app's kit; the tone climbs the standard semantic
 * palette as a difficulty heat-ramp — success (soft) → gold (thinking) → danger (sharp).
 */
const tierTone: Record<CasinoAiTier, BadgeTone> = {
  novice: 'success',
  solid: 'gold',
  sharp: 'danger',
}

export function DifficultyBadge({ tier, className }: { tier: CasinoAiTier; className?: string }) {
  const { label } = casinoTierProfile(tier)
  return (
    <Badge tone={tierTone[tier]} className={className}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  )
}
