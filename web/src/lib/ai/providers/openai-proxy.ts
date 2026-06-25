/**
 * OpenAI-via-server-proxy provider (SECURE).
 *
 * Unlike the placeholder `openai`/`anthropic` providers (which can embed a raw key
 * in the browser bundle), this provider NEVER sees the OpenAI API key. It calls a
 * Firebase **callable** Cloud Function (`aiChat`) with the Firebase Functions SDK;
 * that function requires auth and reads the key from a server-side secret
 * (`OPENAI_API_KEY`) at runtime. The key therefore lives only on the server.
 *
 * Activation (opt-in, NO code changes): in `web/.env.local` set
 *   VITE_LLM_PROVIDER=openai-proxy
 * The default provider stays `gemini`, so existing behavior is unchanged until the
 * flag is set. Optionally override the model with `VITE_OPENAI_MODEL` (the function
 * defaults to gpt-4o-mini otherwise).
 *
 * Failure is always soft: a missing sign-in, an undeployed function, a network
 * error, or a timeout resolves to `null`, so callers (the AI coach, table talk, and
 * the Room 2 LLM opponents) transparently fall back to rule-based logic.
 */
import type { LLMProvider } from './index'
import { httpsCallable } from 'firebase/functions'
import { getAiFunctions } from '../../firebaseFunctions'

/** Request payload accepted by the `aiChat` callable (kept minimal + server-validated). */
type AiChatRequest = {
  model?: string
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  temperature?: number
  max_tokens?: number
  json?: boolean
}

/** Response shape returned by the `aiChat` callable. */
type AiChatResponse = {
  text: string
  model?: string
  finishReason?: string | null
}

function readEnv(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Optional client-side model override; the function defaults to gpt-4o-mini. */
function modelOverride(): string {
  return readEnv(import.meta.env.VITE_OPENAI_MODEL)
}

/**
 * Configured whenever the Functions SDK instance is obtainable. This provider is
 * opt-in (only ever active when `VITE_LLM_PROVIDER=openai-proxy`), and it cannot
 * see the server-side key, so "configured" means "the proxy path is wired up" —
 * runtime auth/availability problems are handled by falling back to `null`.
 */
function isConfigured(): boolean {
  try {
    return getAiFunctions() !== null
  } catch {
    return false
  }
}

/**
 * Reject as soon as `signal` aborts so an aiClient timeout unblocks promptly. The
 * callable itself can't be cancelled, but its (now-ignored) result is discarded.
 */
function withAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(new Error('aborted'))
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new Error('aborted'))
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (error) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      },
    )
  })
}

async function generateText(prompt: string, signal: AbortSignal): Promise<string | null> {
  if (signal.aborted) return null

  const functions = getAiFunctions()
  if (!functions) return null

  try {
    const aiChat = httpsCallable<AiChatRequest, AiChatResponse>(functions, 'aiChat')
    const model = modelOverride()
    const payload: AiChatRequest = {
      messages: [{ role: 'user', content: prompt }],
      ...(model ? { model } : {}),
    }

    const result = await withAbort(aiChat(payload), signal)
    const text = result.data?.text
    return typeof text === 'string' && text.trim().length > 0 ? text : null
  } catch {
    // Unauthenticated, undeployed, network, or server error → soft-fail to null so
    // callers fall back to rule-based logic. Never surface server/key details here.
    return null
  }
}

/**
 * The callable is non-streaming, so "streaming" is a single non-streamed call whose
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
