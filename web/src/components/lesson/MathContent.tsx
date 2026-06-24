import type { ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { lookupGlossaryTerm } from '../../data/glossary'
import { GlossaryTerm } from './GlossaryTerm'

type MathContentProps = {
  children: string
  className?: string
}

/**
 * Pull the plain text out of a `**bold**` node *only* when it is purely text.
 * If the bold contains anything else (e.g. inline KaTeX from remark-math), we
 * return null and fall back to a normal `<strong>` so math is never disturbed.
 */
function plainText(children: ReactNode): string | null {
  if (typeof children === 'string') return children.trim() || null
  if (Array.isArray(children) && children.every((child) => typeof child === 'string')) {
    return children.join('').trim() || null
  }
  return null
}

/**
 * Render bold text as a clickable `GlossaryTerm` when it matches a known poker
 * term; otherwise render it as ordinary bold. KaTeX/math is untouched because
 * we only convert pure-text bolds.
 */
const markdownComponents: Components = {
  strong({ children }) {
    const text = plainText(children)
    const entry = text ? lookupGlossaryTerm(text) : null
    if (entry) return <GlossaryTerm term={entry.term} definition={entry.definition} />
    return <strong>{children}</strong>
  },
}

export function MathContent({ children, className = '' }: MathContentProps) {
  return (
    <div className={`lesson-prose text-slate-700 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
