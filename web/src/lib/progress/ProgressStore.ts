/**
 * The deep, instantiable module that owns the learner's lesson-progress aggregate.
 *
 * Reads are synchronous from an intrinsic, offline-first local cache (write-through
 * to localStorage, queued/debounced to the backend). It exposes `subscribe` +
 * `getSnapshot` so React can bind via `useSyncExternalStore`; same-tab updates come
 * from mutations, cross-tab updates from a `storage` listener the store installs.
 * The XP / level / streak counters live behind the backend seam because a completion
 * must write them atomically with the progress doc.
 *
 * Replaces the former split across `lessonProgress*`, `progressSync`, `lessonSession`,
 * and the module-level singletons, plus the bespoke window custom-event bus.
 */
import { computeLessonXp, computeTestOutXp, XP_GATE_PASS, type LessonXpBreakdown } from '../gamification'
import { gateId, sectionLessonIds } from '../sectionGates'
import type { SectionId } from '../../data/lessons'
import { sanitizeProblemAttempts, sanitizeStringArray } from './sanitize'
import { getCompletedIds } from './selectors'
import {
  defaultLessonStats,
  type LessonCompletionAward,
  type LessonProgressPayload,
  type LessonSession,
  type LessonStats,
  type ProgressBackend,
  type SkillCheckSaveResult,
} from './types'

const STATS_KEY = 'lesson-stats'
/** Denormalized completed list from the old design — removed on write, only cleaned up here. */
const LEGACY_COMPLETED_KEY = 'completed-lesson-ids'
const SESSION_PREFIX = 'lesson-session-'
const SESSION_DEBOUNCE_MS = 400

const sessionKey = (lessonId: string) => `${SESSION_PREFIX}${lessonId}`

export type ProgressSnapshot = {
  statsByLesson: Record<string, LessonStats>
  completedIds: string[]
}

export type ProgressStoreOptions = {
  backend: ProgressBackend
  /**
   * Wipes the OTHER per-user local state (casino table-clears + bankroll) during an
   * H1 reset. Injected so the progress store never reaches into those modules itself.
   */
  onLocalReset?: () => void
  /** Fallback uid for backend writes before/around an auth sync (e.g. `auth.currentUser`). */
  getFallbackUid?: () => string | null
}

export class ProgressStore {
  private readonly backend: ProgressBackend
  private readonly options: ProgressStoreOptions
  private statsByLesson: Record<string, LessonStats>
  private snapshot: ProgressSnapshot
  private readonly listeners = new Set<() => void>()
  private readonly sessionWriteTimers = new Map<string, ReturnType<typeof setTimeout>>()
  /** The synced uid; the single source for backend write gating (was the `syncUid` singleton). */
  private uid: string | null = null
  private storageAttached = false

  constructor(options: ProgressStoreOptions) {
    this.options = options
    this.backend = options.backend
    this.statsByLesson = this.readStatsFromStorage()
    this.snapshot = this.buildSnapshot()
  }

  // --- React binding -------------------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    if (this.listeners.size === 1) this.attachStorageListener()
    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0) this.detachStorageListener()
    }
  }

  getSnapshot = (): ProgressSnapshot => this.snapshot

  // --- synchronous reads ---------------------------------------------------

  getStats(lessonId: string): LessonStats {
    return this.statsByLesson[lessonId] ?? defaultLessonStats()
  }

  getCompletedIds(): string[] {
    return getCompletedIds(this.statsByLesson)
  }

  isLessonInProgress(lessonId: string, stepCount: number): boolean {
    const stats = this.getStats(lessonId)
    if (stats.completed) return false
    if (stats.lessonFinished) return true
    const session = this.loadSession(lessonId, stepCount)
    return session.stepIndex > 0 || session.solvedStepIds.length > 0
  }

  loadSession(lessonId: string, stepCount: number): LessonSession {
    try {
      const raw = localStorage.getItem(sessionKey(lessonId))
      if (!raw) return { stepIndex: 0, solvedStepIds: [] }
      const parsed = JSON.parse(raw) as LessonSession
      const stepIndex =
        typeof parsed.stepIndex === 'number' &&
        parsed.stepIndex >= 0 &&
        parsed.stepIndex < stepCount
          ? parsed.stepIndex
          : 0
      const solvedStepIds = sanitizeStringArray(parsed.solvedStepIds)
      const problemAttempts = sanitizeProblemAttempts(parsed.problemAttempts)
      return { stepIndex, solvedStepIds, problemAttempts }
    } catch {
      return { stepIndex: 0, solvedStepIds: [] }
    }
  }

  // --- stats mutations -----------------------------------------------------

  markLessonAttempted(lessonId: string): void {
    const current = this.statsByLesson[lessonId] ?? defaultLessonStats()
    if (current.attempted) return
    this.statsByLesson[lessonId] = { ...current, attempted: true }
    this.persistStats()
    this.writeStatsToBackend(lessonId, this.statsByLesson[lessonId])
    this.commit()
  }

  saveLessonFinished(
    lessonId: string,
    lessonAccuracy: number,
    problemAttempts: Record<string, number>,
    problemStepIds: string[],
  ): void {
    const current = this.statsByLesson[lessonId] ?? defaultLessonStats()
    this.statsByLesson[lessonId] = {
      ...current,
      attempted: true,
      lessonFinished: true,
      lessonAccuracy,
      pendingProblemAttempts: { ...problemAttempts },
      pendingProblemStepIds: [...problemStepIds],
    }
    this.persistStats()
    this.writeStatsToBackend(lessonId, this.statsByLesson[lessonId])
    this.commit()
  }

  saveSkillCheckResult(lessonId: string, correct: number, total: number): SkillCheckSaveResult {
    return this.applyLessonCompletion(lessonId, correct, total)
  }

  /**
   * Record a PASSING section-gate attempt. Gate state lives behind a synthetic
   * `gate-<sectionId>` progress doc, so passing it rides the same atomic completion +
   * idempotent-XP + replay path as a lesson:
   *  - First pass after doing the lessons → a one-time `XP_GATE_PASS` mastery bonus.
   *  - First pass via TEST-OUT (some section lessons still unfinished) → the skipped
   *    lessons are marked complete (so the lesson-based casino gates stay coherent) and
   *    a reduced `computeTestOutXp(skipped)` is awarded instead of the mastery bonus.
   *  - A re-pass of an already-passed gate → small, decaying replay XP (xpBreakdown null).
   * Failing attempts must NOT call this (the gate stays retryable, nothing unlocks).
   */
  saveGateResult(sectionId: SectionId, correct: number, total: number): SkillCheckSaveResult {
    const id = gateId(sectionId)
    const current = this.statsByLesson[id] ?? defaultLessonStats()
    const isFirstCompletion = !current.completed

    // Lessons in this section not yet completed BEFORE this pass — what a test-out skips.
    const completedIds = this.getCompletedIds()
    const pendingLessonIds = sectionLessonIds(sectionId).filter((lid) => !completedIds.includes(lid))
    const testedOut = isFirstCompletion ? pendingLessonIds.length > 0 : current.testedOut

    // Test-out: auto-complete the skipped lessons (no per-lesson XP) so every existing
    // lesson-based gate (areGuidedPlayLessonsComplete / isTableUnlocked / …) just works.
    if (isFirstCompletion && pendingLessonIds.length > 0) {
      for (const lessonId of pendingLessonIds) this.markLessonTestedOut(lessonId)
    }

    const gateXp = testedOut ? computeTestOutXp(pendingLessonIds.length) : XP_GATE_PASS
    const xpBreakdown: LessonXpBreakdown | null = isFirstCompletion
      ? { base: gateXp, bonus: 0, total: gateXp }
      : null

    const nextStats: LessonStats = {
      ...current,
      attempted: true,
      lessonFinished: true,
      completed: true,
      skillCheckCorrect: correct,
      skillCheckTotal: total,
      pendingProblemAttempts: null,
      testedOut,
      lastLessonXpBreakdown: xpBreakdown
        ? { base: xpBreakdown.base, bonus: xpBreakdown.bonus }
        : current.lastLessonXpBreakdown,
    }

    return this.runCompletion(id, nextStats, xpBreakdown, isFirstCompletion)
  }

  /**
   * Mark a single lesson complete via test-out: it counts for the lesson-based gates but
   * is flagged `testedOut` and intentionally earns NO per-lesson XP (the section's reduced
   * test-out XP is awarded once, on the gate doc). Persists `completed: true` so the
   * backend's idempotency guard never later grants this lesson its full first-completion XP.
   * A no-op when the lesson was already completed for real.
   */
  private markLessonTestedOut(lessonId: string): void {
    const current = this.statsByLesson[lessonId] ?? defaultLessonStats()
    if (current.completed) return
    const next: LessonStats = {
      ...current,
      attempted: true,
      lessonFinished: true,
      completed: true,
      testedOut: true,
    }
    this.statsByLesson[lessonId] = next
    this.persistStats()
    this.writeStatsToBackend(lessonId, next)
  }

  /**
   * Complete a lesson that has no skill check: finishing the body IS the full
   * completion, so mark completed and award XP directly. (All current lessons have
   * skill checks, so this is a guard for future content rather than a live path.)
   */
  completeLessonWithoutSkillCheck(lessonId: string): SkillCheckSaveResult {
    return this.applyLessonCompletion(lessonId, null, null)
  }

  /**
   * Shared completion path for a passed skill check and a no-skill-check lesson.
   * Updates local stats and, for signed-in users, hands off to the atomic backend
   * `completeLesson` which awards XP exactly once (idempotent via the persisted
   * `xpAwarded` flag) and advances the streak once per day for any qualifying pass.
   */
  private applyLessonCompletion(
    lessonId: string,
    skillCheckCorrect: number | null,
    skillCheckTotal: number | null,
  ): SkillCheckSaveResult {
    const current = this.statsByLesson[lessonId] ?? defaultLessonStats()
    const isFirstCompletion = !current.completed

    const problemStepIds =
      current.pendingProblemStepIds ?? Object.keys(current.pendingProblemAttempts ?? {})
    const xpBreakdown = isFirstCompletion
      ? computeLessonXp(current.pendingProblemAttempts ?? {}, problemStepIds)
      : null

    const nextStats: LessonStats = {
      ...current,
      attempted: true,
      lessonFinished: true,
      completed: true,
      skillCheckCorrect,
      skillCheckTotal,
      pendingProblemAttempts: null,
      lastLessonXpBreakdown: xpBreakdown
        ? { base: xpBreakdown.base, bonus: xpBreakdown.bonus }
        : current.lastLessonXpBreakdown,
    }

    return this.runCompletion(lessonId, nextStats, xpBreakdown, isFirstCompletion)
  }

  /**
   * Shared completion tail for lessons and section gates: write the local stats,
   * notify subscribers, and (for signed-in users) hand off to the atomic backend
   * `completeLesson`. A non-null `xpBreakdown` is a first completion (full XP, once);
   * null is a replay (small decaying XP). The award promise is surfaced and never
   * rejects so the celebration can prefer the authoritative values without blocking.
   */
  private runCompletion(
    progressKey: string,
    nextStats: LessonStats,
    xpBreakdown: LessonXpBreakdown | null,
    isFirstCompletion: boolean,
  ): SkillCheckSaveResult {
    this.statsByLesson[progressKey] = nextStats
    this.persistStats()
    this.commit()

    const uid = this.effectiveUid()
    let award: Promise<LessonCompletionAward | null> = Promise.resolve(null)
    if (uid) {
      // The backend transaction persists the progress doc (completion + xpAwarded),
      // so on SUCCESS we intentionally do NOT also queue a separate stats write —
      // that would race with the atomic award. The promise is surfaced (and never
      // rejects) so the "win the pot" celebration can prefer the authoritative award
      // without blocking on it.
      award = this.backend.completeLesson(uid, progressKey, xpBreakdown, nextStats).catch((err) => {
        // Durability: the atomic award didn't land, so the completion lives only in
        // local storage and the next sync would silently revert it. Best-effort
        // persist completed:true to the remote progress doc. The backend's
        // completed/xpAwarded guard keeps a later reconcile idempotent (never
        // double-awards first-completion XP).
        console.warn('Failed to award completion; persisting completion as a fallback:', err)
        this.writeCompletionFallback(progressKey, nextStats)
        return null
      })
    }

    return { isFirstCompletion, xpBreakdown, award }
  }

  /**
   * Credit a qualifying daily activity that keeps a streak alive without awarding XP
   * — e.g. finishing a review of an already-completed lesson.
   */
  recordReviewActivity(): void {
    const uid = this.effectiveUid()
    if (!uid) return
    void this.backend.touchStreak(uid).catch((err) => {
      console.warn('Failed to record review activity for streak:', err)
    })
  }

  /** Clear partial lesson progress so the student must redo lesson steps from step 1. */
  resetLessonForRestart(lessonId: string): void {
    const current = this.statsByLesson[lessonId] ?? defaultLessonStats()
    if (current.completed) return

    this.statsByLesson[lessonId] = {
      ...current,
      attempted: true,
      lessonFinished: false,
      lessonAccuracy: null,
      pendingProblemAttempts: null,
      pendingProblemStepIds: null,
    }
    this.persistStats()
    this.writeStatsToBackend(lessonId, this.statsByLesson[lessonId])
    this.commit()
  }

  abandonLessonAttempt(lessonId: string, options?: { resetLessonFinished?: boolean }): void {
    this.clearSession(lessonId)
    this.onLessonSessionCleared(lessonId)
    if (options?.resetLessonFinished) {
      this.resetLessonForRestart(lessonId)
    }
  }

  onLessonSessionCleared(lessonId: string): void {
    this.writeSessionClear(lessonId, this.getStats(lessonId))
  }

  // --- sessions ------------------------------------------------------------

  saveSession(lessonId: string, session: LessonSession): void {
    try {
      localStorage.setItem(sessionKey(lessonId), JSON.stringify(session))
    } catch {
      // Ignore storage errors (private mode / disabled storage): play still works.
    }
    this.scheduleSessionWrite(lessonId, session)
  }

  clearSession(lessonId: string): void {
    try {
      localStorage.removeItem(sessionKey(lessonId))
    } catch {
      // Ignore storage errors.
    }
  }

  // --- auth sync (H1) ------------------------------------------------------

  /**
   * Reconcile local progress with the backend on an auth change (H1 — shared-device
   * safety). Behaviour is preserved exactly from the former `syncProgressOnAuth`.
   */
  async syncOnAuth(uid: string | null): Promise<void> {
    const previousUid = this.uid

    // Sign-out (or no user): wipe local progress so the next person on this shared
    // device starts clean and we never upload the prior user's data (H1).
    if (!uid) {
      this.resetLocalUserState()
      this.uid = null
      this.commit()
      return
    }

    // Account switch without a sign-out in between: clear the previous user's local
    // data before loading the new account's remote progress (H1).
    if (previousUid && previousUid !== uid) {
      this.resetLocalUserState()
    }

    this.uid = uid

    try {
      const remote = await this.backend.loadAll(uid)

      if (Object.keys(remote).length === 0) {
        // Only merge local → remote for a genuine pre-auth/anonymous session, i.e. no
        // real uid was synced earlier this session. For a freshly signed-in different
        // account we must NOT donate the prior local data; clear it and treat remote
        // (empty) as the source of truth (H1).
        const isAnonymousHandoff = previousUid == null
        const local = this.exportLocalProgress()
        if (isAnonymousHandoff && Object.keys(local).length > 0) {
          await Promise.all(
            Object.entries(local).map(([lessonId, payload]) =>
              this.backend.writeLesson(uid, lessonId, payload),
            ),
          )
          this.applyRemoteProgress(local)
        } else {
          // Different account with empty remote — make sure no prior local data lingers.
          this.resetLocalUserState()
        }
      } else {
        this.applyRemoteProgress(remote)
      }
    } catch (err) {
      console.warn('Failed to sync lesson progress from Firestore:', err)
    } finally {
      this.commit()
    }
  }

  /**
   * H1 reset: wipe ALL per-user local state — lesson progress here, plus casino
   * table-clears + bankroll via the injected `onLocalReset`. The single explicit
   * orchestrator so no module secretly reaches into bankroll/casino.
   */
  resetLocalUserState(): void {
    this.clearLocalProgress()
    this.options.onLocalReset?.()
  }

  // --- local cache helpers -------------------------------------------------

  /** Wipe locally-persisted lesson progress only (stats + sessions); leaves remote intact. */
  private clearLocalProgress(): void {
    this.statsByLesson = {}
    try {
      localStorage.removeItem(STATS_KEY)
      localStorage.removeItem(LEGACY_COMPLETED_KEY)
      const sessionKeys: string[] = []
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i)
        if (key && key.startsWith(SESSION_PREFIX)) sessionKeys.push(key)
      }
      for (const key of sessionKeys) localStorage.removeItem(key)
    } catch {
      // Ignore storage access errors (e.g. disabled/blocked storage).
    }
    this.snapshot = this.buildSnapshot()
  }

  private applyRemoteProgress(remote: Record<string, LessonProgressPayload>): void {
    const map: Record<string, LessonStats> = {}
    for (const [lessonId, payload] of Object.entries(remote)) {
      map[lessonId] = payload.stats
    }
    this.statsByLesson = map
    this.persistStats()

    for (const [lessonId, payload] of Object.entries(remote)) {
      try {
        if (payload.session) {
          localStorage.setItem(sessionKey(lessonId), JSON.stringify(payload.session))
        } else {
          localStorage.removeItem(sessionKey(lessonId))
        }
      } catch {
        // Ignore storage errors.
      }
    }
    this.snapshot = this.buildSnapshot()
  }

  private exportLocalProgress(): Record<string, LessonProgressPayload> {
    const out: Record<string, LessonProgressPayload> = {}
    for (const [lessonId, stats] of Object.entries(this.statsByLesson)) {
      let session: LessonProgressPayload['session']
      try {
        const sessionRaw = localStorage.getItem(sessionKey(lessonId))
        if (sessionRaw) {
          const parsed = JSON.parse(sessionRaw) as LessonSession
          session = {
            stepIndex: typeof parsed.stepIndex === 'number' ? parsed.stepIndex : 0,
            solvedStepIds: sanitizeStringArray(parsed.solvedStepIds),
            problemAttempts: sanitizeProblemAttempts(parsed.problemAttempts),
          }
        }
      } catch {
        session = undefined
      }
      out[lessonId] = { stats, session }
    }
    return out
  }

  private readStatsFromStorage(): Record<string, LessonStats> {
    try {
      const raw = localStorage.getItem(STATS_KEY)
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch {
      return {}
    }
  }

  private persistStats(): void {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(this.statsByLesson))
    } catch {
      // Ignore storage errors.
    }
  }

  // --- backend writes (mirrors the former progressSync queue helpers) ------

  private writeStatsToBackend(lessonId: string, stats: LessonStats): void {
    const uid = this.effectiveUid()
    if (!uid) return

    const session = this.loadSession(lessonId, Number.MAX_SAFE_INTEGER)
    const payload: LessonProgressPayload = {
      stats,
      session: session.stepIndex > 0 || session.solvedStepIds.length > 0 ? session : null,
    }

    void this.backend.writeLesson(uid, lessonId, payload).catch((err) => {
      console.warn(`Failed to persist lesson stats for ${lessonId}:`, err)
    })
  }

  private scheduleSessionWrite(lessonId: string, session: LessonSession): void {
    const uid = this.effectiveUid()
    if (!uid) return

    const existing = this.sessionWriteTimers.get(lessonId)
    if (existing) clearTimeout(existing)

    this.sessionWriteTimers.set(
      lessonId,
      setTimeout(() => {
        this.sessionWriteTimers.delete(lessonId)
        const stats = this.statsByLesson[lessonId] ?? { ...defaultLessonStats(), attempted: true }

        void this.backend
          .writeLesson(uid, lessonId, {
            stats,
            session: session.stepIndex > 0 || session.solvedStepIds.length > 0 ? session : null,
          })
          .catch((err) => {
            console.warn(`Failed to persist lesson session for ${lessonId}:`, err)
          })
      }, SESSION_DEBOUNCE_MS),
    )
  }

  private writeSessionClear(lessonId: string, stats: LessonStats): void {
    const uid = this.effectiveUid()
    if (!uid) return

    const existing = this.sessionWriteTimers.get(lessonId)
    if (existing) {
      clearTimeout(existing)
      this.sessionWriteTimers.delete(lessonId)
    }

    void this.backend.writeLesson(uid, lessonId, { stats, session: null }).catch((err) => {
      console.warn(`Failed to clear lesson session for ${lessonId}:`, err)
    })
  }

  private writeCompletionFallback(lessonId: string, stats: LessonStats): void {
    const uid = this.effectiveUid()
    if (!uid) return

    const existing = this.sessionWriteTimers.get(lessonId)
    if (existing) {
      clearTimeout(existing)
      this.sessionWriteTimers.delete(lessonId)
    }

    void this.backend.writeLesson(uid, lessonId, { stats, session: null }).catch((err) => {
      console.warn(`Failed to persist fallback lesson completion for ${lessonId}:`, err)
    })
  }

  private effectiveUid(): string | null {
    return this.uid ?? this.options.getFallbackUid?.() ?? null
  }

  // --- snapshot + cross-tab ------------------------------------------------

  private buildSnapshot(): ProgressSnapshot {
    return {
      statsByLesson: { ...this.statsByLesson },
      completedIds: getCompletedIds(this.statsByLesson),
    }
  }

  /** Rebuild the immutable snapshot and notify same-tab subscribers. */
  private commit(): void {
    this.snapshot = this.buildSnapshot()
    for (const listener of this.listeners) listener()
  }

  private attachStorageListener(): void {
    if (this.storageAttached || typeof window === 'undefined') return
    window.addEventListener('storage', this.handleStorageEvent)
    this.storageAttached = true
  }

  private detachStorageListener(): void {
    if (!this.storageAttached || typeof window === 'undefined') return
    window.removeEventListener('storage', this.handleStorageEvent)
    this.storageAttached = false
  }

  /** Cross-tab: another tab changed the persisted stats (or cleared storage). */
  private handleStorageEvent = (event: StorageEvent): void => {
    if (event.key === STATS_KEY || event.key === null) {
      this.statsByLesson = this.readStatsFromStorage()
      this.commit()
    }
  }
}
