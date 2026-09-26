import type { AnatomyDataset } from '@/lib/anatomy-types';
import type { GraphData } from '@/types/graph';
const colors: Record<string, string> = { Bone: '#e4d9c2', Muscle: '#df8383', Artery: '#ff6868', Nerve: '#f2cf65' };
export function toGraphData(data: AnatomyDataset): GraphData {
  return {
    nodes: [...data.structures.map((node) => ({ id: node.graphNodeId, name: node.name, system: node.system.name, color: colors[node.category] ?? '#87a6ba', val: 3, visualBinding: { meshId: node.asset?.meshId } })),
      ...data.clinicalConditions.map((node) => ({ id: node.id, name: node.name, system: 'Clinical', color: '#c79cde', val: 4, visualBinding: {} }))],
    links: data.relationships.map((relation) => ({ id: relation.id, source: relation.source, target: relation.target, type: relation.type, color: '#697a92' })),
  };
}
