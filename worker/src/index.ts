/**
 * "Suited" AI proxy — a free-tier Cloudflare Worker that replaces the previous
 * Firebase callable (Cloud Functions require the Blaze plan; this project is on
 * the free Spark plan).
 *
 * POST /chat
 *   - Requires `Authorization: Bearer <Firebase ID token>` (verified here).
 *   - Body: { model?, messages, temperature?, max_tokens?, json? }
 *   - Calls OpenAI Chat Completions with the server-side OPENAI_API_KEY secret
 *     and returns { text, model, finishReason }.
 *
 * GET / (or /health)
 *   - Unauthenticated liveness probe → { status: "ok" }.
 *
 * The OpenAI key lives ONLY in the Worker secret (`wrangler secret put
 * OPENAI_API_KEY`); it is never in this repo and never returned to clients.
 */
import { verifyIdToken } from './firebaseAuth'
import { callOpenAI, validateChatRequest, ValidationError } from './openai'

/** Firebase project whose ID tokens this proxy accepts. */
const PROJECT_ID = 'brilliant-alpha-clone-54be9'

/** Browser origins permitted to call the proxy (CORS allowlist). */
const ALLOWED_ORIGINS: ReadonlySet<string> = new Set([
  'https://brilliant-alpha-clone-54be9.web.app',
  'https://brilliant-alpha-clone-54be9.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
])

/** Bindings declared for this Worker. `OPENAI_API_KEY` is a deploy-time secret. */
export interface Env {
  OPENAI_API_KEY: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    const url = new URL(request.url)

    // CORS preflight — answer before any auth/parsing.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    // Unauthenticated liveness probe (handy for confirming a deploy).
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      return json({ status: 'ok', service: 'suited-ai-proxy' }, 200, origin)
    }

    if (url.pathname !== '/chat') {
      return json({ error: 'Not found.' }, 404, origin)
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed.' }, 405, origin)
    }

    // 1) Require + verify a Firebase ID token.
    const idToken = bearerToken(request.headers.get('Authorization'))
    if (!idToken) {
      return json({ error: 'Missing or malformed Authorization header.' }, 401, origin)
    }
    const verified = await verifyIdToken(idToken, PROJECT_ID).catch(() => null)
    if (!verified) {
      return json({ error: 'Invalid or expired authentication token.' }, 401, origin)
    }

    // 2) The OpenAI key must be configured server-side.
    const apiKey = env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('OPENAI_API_KEY secret is not configured.')
      return json({ error: 'AI is temporarily unavailable.' }, 503, origin)
    }

    // 3) Parse + validate the (untrusted) body.
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return json({ error: 'Request body must be valid JSON.' }, 400, origin)
    }

    let params
    try {
      params = validateChatRequest(body)
    } catch (err) {
      const message = err instanceof ValidationError ? err.message : 'Invalid request.'
      return json({ error: message }, 400, origin)
    }

    // 4) Call OpenAI. Failures return a clean message (never the key / raw error).
    try {
      const result = await callOpenAI(apiKey, params)
      return json(result, 200, origin)
    } catch (err) {
      console.error('OpenAI request failed:', sanitizeError(err))
      return json({ error: 'The AI request failed. Please try again.' }, 502, origin)
    }
  },
} satisfies ExportedHandler<Env>

// --- helpers ----------------------------------------------------------------

/** Extract the token from an `Authorization: Bearer <token>` header. */
function bearerToken(header: string | null): string | null {
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!match) return null
  const token = match[1].trim()
  return token.length > 0 ? token : null
}

/** CORS headers; echoes the request Origin only when it is on the allowlist. */
function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

/** JSON response with CORS headers applied. */
function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  })
}

/** Reduce an error to a short, safe string for logging (never includes the key). */
function sanitizeError(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`.slice(0, 300)
  return 'unknown error'
}
