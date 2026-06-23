# MVP Performance Results (Phase 1)

Audit date: 2026-06-23  
Scope: `web/` SPA — lesson player, interactions, Firestore sync  
Build: `npm run build` ✅ passes

## Summary

| # | Target | Result | Notes |
|---|--------|--------|-------|
| 1 | Answer feedback &lt; 100ms | **PASS** | Synchronous React state updates; no feedback-path `setTimeout` |
| 2 | Interactive visuals @ 60 FPS | **PASS** | Animations use `transform`; layout-triggering width animation fixed |
| 3 | Lesson load &lt; 2s to first interaction | **PASS** | Code-split routes, lesson data, and interactions; main bundle −37% gzip |
| 4 | Mobile / touch | **PARTIAL** | Viewport OK; primary controls ≥44px; decorative xs dice + text links smaller |
| 5 | Multiple concurrent learners | **PASS** (documented) | Per-client SPA; debounced Firestore writes; no blocking sync loops |

---

## Target 1 — Instant answer feedback (&lt; 100ms)

### Audit

- Grep for `setTimeout` in feedback path: **none** tied to Check → correct/incorrect UI.
- `CheckPanel` is presentational only; validation runs in interaction `handleSubmit` handlers.
- `ProblemStepView` calls `setShowIncorrect(true)` / `setSolved(true)` synchronously in `handleIncorrect` / `handleCorrect` (no timers, no `requestAnimationFrame` deferral).
- `SkillCheckStepView` sets `result` state immediately on submit.

### Existing animation timers (not feedback)

| File | Delay | Purpose |
|------|-------|---------|
| `CoinFlipLab.tsx` | 520ms | Coin flip animation end |
| `SampleSpacePicker.tsx` | 520ms | Coin flip animation end |
| `CoinFlipProbability.tsx` | 400–500ms | Trial animation |
| `BirthdaySimulation.tsx` | — | Simulation pacing |
| `progressSync.ts` | 400ms | Firestore session write debounce (background) |

These do **not** gate correct/incorrect UI after “Check answer”.

### Result: **PASS**

Feedback is rendered in the same React commit as submit. Expected latency is frame budget only (~16ms at 60 FPS), well under 100ms.

---

## Target 2 — Smooth interactive visuals (60 FPS)

### Audit

**CSS widgets reviewed:** `.coin-3d`, `.die-3d`, `.grid-cell-3d`, `.prob-bar-3d`

| Pattern | Before | After |
|---------|--------|-------|
| Coin/die spin | `@keyframes` on `transform` | ✅ unchanged; added `will-change: transform` on animated classes |
| Grid/die chip selection | `transform` + `box-shadow` transitions | ✅ compositor-friendly transforms |
| Fairness probability bars | `width` transition (layout) | ✅ **`transform: scaleX()`** — no layout thrashing |
| Hover on 3D controls | Always-on `:hover` | ✅ **`@media (hover: hover) and (pointer: fine)`** — avoids sticky hover on touch |

`prefers-reduced-motion: reduce` already short-circuits animations globally.

### Result: **PASS**

No artificial frame drops from layout-affecting bar animation. Touch devices no longer get hover-only visual states blocking interaction clarity.

---

## Target 3 — Fast lesson load (&lt; 2s to first interaction)

### Before (single bundle)

| Asset | Size | Gzip |
|-------|------|------|
| `index-*.js` | 1,415 KB | 420 KB |
| `index-*.css` | 73 KB | 17 KB |

All 6 lessons + all interactions loaded on first app paint.

### After (code splitting)

| Asset | Size | Gzip | When loaded |
|-------|------|------|-------------|
| `index-*.js` (shell + Firebase + KaTeX + auth) | 881 KB | 266 KB | Initial |
| `LessonPage-*.js` | 16 KB | 4.6 KB | Route `/lesson/:id` |
| `lesson-N-*.js` (per lesson) | 7–12 KB | 2.5–4.1 KB | `loadLesson(id)` |
| Interaction chunks | 0.7–4 KB each | 0.4–1.8 KB | Active step only |

**Main JS gzip reduced ~37%** (420 → 266 KB). Lesson route fetches only one lesson file + one interaction at a time.

### Changes applied

- Lazy routes: `CoursePage`, `LessonPage`, `SkillCheckPage` (`App.tsx`)
- Dynamic `import()` per lesson (`lessonContent.ts`) and skill check (`skillCheckContent.ts`)
- Lazy interaction components (`InteractionRenderer.tsx`)

### Estimated time to first interaction

On a typical 4G connection (~10 Mbps), extra lesson payload ≈ 30–50 KB gzip → **&lt; 500ms** network + parse, plus shell already cached after first visit. Well under **2s** target.

### Result: **PASS**

---

## Target 4 — Mobile / touch

### Verified

- ✅ `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` in `index.html`
- ✅ Primary actions use `min-h-11` (44px): `CheckPanel`, `LessonPlayer` Back/Continue
- ✅ Grid cells `.grid-cell-3d` min 3.25rem (52px) touch targets
- ✅ No hover-only **required** interactions (hover is cosmetic; gated behind `hover: hover`)
- ✅ Coin/die `:active` states work without hover

### Gaps (PARTIAL)

- Table header `DieFace size="xs"` (~18px) is decorative inside larger cell buttons — acceptable
- Text links (“Why?”, “Get hint”, course back link) rely on text padding &lt; 44px height
- Some secondary chips still `py-2` without `min-h-11` (only `CountingProduct` updated as representative fix)

### Result: **PARTIAL**

Core lesson flow is touch-usable; secondary text controls could be enlarged in a follow-up.

---

## Target 5 — Multiple concurrent learners

### Architecture note

This is a **client-side SPA** with **Firestore** persistence. Performance is **per browser tab/device**:

- Each learner runs their own JS heap and render loop.
- Server-side concurrency does not share one lesson player instance.
- Firestore scales writes independently; app does not poll in a tight loop.

### Verified in code

| Concern | Status |
|---------|--------|
| Blocking sync loops | None in lesson player |
| Session Firestore writes | Debounced **400ms** (`progressSync.ts` `SESSION_DEBOUNCE_MS`) |
| Stats writes | Fire-and-forget `void writeLessonProgress(...)` |
| Lesson player memory | `useEffect` cleanups on route change; no global interval listeners in player |
| Progress sync on auth | Single async fetch; not re-run per step |

### Result: **PASS** (with documentation)

No code changes required beyond confirming existing debounce pattern.

---

## Optimizations applied

1. **Code splitting** — lazy routes, per-lesson dynamic imports, lazy interaction components
2. **CSS** — `prob-bar-3d` uses `scaleX` instead of `width`; `will-change: transform` on flip/roll; hover gated for fine pointers
3. **Touch targets** — `min-h-11` on CheckPanel and LessonPlayer navigation buttons
4. **XP path** — store `pendingProblemStepIds` at lesson finish so skill-check XP calc does not require eager lesson content load

---

## Files changed

- `web/src/App.tsx` — lazy routes
- `web/src/data/lessonContent.ts` — dynamic lesson loaders + cache
- `web/src/data/skillCheckContent.ts` — dynamic skill-check loaders + cache
- `web/src/pages/LessonPage.tsx`, `SkillCheckPage.tsx` — async content load
- `web/src/components/lesson/InteractionRenderer.tsx` — lazy interactions
- `web/src/components/lesson/LessonPlayer.tsx` — touch targets + `problemStepIds` on finish
- `web/src/components/lesson/interactions/CheckPanel.tsx`, `CountingProduct.tsx`, `FairnessScale.tsx`
- `web/src/lib/lessonProgress.ts`, `lessonProgressStore.ts`, `lessonProgressFirestore.ts`
- `web/src/index.css` — animation / hover performance
- `web/src/components/LessonPathModal.tsx` — remove sync `getLesson` dependency

---

## Recommendations (out of scope for MVP)

- Lazy-load KaTeX CSS/fonts on first math render (large share of initial CSS)
- Add `min-h-11` to all lesson chip/select buttons via shared utility class
- Split Firebase into a secondary chunk loaded after auth shell if cold-start still heavy on slow 3G
