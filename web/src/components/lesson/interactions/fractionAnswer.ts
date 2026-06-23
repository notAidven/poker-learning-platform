import type { FractionProbability } from '../../../types/lesson'

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y) {
    const t = y
    y = x % y
    x = t
  }
  return x
}

/** Reduce to lowest terms; rejects invalid denominators and negative numerators. */
export function reduceFraction(num: number, den: number): FractionProbability | null {
  if (!Number.isInteger(num) || !Number.isInteger(den) || den <= 0 || num < 0) return null
  const g = gcd(num, den)
  return { num: num / g, den: den / g }
}

/** Parse "1/6", "1 / 6", etc. */
export function parseFractionString(raw: string): FractionProbability | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const match = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (!match) return null
  return reduceFraction(Number(match[1]), Number(match[2]))
}

export function parseFractionFields(
  numStr: string,
  denStr: string,
): FractionProbability | null {
  const numTrim = numStr.trim()
  const denTrim = denStr.trim()

  if (numTrim.includes('/') && denTrim === '') {
    return parseFractionString(numTrim)
  }

  if (numTrim === '' || denTrim === '') return null

  const num = Number(numTrim)
  const den = Number(denTrim)
  if (!Number.isFinite(num) || !Number.isFinite(den)) return null
  if (!Number.isInteger(num) || !Number.isInteger(den)) return null
  return reduceFraction(num, den)
}

export function hasValidFractionInput(numStr: string, denStr: string): boolean {
  return parseFractionFields(numStr, denStr) !== null
}

export function fractionMatches(
  numStr: string,
  denStr: string,
  expected: FractionProbability,
): boolean {
  const entered = parseFractionFields(numStr, denStr)
  const reducedExpected = reduceFraction(expected.num, expected.den)
  if (!entered || !reducedExpected) return false
  return entered.num === reducedExpected.num && entered.den === reducedExpected.den
}
