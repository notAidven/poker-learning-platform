/**
 * Pure, runtime-free per-uid rate-limit logic (no Worker / Durable Object
 * imports), so it can be unit-tested directly. The Durable Object in
 * `rateLimiterDO.ts` just loads the prior window state, calls `evaluateRateLimit`,
 * and persists the result.
 *
 * Two simple fixed windows are enforced per uid: a per-minute burst guard and a
 * per-day cap. Together with the model allow-list, these bound how much a single
 * (possibly abused) account can cost.
 */

/**
 * Per-uid limits. Tunable — because the web client soft-fails on any non-2xx,
 * exceeding these only degrades the AI to its rule-based fallback; it never breaks
 * the app. Defaults leave room for brisk Room 2 play (several LLM opponents +
 * coach) while still capping bursts and worst-case daily spend.
 */
export const RATE_LIMITS = {
  /** Max requests per rolling minute, per uid (burst guard). */
  perMinute: 30,
  /** Max requests per rolling day, per uid (cost ceiling). */
  perDay: 400,
} as const

export const MINUTE_MS = 60_000
export const DAY_MS = 86_400_000

/** Fixed-window counters persisted per uid. */
export type WindowState = {
  minuteWindowStartMs: number
  minuteCount: number
  dayWindowStartMs: number
  dayCount: number
}

export type RateLimitDecision =
  | { allowed: true }
  | { allowed: false; scope: 'minute' | 'day'; retryAfterSeconds: number }

/**
 * Decide whether a request at `nowMs` is within the per-minute and per-day limits,
 * and return the `next` state to persist. Pure: identical inputs always produce
 * identical output, with no clock or storage access of its own.
 *
 * On a rejection the counters are left unchanged, so the caller may skip writing.
 */
export function evaluateRateLimit(
  prev: WindowState | undefined,
  nowMs: number,
  limits: { perMinute: number; perDay: number } = RATE_LIMITS,
): { decision: RateLimitDecision; next: WindowState } {
  let minuteWindowStartMs = prev?.minuteWindowStartMs ?? nowMs
  let minuteCount = prev?.minuteCount ?? 0
  let dayWindowStartMs = prev?.dayWindowStartMs ?? nowMs
  let dayCount = prev?.dayCount ?? 0

  if (nowMs - minuteWindowStartMs >= MINUTE_MS) {
    minuteWindowStartMs = nowMs
    minuteCount = 0
  }
  if (nowMs - dayWindowStartMs >= DAY_MS) {
    dayWindowStartMs = nowMs
    dayCount = 0
  }

  const next: WindowState = { minuteWindowStartMs, minuteCount, dayWindowStartMs, dayCount }

  // Check the daily cap first (longer cooldown).
  if (dayCount >= limits.perDay) {
    return {
      decision: { allowed: false, scope: 'day', retryAfterSeconds: secondsUntil(dayWindowStartMs + DAY_MS, nowMs) },
      next,
    }
  }
  if (minuteCount >= limits.perMinute) {
    return {
      decision: {
        allowed: false,
        scope: 'minute',
        retryAfterSeconds: secondsUntil(minuteWindowStartMs + MINUTE_MS, nowMs),
      },
      next,
    }
  }

  next.minuteCount = minuteCount + 1
  next.dayCount = dayCount + 1
  return { decision: { allowed: true }, next }
}

/** Whole seconds until `deadlineMs`, never less than 1 (for a sane Retry-After). */
function secondsUntil(deadlineMs: number, nowMs: number): number {
  return Math.max(1, Math.ceil((deadlineMs - nowMs) / 1000))
}
