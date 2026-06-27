/** Base XP on first full lesson completion (lesson + skill check). */
export const XP_BASE_LESSON = 100

/** Max bonus XP when every lesson problem is solved on the first submit. */
export const XP_MAX_BONUS = 50

/** Each extra submit beyond the first per problem reduces bonus by this amount. */
export const XP_BONUS_PENALTY_PER_EXTRA_ATTEMPT = 10

// ---------------------------------------------------------------------------
// Section gates + test-out + replay XP (Section Gates feature).
//
// The XP story, smallest → largest, so the reward always tracks the effort:
//   • Replay (re-doing a completed lesson / re-taking a passed gate): a tiny,
//     decaying-but-floored amount — practice is rewarded, farming is not.
//   • Test-out (skipping a section's lessons by passing its gate cold): a
//     reduced flat amount PER lesson skipped — far less than actually doing them.
//   • Doing the lessons: full per-lesson XP (100 + up to 50), unchanged, PLUS a
//     one-time mastery bonus for passing the section gate (`XP_GATE_PASS`).
// First-completion XP is still granted exactly once (see the backend's
// `xpAwarded`/`completed` idempotency guard); replay XP is a separate, additive
// reward that never re-grants the first-completion amount.
// ---------------------------------------------------------------------------

/** One-time mastery bonus for passing a section gate after doing the lessons. */
export const XP_GATE_PASS = 75

/** Reduced XP granted per lesson skipped when a section is cleared via test-out. */
export const XP_TESTOUT_PER_LESSON = 20

/** First replay's XP (the largest replay award); each further replay decays from here. */
export const XP_REPLAY_BASE = 20

/** Replays never drop below this floor (so any practice is still worth a little). */
export const XP_REPLAY_MIN = 5

/** Each successive replay multiplies the award by this factor (diminishing returns). */
export const XP_REPLAY_DECAY = 0.5

/**
 * A section gate passes at ~70% (PM-tunable). Like skill checks, no hints; unlike
 * them the bar is a touch higher because a gate covers the whole section. With the
 * authored gate sizes this means: Foundations 3/4, Playing a Hand 5/6, The Math 6/8.
 */
export const GATE_PASS_RATIO = 0.7

/** True when a section-gate score clears the ~70% bar. */
export function isGatePassing(correct: number, total: number): boolean {
  if (total <= 0) return true
  // Small epsilon so an exact 70% (e.g. 7/10) reliably clears the threshold.
  return correct / total >= GATE_PASS_RATIO - 1e-9
}

/** Smallest integer correct-count that passes a gate of `total` questions (for UI copy). */
export function gatePassMark(total: number): number {
  for (let correct = 0; correct <= total; correct += 1) {
    if (isGatePassing(correct, total)) return correct
  }
  return total
}

/**
 * XP for clearing a section via test-out: a reduced flat amount for each lesson the
 * learner skipped, e.g. 2 skipped lessons → 40 XP. Deliberately far below the
 * 100–150 XP each of those lessons would have paid out, so test-out is a shortcut
 * with a real XP cost, not a free ride.
 */
export function computeTestOutXp(skippedLessonCount: number): number {
  return Math.max(0, Math.round(skippedLessonCount)) * XP_TESTOUT_PER_LESSON
}

/**
 * Replay XP for repeating an already-completed lesson or re-taking an already-passed
 * gate (previously always 0). `priorReplays` is the number of replays ALREADY
 * rewarded for this item (0 for the first replay):
 *
 *   award = max(XP_REPLAY_MIN, round(XP_REPLAY_BASE × XP_REPLAY_DECAY^priorReplays))
 *
 * So the sequence is 20, 10, 5, 5, 5, … — diminishing returns floored at 5. The
 * tiny, bounded amount (plus the once-per-day streak credit) rewards genuine
 * practice while making XP farming pointless.
 */
export function computeReplayXp(priorReplays: number): number {
  const decayed = Math.round(XP_REPLAY_BASE * Math.pow(XP_REPLAY_DECAY, Math.max(0, priorReplays)))
  return Math.max(XP_REPLAY_MIN, decayed)
}

export type LessonXpBreakdown = {
  base: number
  bonus: number
  total: number
}

/**
 * XP for first-time lesson completion:
 *
 *   baseXp  = 100
 *   extraAttempts = sum(problemAttempts) − problemCount
 *   bonusXp = max(0, 50 − extraAttempts × 10)
 *   totalXp = baseXp + bonusXp
 *
 * Example (5 problems): all first try → 150 XP; one problem took 3 tries → 130 XP.
 */
export function computeLessonXp(
  problemAttempts: Record<string, number>,
  problemStepIds: string[],
): LessonXpBreakdown {
  const base = XP_BASE_LESSON
  const problemCount = problemStepIds.length

  if (problemCount === 0) {
    return { base, bonus: XP_MAX_BONUS, total: base + XP_MAX_BONUS }
  }

  let totalAttempts = 0
  for (const id of problemStepIds) {
    const n = problemAttempts[id]
    totalAttempts += typeof n === 'number' && n > 0 ? n : 1
  }

  const extraAttempts = totalAttempts - problemCount
  const bonus = Math.max(
    0,
    XP_MAX_BONUS - extraAttempts * XP_BONUS_PENALTY_PER_EXTRA_ATTEMPT,
  )

  return { base, bonus, total: base + bonus }
}

/**
 * Skill-check pass policy (PM P1 #3 — product-tunable, documented in
 * `docs/qa-review.md`). A learner must answer at least 2 of 3 correctly to
 * pass: mark the lesson `completed`, award XP, and unlock the next lesson.
 * Below the threshold they keep their lesson body progress and may retake the
 * skill check freely.
 */
export const SKILL_CHECK_PASS_RATIO = 2 / 3

/** True when a skill-check score is a pass (≥ 2/3, e.g. 2 of 3 correct). */
export function isSkillCheckPassing(correct: number, total: number): boolean {
  if (total <= 0) return true
  // Small epsilon so 2/3 (0.6666…) reliably clears the 2/3 threshold.
  return correct / total >= SKILL_CHECK_PASS_RATIO - 1e-9
}

/** Fewest correct answers that pass a skill check of `total` questions (≥ 2/3). */
export function skillCheckMinToPass(total: number): number {
  if (total <= 0) return 0
  return Math.ceil(total * SKILL_CHECK_PASS_RATIO - 1e-9)
}

/** Calendar days use Central American Time (UTC−6, no DST). */
export const STREAK_TIMEZONE = 'America/Guatemala'

/** XP needed to advance from `level` to `level + 1`. PRD: 100 + (level − 1) × 25 */
export function xpToNextLevel(level: number): number {
  return 100 + (level - 1) * 25
}

export function levelFromTotalXp(totalXp: number): number {
  let level = 1
  let remaining = totalXp
  while (remaining >= xpToNextLevel(level)) {
    remaining -= xpToNextLevel(level)
    level += 1
  }
  return level
}

export function xpInCurrentLevel(totalXp: number, level: number): number {
  let spent = 0
  for (let l = 1; l < level; l += 1) {
    spent += xpToNextLevel(l)
  }
  return totalXp - spent
}

export type LevelProgress = {
  level: number
  totalXp: number
  xpInLevel: number
  xpToNext: number
  progressPercent: number
}

export function getLevelProgress(totalXp: number): LevelProgress {
  const level = levelFromTotalXp(totalXp)
  const xpInLevel = xpInCurrentLevel(totalXp, level)
  const xpToNext = xpToNextLevel(level)
  return {
    level,
    totalXp,
    xpInLevel,
    xpToNext,
    progressPercent: Math.min(100, Math.round((xpInLevel / xpToNext) * 100)),
  }
}

export function getCalendarDayCAT(date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: STREAK_TIMEZONE })
}

function daysBetween(fromDay: string, toDay: string): number {
  const from = new Date(`${fromDay}T12:00:00Z`).getTime()
  const to = new Date(`${toDay}T12:00:00Z`).getTime()
  return Math.round((to - from) / (24 * 60 * 60 * 1000))
}

function previousCalendarDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** Streak shown on dashboard — resets to 0 if the user missed a calendar day (CAT). */
export function getEffectiveStreak(
  storedStreak: number,
  lastActivityDate: string | null,
  today = getCalendarDayCAT(),
): number {
  if (!lastActivityDate || storedStreak <= 0) return 0
  const daysSince = daysBetween(lastActivityDate, today)
  if (daysSince <= 1) return storedStreak
  return 0
}

export type StreakUpdate = {
  streak: number
  lastActivityDate: string
}

/** Update streak after a qualifying lesson completion (once per CAT day). */
export function computeStreakAfterCompletion(
  storedStreak: number,
  lastActivityDate: string | null,
  today = getCalendarDayCAT(),
): StreakUpdate {
  if (lastActivityDate === today) {
    return { streak: storedStreak, lastActivityDate: today }
  }

  const yesterday = previousCalendarDay(today)
  if (lastActivityDate === yesterday) {
    return { streak: storedStreak + 1, lastActivityDate: today }
  }

  return { streak: 1, lastActivityDate: today }
}

/**
 * Whether THIS qualifying completion advances the displayed streak — i.e. it is the
 * first activity of the day, so the visible streak ticks up (a fresh day after a miss
 * counts as starting at 1). Drives the header flame pulse.
 */
export function didStreakIncrease(
  storedStreak: number,
  lastActivityDate: string | null,
  today = getCalendarDayCAT(),
): boolean {
  const before = getEffectiveStreak(storedStreak, lastActivityDate, today)
  const after = computeStreakAfterCompletion(storedStreak, lastActivityDate, today).streak
  return after > before
}

export type GamificationUpdateDetail = { streakIncreased?: boolean }

export function notifyGamificationUpdated(detail?: GamificationUpdateDetail) {
  window.dispatchEvent(new CustomEvent('gamification-updated', { detail }))
}
