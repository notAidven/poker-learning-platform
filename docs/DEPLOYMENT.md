# Deployment runbook

How to deploy **Suited** end-to-end. The app is intentionally **free-tier**: Firebase **Spark**
plan for Auth + Firestore + Hosting, and a free **Cloudflare Workers** plan for the optional
OpenAI proxy. Nothing here requires a paid plan.

For how the pieces fit together, see [ARCHITECTURE.md](ARCHITECTURE.md). For the Worker's own
reference, see [`worker/README.md`](../worker/README.md).

> **Never commit secrets.** The OpenAI key is a **Worker secret** only. `web/.env.local`,
> `worker/.dev.vars`, and any `.env*` files are gitignored — keep it that way. The placeholders
> below (`your-project-id`, `sk-...`, `<your-subdomain>`) are not real values.

## Table of contents

- [Prerequisites](#prerequisites)
- [What gets deployed](#what-gets-deployed)
- [1. Configure the web app](#1-configure-the-web-app)
- [2. Deploy Firebase Hosting + Firestore rules](#2-deploy-firebase-hosting--firestore-rules)
- [3. Configure Firebase Authentication](#3-configure-firebase-authentication)
- [4. Deploy the AI Worker (optional)](#4-deploy-the-ai-worker-optional)
- [5. Wire the client to the Worker](#5-wire-the-client-to-the-worker)
- [Verifying a deploy](#verifying-a-deploy)
- [Rollback](#rollback)
- [Free-tier notes](#free-tier-notes)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- **Node.js 20+** and npm.
- A **Firebase project** (free Spark plan is fine). This repo's default project is
  `brilliant-alpha-clone-54be9` (`.firebaserc`); swap in your own as needed.
- **Firebase CLI** — used via `npx -y firebase-tools@latest` (no global install required), and a
  `firebase login`.
- *(Only for the AI proxy)* a free **Cloudflare account**, an **OpenAI API key**, and
  **Wrangler** (used via `npx wrangler`).

## What gets deployed

| Component | Where | How |
|-----------|-------|-----|
| Web app (SPA) | Firebase Hosting (`web/dist`) | `firebase deploy --only hosting` |
| Firestore security rules | Cloud Firestore | `firebase deploy --only firestore:rules` |
| OpenAI proxy *(optional)* | Cloudflare Worker `suited-ai-proxy` | `wrangler deploy` |

Hosting and rules can be deployed together: `firebase deploy --only hosting,firestore:rules`.

## 1. Configure the web app

From `web/`, create your local env file and fill in the Firebase **Web app** config (Firebase
Console → Project settings → Your apps → Web):

```bash
cd web
npm install
cp .env.example .env.local
# edit web/.env.local — set the VITE_FIREBASE_* values
```

Minimum required keys (see the [README env table](../README.md#environment-variables) for the
full list):

```bash
# web/.env.local
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Verify it builds before deploying — the build also runs the type-checker:

```bash
npm run build          # tsc -b && vite build  → web/dist
npx vitest run         # optional: unit tests
```

## 2. Deploy Firebase Hosting + Firestore rules

Run from the **repository root** (where `firebase.json` and `firestore.rules` live):

```bash
# Build the SPA first
cd web && npm run build && cd ..

# Log in (one-time) and deploy hosting + rules together
npx -y firebase-tools@latest login
npx -y firebase-tools@latest deploy --only hosting,firestore:rules
```

What this does:

- **Hosting** publishes `web/dist` with the SPA rewrite and cache headers from `firebase.json`.
- **Firestore rules** publishes `firestore.rules`. Editing the rules file has **no effect** until
  this runs — deploy after any rules change, then confirm username login still works and a `list`
  on the `usernames` collection is denied (see [security-fixes.md](security-fixes.md)).

To deploy them separately:

```bash
npx -y firebase-tools@latest deploy --only hosting
npx -y firebase-tools@latest deploy --only firestore:rules
```

> `firestore.indexes.json` is currently empty (no composite indexes needed); deploying
> `firestore:rules` is sufficient for the data model.

## 3. Configure Firebase Authentication

The committed auth config is **localhost-only**, so Google/email sign-in will fail from a
production domain until you add it. In the Firebase Console:

1. **Authentication → Settings → Authorized domains → Add domain** — add your production
   domain(s) (e.g. `your-project-id.web.app`, `your-project-id.firebaseapp.com`, and any custom
   domain). The Firebase CLI does **not** add authorized domains automatically.
2. **Google provider** — add the same origin(s) to the OAuth 2.0 **Web client** redirect URIs
   (Google Cloud Console → APIs & Services → Credentials), then redeploy auth config:

   ```bash
   npx -y firebase-tools@latest deploy --only auth
   ```

A helper script can add authorized domains from the repo root (requires `firebase login`):

```bash
node scripts/add-auth-domains.mjs
```

See [`web/README.md`](../web/README.md) for the local-dev Google-sign-in walkthrough.

## 4. Deploy the AI Worker (optional)

Only needed for the **secure OpenAI path** (`openai-proxy`). Skip this entirely to run on Gemini
(Firebase AI Logic) or the rule-based fallback. From `worker/`:

```bash
cd worker
npm install

# 1) Authenticate Wrangler with your Cloudflare account (opens a browser).
npx wrangler login

# 2) Store the OpenAI key as a Worker SECRET (never put it in any file).
npx wrangler secret put OPENAI_API_KEY
#    paste your sk-... key when prompted (placeholder shown — use your real key here)

# 3) Deploy. Note the printed Worker URL.
npx wrangler deploy
#    e.g. https://suited-ai-proxy.<your-subdomain>.workers.dev
```

Notes:

- The Worker (`suited-ai-proxy`, see `wrangler.toml`) uses only standard `fetch` + Web Crypto.
  It declares two bindings — the `OPENAI_API_KEY` **secret** and a **Durable Object**
  (`RATE_LIMITER`, the `RateLimiterDO` class) used for per-uid rate limiting. The Durable Object is
  **SQLite-backed** (the only free-tier storage backend) and is **created automatically** on
  `wrangler deploy` by the `[[migrations]]` entry in `wrangler.toml` — there is **no namespace to
  create** and nothing to paste back into config. No KV, D1, or other resources are needed.
- **Cost & abuse controls ship with the deploy** (they are code/config, not account setup): a
  server-side **model allow-list** (`ALLOWED_MODELS` in `src/openai.ts`, default `gpt-4o-mini` —
  any other model is rejected with `400`), **per-uid rate limits** (a per-minute burst guard,
  default `30`, plus a daily cap, default `400`, in `src/rateLimit.ts`; over-limit requests get a
  `429` with `Retry-After`), and **tight input/output caps** (`MAX_MESSAGES` `12`,
  `MAX_CONTENT_CHARS` `8,000`, `MAX_OUTPUT_TOKENS` `2,048`). To change any of these, edit the
  source / `wrangler.toml` and redeploy. See [`worker/README.md`](../worker/README.md) for details.
- `OPENAI_API_KEY` is a deploy-time secret. To rotate it, run `npx wrangler secret put
  OPENAI_API_KEY` again; to inspect or remove, use `npx wrangler secret list` /
  `npx wrangler secret delete OPENAI_API_KEY`.
- **CORS / project id:** the Worker only answers browser requests from the origins in
  `ALLOWED_ORIGINS`, and only accepts Firebase ID tokens for the project id in `PROJECT_ID`
  (both in `worker/src/index.ts`). Update them if you deploy under a different domain or Firebase
  project, then redeploy.
- **Local dev:** create `worker/.dev.vars` (gitignored) with `OPENAI_API_KEY=sk-...` and run
  `npm run dev` (Wrangler dev). `npm run dry-run` builds without deploying.

Confirm it's live:

```bash
curl https://suited-ai-proxy.<your-subdomain>.workers.dev/health
# → {"status":"ok","service":"suited-ai-proxy"}
```

## 5. Wire the client to the Worker

Point the web app at the deployed Worker, then rebuild and redeploy hosting:

```bash
# web/.env.local — use YOUR deployed Worker URL
VITE_LLM_PROVIDER=openai-proxy
VITE_AI_PROXY_URL=https://suited-ai-proxy.<your-subdomain>.workers.dev
# optional model override (the Worker defaults to gpt-4o-mini):
# VITE_OPENAI_MODEL=gpt-4o-mini
```

```bash
cd web && npm run build && cd ..
npx -y firebase-tools@latest deploy --only hosting
```

The client appends `/chat` to `VITE_AI_PROXY_URL` automatically (the base URL or a full `.../chat`
URL both work). With either flag unset, the app keeps its default behavior (Gemini → rule-based).
If the proxy is unreachable or the user isn't signed in, AI calls **soft-fail** to the rule-based
fallback rather than erroring.

## Verifying a deploy

- **Hosting** — load the site, sign in, and play a lesson. With a real account, confirm in the
  Firestore console that completing a lesson + passing its skill check (≥ 2/3) bumps
  `users/{uid}.totalXp`/`level` once and sets `lessonProgress/{lessonId}.xpAwarded = true`, and
  that re-passing does not re-award XP.
- **Rules** — confirm username login still works and a `list` on `usernames` is denied.
- **Worker** — hit `/health` (above). Then, signed in, open a Room 2 table; with
  `openai-proxy` configured the LLM opponents/coach use the model, and with it off they fall back
  cleanly. The Worker returns `401` for missing/invalid Firebase ID tokens, `400` for an off-list
  `model`, and `429` once a uid exceeds its per-minute or daily rate limit (the client soft-fails
  to rule-based on any non-2xx).

## Rollback

- **Hosting** — Firebase keeps prior releases: **Hosting → Release history → Rollback** in the
  console, or redeploy a previous build.
- **Firestore rules** — re-deploy the previous `firestore.rules` from git history with
  `firebase deploy --only firestore:rules`.
- **Worker** — `npx wrangler rollback` (or redeploy a previous commit). Rotating/removing the
  `OPENAI_API_KEY` secret takes effect on the next request; the client soft-fails to rule-based
  if the proxy stops working.

## Free-tier notes

- **No Firebase Blaze plan.** The app deliberately avoids Cloud Functions (which require Blaze)
  for the OpenAI proxy and uses a **Cloudflare Worker** on the free plan instead. Firebase stays
  on the free **Spark** plan (Auth + Firestore + Hosting).
- **AI is opt-in.** With no provider configured, every AI feature uses deterministic rule-based
  logic — so a zero-cost deploy is fully functional. Add Gemini (Firebase AI Logic) or the Worker
  proxy only when you want live model output.
- **Keep the key server-side.** Prefer the `openai-proxy` Worker over the browser-side `openai`
  provider for production, so the OpenAI key is never shipped in the client bundle.
- **Bounded AI cost.** The Worker's server-side model allow-list and per-uid rate limits (see
  [step 4](#4-deploy-the-ai-worker-optional) and [`worker/README.md`](../worker/README.md)) cap how
  much any one account can spend. The rate-limiter's Durable Object is SQLite-backed, so it stays
  on the free Workers plan with nothing to provision.
- **Optional App Check.** Set `VITE_RECAPTCHA_SITE_KEY` to enable Firebase App Check (reCAPTCHA
  Enterprise); it's wrapped in try/catch so a missing key never breaks startup.

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| Blank screen, console warns "Firebase config incomplete" | Missing `VITE_FIREBASE_*` in `web/.env.local`; rebuild after fixing. |
| Google sign-in popup fails in prod | Production domain not in **Authorized domains** and/or OAuth redirect URIs; add them and `deploy --only auth`. |
| Username login fails after a rules change | Re-deploy `firestore:rules`; confirm `usernames` single-doc `get` is allowed and `list` denied. |
| AI features always use the rule-based fallback | Expected when no provider is configured. For the proxy, ensure the user is signed in, `VITE_LLM_PROVIDER=openai-proxy` and `VITE_AI_PROXY_URL` are set, and the app was **rebuilt** (Vite inlines env at build time). |
| Worker returns `401` | Missing/expired Firebase ID token, or a `PROJECT_ID` mismatch in `worker/src/index.ts`. |
| Worker returns `503` | `OPENAI_API_KEY` secret not set — run `npx wrangler secret put OPENAI_API_KEY`. |
| Worker returns `429` | Per-uid rate limit hit (per-minute burst or daily cap); the client soft-fails to rule-based. Tune `RATE_LIMITS` in `worker/src/rateLimit.ts` and redeploy. |
| Worker returns `400` "model is not supported" | The requested model isn't in `ALLOWED_MODELS` (`worker/src/openai.ts`); add it and redeploy, or use the default `gpt-4o-mini`. |
| Browser CORS error calling the Worker | The site's origin isn't in `ALLOWED_ORIGINS` in `worker/src/index.ts`; add it and redeploy the Worker. |
