import type { SectionId } from '../lessons'
import type { SectionGateDefinition } from './types'

/**
 * Lazy loaders for each section gate's question set, keyed by section id (mirrors
 * `skillCheckContent.ts`). Only the gated lesson sections have a gate — the casino
 * section does not. Cached after first load.
 */
const sectionGateLoaders: Partial<Record<SectionId, () => Promise<SectionGateDefinition>>> = {
  foundations: () => import('./gate-foundations').then((m) => m.gateFoundations),
  playing: () => import('./gate-playing').then((m) => m.gatePlaying),
  math: () => import('./gate-math').then((m) => m.gateMath),
}

const sectionGateCache = new Map<SectionId, SectionGateDefinition>()

export function hasSectionGate(sectionId: SectionId): boolean {
  return sectionId in sectionGateLoaders
}

export async function loadSectionGate(
  sectionId: SectionId,
): Promise<SectionGateDefinition | undefined> {
  const loader = sectionGateLoaders[sectionId]
  if (!loader) return undefined

  const cached = sectionGateCache.get(sectionId)
  if (cached) return cached

  const gate = await loader()
  sectionGateCache.set(sectionId, gate)
  return gate
}

export type { SectionGateDefinition, SectionGateQuestion } from './types'
