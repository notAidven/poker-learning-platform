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

/** A minimal structural view of the markdown (mdast) nodes this file walks. */
type MdNode = {
  type: string
  value?: string
  children?: MdNode[]
  data?: { hProperties?: Record<string, unknown> } & Record<string, unknown>
}

/** Property bag set by the plugin and read back from the rendered node. */
const FIRST_FLAG = 'dataGlossaryFirst'

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

/** Text of an mdast node when it is purely text children, else null (mirrors `plainText`). */
function pureTextOf(node: MdNode): string | null {
  if (!node.children || node.children.length === 0) return null
  let text = ''
  for (const child of node.children) {
    if (child.type === 'text' && typeof child.value === 'string') text += child.value
    else return null // inline math / other content → not a plain-text bold
  }
  return text.trim() || null
}

/**
 * remark plugin that tags ONLY the first `**bold**` occurrence of each glossary
 * term in this block, so `MathContent` renders just that one as a clickable
 * popover and leaves every later repeat as ordinary bold (cuts popover noise).
 *
 * Terms are de-duplicated by their resolved definition, so singular/plural and
 * "the …" variants (flush / flushes / the flush) count as one term. It runs
 * after remark-math, and only tags pure-text bolds, so KaTeX and non-glossary
 * bold are never touched. A fresh `seen` set per run keeps it pure (and
 * StrictMode-safe): the result depends only on the input, never on render order.
 */
function remarkFirstGlossaryOnly() {
  return (tree: MdNode) => {
    const seen = new Set<string>()
    const walk = (node: MdNode) => {
      if (node.type === 'strong') {
        const text = pureTextOf(node)
        const entry = text ? lookupGlossaryTerm(text) : null
        if (entry && !seen.has(entry.definition)) {
          seen.add(entry.definition)
          node.data = {
            ...node.data,
            hProperties: { ...node.data?.hProperties, [FIRST_FLAG]: true },
          }
        }
        return // no nested bold to consider inside a <strong>
      }
      if (node.children) for (const child of node.children) walk(child)
    }
    walk(tree)
  }
}

/**
 * Render bold text as a clickable `GlossaryTerm` only for the first occurrence
 * of each known poker term (tagged by `remarkFirstGlossaryOnly`); all other
 * bold — repeats, non-glossary words, and KaTeX — renders as ordinary bold.
 */
const markdownComponents: Components = {
  strong({ node, children }) {
    const isFirst = node?.properties?.[FIRST_FLAG] === true
    const text = isFirst ? plainText(children) : null
    const entry = text ? lookupGlossaryTerm(text) : null
    if (entry) return <GlossaryTerm term={entry.term} definition={entry.definition} />
    return <strong>{children}</strong>
  },
}

export function MathContent({ children, className = '' }: MathContentProps) {
  return (
    <div className={`lesson-prose text-slate-700 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkFirstGlossaryOnly as unknown as typeof remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
