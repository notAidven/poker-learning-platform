/**
 * Pluggable LLM provider layer.
 *
 * A single active provider is chosen from env at runtime and consumed by
 * `../aiClient`. The default is `gemini` (Firebase AI Logic), so behavior is
 * unchanged until an OpenAI or Anthropic key (or a proxy URL) is configured — no
 * code changes are required to switch providers, only env vars.
 *
 * NOTE: provider modules import the `LLMProvider` *type* from here with
 * `import type`, so there is no runtime import cycle (the type import is erased).
 */
import { geminiProvider } from './gemini'
import { openaiProvider } from './openai'
import { anthropicProvider } from './anthropic'
import { openaiProxyProvider } from './openai-proxy'
import { readEnv } from './env'

export type LLMProviderId = 'gemini' | 'openai' | 'anthropic' | 'openai-proxy'

export type LLMProvider = {
  id: LLMProviderId
  /** True when this provider can actually make a call (model/key/proxy present). */
  isConfigured(): boolean
  /** One-shot generation. Resolve to `null` on any failure; callers handle fallback. */
  generateText(prompt: string, signal: AbortSignal): Promise<string | null>
}

const PROVIDERS: Record<LLMProviderId, LLMProvider> = {
  gemini: geminiProvider,
  openai: openaiProvider,
  anthropic: anthropicProvider,
  'openai-proxy': openaiProxyProvider,
}

/**
 * Resolve the active provider id:
 *   1. explicit `VITE_LLM_PROVIDER` ('gemini' | 'openai' | 'anthropic' | 'openai-proxy') wins;
 *   2. else auto-detect: `VITE_OPENAI_API_KEY` -> openai, `VITE_ANTHROPIC_API_KEY` -> anthropic;
 *   3. else default to `gemini` (existing Firebase AI Logic).
 *
 * `openai-proxy` is opt-in only (step 1): it routes calls through the secure server
 * proxy (the `aiChat` callable) and is never auto-selected, so the safe default
 * (gemini, then rule-based) is unchanged until the flag is explicitly set.
 *
 * Each `import.meta.env.VITE_*` is read via static member access so Vite can inline
 * the value at build time (dynamic indexing would not be statically replaced).
 */
function selectProviderId(): LLMProviderId {
  const explicit = readEnv(import.meta.env.VITE_LLM_PROVIDER).toLowerCase()
  if (
    explicit === 'gemini' ||
    explicit === 'openai' ||
    explicit === 'anthropic' ||
    explicit === 'openai-proxy'
  ) {
    return explicit
  }
  if (readEnv(import.meta.env.VITE_OPENAI_API_KEY)) return 'openai'
  if (readEnv(import.meta.env.VITE_ANTHROPIC_API_KEY)) return 'anthropic'
  return 'gemini'
}

let cachedProvider: LLMProvider | null = null

/** The env-selected LLM provider (cached; selection is static per build/runtime). */
export function getActiveProvider(): LLMProvider {
  if (cachedProvider) return cachedProvider
  cachedProvider = PROVIDERS[selectProviderId()]
  return cachedProvider
}
