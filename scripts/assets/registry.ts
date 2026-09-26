import { ATTRIBUTION, LICENSE_URL, MAPPING_URL } from './io';
import type { AnatomyDataset } from '../../src/lib/anatomy-types';

export interface AssetMesh {
  meshId: string;
  graphNodeId: string;
  fmaId: string | null;
  name: string;
  category: string;
  system: string;
  layer: string;
  sourceDataset: string;
  sourceVersion: string;
  sourceFile?: string;
  sourceSha256?: string;
  sourceObject?: string;
  sourceUrl?: string;
  licenseUrl?: string;
  attribution?: string;
  registrationId?: string;
  sourceTriangleCount?: number;
  geometryRepresentation?: 'source-mesh' | 'source-surface';
  sourceParts?: { sourceFile: string; sourceSha256: string }[];
  sourceCrop?: { bounds: number[]; method: 'retain-contained-triangles'; note: string };
  materialId: string;
  searchableTerms: string[];
  clinicalTags: string[];
  position: number[];
  boundingBox: number[];
  explosionDirection: number[];
  lod: { high: string; medium: string; low: string };
}
export interface AssetManifest {
  version: string;
  regionId: string;
  dataset: string;
  datasetVersion: string;
  regionCentroid: number[];
  coordinateScale: number;
  meshes: AssetMesh[];
}
export interface SourceMapping {
  meshId: string;
  graphNodeId: string;
  fmaId: string;
  sourceName: string;
  sourceFile: string;
  sourceRow: string;
  sourceParts?: { sourceFile: string; sourceName: string; sourceRow: string }[];
}
export interface MappingSnapshot {
  dataset: string;
  version: string;
  sourceUrl: string;
  sourceSha256: string;
  licenseUrl: string;
  attribution: string;
  mappings: SourceMapping[];
}

export interface ZAnatomyMapping {
  dataset: 'Z-Anatomy';
  version: string;
  sourceUrl: string;
  licenseUrl: string;
  attribution: string;
  registration: { id: string; matrix: number[]; [key: string]: unknown };
  mappings: {
    meshId: string; graphNodeId: string; sourceFile: string; sourceObject: string;
    sourceSha256: string; sourceUrl: string;
    sourceTriangleCount?: number; geometryRepresentation?: 'source-mesh' | 'source-surface';
  }[];
}

export function buildRegistry(manifest: AssetManifest, mapping: MappingSnapshot, dataset?: AnatomyDataset, zMapping?: ZAnatomyMapping) {
  return {
    version: '4.0',
    sources: [
      { dataset: mapping.dataset, version: mapping.version, attribution: ATTRIBUTION, licenseUrl: LICENSE_URL, mappingUrl: MAPPING_URL, mappingSha256: mapping.sourceSha256 },
      ...(zMapping ? [{ dataset: zMapping.dataset, version: zMapping.version, attribution: zMapping.attribution, licenseUrl: zMapping.licenseUrl, sourceUrl: zMapping.sourceUrl, registrationId: zMapping.registration.id }] : []),
    ],
    validationScope: 'Structural integrity, source identity and atlas registration checks; no medical or ontology certification.',
    meshes: Object.fromEntries(manifest.meshes.map(mesh => {
      const source = mesh.sourceDataset === 'BodyParts3D'
        ? mapping.mappings.find(item => item.meshId === mesh.meshId)
        : zMapping?.mappings.find(item => item.meshId === mesh.meshId);
      if (!source) throw new Error(`Missing source mapping for ${mesh.meshId}`);
      return [mesh.meshId, {
        graphNodeId: mesh.graphNodeId, name: mesh.name, category: mesh.category,
        system: mesh.system, region: manifest.regionId, layer: mesh.layer,
        sourceDataset: mesh.sourceDataset, sourceVersion: mesh.sourceVersion,
        sourceFile: source.sourceFile,
        sourceName: 'sourceName' in source ? source.sourceName : source.sourceObject,
        ...('sourceParts' in source && source.sourceParts ? { sourceParts: source.sourceParts } : {}),
        ...(mesh.sourceCrop ? { sourceCrop: mesh.sourceCrop } : {}),
        ...(mesh.sourceSha256 ? { sourceSha256: mesh.sourceSha256 } : {}),
        ...(mesh.registrationId ? { registrationId: mesh.registrationId } : {}),
        ...(mesh.geometryRepresentation ? { geometryRepresentation: mesh.geometryRepresentation, sourceTriangleCount: mesh.sourceTriangleCount } : {}),
        sourceUrl: mesh.sourceUrl ?? mapping.sourceUrl,
        licenseUrl: mesh.licenseUrl ?? mapping.licenseUrl,
        attribution: mesh.attribution ?? mapping.attribution,
        mappingStatus: mesh.sourceDataset === 'BodyParts3D' ? 'archive-row-matched' : 'source-object-registered', ontologyValidated: false,
        lod: mesh.lod,
      }];
    })),
    graphNodes: Object.fromEntries((dataset?.structures ?? manifest.meshes).map(node => [node.graphNodeId, {
      fmaId: node.fmaId,
      meshIds: manifest.meshes.filter(mesh => mesh.graphNodeId === node.graphNodeId).map(mesh => mesh.meshId),
    }])),
    ontologies: Object.fromEntries([...new Set((dataset?.structures ?? manifest.meshes).map(node => node.fmaId).filter((id): id is string => Boolean(id)))].map(id => [id, `http://purl.org/sig/ont/fma/fma${id.replace('FMA', '')}`])),
  };
}
export type AssetRegistry = ReturnType<typeof buildRegistry>;
