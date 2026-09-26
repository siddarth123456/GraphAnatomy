import { ATTRIBUTION, LICENSE_URL, MAPPING_URL } from './io';
import type { AnatomyDataset } from '../../src/lib/anatomy-types';

export interface AssetMesh {
  meshId: string;
  graphNodeId: string;
  fmaId: string;
  name: string;
  category: string;
  system: string;
  layer: string;
  sourceDataset: string;
  sourceVersion: string;
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

export function buildRegistry(manifest: AssetManifest, mapping: MappingSnapshot, dataset?: AnatomyDataset) {
  return {
    version: '3.0',
    source: { dataset: manifest.dataset, version: manifest.datasetVersion, attribution: ATTRIBUTION, licenseUrl: LICENSE_URL, mappingUrl: MAPPING_URL, mappingSha256: mapping.sourceSha256 },
    validationScope: 'Structural integrity and archive FMA-to-file consistency only; no medical or ontology certification.',
    meshes: Object.fromEntries(manifest.meshes.map(mesh => {
      const source = mapping.mappings.find(item => item.meshId === mesh.meshId);
      if (!source) throw new Error(`Missing source mapping for ${mesh.meshId}`);
      return [mesh.meshId, {
        graphNodeId: mesh.graphNodeId, name: mesh.name, category: mesh.category,
        system: mesh.system, region: manifest.regionId, layer: mesh.layer,
        sourceDataset: mesh.sourceDataset, sourceVersion: mesh.sourceVersion,
        sourceFile: source.sourceFile, sourceName: source.sourceName,
        mappingStatus: 'archive-row-matched', ontologyValidated: false,
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
