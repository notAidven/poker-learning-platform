import type { VennDiagramConfig } from '../../types/lesson'
import { MathContent } from './MathContent'
import { VennDiagram } from './VennDiagram'

type ConceptStepViewProps = {
  title?: string
  content: string
  visual?: VennDiagramConfig
}

export function ConceptStepView({ title, content, visual }: ConceptStepViewProps) {
  return (
    <div className="space-y-4">
      {title && <h2 className="text-xl font-bold text-slate-900">{title}</h2>}
      <MathContent>{content}</MathContent>
      {visual && (
        <figure className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-4">
          <VennDiagram config={visual} />
        </figure>
      )}
    </div>
  )
}
