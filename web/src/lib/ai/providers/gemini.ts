/**
 * Gemini provider (DEFAULT) — wraps the existing Firebase AI Logic path.
 *
 * This preserves the app's current behavior exactly: when Firebase AI Logic is
 * provisioned, `getGeminiModel()` returns a model; otherwise it returns `null` and
 * callers fall back to rule-based logic. No API-key env var is needed here —
 * Firebase config (see ../../firebase) drives availability.
 */
import type { LLMProvider } from './index'
import { getGeminiModel } from '../../firebase'

/** Available when a Gemini model can be constructed (Firebase AI Logic provisioned). */
function isConfigured(): boolean {
  return getGeminiModel() !== null
}

async function generateText(prompt: string, signal: AbortSignal): Promise<string | null> {
  const model = getGeminiModel()
  if (!model || signal.aborted) return null

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  return typeof text === 'string' && text.trim().length > 0 ? text : null
}

async function streamText(
  prompt: string,
  signal: AbortSignal,
  onToken: (chunk: string) => void,
): Promise<string | null> {
  const model = getGeminiModel()
  if (!model || signal.aborted) return null

  const { stream } = await model.generateContentStream(prompt)
  let full = ''
  for await (const chunk of stream) {
    // Stop early if the caller's timeout aborted the request; tokens already
    // delivered via onToken are kept (matching the original behavior).
    if (signal.aborted) break
    let piece = ''
    try {
      piece = chunk.text()
    } catch {
      piece = ''
    }
    if (piece) {
      full += piece
      onToken(piece)
    }
  }
  return full.trim().length > 0 ? full : null
}

export const geminiProvider: LLMProvider = {
  id: 'gemini',
  isConfigured,
  generateText,
  streamText,
}
