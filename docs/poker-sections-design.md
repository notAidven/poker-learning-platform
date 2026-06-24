# Design Doc: Sectioned Learning Path + Expanded Math Track

**Status:** Implemented on branch `poker-sections` (forked from `poker-revamp`). Behind-the-scenes only — not deployed.
**Scope:** Reorganize the existing 5-lesson "Suited" path into **3 visually-distinct sections**, **expand the technical-theory track into 4 dedicated Math lessons** (8 lessons total), and give the Duolingo-style vertical path a per-section visual treatment (section banner, tinted nodes, soft background band).
**Non-goals:** No new interactions, no AI/opponent-AI, no real-money framing. Reuses the existing lesson engine, skill-check flow, gamification, and the `outs-odds` / `betting-round` / `card-deck` / `compare-events` widgets unchanged.

> The poker math in this doc is sourced from `docs/poker-research/03-poker-math.md` and `docs/poker-course-design.md` §3 (the verified source of truth): flush draw = 9 outs, OESD = 8, gutshot = 4; Rule of 4 (flop) / 2 (turn); required equity = `call / (pot + call)`; `EV = p·won − (1−p)·call`.

---

## 1. The three sections

| # | Section | id | Tint (theme token) | Lessons |
| --- | --- | --- | --- | --- |
| 1 | **Foundations** | `foundations` | felt-green (`emerald-*`) | L1 Poker & the Deck, L2 Hand Rankings |
| 2 | **Playing a Hand** | `playing` | oxblood / red (`brand-*`) | L3 Flow of a Hand, L4 Betting Basics |
| 3 | **The Math** | `math` | brass / gold (`gold-*`) | L5 Outs & Equity, L6 Pot Odds, L7 Expected Value, L8 Bet Sizing & Value Betting |

Section colors map onto the existing theme tokens defined in `web/src/index.css` `@theme` (no new palette invented):
- **felt-green** → Tailwind default `emerald-*` (the light, legible green; `night-*` is reserved for the dark felt surfaces).
- **oxblood** → the custom `brand-*` scale (`#9b2c44` etc.).
- **brass/gold** → the custom `gold-*` scale (`#bb8f3c` etc.), with light bands at low opacity (`gold-200/25`) since `gold-50/100` are not defined.

The concrete per-section class strings live in `CoursePath.tsx`'s `SECTION_THEME` map (Tailwind needs literal class names), while `data/lessons.ts` carries a lightweight `accent` token name per section for documentation.

---

## 2. The eight lessons (scope + interactions)

| L | Title | Section | One-line scope | Interactions |
| --- | --- | --- | --- | --- |
| 1 | Poker & the Deck | Foundations | 52-card deck, hole + community, best 5 of 7 (**unchanged**) | `card-deck`, `board-dealer`, `hand-ranker` |
| 2 | Hand Rankings | Foundations | the 10 categories, rarer = stronger, kickers (**unchanged**) | `hand-ranking-ladder`, `hand-ranker`, `compare-events` |
| 3 | Flow of a Hand | Playing a Hand | blinds, button, the four streets, position, showdown (**unchanged**) | `board-dealer`, `compare-events` |
| 4 | **Betting Basics** | Playing a Hand | the five actions (check/bet/call/raise/fold), opening/closing a round, sizing to the board — **EV math removed** (moved to L7) | `betting-round` |
| 5 | **Outs & Equity** | The Math | count outs (flush 9 / OESD 8 / gutshot 4), Rule of 2 & 4, outs → equity % | `outs-odds` (outs + equity asks) |
| 6 | **Pot Odds** | The Math | required equity = call/(pot+call), bigger bet = worse price, compare equity → call/fold | `outs-odds` (potOdds + decision asks) |
| 7 | **Expected Value (EV)** | The Math | EV of a call (`p·won − (1−p)·call`), EV ↔ pot odds, intro to **fold equity** | `betting-round` (ev-of-call + choose-action) |
| 8 | **Bet Sizing & Value Betting** | The Math | value vs bluff, thin value, sizing small/half/large to the board | `betting-round` (choose-action + choose-size) |

Each lesson keeps the house style: one idea per concept step, no two concepts in a row, ~75%+ interactive, every new term defined before use (bold terms auto-link to the existing `glossary.ts` popover), and prompts never reveal the answer.

Each lesson ships a matching **3-question skill check** (no hints / no "Why?", pass = ≥ 2/3), reusing the same widgets:
- **SC4 Betting Basics:** raise a monster facing a bet · size a half-pot bet · fold air to a big bet.
- **SC5 Outs & Equity:** count flush outs (9) · OESD → equity on the flop (Rule of 4) · flush draw → equity on the turn (Rule of 2).
- **SC6 Pot Odds:** required equity for a quarter-pot bet · a +EV call (equity > price) · a fold (equity < price).
- **SC7 EV:** EV of a call (positive) · EV of a call (negative) · a fold-equity semibluff (bet).
- **SC8 Bet Sizing:** size a half-pot bet · size up on a wet board · value-bet a strong hand.

---

## 3. Id remap (clean swap — no migration code)

Old lesson-4 ("Outs, Odds & Pot Odds") splits into the new L5 + L6, and old lesson-5 ("Betting") becomes the new L4 with its EV beats relocated to L7. Content is re-homed across ids; exported names always match the loader (`lesson-6.ts` exports `lesson6`, etc.).

| New id | New title | Section | Source of content |
| --- | --- | --- | --- |
| 1 | Poker & the Deck | Foundations | old lesson-1 (**unchanged**) |
| 2 | Hand Rankings | Foundations | old lesson-2 (**unchanged**) |
| 3 | Flow of a Hand | Playing a Hand | old lesson-3 (**unchanged**) |
| 4 | Betting Basics | Playing a Hand | old **lesson-5** "Betting" — actions + sizing kept, EV concept/problems removed |
| 5 | Outs & Equity | The Math | old **lesson-4** — outs + Rule of 2 & 4 + outs→equity half |
| 6 | Pot Odds | The Math | old **lesson-4** — pot-odds + call/fold-decision half |
| 7 | Expected Value (EV) | The Math | **new** (seeded by old lesson-5's EV-of-a-call beats) |
| 8 | Bet Sizing & Value Betting | The Math | **new** |

**Progress-data note:** lesson progress / XP / streaks are keyed by lesson id. Because this is a new, undeployed structure, the id remap is a clean break — a learner who previously "completed lesson 4 (Outs/Odds)" would now read as "completed lesson 4 (Betting Basics)". No migration code is added (out of scope; fresh structure). Flagged here for the reviewer.

---

## 4. Path visual treatment (`CoursePath.tsx`)

- **Data model:** `LessonMeta` gains `section: SectionId`; a `sections: SectionMeta[]` array defines `{ id, title, subtitle, accent }`. The existing `unit` / `primaryInteraction` fields are kept (HomePage cards still use them) with refreshed values.
- **Section header / banner:** before the first node of each section, a centered banner shows an eyebrow (`Section N`), the section title, and a one-line subtitle, tinted with the section accent.
- **Soft background band:** each section's rows sit on a rounded, low-opacity tinted band (`emerald-50/60`, `brand-50/50`, `gold-200/25`) so the three zones read at a glance.
- **Tinted nodes:** nodes are tinted per section while **status affordances are preserved** — completed = check icon, current = number/star + pulse + Start/Up-next badge, locked = lock icon. Tints: Foundations emerald, Playing brand/oxblood, Math gold/brass.
- **Generalized zigzag:** the fixed 6-entry `PATH_DIRECTIONS` array is replaced by a derivation that works for any N — the first node is centered, then rows alternate right/left. The connectors, nodes, and side labels still share the one measured pixel coordinate system (the previously-fixed mobile-alignment invariant is preserved). Connectors are drawn **only between same-section nodes**; section boundaries break the path so the banner provides a clean divider.

---

## 5. Files touched

**New content:** `lessons/lesson-6.ts`, `lesson-7.ts`, `lesson-8.ts`; `skillChecks/skill-check-6.ts`, `skill-check-7.ts`, `skill-check-8.ts`; this doc.
**Rewritten content:** `lessons/lesson-4.ts` (→ Betting Basics), `lesson-5.ts` (→ Outs & Equity); `skillChecks/skill-check-4.ts`, `skill-check-5.ts`.
**Wiring / data:** `data/lessons.ts` (sections + meta), `data/lessonContent.ts` + `data/skillCheckContent.ts` (register ids 6–8), `data/course.ts` (branding "8 lessons"), `components/CoursePath.tsx`, `components/LessonPathModal.tsx`, `components/ui/AuthLayout.tsx` (copy), `scripts/mvp-logic-check.mjs` (assertions).
**Unchanged:** the lesson/skill-check engine, all interaction widgets, the hand evaluator, gamification/progress, routing, auth.
