/**
 * Per-uid rate limiter, backed by a Durable Object.
 *
 * The Worker addresses one instance per uid (`idFromName(uid)`), so every user
 * gets an isolated, strongly-consistent counter — the per-user coordination
 * boundary Cloudflare recommends, never a single global instance. SQLite is the
 * storage backend (the only one available on the free plan); the instance is
 * created automatically on `wrangler deploy` via the wrangler.toml migration.
 *
 * All windowing logic lives in the pure `evaluateRateLimit` (see `rateLimit.ts`)
 * so it can be unit-tested without the Durable Object runtime.
 */
import { DurableObject } from 'cloudflare:workers'
import { evaluateRateLimit, type RateLimitDecision, type WindowState } from './rateLimit'

const STATE_KEY = 'window'

export class RateLimiterDO extends DurableObject {
  /** Record one request at `nowMs` and report whether it is within the limits. */
  async check(nowMs: number): Promise<RateLimitDecision> {
    const prev = await this.ctx.storage.get<WindowState>(STATE_KEY)
    const { decision, next } = evaluateRateLimit(prev, nowMs)
    // Persist only when the counters actually advanced (an allowed request); a
    // rejected request leaves stored state untouched, so no write is needed.
    if (decision.allowed) {
      await this.ctx.storage.put(STATE_KEY, next)
    }
    return decision
  }
}
