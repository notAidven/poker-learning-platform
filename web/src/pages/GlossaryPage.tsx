import { useId, useMemo, useState } from 'react'
import { glossaryEntries, type GlossaryEntry } from '../data/glossary'

/**
 * A searchable, A–Z glossary of every poker term defined in `data/glossary.ts`.
 * The list is built by iterating the exported `glossaryEntries`, so any term
 * added to the glossary appears here automatically with no extra wiring.
 */

/** Terms that read as acronyms; everything else is shown in sentence case. */
const ACRONYM_DISPLAY: Record<string, string> = {
  ev: 'EV',
  utg: 'UTG',
}

/** Pretty-print a normalized glossary key for display (keeps it faithful to the data). */
function displayTerm(term: string): string {
  const acronym = ACRONYM_DISPLAY[term]
  if (acronym) return acronym
  return term.charAt(0).toUpperCase() + term.slice(1)
}

/** First-letter section bucket (A–Z) for a term. */
function bucketOf(term: string): string {
  const first = term.charAt(0).toUpperCase()
  return /[A-Z]/.test(first) ? first : '#'
}

type Group = { letter: string; entries: GlossaryEntry[] }

function groupEntries(entries: GlossaryEntry[]): Group[] {
  const byLetter = new Map<string, GlossaryEntry[]>()
  for (const entry of entries) {
    const letter = bucketOf(entry.term)
    const list = byLetter.get(letter)
    if (list) list.push(entry)
    else byLetter.set(letter, [entry])
  }
  return [...byLetter.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([letter, list]) => ({ letter, entries: list }))
}

export function GlossaryPage() {
  const [query, setQuery] = useState('')
  const searchId = useId()

  const normalizedQuery = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!normalizedQuery) return glossaryEntries
    return glossaryEntries.filter(
      (entry) =>
        entry.term.toLowerCase().includes(normalizedQuery) ||
        entry.definition.toLowerCase().includes(normalizedQuery),
    )
  }, [normalizedQuery])

  const groups = useMemo(() => groupEntries(filtered), [filtered])

  const total = glossaryEntries.length
  const count = filtered.length

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Poker glossary
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-night-700/80">
          Every term from the course in one place. Search by word or meaning, or browse A to Z.
        </p>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Search the glossary
          </label>
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-night-700/40"
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms (e.g. pot odds, flush, EV)"
            autoComplete="off"
            className="w-full rounded-xl border border-night-900/12 bg-night-900/[0.03] py-3 pl-11 pr-4 text-sm text-ink shadow-[inset_0_1px_2px_rgba(7,21,15,0.06)] outline-none transition placeholder:text-night-700/40 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/15"
          />
        </div>
        <p className="text-xs font-medium text-night-700/60" role="status" aria-live="polite">
          {normalizedQuery
            ? `${count} of ${total} ${total === 1 ? 'term' : 'terms'} match "${query.trim()}"`
            : `${total} ${total === 1 ? 'term' : 'terms'}`}
        </p>
      </div>

      {groups.length > 1 && (
        <nav
          aria-label="Jump to a letter"
          className="flex flex-wrap gap-1.5 rounded-2xl border border-night-900/10 bg-white p-2 shadow-card"
        >
          {groups.map((group) => (
            <a
              key={group.letter}
              href={`#glossary-${group.letter}`}
              className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold text-night-700/70 transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              {group.letter}
            </a>
          ))}
        </nav>
      )}

      {count === 0 ? (
        <p className="rounded-2xl border border-night-900/10 bg-white p-8 text-center text-sm text-night-700/70 shadow-card">
          No terms match your search. Try a different word.
        </p>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.letter} id={`glossary-${group.letter}`} aria-labelledby={`glossary-${group.letter}-heading`}>
              <h2
                id={`glossary-${group.letter}-heading`}
                className="mb-3 border-b border-night-900/10 pb-1 font-display text-lg font-bold text-brand-700"
              >
                {group.letter}
              </h2>
              <dl className="space-y-3">
                {group.entries.map((entry) => (
                  <div
                    key={entry.term}
                    className="rounded-2xl border border-night-900/10 bg-white p-4 shadow-card"
                  >
                    <dt className="text-sm font-bold text-ink">{displayTerm(entry.term)}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-night-700/80">
                      {entry.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
