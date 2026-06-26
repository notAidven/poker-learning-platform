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

## Local development

```bash
cd worker
npm install
npm run typecheck        # tsc --noEmit
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

# 3) Deploy. Note the printed Worker URL, e.g.
#    https://suited-ai-proxy.<your-subdomain>.workers.dev
npx wrangler deploy
```

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

- `src/index.ts` — request routing, CORS, auth gating, OpenAI call orchestration.
- `src/firebaseAuth.ts` — Firebase ID token verification (Web Crypto, zero deps).
- `src/openai.ts` — request validation + OpenAI Chat Completions call.
- `wrangler.toml` — Worker config (name, entry, compatibility date).
