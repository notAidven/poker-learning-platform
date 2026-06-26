import { describe, it, expect } from 'vitest'
import { evaluateRateLimit, MINUTE_MS, type WindowState } from '../src/rateLimit'
import { ALLOWED_MODELS, DEFAULT_MODEL, validateChatRequest } from '../src/openai'

// These two helpers (the model allow-list and the pure rate-limit windowing) are
// the core cost/abuse guardrails, so they get direct unit coverage. Neither pulls
// in the Durable Object runtime, so the tests run under plain vitest.

const userMessage = [{ role: 'user' as const, content: 'hi' }]

describe('model allow-list', () => {
  it('defaults to an allow-listed model when `model` is omitted', () => {
    const params = validateChatRequest({ messages: userMessage })
    expect(params.model).toBe(DEFAULT_MODEL)
    expect(ALLOWED_MODELS.has(params.model)).toBe(true)
  })

  it('accepts an allow-listed model', () => {
    const params = validateChatRequest({ model: 'gpt-4o-mini', messages: userMessage })
    expect(params.model).toBe('gpt-4o-mini')
  })

  it('rejects a model that is not on the allow-list', () => {
    expect(() => validateChatRequest({ model: 'gpt-4o', messages: userMessage })).toThrow(
      /not supported/i,
    )
  })
})

describe('evaluateRateLimit', () => {
  const limits = { perMinute: 3, perDay: 5 }

  it('allows requests up to the per-minute limit, then blocks with scope "minute"', () => {
    let state: WindowState | undefined
    const t = 1_000_000
    for (let i = 0; i < limits.perMinute; i++) {
      const r = evaluateRateLimit(state, t, limits)
      expect(r.decision.allowed).toBe(true)
      state = r.next
    }
    const blocked = evaluateRateLimit(state, t, limits)
    expect(blocked.decision.allowed).toBe(false)
    if (!blocked.decision.allowed) {
      expect(blocked.decision.scope).toBe('minute')
      expect(blocked.decision.retryAfterSeconds).toBeGreaterThan(0)
    }
  })

  it('resets the minute window after 60s', () => {
    let state: WindowState | undefined
    const t = 2_000_000
    for (let i = 0; i < limits.perMinute; i++) state = evaluateRateLimit(state, t, limits).next
    expect(evaluateRateLimit(state, t, limits).decision.allowed).toBe(false)
    expect(evaluateRateLimit(state, t + MINUTE_MS, limits).decision.allowed).toBe(true)
  })

  it('enforces the daily cap across separate minute windows', () => {
    let state: WindowState | undefined
    let t = 3_000_000
    let allowed = 0
    for (let i = 0; i < 10; i++) {
      const r = evaluateRateLimit(state, t, limits)
      if (r.decision.allowed) allowed++
      state = r.next
      t += MINUTE_MS // step a full minute so the per-minute window never blocks
    }
    expect(allowed).toBe(limits.perDay)
    const blocked = evaluateRateLimit(state, t, limits)
    expect(blocked.decision.allowed).toBe(false)
    if (!blocked.decision.allowed) expect(blocked.decision.scope).toBe('day')
  })

  it('does not advance counters on a rejected request', () => {
    let state: WindowState | undefined
    const t = 4_000_000
    for (let i = 0; i < limits.perMinute; i++) state = evaluateRateLimit(state, t, limits).next
    const before = state
    const blocked = evaluateRateLimit(state, t, limits)
    expect(blocked.decision.allowed).toBe(false)
    expect(blocked.next.minuteCount).toBe(before?.minuteCount)
    expect(blocked.next.dayCount).toBe(before?.dayCount)
  })
})
