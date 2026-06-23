import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

type MathContentProps = {
  children: string
  className?: string
}

export function MathContent({ children, className = '' }: MathContentProps) {
  return (
    <div className={`lesson-prose text-slate-700 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
