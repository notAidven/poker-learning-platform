import { MathContent } from './MathContent'

type ConceptStepViewProps = {
  title?: string
  content: string
}

export function ConceptStepView({ title, content }: ConceptStepViewProps) {
  return (
    <div className="space-y-4">
      {title && <h2 className="text-xl font-bold text-slate-900">{title}</h2>}
      <MathContent>{content}</MathContent>
    </div>
  )
}
