/**
 * Anthropic provider — PLACEHOLDER (real REST shape, inert until a key/proxy is set).
 *
 * Drop-in activation (NO code changes needed): in `web/.env.local` set
 *   VITE_ANTHROPIC_API_KEY=sk-ant-...     (and optionally VITE_LLM_PROVIDER=anthropic)
 * or, preferred for production, point at your backend proxy:
 *   VITE_LLM_PROVIDER=anthropic
 *   VITE_LLM_PROXY_URL=https://your-proxy.example.com
 *
 * SECURITY: a raw `VITE_ANTHROPIC_API_KEY` is embedded in the client bundle by Vite
 * and is therefore visible to every user who loads the app. For anything beyond local
 * prototyping, leave the key blank and set `VITE_LLM_PROXY_URL` to a backend you
 * control that injects the real key server-side.
 * TODO(secure): route via VITE_LLM_PROXY_URL in production.
 */
import type { LLMProvider } from './index'
import { readEnv } from './env'

// TODO(model): default Anthropic model — change here, or override with VITE_ANTHROPIC_MODEL.
const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-haiku-latest'
// TODO(model): tune the response token budget for your use case.
const DEFAULT_MAX_TOKENS = 1024

// Direct Anthropic REST base; the `/v1/messages` path is appended below.
const ANTHROPIC_API_BASE = 'https://api.anthropic.com'
const ANTHROPIC_VERSION = '2023-06-01'

function apiKey(): string {
  return readEnv(import.meta.env.VITE_ANTHROPIC_API_KEY)
}

function proxyUrl(): string {
  return readEnv(import.meta.env.VITE_LLM_PROXY_URL)
}

function modelName(): string {
  return readEnv(import.meta.env.VITE_ANTHROPIC_MODEL) || DEFAULT_ANTHROPIC_MODEL
}

/** Configured when a raw key is present OR a backend proxy URL is set (preferred). */
function isConfigured(): boolean {
  return apiKey().length > 0 || proxyUrl().length > 0
}

async function generateText(prompt: string, signal: AbortSignal): Promise<string | null> {
  const key = apiKey()
  const proxy = proxyUrl()
  if (!key && !proxy) return null

  // Prefer the proxy so the raw key never reaches the browser. The proxy is expected
  // to expose the same `/v1/messages` path and inject `x-api-key` server-side.
  const base = (proxy || ANTHROPIC_API_BASE).replace(/\/+$/, '')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'anthropic-version': ANTHROPIC_VERSION,
    // Required to call the Anthropic API directly from a browser. PROTOTYPING ONLY:
    // direct browser use exposes the key — prefer a backend proxy (VITE_LLM_PROXY_URL)
    // so neither the key nor this header ever ships to end users.
    'anthropic-dangerous-direct-browser-access': 'true',
  }
  // Only attach the raw key for direct (non-proxied) calls.
  if (!proxy && key) headers['x-api-key'] = key

  const response = await fetch(`${base}/v1/messages`, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      model: modelName(),
      max_tokens: DEFAULT_MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!response.ok) return null

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>
  }
  const block = data.content?.find((part) => typeof part?.text === 'string')
  const text = block?.text
  return typeof text === 'string' && text.trim().length > 0 ? text : null
}

export const anthropicProvider: LLMProvider = {
  id: 'anthropic',
  isConfigured,
  generateText,
}
