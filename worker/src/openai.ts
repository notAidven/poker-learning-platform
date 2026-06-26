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

/**
 * Server-side model allow-list — the primary cost guardrail. Even a stolen or
 * abused Firebase token can only ever invoke a model named here, so a caller can
 * never run up a bill on an expensive model. To enable another model, add its
 * exact id to this set (nothing else needs to change).
 */
export const ALLOWED_MODELS: ReadonlySet<string> = new Set<string>(['gpt-4o-mini'])

/** Default when the client omits `model`; must itself be in ALLOWED_MODELS. */
export const DEFAULT_MODEL = 'gpt-4o-mini'

const DEFAULT_MAX_TOKENS = 1024
// Output ceiling (cost guardrail). The client never sends max_tokens today, so it
// uses DEFAULT_MAX_TOKENS; this only caps anyone who does. Lowered from 4096.
const MAX_OUTPUT_TOKENS = 2048
// Input caps tuned to this app's real prompts — the largest, the deep-table coach
// read, is a few KB in a single message. Tightened from 50 x 24,000 to cut the
// input-cost / abuse vector while leaving generous headroom.
const MAX_MESSAGES = 12
const MAX_CONTENT_CHARS = 8_000

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
  // Allow-list, not just a length check: reject any model the proxy isn't
  // explicitly permitted to call (the message intentionally does not echo the
  // rejected value).
  if (!ALLOWED_MODELS.has(model)) {
    throw new ValidationError('`model` is not supported by this proxy.')
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
