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
 * TODO(secure): route via VITE_LLM_PROXY_URL in production.
 */
import type { LLMProvider } from './index'
import { readEnv } from './env'

// TODO(model): default OpenAI model — change here, or override with VITE_OPENAI_MODEL.
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'

// Direct OpenAI REST base; the `/chat/completions` path is appended below.
const OPENAI_API_BASE = 'https://api.openai.com/v1'

function apiKey(): string {
  return readEnv(import.meta.env.VITE_OPENAI_API_KEY)
}

function proxyUrl(): string {
  return readEnv(import.meta.env.VITE_LLM_PROXY_URL)
}

function modelName(): string {
  return readEnv(import.meta.env.VITE_OPENAI_MODEL) || DEFAULT_OPENAI_MODEL
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
