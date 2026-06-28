/**
 * OpenAI provider — PLACEHOLDER (real REST shape, inert until a key/proxy is set).
 *
 * Drop-in activation (NO code changes needed): in `web/.env.local` set
 *   VITE_OPENAI_API_KEY=sk-...            (and optionally VITE_LLM_PROVIDER=openai)
 * or, preferred for production, point at your backend proxy:
 *   VITE_LLM_PROVIDER=openai
 *   VITE_LLM_PROXY_URL=https://your-proxy.example.com
 *
 * SECURITY: a raw `VITE_OPENAI_API_KEY` is embedded in the client bundle by Vite and
 * is therefore visible to every user who loads the app. For anything beyond local
 * prototyping, leave the key blank and set `VITE_LLM_PROXY_URL` to a backend you
 * control that injects the real key server-side.
 *
 * PRODUCTION GUARD: this direct-key provider is hard-disabled in production builds
 * (`import.meta.env.PROD`). `isConfigured()` reports `false`, `generateText()` throws,
 * and the raw-key read below is dead-code-eliminated so a `VITE_OPENAI_API_KEY` can
 * never be inlined into a prod bundle — even if a future env misconfig sets one. Use
 * the secure `openai-proxy` provider in production; this path is dev/prototyping-only.
 */
import type { LLMProvider } from './index'
import { readEnv } from './env'

// TODO(model): default OpenAI model — change here, or override with VITE_OPENAI_MODEL.
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'

// Direct OpenAI REST base; the `/chat/completions` path is appended below.
const OPENAI_API_BASE = 'https://api.openai.com/v1'

function apiKey(): string {
  // SECURITY: never read a raw client key in a production build. `import.meta.env.PROD`
  // is statically `true` in prod, so this read is dead-code-eliminated and the
  // `VITE_OPENAI_API_KEY` value is never inlined into (and shipped with) the bundle.
  if (import.meta.env.PROD) return ''
  return readEnv(import.meta.env.VITE_OPENAI_API_KEY)
}

function proxyUrl(): string {
  return readEnv(import.meta.env.VITE_LLM_PROXY_URL)
}

function modelName(): string {
  return readEnv(import.meta.env.VITE_OPENAI_MODEL) || DEFAULT_OPENAI_MODEL
}

/**
 * Configured when a raw key is present OR a backend proxy URL is set (preferred).
 * Always `false` in production: the direct-key provider is dev/prototyping-only (the
 * production-safe path is the `openai-proxy` provider), so it can never be the active
 * provider in a prod build and `aiClient` short-circuits to the rule-based fallback.
 */
function isConfigured(): boolean {
  if (import.meta.env.PROD) return false
  return apiKey().length > 0 || proxyUrl().length > 0
}

async function generateText(prompt: string, signal: AbortSignal): Promise<string | null> {
  // SECURITY (defense in depth): refuse to run in production even if invoked directly.
  // A raw `VITE_OPENAI_API_KEY` would be exposed to every visitor; the secure
  // `openai-proxy` provider must be used instead. `aiClient` catches this throw and
  // falls back to the rule-based engine, so the app degrades gracefully.
  if (import.meta.env.PROD) {
    throw new Error(
      "The 'openai' direct-key provider is disabled in production builds to prevent " +
        'shipping a raw API key to the browser. Set VITE_LLM_PROVIDER=openai-proxy ' +
        '(the secure server proxy) instead.',
    )
  }

  const key = apiKey()
  const proxy = proxyUrl()
  if (!key && !proxy) return null

  // Prefer the proxy so the raw key never reaches the browser. The proxy is expected
  // to expose the same `/chat/completions` path and inject Authorization server-side.
  const base = (proxy || OPENAI_API_BASE).replace(/\/+$/, '')

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  // Only attach the raw key for direct (non-proxied) calls.
  if (!proxy && key) headers['Authorization'] = `Bearer ${key}`

  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      model: modelName(),
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!response.ok) return null

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const text = data.choices?.[0]?.message?.content
  return typeof text === 'string' && text.trim().length > 0 ? text : null
}

export const openaiProvider: LLMProvider = {
  id: 'openai',
  isConfigured,
  generateText,
}
