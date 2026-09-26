export type DataMode = 'bundled' | 'neo4j';

export interface Citation {
  title: string;
  url: string;
}

export interface AnatomyAsset {
  meshId: string;
  glbPath: string;
  manifestPath: string;
  sourceDataset: string;
  sourceVersion: string;
}

export interface AnatomicalStructure {
  graphNodeId: string;
  name: string;
  fmaId: string | null;
  snomedId: string | null;
  ontologyValidated: boolean;
  category: string;
  system: { id: string; name: string };
  asset: AnatomyAsset | null;
  searchableTerms: string[];
  description: string;
  citation: Citation | null;
}

export interface ClinicalCondition {
  id: string;
  name: string;
  synonyms: string[];
  description: string;
  citation: Citation;
}

export interface AnatomyRelationship {
  id: string;
  source: string;
  target: string;
  type: 'ARTICULATES_WITH' | 'INNERVATES' | 'SUPPLIES' | 'ORIGINATES_ON' | 'INSERTS_ON' | 'AFFECTED_BY';
  description: string;
  citation: Citation;
}

export interface AnatomyDataset {
  mode: DataMode;
  structures: AnatomicalStructure[];
  clinicalConditions: ClinicalCondition[];
  relationships: AnatomyRelationship[];
  metadata: {
    datasetId: string;
    version: string;
    structureCount: number;
    renderableCount: number;
    relationshipCount: number;
    ontologyStatus: string;
    scope: string;
  };
}

export type RetrievalIntent = 'SPATIAL_QUERY' | 'CLINICAL_CONDITION_QUERY' | 'ANATOMY_RELATIONSHIP_QUERY';

export interface EvidenceNode {
  graphNodeId: string;
  name: string;
  fmaId: string | null;
  meshId: string | null;
  ontologyValidated: false;
  sourceDataset: string;
  sourceVersion: string;
}

export interface RetrievalEvidence {
  id: string;
  sourceNode: EvidenceNode;
  targetNode: EvidenceNode;
  relationship: AnatomyRelationship['type'];
  description: string;
  citation: Citation;
  retrievalMethod: 'CURATED_GRAPH';
  retrievalDepth: 1;
}

export interface RetrievalResponse {
  query: string;
  intent: RetrievalIntent;
  status: 'ok' | 'no_results' | 'unsupported';
  message: string;
  extractedTerms: string[];
  evidence: RetrievalEvidence[];
  metadata: {
    timestamp: string;
    totalEvidences: number;
    version: string;
    mode: DataMode;
    graphragStage: string;
    truncated: boolean;
  };
}
