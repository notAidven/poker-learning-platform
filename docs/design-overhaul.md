# Suited — Design Overhaul Spec

The contract for the design/animation overhaul. Goal: keep Suited's identity
(oxblood / felt-green / antique-brass, Inter + Fraunces, poker-chip + playing-card
motifs) and make it feel **deliberate, tactile, and casino-grade** — more polished,
more modern, more animated.

**Signature idea — "win the pot."** Every reward behaves like winning a hand: chips
are raked across the felt into your stack. One metaphor drives the XP celebration,
the level meter, the streak flame, and course-path progression — never generic confetti.

Stack: React 19 + Vite 8 + TS 6 + Tailwind v4 (CSS-first `@theme` in `web/src/index.css`).
Add **`motion`** (Framer Motion's modern package, `import { ... } from "motion/react"`)
for orchestrated sequences; keep CSS keyframes for ambient/simple motion.

Verify commands (run in `web/`): `npm run build` (tsc + vite), `npm run lint`, `npm test`.
Respect the existing `prefers-reduced-motion` kill-switch (`index.css` global block +
`usePrefersReducedMotion` hook) in ALL new motion.

---

## 1. Token contract (names are the cross-worker API — do not rename)

Add to the `@theme` block in `web/src/index.css`. Values below are starting points;
the foundation phase finalizes exact hexes against screenshots.

### Motion (new)
```
--ease-standard: cubic-bezier(0.2, 0, 0, 1);     /* general UI */
--ease-deal:     cubic-bezier(0.2, 0.82, 0.3, 1); /* card settle */
--ease-chip:     cubic-bezier(0.34, 1.4, 0.64, 1);/* springy chip pop */
--ease-rake:     cubic-bezier(0.22, 1, 0.36, 1);  /* chips gliding to stack */
--ease-exit:     cubic-bezier(0.4, 0, 1, 1);
--dur-quick: 150ms;  --dur-base: 250ms;  --dur-deal: 450ms;  --dur-celebrate: 900ms;
```
Mirror easings/durations as JS consts in a new `web/src/lib/motion.ts` for `motion/react`
(`EASE.deal = [0.2,0.82,0.3,1]`, `DUR.base = 0.25`, etc.). Replace inline `cubic-bezier()`
re-types with these tokens.

### Elevation (Tailwind `shadow-*` utilities) — keep the 3 existing, add:
```
--shadow-card  (exists)  --shadow-lift (exists)  --shadow-token (exists)
--shadow-pop:   raised/hover interactive surfaces
--shadow-modal: overlays / dialogs
```

### Radius (Tailwind `rounded-*` utilities)
```
--radius-control: 0.75rem;  --radius-card: 1rem;  --radius-panel: 1.5rem;  (pill = full)
```
Migrate the `lg/xl/2xl/3xl/[2rem]/[1.75rem]` sprawl onto these three + pill.

### Palette gap-fill (keep all existing brand/night/gold/surface/ink)
- `night-50…500` — light green-tinted ramp bridging ivory→`night-600 #205c3e`
  (so surfaces stop faking it with `night-900/[opacity]`).
- `gold-50, gold-100, gold-700, gold-800, gold-900` (existing 200–600).
- `brand-950`.

### Semantic state colors (the consistency fix — replace raw Tailwind/hex)
Four states MUST stay visually distinct (as `index.css:4-7` intends):
| State | Token family | Was (kill these) |
|---|---|---|
| selected / active | **brand** (oxblood) | `#2563eb`/`#1d4ed8` blue, `sky` |
| correct / success | **success-*** (refined felt-green, readable) | raw `emerald`/`#10b981` |
| reward / XP | **gold** (brass) | `amber` |
| wrong / danger | **danger-*** (warm clay-red, distinct from oxblood) | raw `rose`/`#f87171` |
Neutral grays: introduce on-brand neutrals or map `slate-*` → `ink`/`night` light shades.
The `~40` files using raw `slate/emerald/amber/sky/violet/rose` migrate to these.

---

## 2. Shared primitives (foundation builds; everyone consumes)

- **`<Modal>`** (`web/src/components/ui/Modal.tsx`): focus trap + backdrop + token'd
  spring entrance. Replaces the 4 copy-pasted modals (`LessonCompleteModal`,
  `ExitLessonModal`, `WhyExplanationModal`, `LessonPathModal`).
- **`<Stagger>` / `useStagger`**: entrance stagger primitive replacing inline `index*60ms` math.
- **`Button` loading state** + route the hand-rolled `bg-brand-600` buttons
  (`LessonPlayer`, `SkillCheckPlayer`, `BoardDealer`, `LessonPathModal`, `OutsOdds`)
  through `Button`/`buttonVariants`.
- **`StatToken`** gains a `value`-change **count-up + pulse** (driven by the existing
  `'gamification-updated'` window event) and an optional `celebrate` trigger.
- **`lib/motion.ts`** easing/duration consts (above).

---

## 3. The hero — XP & level-up celebration ("win the pot")

**Data plumbing:** `awardLessonCompletion()` already returns
`{ xpAwarded, baseXp, bonusXp, totalXp, level, streak, leveledUp }`
(`web/src/lib/gamificationFirestore.ts`). Today only `xpBreakdown` reaches the UI and
`leveledUp` is discarded. Thread the full `LessonCompletionAward` through
`applyLessonCompletion` / `saveSkillCheckResult` (`web/src/lib/lessonProgress.ts`) back
to `SkillCheckPlayer`.

**Reward component** (`web/src/components/gamification/RewardCelebration.tsx`), props:
`{ xpGained, base, bonus, fromXp, toXp, level, leveledUp, streak, streakIncreased }`.
Sequence (skill-check pass result block, `SkillCheckPlayer.tsx:123-164`):
1. `+XP` **counts up** (tabular-nums) while a small stack of **poker chips is raked**
   (uses `--ease-rake`) from the result card into the level meter.
2. The **level meter fills** as chips land; on `leveledUp` it overflows → flips to the
   next level with a **distinct, larger brass flourish + spade glint** (reserved for
   level-up only, so it stays special).
3. **Streak flame** in the header (`Layout.tsx:65-72`) pulses when `streakIncreased`.
4. Back on Home/Profile, stat chips **count up + pulse** on arrival.
Sound is **off by default**. Fully reduced-motion-safe (skip rake/burst, show final values).

---

## 4. Motion system & per-screen polish

- **Lesson/skill-check step transitions**: slide-fade between keyed steps (currently
  hard-swap); progress-bar advance pulse. Answer micro-feedback: check-draw on correct,
  gentle shake on wrong (`ProblemStepView`, `CheckPanel`).
- **Course path** (`CoursePath.tsx`): connecting-line **draw** (animate `stroke-dashoffset`)
  + staggered node reveal + chip-fill "flip" when a lesson completes.
- **Home**: count-up stats, breathing "Up next" emphasis, token'd completion chips.
- **Table**: chips slide bet→pot and pot→winner; 3D villain card flip at showdown.
- **Profile / Auth**: staggered entrances, login mode-switch crossfade, button spinners,
  token'd text.
- **Cleanup**: delete the ~420 lines of dead CSS in `index.css` (coin/dice/grid/
  prob-slider/`scene-3d`/`chip-3d--active`/`gold-rule`) — verify zero `.tsx` consumers first.

---

## 5. Build phases

1. **Foundation** (one worker): tokens (§1), `lib/motion.ts`, palette gap-fill + semantic
   colors in `index.css`, dead-CSS deletion, `<Modal>`, `<Stagger>`, `Button` loading,
   animated `StatToken`, install `motion`. Land green (build/lint/test) + commit.
2. **Parallel** (after foundation commits): (a) XP celebration + gamification surfaces,
   (b) core learning flow (course path + lesson + skill-check transitions/feedback),
   (c) shell + home + table + auth + profile polish. Each owns its own files; prefer the
   motion lib / component-scoped styles over editing `index.css` to avoid conflicts.
