export interface GraphNode {
  id: string;
  name: string;
  system: string;
  color: string;
  val: number;
  visualBinding: { meshId?: string };
  x?: number;
  y?: number;
  z?: number;
}
export interface GraphLink { id: string; source: string; target: string; type: string; color?: string; }
export interface GraphData { nodes: GraphNode[]; links: GraphLink[]; }
export interface IGraphRendererProps {
  data: GraphData;
  onNodeClick?: (nodeId: string, meshId?: string) => void;
  highlightedNodes?: Set<string>;
}
