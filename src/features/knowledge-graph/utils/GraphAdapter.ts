import { GraphData, GraphNode, GraphLink } from '@/types/graph';

export function transformNeo4jToGraph(structures: any[]): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  structures.forEach((struct) => {
    nodes.push({
      id: struct.graphNodeId,
      name: struct.name,
      system: struct.system?.name?.toUpperCase() || 'UNKNOWN',
      val: 20,
      color: getSystemColor(struct.system?.name),
      visualBinding: struct.asset ? { meshId: struct.asset.meshId } : { meshId: 'missing' },
    });

    // Add innervates links
    if (struct.innervates && struct.innervates.length > 0) {
      struct.innervates.forEach((target: any) => {
        links.push({
          source: struct.graphNodeId,
          target: target.graphNodeId,
          type: 'INNERVATES',
        });
      });
    }

    // Add supplies links
    if (struct.supplies && struct.supplies.length > 0) {
      struct.supplies.forEach((target: any) => {
        links.push({
          source: struct.graphNodeId,
          target: target.graphNodeId,
          type: 'SUPPLIES',
        });
      });
    }
    
    // We can also add structural (BELONGS_TO) links if we want a hierarchical graph
  });

  return { nodes, links };
}

function getSystemColor(systemName?: string): string {
  switch (systemName) {
    case 'Nervous':
      return '#facc15'; // yellow-400
    case 'Muscular':
      return '#f87171'; // red-400
    case 'Cardiovascular':
      return '#3b82f6'; // blue-500
    case 'Skeletal':
      return '#f3f4f6'; // gray-100
    case 'Integumentary':
      return '#fdba74'; // orange-300
    default:
      return '#9ca3af'; // gray-400
  }
}
