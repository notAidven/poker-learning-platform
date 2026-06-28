// @vitest-environment node
/**
 * Guards for the dormant direct-key providers (`openai` / `anthropic`).
 *
 * These providers would embed a raw `VITE_*_API_KEY` in the client bundle if ever
 * selected, so they MUST be inert in production: `isConfigured()` is `false`,
 * `generateText()` refuses, and `selectProviderId()` never resolves to them (an
 * explicit selection falls back to the safe default, and a bundled key can't flip the
 * active provider). In development they still work for local prototyping. The secure
 * `openai-proxy` and the default `gemini` (→ rule-based) paths must be unaffected.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

// Importing the provider registry (./index) also pulls in ./gemini and ./openai-proxy,
// which import the real Firebase SDK. Stub it so these unit tests stay hermetic and
// only exercise provider SELECTION + the production guard.
vi.mock('../../firebase', () => ({
  auth: { currentUser: null },
  db: {},
  app: {},
  getGeminiModel: () => null,
}))

const signal = () => new AbortController().signal

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('direct-key providers are hard-disabled in production', () => {
  it('openai: isConfigured() is false and generateText() refuses, even with a key set', async () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_OPENAI_API_KEY', 'sk-prod-should-never-be-used')

    const { openaiProvider } = await import('./openai')

    expect(openaiProvider.isConfigured()).toBe(false)
    await expect(openaiProvider.generateText('hello', signal())).rejects.toThrow(/production/i)
  })

  it('anthropic: isConfigured() is false and generateText() refuses, even with a key set', async () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_ANTHROPIC_API_KEY', 'sk-ant-prod-should-never-be-used')

    const { anthropicProvider } = await import('./anthropic')

    expect(anthropicProvider.isConfigured()).toBe(false)
    await expect(anthropicProvider.generateText('hello', signal())).rejects.toThrow(/production/i)
  })

  it('an explicit VITE_LLM_PROVIDER=openai falls back to gemini in production', async () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_LLM_PROVIDER', 'openai')
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { getActiveProvider } = await import('./index')

    expect(getActiveProvider().id).toBe('gemini')
    expect(errSpy).toHaveBeenCalledOnce()
  })

  it('an explicit VITE_LLM_PROVIDER=anthropic falls back to gemini in production', async () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_LLM_PROVIDER', 'anthropic')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { getActiveProvider } = await import('./index')

    expect(getActiveProvider().id).toBe('gemini')
  })

  it('a stray bundled VITE_OPENAI_API_KEY never flips the active provider in production', async () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_LLM_PROVIDER', '') // no explicit choice → would hit auto-detect in dev
    vi.stubEnv('VITE_OPENAI_API_KEY', 'sk-prod-should-never-be-used')

    const { getActiveProvider } = await import('./index')

    expect(getActiveProvider().id).toBe('gemini')
  })
})

describe('the production-safe providers are unaffected', () => {
  it('the secure openai-proxy provider still works in production', async () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_LLM_PROVIDER', 'openai-proxy')
    vi.stubEnv('VITE_AI_PROXY_URL', 'https://proxy.example.com')

    const { getActiveProvider } = await import('./index')
    const provider = getActiveProvider()

    expect(provider.id).toBe('openai-proxy')
    expect(provider.isConfigured()).toBe(true)
  })

  it('the default (no flag set) stays gemini → rule-based in production', async () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_LLM_PROVIDER', '')

    const { getActiveProvider } = await import('./index')
    const provider = getActiveProvider()

    expect(provider.id).toBe('gemini')
    // The stubbed Firebase AI is unavailable, so AI reports off and callers fall back.
    expect(provider.isConfigured()).toBe(false)
  })
})

describe('direct-key providers still work in development (local prototyping)', () => {
  it('openai: a key configures the provider and is auto-selected', async () => {
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_LLM_PROVIDER', '')
    vi.stubEnv('VITE_OPENAI_API_KEY', 'sk-dev-prototype-key')

    const { openaiProvider } = await import('./openai')
    expect(openaiProvider.isConfigured()).toBe(true)

    const { getActiveProvider } = await import('./index')
    expect(getActiveProvider().id).toBe('openai')
  })

  it('anthropic: a key configures the provider and is auto-selected', async () => {
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_LLM_PROVIDER', '')
    vi.stubEnv('VITE_OPENAI_API_KEY', '')
    vi.stubEnv('VITE_ANTHROPIC_API_KEY', 'sk-ant-dev-prototype-key')

    const { anthropicProvider } = await import('./anthropic')
    expect(anthropicProvider.isConfigured()).toBe(true)

    const { getActiveProvider } = await import('./index')
    expect(getActiveProvider().id).toBe('anthropic')
  })
})
