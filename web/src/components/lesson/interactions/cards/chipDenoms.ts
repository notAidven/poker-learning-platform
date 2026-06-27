/**
 * Standard casino chip denominations + their classic colors, shared by the chip
 * visuals in `PlayingCardKit` (the face-on `ChipDisc` and the `ChipStack` of
 * edge-on discs) and by the poker table (to color chips in flight). Kept in its
 * own module so the card-kit file only exports React components (fast-refresh).
 *
 * Colors: 1 white, 5 red, 25 green, 100 black, 500 purple, 1000 gold — tuned to the
 * app palette (brass gold, felt-green, oxblood-leaning red, blackened-emerald black)
 * so the chips feel high-stakes without clashing with the clean shell.
 */
import type { CSSProperties } from 'react'

export type ChipDenom = 1 | 5 | 25 | 100 | 500 | 1000

type DenomStyle = { hi: string; face: string; lo: string; rim: string; spot: string; txt: string }

const DENOM_STYLE: Record<ChipDenom, DenomStyle> = {
  1: { hi: '#ffffff', face: '#f1f5f3', lo: '#cbd5d1', rim: '#94a3a0', spot: '#b04a5e', txt: '#3f4b46' },
  5: { hi: '#f48a9c', face: '#cf3350', lo: '#90122e', rim: '#6d0f25', spot: '#fff1f4', txt: '#fff4f6' },
  25: { hi: '#5fd39a', face: '#1f9d5d', lo: '#0d5a38', rim: '#0a3c27', spot: '#eafaf0', txt: '#f1fbf5' },
  100: { hi: '#5b6b62', face: '#1b2a23', lo: '#080f0c', rim: '#000000', spot: '#e8efeb', txt: '#f4f7f5' },
  500: { hi: '#b89bf3', face: '#7c3aed', lo: '#52189c', rim: '#3c1273', spot: '#f4eeff', txt: '#f6f1ff' },
  1000: { hi: '#f6e4ac', face: '#d4ad57', lo: '#9a7029', rim: '#6f5220', spot: '#fff7df', txt: '#4a3712' },
}

/** Denominations from highest to lowest — the order chips are broken down + stacked. */
export const DENOMS: ChipDenom[] = [1000, 500, 100, 25, 5, 1]

/** CSS custom properties that color a single chip for a given denomination. */
export function denomVars(d: ChipDenom): CSSProperties {
  const s = DENOM_STYLE[d]
  return {
    '--hi': s.hi,
    '--face': s.face,
    '--lo': s.lo,
    '--rim': s.rim,
    '--spot': s.spot,
    '--txt': s.txt,
  } as CSSProperties
}

/** The largest denomination that is <= amount (defaults to white for tiny/zero amounts). */
export function topDenom(amount: number): ChipDenom {
  for (const d of DENOMS) if (amount >= d) return d
  return 1
}

/** Greedily break an amount into stacks of standard denominations (high → low). */
export function breakIntoChips(amount: number): { denom: ChipDenom; count: number }[] {
  let rest = Math.max(0, Math.round(amount))
  const out: { denom: ChipDenom; count: number }[] = []
  for (const d of DENOMS) {
    const count = Math.floor(rest / d)
    if (count > 0) {
      out.push({ denom: d, count })
      rest -= count * d
    }
  }
  return out
}
