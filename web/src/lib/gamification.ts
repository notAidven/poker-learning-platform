/** Base XP on first full lesson completion (lesson + skill check). */
export const XP_BASE_LESSON = 100

/** Max bonus XP when every lesson problem is solved on the first submit. */
export const XP_MAX_BONUS = 50

/** Each extra submit beyond the first per problem reduces bonus by this amount. */
export const XP_BONUS_PENALTY_PER_EXTRA_ATTEMPT = 10

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

export function notifyGamificationUpdated() {
  window.dispatchEvent(new Event('gamification-updated'))
}
