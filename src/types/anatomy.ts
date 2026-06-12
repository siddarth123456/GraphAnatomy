export enum AnatomyLayer {
  Skin = 0,
  Fat = 1,
  Fascia = 2,
  Muscle = 3,
  Tendon = 4,
  Ligament = 5,
  Nerve = 6,
  Artery = 7,
  Vein = 8,
  Bone = 9
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
  name: string;
  category: string;
  system: string;
  glbPath: string;
  materialId: string;
  layer: AnatomyLayer;
  boundingBox: [number, number, number, number, number, number]; // minX, minY, minZ, maxX, maxY, maxZ
  searchableTerms: string[];
  clinicalTags: string[];
}

export interface RegionManifest {
  regionId: string;
  name: string;
  meshes: AnatomySceneNode[];
}
