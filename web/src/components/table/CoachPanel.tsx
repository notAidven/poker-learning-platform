import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getCoachTip,
  getDeepCoachTip,
  type CoachContext,
  type DeepCoachContext,
} from '../../lib/ai/coach'

type CoachPanelProps = {
  /** The hero's spot, or null when it is not the hero's turn. */
  context: CoachContext | null
  /** The richer, table-wide context for the deep read; null when not the hero's turn. */
  deepContext?: DeepCoachContext | null
  /** Changes once per hero decision point; drives an automatic re-fetch. */
  turnKey: string
  /** Identifies the current hand; the message feed resets between hands. */
  handKey: string | number
  /** Whether it is currently the hero's turn. */
  active: boolean
  /**
   * A short, rule-based reaction to the hero's LAST move (Room 1 only). Shown after
   * the hero acts, while the opponents play and the hand resolves. Always available
   * with AI off because it is derived from the rule logic.
   */
  reaction?: string | null
  /**
   * A result-aware "what just happened" recap shown once the hand is OVER (Room 1
   * only). Unlike `reaction`, it factors in who won and what the opponent held, so
   * an in-the-moment "good call" is never the last word on a hand the hero lost.
   */
  resultReflection?: string | null
}

type Tip = { text: string; source: 'ai' | 'fallback' }

/** Minimum time (ms) a feed message stays before the next one is promoted. */
const MIN_MESSAGE_MS = 2400
/** How many recent coach messages the scrollable feed keeps. */
const MAX_FEED = 4

type FeedTone = 'ai' | 'rule' | 'reaction' | 'recap'
type FeedMsg = { id: string; label: string; tone: FeedTone; text: string }

const TONE_CLASS: Record<FeedTone, string> = {
  ai: 'bg-brand-600 text-white',
  rule: 'bg-slate-200 text-slate-600',
  reaction: 'bg-emerald-100 text-emerald-700',
  recap: 'bg-indigo-100 text-indigo-700',
}

/**
 * A short, scrollable history of coach messages. Each new message is queued and
 * shown for at least `MIN_MESSAGE_MS`, so a rapid burst of villain actions can never
 * blow a message away mid-read. Older messages stay (dimmed) and remain scrollable;
 * the newest is highlighted. Reset per hand via a `key` from the parent, so an
 * end-of-hand recap stays visible until the next hand begins.
 */
function CoachMessageFeed({ message, placeholder }: { message: FeedMsg | null; placeholder: string }) {
  const [feed, setFeed] = useState<FeedMsg[]>([])
  const queueRef = useRef<FeedMsg[]>([])
  const lastIdRef = useRef<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Enqueue each new message and run a self-contained drain loop that promotes one
  // message at a time, holding each for at least MIN_MESSAGE_MS so a burst of villain
  // actions can never blow a message away mid-read. setState only happens inside the
  // timer callbacks (never synchronously in the effect body).
  useEffect(() => {
    if (!message || lastIdRef.current === message.id) return
    lastIdRef.current = message.id
    queueRef.current.push(message)
    if (timerRef.current != null) return // a drain loop is already running

    function step() {
      const next = queueRef.current.shift()
      if (!next) {
        timerRef.current = null
        return
      }
      setFeed((f) => (f[f.length - 1]?.id === next.id ? f : [...f, next].slice(-MAX_FEED)))
      timerRef.current = window.setTimeout(step, MIN_MESSAGE_MS)
    }
    timerRef.current = window.setTimeout(step, 0)
  }, [message])

  // Clear any pending timer on unmount (the feed is keyed per hand, so it remounts).
  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current)
    }
  }, [])

  // Keep the newest message in view as the feed grows.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [feed])

  return (
    <div
      ref={scrollRef}
      aria-live="polite"
      className="flex max-h-44 flex-col gap-2 overflow-y-auto pr-1"
    >
      {feed.length === 0 ? (
        <p className="min-h-[3rem] text-sm leading-relaxed text-slate-500">{placeholder}</p>
      ) : (
        feed.map((m, i) => {
          const newest = i === feed.length - 1
          return (
            <div key={`${m.id}-${i}`} className={newest ? 'opacity-100' : 'opacity-50'}>
              <span
                className={`mb-0.5 inline-block rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ${TONE_CLASS[m.tone]}`}
              >
                {m.label}
              </span>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{m.text}</p>
            </div>
          )
        })
      )}
    </div>
  )
}

type DeepState = { key: string; loading: boolean; tip: Tip | null }

/**
 * Feature 1 coach. It now:
 *   - BEFORE the hero acts: asks `getCoachTip` for a grounded one-liner ("Ask coach"
 *     re-requests it), and offers "Ask the coach for more" for a deeper, table-wide,
 *     numbers-driven read (`getDeepCoachTip`).
 *   - AFTER the hero acts: shows a supportive `reaction`, then a result-aware `recap`.
 *
 * Messages flow through a paced, scrollable feed so they are readable. Everything
 * works with AI off: tips and the deep read fall back to the rule-based logic.
 */
export function CoachPanel({
  context,
  deepContext,
  turnKey,
  handKey,
  active,
  reaction,
  resultReflection,
}: CoachPanelProps) {
  const [entry, setEntry] = useState<{ key: string; tip: Tip } | null>(null)
  const [nonce, setNonce] = useState(0)
  const [deep, setDeep] = useState<DeepState | null>(null)

  const requestKey = `${turnKey}#${nonce}`
  const fresh = entry?.key === requestKey
  const loading = active && Boolean(context) && !fresh
  const tip = entry?.tip ?? null

  useEffect(() => {
    if (!active || !context) return
    let cancelled = false
    getCoachTip(context).then((result) => {
      if (!cancelled) setEntry({ key: requestKey, tip: result })
    })
    return () => {
      cancelled = true
    }
  }, [requestKey, active, context])

  // Once the hand is over the recap wins; while opponents act, show the reaction to
  // the hero's last move; on the hero's turn, the latest tip.
  const showRecap = !active && Boolean(resultReflection)
  const showReaction = !active && !showRecap && Boolean(reaction)

  let incoming: FeedMsg | null = null
  if (showRecap && resultReflection) {
    incoming = { id: `recap:${resultReflection}`, label: 'Hand recap', tone: 'recap', text: resultReflection }
  } else if (showReaction && reaction) {
    incoming = { id: `react:${reaction}`, label: 'Your move', tone: 'reaction', text: reaction }
  } else if (active && fresh && tip) {
    incoming = {
      id: `tip:${requestKey}`,
      label: tip.source === 'ai' ? 'AI read' : 'Built-in',
      tone: tip.source === 'ai' ? 'ai' : 'rule',
      text: tip.text,
    }
  }

  const askMore = useCallback(() => {
    if (!deepContext) return
    const key = turnKey
    setDeep({ key, loading: true, tip: null })
    getDeepCoachTip(deepContext).then(
      (result) => setDeep({ key, loading: false, tip: result }),
      () =>
        setDeep({
          key,
          loading: false,
          tip: {
            text: 'Could not load a deeper read right now. Weigh your pot odds against your equity, factor in how many players are left, and lean on position.',
            source: 'fallback',
          },
        }),
    )
  }, [deepContext, turnKey])

  const showDeep = deep != null && deep.key === turnKey

  return (
    <section className="flex flex-col rounded-2xl border border-brand-200 bg-brand-50/60 p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-brand-800">
          <span aria-hidden>&clubs;</span> Coach
        </h3>
        {loading && <span className="text-[0.65rem] font-semibold text-slate-400">reading the spot…</span>}
      </div>

      <CoachMessageFeed
        key={handKey}
        message={incoming}
        placeholder="Your coach will weigh in when it is your turn, react after you act, and recap how the hand played out."
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!active || loading}
          onClick={() => setNonce((n) => n + 1)}
          className="rounded-xl border border-brand-300 bg-white px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
        >
          Ask coach
        </button>
        <button
          type="button"
          disabled={!deepContext || (showDeep && deep.loading)}
          onClick={askMore}
          title={deepContext ? 'A deeper, numbers-driven read of the whole table' : 'Available on your turn to act'}
          className="rounded-xl border border-brand-300 bg-white px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
        >
          Ask the coach for more
        </button>
      </div>

      {showDeep && (
        <div
          className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-brand-200 bg-white/70 p-3"
          aria-live="polite"
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-bold text-brand-800">Deep read</span>
            {deep.tip && (
              <span
                className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ${
                  deep.tip.source === 'ai' ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {deep.tip.source === 'ai' ? 'AI' : 'Rule-based'}
              </span>
            )}
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {deep.loading ? 'Crunching the numbers…' : (deep.tip?.text ?? '')}
          </p>
        </div>
      )}
    </section>
  )
}
