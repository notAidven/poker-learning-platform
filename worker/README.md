# Suited AI Proxy — Cloudflare Worker

A tiny, **free-tier** Cloudflare Worker that proxies OpenAI Chat Completions for
the "Suited" poker app. It exists because Firebase Cloud Functions require the
**Blaze** (paid) plan, while this project runs on the free **Spark** plan. The
Worker runs on Cloudflare's free Workers plan instead.

The OpenAI API key lives **only** in a Worker secret (`OPENAI_API_KEY`) — it is
never committed to this repo and never sent to the browser.

## What it does

- `POST /chat` — requires `Authorization: Bearer <Firebase ID token>`.
  - Body: `{ model?, messages, temperature?, max_tokens?, json? }`
  - Validates input, calls `https://api.openai.com/v1/chat/completions`, and
    returns `{ text, model, finishReason }`.
  - Default model: `gpt-4o-mini`. Set `json: true` for a `json_object` response.
  - Enforces a server-side **model allow-list** and **per-uid rate limits**; see
    [Cost & abuse controls](#cost--abuse-controls).
- `GET /` (or `/health`) — unauthenticated liveness probe → `{ "status": "ok" }`.
- `OPTIONS` — CORS preflight.

### Auth gating (Firebase ID tokens)

Every `/chat` request must carry a Firebase ID token. The Worker verifies it with
**Web Crypto only** (no runtime dependencies):

1. Fetches Google's public x509 certs from the securetoken endpoint and caches
   them per the response's `Cache-Control: max-age`.
2. Extracts the public key (SubjectPublicKeyInfo) from the matching certificate
   and verifies the token's **RS256** signature.
3. Checks the claims: `aud === "brilliant-alpha-clone-54be9"`,
   `iss === "https://securetoken.google.com/brilliant-alpha-clone-54be9"`, and
   `exp` not expired (plus light `iat`/`auth_time`/`sub` sanity checks).

Missing/invalid tokens get a `401`. The token's `aud`/`iss` project id is set in
`src/index.ts` (`PROJECT_ID`); change it if you point this at another project.

### CORS

Allowed origins: the production hosting domains
(`https://brilliant-alpha-clone-54be9.web.app`,
`https://brilliant-alpha-clone-54be9.firebaseapp.com`) and local dev
(`http://localhost:5173`, `:5174`, `:5175`). Update `ALLOWED_ORIGINS` in
`src/index.ts` if your origins differ.

## Cost & abuse controls

Auth and CORS gate **who** can reach the proxy; these controls gate **how much**
it can cost, so a signed-in (or token-stealing) caller can't run up an OpenAI bill:

- **Server-side model allow-list.** The proxy only ever calls a model on an
  explicit allow-list (`ALLOWED_MODELS` in `src/openai.ts`), defaulting to
  `gpt-4o-mini`. Any other `model` value is rejected with `400` — a client can
  never select an off-list (e.g. expensive) model. Add a model to that set to
  enable it.
- **Per-uid rate limiting (Durable Object).** Every request is counted against the
  verified `uid` via a Durable Object addressed per uid (`idFromName(uid)`), which
  gives each user an isolated, strongly-consistent counter on the **free** plan.
  Two fixed windows are enforced:
  - a per-minute burst guard (`RATE_LIMITS.perMinute`, default `30`), and
  - a daily cap (`RATE_LIMITS.perDay`, default `400`).

  Over-limit requests get `429` with a `Retry-After` header. The web client treats
  any non-2xx as a soft failure and falls back to its rule-based logic, so hitting
  a limit degrades the AI gracefully rather than erroring. Tune the numbers in
  `src/rateLimit.ts`.
- **Tight input/output caps** (`src/openai.ts`): `MAX_MESSAGES` (`12`),
  `MAX_CONTENT_CHARS` (`8,000`), and `MAX_OUTPUT_TOKENS` (`2,048`; the default
  `max_tokens` stays `1,024`) — sized to this app's coach/opponent prompts to cut
  the input-cost vector.

**Why a Durable Object and not KV?** A DO gives a strongly-consistent counter (no
eventual-consistency race) and isn't subject to KV's free-tier daily *write* cap,
which a per-request counter would otherwise burn through. It is also simpler to
operate: the DO is created automatically on `wrangler deploy` (via the
`[[migrations]]` entry in `wrangler.toml`), so there is **no namespace to create**
and nothing to paste back into config.

## Local development

```bash
cd worker
npm install
npm run typecheck        # tsc --noEmit
npm test                 # vitest run (unit tests: model allow-list + rate limits)
npm run dry-run          # wrangler deploy --dry-run --outdir dist (builds, no deploy)

# To run it locally with a key, create worker/.dev.vars (gitignored):
#   OPENAI_API_KEY=sk-...
npm run dev              # wrangler dev
```

## Deploy (maintainer steps)

You need a **free Cloudflare account**. From the `worker/` directory:

```bash
cd worker
npm install

# 1) Authenticate wrangler with your Cloudflare account (opens a browser).
npx wrangler login

# 2) Store the OpenAI key as a Worker SECRET (never put it in any file).
npx wrangler secret put OPENAI_API_KEY
#    (paste your sk-... key when prompted)

# 3) Deploy. This also provisions the rate-limiter Durable Object automatically:
#    the `[[migrations]]` entry in wrangler.toml runs on first deploy, so there is
#    NO namespace to create and nothing to paste back into config. Note the printed
#    Worker URL, e.g. https://suited-ai-proxy.<your-subdomain>.workers.dev
npx wrangler deploy
```

> Rate limits and the model allow-list are code/config, not account setup — they
> ship with the deploy above. To change them, edit `src/rateLimit.ts` /
> `src/openai.ts` (or `wrangler.toml`) and redeploy. See
> [Cost & abuse controls](#cost--abuse-controls).

### Wire the client to the Worker

Set the deployed Worker URL as a build-time env var for the web app, then rebuild
and redeploy hosting:

```bash
# In web/.env.local (gitignored) — use YOUR deployed Worker URL:
VITE_AI_PROXY_URL=https://suited-ai-proxy.<your-subdomain>.workers.dev
VITE_LLM_PROVIDER=openai-proxy

cd ../web
npm run build
firebase deploy --only hosting
```

The client appends `/chat` to `VITE_AI_PROXY_URL` automatically (setting it to the
base Worker URL or the full `.../chat` URL both work).

> The OpenAI path only goes live once `VITE_LLM_PROVIDER=openai-proxy` is set
> **and** `VITE_AI_PROXY_URL` points at the deployed Worker. With either unset,
> the app keeps its default behavior (Gemini → rule-based fallback). If the proxy
> is unreachable or the user isn't signed in, calls soft-fail to the rule-based
> fallback rather than erroring.

## Files

- `src/index.ts` — request routing, CORS, auth gating, rate-limit gate, OpenAI call.
- `src/firebaseAuth.ts` — Firebase ID token verification (Web Crypto, zero deps).
- `src/openai.ts` — request validation, model allow-list, input caps, OpenAI call.
- `src/rateLimit.ts` — pure per-uid fixed-window limit logic (unit-tested).
- `src/rateLimiterDO.ts` — the `RateLimiterDO` Durable Object (per-uid counter).
- `wrangler.toml` — Worker config (name, entry, DO binding + migration).
- `test/rateLimit.test.ts` — unit tests for the allow-list and rate-limit logic.
