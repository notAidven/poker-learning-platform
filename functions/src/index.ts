/**
 * Secure server-side OpenAI proxy for the "Suited" poker web app.
 *
 * `aiChat` is a 2nd-gen Firebase **callable** function. It:
 *   - REQUIRES authentication (rejects when `request.auth` is missing);
 *   - reads the OpenAI key from the `OPENAI_API_KEY` v2 secret at runtime (bound to
 *     the function via `secrets`), so the key NEVER ships to the browser;
 *   - validates the client params and calls OpenAI Chat Completions via the official
 *     `openai` package, with an optional JSON-output mode (`response_format`);
 *   - returns only the assistant text (plus model + finish reason), and on any
 *     failure returns a clean message that NEVER leaks the key or request details.
 *
 * The maintainer sets the secret and deploys this function separately:
 *   firebase functions:secrets:set OPENAI_API_KEY
 *   firebase deploy --only functions
 */
import { onCall, HttpsError } from 'firebase-functions/https'
import { defineSecret } from 'firebase-functions/params'
import * as logger from 'firebase-functions/logger'
import OpenAI from 'openai'

/** The OpenAI key, supplied at runtime from a Secret Manager secret (never in code). */
const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY')

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_MAX_TOKENS = 1024
const MAX_OUTPUT_TOKENS = 4096
const MAX_MESSAGES = 50
const MAX_CONTENT_CHARS = 24_000
const MAX_MODEL_CHARS = 100

type ChatRole = 'system' | 'user' | 'assistant'
type ChatMessage = { role: ChatRole; content: string }

/** Raw, untrusted client payload (validated before use). */
type AiChatRequest = {
  model?: unknown
  messages?: unknown
  temperature?: unknown
  max_tokens?: unknown
  json?: unknown
}

/** The clean response returned to the client. */
type AiChatResponse = {
  text: string
  model: string
  finishReason: string | null
}

const VALID_ROLES: ReadonlySet<string> = new Set<ChatRole>(['system', 'user', 'assistant'])

export const aiChat = onCall<AiChatRequest, Promise<AiChatResponse>>(
  {
    secrets: [OPENAI_API_KEY],
    memory: '256MiB',
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (request): Promise<AiChatResponse> => {
    // 1) Auth is mandatory — reject anonymous callers.
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to use AI features.')
    }

    // 2) Validate + normalize the (untrusted) client params.
    const params = validateInput(request.data)

    // 3) Read the key from the bound secret. Never log or echo it.
    const apiKey = OPENAI_API_KEY.value()
    if (!apiKey) {
      logger.error('aiChat: OPENAI_API_KEY secret is not configured.')
      throw new HttpsError('failed-precondition', 'AI is temporarily unavailable.')
    }

    // 4) Call OpenAI Chat Completions.
    const openai = new OpenAI({ apiKey })
    try {
      const completion = await openai.chat.completions.create({
        model: params.model,
        messages: params.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
        max_tokens: params.maxTokens,
        ...(params.json ? { response_format: { type: 'json_object' as const } } : {}),
      })

      const choice = completion.choices[0]
      return {
        text: choice?.message?.content ?? '',
        model: completion.model ?? params.model,
        finishReason: choice?.finish_reason ?? null,
      }
    } catch (err) {
      // Log a SANITIZED message only — never the key, headers, or full request body.
      logger.error('aiChat: OpenAI request failed.', { detail: sanitizeError(err) })
      throw new HttpsError('internal', 'The AI request failed. Please try again.')
    }
  },
)

// --- validation -------------------------------------------------------------

type ValidatedParams = {
  model: string
  messages: ChatMessage[]
  temperature: number | undefined
  maxTokens: number
  json: boolean
}

function validateInput(data: AiChatRequest | undefined): ValidatedParams {
  if (data == null || typeof data !== 'object') {
    throw new HttpsError('invalid-argument', 'Request body must be an object.')
  }
  return {
    messages: validateMessages(data.messages),
    model: validateModel(data.model),
    temperature: validateTemperature(data.temperature),
    maxTokens: validateMaxTokens(data.max_tokens),
    json: data.json === true,
  }
}

function validateMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpsError('invalid-argument', '`messages` must be a non-empty array.')
  }
  if (value.length > MAX_MESSAGES) {
    throw new HttpsError('invalid-argument', `\`messages\` may not exceed ${MAX_MESSAGES} entries.`)
  }

  return value.map((entry, index): ChatMessage => {
    if (entry == null || typeof entry !== 'object') {
      throw new HttpsError('invalid-argument', `messages[${index}] must be an object.`)
    }
    const role = (entry as { role?: unknown }).role
    const content = (entry as { content?: unknown }).content
    if (typeof role !== 'string' || !VALID_ROLES.has(role)) {
      throw new HttpsError(
        'invalid-argument',
        `messages[${index}].role must be "system", "user", or "assistant".`,
      )
    }
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new HttpsError('invalid-argument', `messages[${index}].content must be a non-empty string.`)
    }
    if (content.length > MAX_CONTENT_CHARS) {
      throw new HttpsError('invalid-argument', `messages[${index}].content is too long.`)
    }
    return { role: role as ChatRole, content }
  })
}

function validateModel(value: unknown): string {
  if (value === undefined || value === null) return DEFAULT_MODEL
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpsError('invalid-argument', '`model` must be a non-empty string.')
  }
  const model = value.trim()
  if (model.length > MAX_MODEL_CHARS) {
    throw new HttpsError('invalid-argument', '`model` is too long.')
  }
  return model
}

function validateTemperature(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 2) {
    throw new HttpsError('invalid-argument', '`temperature` must be a number between 0 and 2.')
  }
  return value
}

function validateMaxTokens(value: unknown): number {
  if (value === undefined || value === null) return DEFAULT_MAX_TOKENS
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new HttpsError('invalid-argument', '`max_tokens` must be a positive integer.')
  }
  return Math.min(value, MAX_OUTPUT_TOKENS)
}

/**
 * Reduce an error to a short, safe string for logging. OpenAI SDK errors never carry
 * the API key, but we still cap length and only keep name/message to avoid logging
 * anything unexpected.
 */
function sanitizeError(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`.slice(0, 300)
  return 'unknown error'
}
