# Brilliant_PRD.md (superseded)

> This file is kept only as a redirect. Its original contents described an earlier,
> pre-pivot product (a "Probability and Random Variables" course with six lessons and
> no AI) that no longer reflects what this repository builds.

## What this project is now

This repository is **Suited**, a learn-by-doing **Texas Hold'em poker** course: nine
interactive lessons across three sections (Foundations, Playing a Hand, and The Math),
followed by a two-room, play-money **Casino Floor**. The AI coach and AI opponents are
opt-in, and every AI feature falls back to deterministic, rule-based logic when no model
is configured.

## Where the current spec lives

- [`README.md`](README.md) - product overview, features, tech stack, setup, and the full
  documentation index.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - the lesson and skill-check content
  model, the poker engine, the casino runtime, the AI layer, and the Firebase data model
  and security rules.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) - the deployment runbook (Firebase Hosting
  and rules, plus the optional Cloudflare Worker AI proxy).

Please treat those documents as the source of truth; the earlier probability-app spec has
been removed to avoid confusion.
