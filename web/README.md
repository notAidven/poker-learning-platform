# Suited (web app)

The React + Vite + TypeScript frontend for **Suited**, a learn-by-doing Texas Hold'em
poker course with a play-money Casino Floor and an opt-in AI coach and AI opponents that
always fall back to deterministic, rule-based logic when no model is configured.

> This file used to carry its own setup notes that have since gone out of date. The
> authoritative documentation now lives at the repository root.

## Where the docs live

- [`../README.md`](../README.md) - product overview, features, tech stack, full setup,
  environment variables, build and test commands, deployment, and the docs index.
- [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) - architecture deep dive: the
  lesson and skill-check content model, the poker engine, the casino runtime, the AI
  layer, and the Firebase data model and security rules (including the progress schema).
- [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) - the step-by-step deployment runbook
  (Firebase Hosting and rules, plus the optional Cloudflare Worker AI proxy).

## Quick start

```bash
cd web
npm install
cp .env.example .env.local   # then add your Firebase web app config
npm run dev
```

With no AI provider configured, every AI feature uses the built-in rule-based fallback,
so the app is fully functional out of the box.

## Build and test

```bash
npm run build                       # type-check (tsc -b) then bundle to web/dist
npx vitest run                      # unit tests
node scripts/mvp-logic-check.mjs    # auth-free logic checks
```

See [`../README.md`](../README.md) for the complete guide, including Google sign-in
setup for local development and the secure OpenAI Worker proxy.
