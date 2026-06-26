import type { ConceptVisual } from '../../types/lesson'
import { MathContent } from './MathContent'
import { ChipDenominations } from './ChipDenominations'

type ConceptStepViewProps = {
  title?: string
  content: string
  visual?: ConceptVisual
}

export function ConceptStepView({ title, content, visual }: ConceptStepViewProps) {
  return (
    <div className="space-y-4">
      {title && <h2 className="text-xl font-bold text-ink">{title}</h2>}
      <MathContent>{content}</MathContent>
      {visual === 'chip-denominations' && <ChipDenominations />}
    </div>
  )
}
