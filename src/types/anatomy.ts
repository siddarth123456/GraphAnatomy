export enum AnatomyLayer {
  Skin = "Skin",
  Fat = "Fat",
  Fascia = "Fascia",
  Muscle = "Muscle",
  Tendon = "Tendon",
  Ligament = "Ligament",
  Nerve = "Nerve",
  Artery = "Artery",
  Vein = "Vein",
  Bone = "Bone"
}

export enum HighlightState {
  None = "NONE",
  Selected = "SELECTED",
  Hovered = "HOVERED",
  SearchResult = "SEARCH_RESULT",
  QuizTarget = "QUIZ_TARGET",
  ClinicalHighlight = "CLINICAL_HIGHLIGHT"
}

export interface AnatomySceneNode {
  meshId: string;
  graphNodeId: string;
  fmaId?: string;
  snomedId?: string | null;
  name: string;
  category: string;
  system: string;
  lod: {
    high: string;
    medium: string;
    low: string;
  };
  explosionDirection: [number, number, number];
  materialId: string;
  layer: AnatomyLayer;
  boundingBox: [number, number, number, number, number, number]; // minX, minY, minZ, maxX, maxY, maxZ
  position?: [number, number, number]; // World-space origin for centered meshes
  rotation?: [number, number, number]; // Euler rotation if needed
  searchableTerms: string[];
  clinicalTags: string[];
}

export interface RegionManifest {
  version: string;
  dataset: string;
  datasetVersion: string;
  pipelineVersion: string;
  generatedAt: string;
  regionId: string;
  name: string;
  meshes: AnatomySceneNode[];
}
