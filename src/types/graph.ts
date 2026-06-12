export type DifficultyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type AnatomicalSystem = 
  | "SKELETAL" 
  | "MUSCULAR" 
  | "NERVOUS" 
  | "VASCULAR" 
  | "CARDIOVASCULAR"
  | "TENDON" 
  | "LIGAMENT" 
  | "INTEGUMENTARY" 
  | "CONNECTIVE";

export type BodyRegion = 
  | "CARPAL" 
  | "METACARPAL" 
  | "PHALANGES" 
  | "PALM" 
  | "DORSUM" 
  | "WRIST" 
  | "FOREARM";

export interface VisualBinding {
  meshId: string;
  glbObject?: string;
  materialId?: string;
  layerDepth?: number;
  boundingBoxCenter?: [number, number, number];
}

export interface GraphNode {
  id: string;
  name: string;
  system: AnatomicalSystem;
  color: string;
  val: number; // PageRank size
  visualBinding: VisualBinding;
  [key: string]: any;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  color?: string;
  [key: string]: any;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface IGraphRendererProps {
  data: GraphData;
  onNodeClick?: (nodeId: string, meshId?: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  highlightedNodes?: Set<string>;
  highlightedLinks?: Set<string>;
}
