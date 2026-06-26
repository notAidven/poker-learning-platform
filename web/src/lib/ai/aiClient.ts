/**
 * Thin, crash-proof wrapper around the active LLM provider (see ./providers).
 *
 * The provider is selected from env (default: Gemini via Firebase AI Logic), so this
 * module's PUBLIC API is unchanged and behavior is identical until an OpenAI/Anthropic
 * key (or proxy URL) is configured. Every entry point degrades gracefully: if no
 * provider is configured, a call errors, or it exceeds the timeout, the function
 * resolves to `null` (or `false`) instead of throwing — callers can therefore always
 * fall back to rule-based logic.
 */
import { getActiveProvider } from './providers'

const DEFAULT_TIMEOUT_MS = 8000

type GenerateOpts = {
  prompt: string
  timeoutMs?: number
}

/** True when the active provider is configured (Firebase AI Logic, or a key/proxy). */
export function isAIConfigured(): boolean {
  return getActiveProvider().isConfigured()
}

/**
 * Ask the model for JSON and parse it defensively (tolerating ```json fences and
 * surrounding prose). Returns `null` on any error, timeout, or if AI is off.
 */
export async function generateJSON<T>(opts: GenerateOpts): Promise<T | null> {
  const text = await generateText(opts)
  if (text == null) return null
  return parseJsonLoose<T>(text)
}

/** One-shot text generation. Returns `null` on any error, timeout, or if AI is off. */
export async function generateText(opts: GenerateOpts): Promise<string | null> {
  const provider = getActiveProvider()
  if (!provider.isConfigured()) return null

  const controller = new AbortController()
  try {
    const text = await withTimeout(
      provider.generateText(opts.prompt, controller.signal),
      opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      controller,
    )
    return typeof text === 'string' && text.trim().length > 0 ? text : null
  } catch {
    return null
  }
}

/**
 * Bound `promise` to `timeoutMs`. On timeout, abort the controller (cancelling
 * fetch-based providers) and reject so the caller resolves to `null`.
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  controller: AbortController,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort()
      reject(new Error('ai-timeout'))
    }, timeoutMs)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

/**
 * Parse model output as JSON, tolerating Markdown code fences and stray text
 * around the JSON body. Returns `null` if nothing parseable is found.
 */
function parseJsonLoose<T>(raw: string): T | null {
  const cleaned = stripCodeFences(raw)
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Fall back to the first {...} or [...] block embedded in the text.
    const match = cleaned.match(/[[{][\s\S]*[\]}]/)
    if (!match) return null
    try {
      return JSON.parse(match[0]) as T
    } catch {
      return null
    }
  }
}

function stripCodeFences(raw: string): string {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text
      .replace(/^```(?:json|JSON)?[^\n]*\n?/, '')
      .replace(/\n?```$/, '')
  }
  return text.trim()
}
