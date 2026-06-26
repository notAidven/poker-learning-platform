/**
 * Request validation + OpenAI Chat Completions call for the Worker proxy.
 *
 * Validation mirrors the previous Firebase callable so the client contract is
 * unchanged: a minimal, server-validated `{ model?, messages, temperature?,
 * max_tokens?, json? }` payload in, a clean `{ text, model, finishReason }` out.
 * The OpenAI key is passed in from the Worker secret and is NEVER logged or echoed.
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_TIMEOUT_MS = 30_000

export const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_MAX_TOKENS = 1024
const MAX_OUTPUT_TOKENS = 4096
const MAX_MESSAGES = 50
const MAX_CONTENT_CHARS = 24_000
const MAX_MODEL_CHARS = 100

export type ChatRole = 'system' | 'user' | 'assistant'
export type ChatMessage = { role: ChatRole; content: string }

export type ChatResponse = {
  text: string
  model: string
  finishReason: string | null
}

export type ValidatedParams = {
  model: string
  messages: ChatMessage[]
  temperature: number | undefined
  maxTokens: number
  json: boolean
}

/** Thrown for any client-side (400) validation problem; message is safe to return. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

const VALID_ROLES: ReadonlySet<string> = new Set<ChatRole>(['system', 'user', 'assistant'])

/** Validate + normalize the untrusted client payload. Throws ValidationError on bad input. */
export function validateChatRequest(data: unknown): ValidatedParams {
  if (data == null || typeof data !== 'object') {
    throw new ValidationError('Request body must be a JSON object.')
  }
  const body = data as Record<string, unknown>
  return {
    messages: validateMessages(body.messages),
    model: validateModel(body.model),
    temperature: validateTemperature(body.temperature),
    maxTokens: validateMaxTokens(body.max_tokens),
    json: body.json === true,
  }
}

function validateMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError('`messages` must be a non-empty array.')
  }
  if (value.length > MAX_MESSAGES) {
    throw new ValidationError(`\`messages\` may not exceed ${MAX_MESSAGES} entries.`)
  }

  return value.map((entry, index): ChatMessage => {
    if (entry == null || typeof entry !== 'object') {
      throw new ValidationError(`messages[${index}] must be an object.`)
    }
    const role = (entry as { role?: unknown }).role
    const content = (entry as { content?: unknown }).content
    if (typeof role !== 'string' || !VALID_ROLES.has(role)) {
      throw new ValidationError(
        `messages[${index}].role must be "system", "user", or "assistant".`,
      )
    }
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new ValidationError(`messages[${index}].content must be a non-empty string.`)
    }
    if (content.length > MAX_CONTENT_CHARS) {
      throw new ValidationError(`messages[${index}].content is too long.`)
    }
    return { role: role as ChatRole, content }
  })
}

function validateModel(value: unknown): string {
  if (value === undefined || value === null) return DEFAULT_MODEL
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError('`model` must be a non-empty string.')
  }
  const model = value.trim()
  if (model.length > MAX_MODEL_CHARS) {
    throw new ValidationError('`model` is too long.')
  }
  return model
}

function validateTemperature(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 2) {
    throw new ValidationError('`temperature` must be a number between 0 and 2.')
  }
  return value
}

function validateMaxTokens(value: unknown): number {
  if (value === undefined || value === null) return DEFAULT_MAX_TOKENS
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new ValidationError('`max_tokens` must be a positive integer.')
  }
  return Math.min(value, MAX_OUTPUT_TOKENS)
}

/** Thrown when OpenAI returns a non-2xx response or the call otherwise fails. */
export class OpenAIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OpenAIError'
  }
}

type OpenAICompletion = {
  model?: string
  choices?: { message?: { content?: string }; finish_reason?: string | null }[]
}

/**
 * Call OpenAI Chat Completions and reduce the result to the proxy's clean shape.
 * The provided `apiKey` is used only as the Bearer credential and never returned.
 */
export async function callOpenAI(apiKey: string, params: ValidatedParams): Promise<ChatResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
        max_tokens: params.maxTokens,
        ...(params.json ? { response_format: { type: 'json_object' as const } } : {}),
      }),
      signal: controller.signal,
    })
  } catch (err) {
    throw new OpenAIError(err instanceof Error ? err.message : 'network error')
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    // Surface a short, sanitized hint for server logs. OpenAI error bodies never
    // contain our key, but we still keep only the message and cap the length.
    let detail = `HTTP ${res.status}`
    try {
      const body = (await res.json()) as { error?: { message?: string } }
      if (body?.error?.message) detail = `${detail}: ${body.error.message}`
    } catch {
      // ignore unparseable error bodies
    }
    throw new OpenAIError(detail.slice(0, 300))
  }

  const completion = (await res.json()) as OpenAICompletion
  const choice = completion.choices?.[0]
  return {
    text: choice?.message?.content ?? '',
    model: completion.model ?? params.model,
    finishReason: choice?.finish_reason ?? null,
  }
}
