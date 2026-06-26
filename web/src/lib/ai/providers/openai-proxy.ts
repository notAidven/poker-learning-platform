/**
 * OpenAI-via-Cloudflare-Worker provider (SECURE).
 *
 * The OpenAI API key NEVER touches the browser. This provider calls a free-tier
 * Cloudflare Worker (see `worker/`) over `fetch`; the Worker holds the key in a
 * server-side secret, verifies the caller's Firebase ID token, and proxies the
 * request to OpenAI. (We moved off the previous Firebase callable because Cloud
 * Functions require the Blaze plan — this project is on the free Spark plan.)
 *
 * Activation (opt-in, NO code changes): in `web/.env.local` set
 *   VITE_LLM_PROVIDER=openai-proxy
 *   VITE_AI_PROXY_URL=https://suited-ai-proxy.<your-subdomain>.workers.dev
 * The default provider stays `gemini`, so existing behavior is unchanged until the
 * flag is set. Optionally override the model with `VITE_OPENAI_MODEL` (the Worker
 * defaults to gpt-4o-mini otherwise).
 *
 * Failure is always soft: a missing proxy URL, a missing sign-in, a network error,
 * a non-2xx response, or a timeout resolves to `null`, so callers (the AI coach,
 * table talk, and the Room 2 LLM opponents) transparently fall back to rule-based
 * logic.
 */
import type { LLMProvider } from './index'
import { auth } from '../../firebase'

/** Request payload accepted by the Worker's `POST /chat` (kept minimal + server-validated). */
type AiChatRequest = {
  model?: string
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  temperature?: number
  max_tokens?: number
  json?: boolean
}

/** Response shape returned by the Worker's `POST /chat`. */
type AiChatResponse = {
  text: string
  model?: string
  finishReason?: string | null
}

function readEnv(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** The deployed Worker base URL (or full `/chat` URL); empty when not configured. */
function proxyUrl(): string {
  return readEnv(import.meta.env.VITE_AI_PROXY_URL)
}

/** Optional client-side model override; the Worker defaults to gpt-4o-mini. */
function modelOverride(): string {
  return readEnv(import.meta.env.VITE_OPENAI_MODEL)
}

/**
 * Build the `/chat` endpoint from the configured proxy URL. Accepts either the
 * base Worker URL (…workers.dev) or one that already ends in `/chat`.
 */
function chatEndpoint(base: string): string {
  const trimmed = base.replace(/\/+$/, '')
  return trimmed.endsWith('/chat') ? trimmed : `${trimmed}/chat`
}

/**
 * "Configured" means the proxy URL is set, so the proxy path is wired up. This
 * provider is opt-in (only active when `VITE_LLM_PROVIDER=openai-proxy`) and can
 * never see the server-side key. Runtime problems (no sign-in, network/server
 * errors) are handled by soft-failing to `null` in `generateText`.
 */
function isConfigured(): boolean {
  return proxyUrl().length > 0
}

/**
 * Get the current user's Firebase ID token, or `null` if nobody is signed in or
 * the token can't be minted. Never throws — a `null` here soft-fails the call.
 */
async function currentIdToken(): Promise<string | null> {
  try {
    const user = auth.currentUser
    if (!user) return null
    const token = await user.getIdToken()
    return typeof token === 'string' && token.length > 0 ? token : null
  } catch {
    return null
  }
}

async function generateText(prompt: string, signal: AbortSignal): Promise<string | null> {
  if (signal.aborted) return null

  const base = proxyUrl()
  if (!base) return null

  const token = await currentIdToken()
  if (!token || signal.aborted) return null

  try {
    const model = modelOverride()
    const payload: AiChatRequest = {
      messages: [{ role: 'user', content: prompt }],
      ...(model ? { model } : {}),
    }

    const response = await fetch(chatEndpoint(base), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal,
    })

    if (!response.ok) return null

    const data = (await response.json()) as AiChatResponse
    const text = data?.text
    return typeof text === 'string' && text.trim().length > 0 ? text : null
  } catch {
    // Unauthenticated, unreachable proxy, network, aborted, or server error →
    // soft-fail to null so callers fall back to rule-based logic. Never surface
    // server/key details here.
    return null
  }
}

/**
 * The Worker is non-streaming, so "streaming" is a single non-streamed call whose
 * full result is emitted once via `onToken` (mirrors aiClient's own fallback).
 */
async function streamText(
  prompt: string,
  signal: AbortSignal,
  onToken: (chunk: string) => void,
): Promise<string | null> {
  const text = await generateText(prompt, signal)
  if (text != null) onToken(text)
  return text
}

export const openaiProxyProvider: LLMProvider = {
  id: 'openai-proxy',
  isConfigured,
  generateText,
  streamText,
}
