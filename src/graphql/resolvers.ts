import { GraphQLError } from 'graphql';
import type { AnatomicalStructure, AnatomyDataset, AnatomyRelationship, ClinicalCondition } from '@/lib/anatomy-types';

function cap<T>(items: T[], limit?: number | null) {
  if (limit != null && (limit < 0 || limit > 100)) throw new GraphQLError('limit must be between 0 and 100.');
  return items.slice(0, limit ?? 100);
}

export function createGraphResolvers(dataset: AnatomyDataset) {
  function related(id: string, type: AnatomyRelationship['type'], direction: 'out' | 'in' | 'both') {
    return dataset.relationships.filter((edge) => edge.type === type && ((direction !== 'in' && edge.source === id) || (direction !== 'out' && edge.target === id)))
      .map((edge) => dataset.structures.find((item) => item.graphNodeId === (edge.source === id ? edge.target : edge.source)))
      .filter((item): item is AnatomicalStructure => !!item).map(structure);
  }
  function condition(node: ClinicalCondition): Record<string, unknown> {
    return { ...node, affectedStructures: () => dataset.relationships.filter((edge) => edge.type === 'AFFECTED_BY' && edge.target === node.id).map((edge) => dataset.structures.find((item) => item.graphNodeId === edge.source)).filter((item): item is AnatomicalStructure => !!item).map(structure) };
  }
  function structure(node: AnatomicalStructure): Record<string, unknown> {
    const id = node.graphNodeId;
    return {
      ...node,
      relationships: () => dataset.relationships.filter((edge) => edge.source === id || edge.target === id),
      innervates: () => related(id, 'INNERVATES', 'out'), innervatedBy: () => related(id, 'INNERVATES', 'in'),
      supplies: () => related(id, 'SUPPLIES', 'out'), suppliedBy: () => related(id, 'SUPPLIES', 'in'),
      articulatesWith: () => related(id, 'ARTICULATES_WITH', 'both'),
      originatesOn: () => related(id, 'ORIGINATES_ON', 'out'), insertsOn: () => related(id, 'INSERTS_ON', 'out'),
      clinicalConditions: () => dataset.relationships.filter((edge) => edge.type === 'AFFECTED_BY' && edge.source === id).map((edge) => dataset.clinicalConditions.find((item) => item.id === edge.target)).filter((item): item is ClinicalCondition => !!item).map(condition),
    };
  }
  return {
    anatomyGraph: () => ({ ...dataset, structures: dataset.structures.map(structure), clinicalConditions: dataset.clinicalConditions.map(condition) }),
    anatomicalStructures: ({ where, limit }: { where?: { graphNodeId?: string; name_CONTAINS?: string; category?: string; fmaId?: string }; limit?: number }) => cap(dataset.structures.filter((item) => !where || ((!where.graphNodeId || item.graphNodeId === where.graphNodeId) && (!where.name_CONTAINS || item.name.toLowerCase().includes(where.name_CONTAINS.toLowerCase())) && (!where.category || item.category === where.category) && (!where.fmaId || item.fmaId === where.fmaId))), limit).map(structure),
    anatomicalStructure: ({ graphNodeId }: { graphNodeId: string }) => { const node = dataset.structures.find((item) => item.graphNodeId === graphNodeId); return node ? structure(node) : null; },
    anatomyAssets: ({ meshId, limit }: { meshId?: string; limit?: number }) => cap(dataset.structures.flatMap((item) => item.asset && (!meshId || item.asset.meshId === meshId) ? [item.asset] : []), limit),
    anatomyRelationships: ({ where, limit }: { where?: { source?: string; target?: string; type?: string }; limit?: number }) => cap(dataset.relationships.filter((edge) => !where || ((!where.source || edge.source === where.source) && (!where.target || edge.target === where.target) && (!where.type || edge.type === where.type))), limit),
    clinicalConditions: ({ where, limit }: { where?: { id?: string; name_CONTAINS?: string }; limit?: number }) => cap(dataset.clinicalConditions.filter((item) => !where || ((!where.id || item.id === where.id) && (!where.name_CONTAINS || item.name.toLowerCase().includes(where.name_CONTAINS.toLowerCase())))), limit).map(condition),
  };
}
