import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createIO, documentStats, finiteVector, isUrl, publicFile, readGlbJSON, readJSON } from './assets/io';
import { buildRegistry, type AssetManifest, type AssetRegistry, type MappingSnapshot, type ZAnatomyMapping } from './assets/registry';
import type { AnatomyDataset } from '../src/lib/anatomy-types';

export function validateRegistration(registration: ZAnatomyMapping['registration']): string[] {
  const invalid = ['Invalid Z-Anatomy registration evidence'];
  if (!registration?.id || !finiteVector(registration.matrix, 16)) return invalid;
  const matrix = registration.matrix;
  const determinant = matrix[0] * (matrix[5] * matrix[10] - matrix[9] * matrix[6])
    - matrix[4] * (matrix[1] * matrix[10] - matrix[9] * matrix[2])
    + matrix[8] * (matrix[1] * matrix[6] - matrix[5] * matrix[2]);
  if (determinant <= 0 || matrix[3] !== 0 || matrix[7] !== 0 || matrix[11] !== 0 || matrix[15] !== 1) return invalid;
  const landmarks = registration.landmarks as { sourceCenter: number[]; targetCenter: number[] }[];
  if (!Array.isArray(landmarks) || landmarks.length < 20) return invalid;
  for (const point of landmarks) {
    if (!finiteVector(point.sourceCenter, 3) || !finiteVector(point.targetCenter, 3)) return invalid;
    const error = Math.hypot(...point.targetCenter.map((target, axis) => matrix[axis] * point.sourceCenter[0]
      + matrix[axis + 4] * point.sourceCenter[1] + matrix[axis + 8] * point.sourceCenter[2] + matrix[axis + 12] - target));
    if (error >= 2) return invalid;
  }
  const heldOut = registration.heldOut as { testCount?: number; maxMm?: number };
  const surface = registration.surfaceVerification as { aggregate?: { rmsMm?: number; p95Mm?: number } };
  const acceptance = registration.acceptance as { passed?: boolean };
  if (acceptance?.passed !== true || (heldOut?.testCount ?? 0) < 10 || !Number.isFinite(heldOut.maxMm) || heldOut.maxMm! >= 2
    || !Number.isFinite(surface?.aggregate?.rmsMm) || surface.aggregate!.rmsMm! >= 1
    || !Number.isFinite(surface?.aggregate?.p95Mm) || surface.aggregate!.p95Mm! >= 2) return invalid;
  return [];
}

export function validateOntology(dataset: AnatomyDataset): string[] {
  const issues: string[] = [];
  const nodes = new Map(dataset.structures.map(node => [node.graphNodeId, node]));
  const conditions = new Set(dataset.clinicalConditions.map(node => node.id));
  if (nodes.size !== dataset.structures.length) issues.push('Duplicate graph node IDs');
  if (conditions.size !== dataset.clinicalConditions.length) issues.push('Duplicate clinical condition IDs');
  for (const id of conditions) if (nodes.has(id)) issues.push(`Clinical/anatomy ID collision: ${id}`);
  const meshIds = new Set<string>();
  for (const node of dataset.structures) {
    if (!node.graphNodeId || !node.name.trim() || !node.category || !node.system?.id || !node.system?.name) issues.push(`Missing structure identity: ${node.graphNodeId}`);
    if (node.fmaId !== null && !/^FMA[1-9]\d*$/.test(node.fmaId)) issues.push(`Invalid FMA ID: ${node.graphNodeId}`);
    if (node.snomedId !== null && !/^[1-9]\d{5,17}$/.test(node.snomedId)) issues.push(`Invalid SNOMED ID format: ${node.graphNodeId}`);
    if (node.ontologyValidated !== false) issues.push(`Unsupported ontology certification claim: ${node.graphNodeId}`);
    if (!node.description?.trim() || !node.citation?.title?.trim() || !isUrl(node.citation?.url)) issues.push(`Missing structure provenance: ${node.graphNodeId}`);
    if (node.asset) {
      if (meshIds.has(node.asset.meshId)) issues.push(`Duplicate asset binding: ${node.asset.meshId}`);
      meshIds.add(node.asset.meshId);
      if (!node.asset.sourceDataset || !node.asset.sourceVersion) issues.push(`Missing asset provenance: ${node.graphNodeId}`);
    }
  }
  for (const condition of dataset.clinicalConditions) {
    if (!condition.id || !condition.name?.trim() || !condition.description?.trim() || !condition.citation?.title?.trim() || !isUrl(condition.citation?.url)) issues.push(`Missing clinical provenance: ${condition.id}`);
  }
  const relationIds = new Set<string>();
  const triples = new Set<string>();
  for (const relation of dataset.relationships) {
    const source = nodes.get(relation.source);
    const target = nodes.get(relation.target);
    const triple = `${relation.source}|${relation.type}|${relation.target}`;
    if (!relation.id || relationIds.has(relation.id) || triples.has(triple)) issues.push(`Duplicate/missing relationship identity: ${relation.id}`);
    relationIds.add(relation.id); triples.add(triple);
    if (!source || (!target && !conditions.has(relation.target)) || relation.source === relation.target) issues.push(`Invalid relationship endpoints: ${relation.id}`);
    if (!relation.description?.trim() || !relation.citation?.title?.trim() || !isUrl(relation.citation?.url)) issues.push(`Missing relationship provenance: ${relation.id}`);
    const validType = {
      ARTICULATES_WITH: source?.category === 'Bone' && target?.category === 'Bone',
      INNERVATES: source?.category === 'Nerve' && ['Muscle', 'Skin', 'Joint', 'Fat'].includes(target?.category ?? ''),
      SUPPLIES: source?.category === 'Artery' && Boolean(target),
      ORIGINATES_ON: source?.category === 'Muscle' && ['Bone', 'Fascia', 'Tendon', 'Ligament'].includes(target?.category ?? ''),
      INSERTS_ON: ['Muscle', 'Tendon'].includes(source?.category ?? '') && ['Bone', 'Fascia', 'Tendon', 'Ligament'].includes(target?.category ?? ''),
      AFFECTED_BY: Boolean(source) && conditions.has(relation.target),
      PART_OF: Boolean(source && target),
      CONTINUES_AS: Boolean(source && target) && ((source?.category === target?.category && ['Nerve', 'Artery', 'Vein', 'Skin'].includes(source?.category ?? '')) || source?.category === 'Tendon'),
      ATTACHES_TO: ['Muscle', 'Tendon', 'Ligament', 'Fascia'].includes(source?.category ?? '') && ['Bone', 'Muscle', 'Tendon', 'Ligament', 'Fascia', 'Joint', 'Skin'].includes(target?.category ?? ''),
      PASSES_THROUGH: ['Tendon', 'Nerve', 'Artery', 'Vein'].includes(source?.category ?? '') && ['Space', 'Fascia', 'Ligament', 'Tendon'].includes(target?.category ?? ''),
      DRAINS_TO: source?.category === 'Vein' && target?.category === 'Vein',
      BRANCHES_FROM: source?.category === target?.category && ['Nerve', 'Artery', 'Vein'].includes(source?.category ?? ''),
      COMMUNICATES_WITH: source?.category === target?.category && ['Nerve', 'Artery', 'Vein'].includes(source?.category ?? ''),
    }[relation.type];
    if (!validType) issues.push(`Invalid relationship type/category: ${relation.id}`);
  }
  if (dataset.metadata.structureCount !== dataset.structures.length || dataset.metadata.renderableCount !== meshIds.size || dataset.metadata.relationshipCount !== dataset.relationships.length) issues.push('Dataset counts do not match content');
  return issues;
}

export async function validateAssets(options: { root?: string; dataset: AnatomyDataset }) {
  const root = options.root ?? process.cwd();
  const issues = validateOntology(options.dataset);
  const warnings: string[] = [];
  const publicDir = path.join(root, 'public');
  const global = readJSON<{ regions: string[]; manifests: Record<string, string> }>(path.join(publicDir, 'manifests/global_manifest.json'));
  const registry = readJSON<AssetRegistry>(path.join(publicDir, 'manifests/registry.json'));
  const mapping = readJSON<MappingSnapshot>(path.join(root, 'scripts/assets/bodyparts3d-mapping.json'));
  const zFile = path.join(root, 'scripts/assets/z-anatomy-mapping.json');
  const zMapping = fs.existsSync(zFile) ? readJSON<ZAnatomyMapping>(zFile) : undefined;
  if (!isUrl(mapping.sourceUrl) || !isUrl(mapping.licenseUrl) || !mapping.attribution || !/^[a-f0-9]{64}$/.test(mapping.sourceSha256)) issues.push('Missing source mapping provenance');
  if (new Set(mapping.mappings.map(item => item.meshId)).size !== mapping.mappings.length) issues.push('Duplicate source mappings');
  if (zMapping && (!isUrl(zMapping.sourceUrl) || !isUrl(zMapping.licenseUrl) || !zMapping.attribution || !finiteVector(zMapping.registration?.matrix, 16) || !zMapping.registration.id)) issues.push('Missing Z-Anatomy source/registration provenance');
  if (zMapping) issues.push(...validateRegistration(zMapping.registration));
  if (zMapping && new Set(zMapping.mappings.map(item => item.meshId)).size !== zMapping.mappings.length) issues.push('Duplicate Z-Anatomy source mappings');
  if (new Set(global.regions).size !== global.regions.length || Object.keys(global.manifests).length !== global.regions.length) issues.push('Invalid global region registry');
  const io = await createIO();
  const allMeshIds = new Set<string>();
  const allGraphIds = new Set<string>();
  const allPaths = new Set<string>();
  const graph = new Map(options.dataset.structures.map(node => [node.graphNodeId, node]));
  let assetsChecked = 0;
  let totalTriangles = 0;
  for (const region of global.regions) {
    const manifest = readJSON<AssetManifest>(publicFile(publicDir, global.manifests[region]));
    if (manifest.regionId !== region || !Array.isArray(manifest.meshes) || !manifest.meshes.length) issues.push(`Invalid region manifest: ${region}`);
    if (!finiteVector(manifest.regionCentroid, 3) || !Number.isFinite(manifest.coordinateScale) || manifest.coordinateScale <= 0) issues.push(`Invalid coordinate metadata: ${region}`);
    for (const mesh of manifest.meshes) {
      const label = mesh.meshId;
      if (!/^mesh_[a-z0-9_]+$/.test(label) || allMeshIds.has(label)) issues.push(`Duplicate/invalid mesh ID: ${label}`);
      allMeshIds.add(label);
      if (!mesh.graphNodeId || allGraphIds.has(mesh.graphNodeId)) issues.push(`Duplicate/missing graph binding: ${label}`);
      allGraphIds.add(mesh.graphNodeId);
      if (!(mesh.fmaId === null && mesh.sourceDataset === 'Z-Anatomy') && !/^FMA[1-9]\d*$/.test(mesh.fmaId ?? '')) issues.push(`Invalid manifest FMA ID: ${label}`);
      if (!finiteVector(mesh.position, 3) || !finiteVector(mesh.explosionDirection, 3) || !finiteVector(mesh.boundingBox, 6) || mesh.boundingBox.slice(0, 3).some((min, axis) => min >= mesh.boundingBox[axis + 3])) issues.push(`Invalid position/bounds: ${label}`);
      const expectedVersion = mesh.sourceDataset === 'BodyParts3D' ? mapping.version : mesh.sourceDataset === 'Z-Anatomy' ? zMapping?.version : undefined;
      if (!expectedVersion || mesh.sourceVersion !== expectedVersion) issues.push(`Source version mismatch: ${label}`);
      const node = graph.get(mesh.graphNodeId);
      if (!node || node.fmaId !== mesh.fmaId || node.asset?.meshId !== label || node.asset?.glbPath !== mesh.lod.high || node.asset?.manifestPath !== global.manifests[region] || node.category !== mesh.category || node.asset.sourceDataset !== mesh.sourceDataset || node.asset.sourceVersion !== mesh.sourceVersion) issues.push(`Asset-to-graph mismatch: ${label}`);
      const source = mapping.mappings.find(item => item.meshId === label);
      const zSource = zMapping?.mappings.find(item => item.meshId === label);
      const sourceParts = source ? [source, ...(source.sourceParts ?? [])] : [];
      if (mesh.sourceDataset === 'BodyParts3D') {
        if (!source || source.fmaId !== mesh.fmaId || source.graphNodeId !== mesh.graphNodeId || sourceParts.some(part => part.sourceRow !== `${source.fmaId}\t${part.sourceName}\t${part.sourceFile.replace(/\.obj$/, '')}` || !/^FJ\d+M?\.obj$/.test(part.sourceFile))) issues.push(`Invalid archive mapping: ${label}`);
        const actualParts = mesh.sourceFile ? [{ sourceFile: mesh.sourceFile, sourceSha256: mesh.sourceSha256 }, ...(mesh.sourceParts ?? [])] : [];
        if (actualParts.length && (actualParts.length !== sourceParts.length || actualParts.some(part => !sourceParts.some(row => row.sourceFile === part.sourceFile) || !/^[a-f0-9]{64}$/.test(part.sourceSha256 ?? '')))) issues.push(`Invalid multipart source provenance: ${label}`);
      } else if (!zSource || zSource.graphNodeId !== mesh.graphNodeId || zSource.sourceFile !== mesh.sourceFile || zSource.sourceObject !== mesh.sourceObject || zSource.sourceSha256 !== mesh.sourceSha256 || !/^[a-f0-9]{64}$/.test(mesh.sourceSha256 ?? '') || mesh.registrationId !== zMapping?.registration.id || mesh.licenseUrl !== zMapping?.licenseUrl || mesh.attribution !== zMapping?.attribution || !isUrl(mesh.sourceUrl)) issues.push(`Invalid registered source provenance: ${label}`);
      if (mesh.sourceDataset === 'Z-Anatomy' && (!Number.isInteger(mesh.sourceTriangleCount) || (mesh.sourceTriangleCount ?? 0) <= 0
        || mesh.sourceTriangleCount !== zSource?.sourceTriangleCount || mesh.geometryRepresentation !== zSource?.geometryRepresentation
        || mesh.geometryRepresentation !== ((mesh.sourceTriangleCount ?? 0) < 64 ? 'source-surface' : 'source-mesh'))) issues.push(`Invalid source geometry representation: ${label}`);
      if (mesh.sourceCrop && (mesh.sourceCrop.method !== 'retain-contained-triangles' || !finiteVector(mesh.sourceCrop.bounds, 6) || !mesh.sourceCrop.note || mesh.sourceCrop.bounds.slice(0, 3).some((min, i) => min >= mesh.sourceCrop!.bounds[i + 3]))) issues.push(`Invalid source crop: ${label}`);
      const lodCounts: number[] = [];
      for (const level of ['high', 'medium', 'low'] as const) {
        try {
          const url = mesh.lod?.[level];
          if (!url || !url.endsWith('.glb') || allPaths.has(url)) throw new Error('Missing/duplicate GLB path');
          allPaths.add(url);
          const file = publicFile(publicDir, url);
          const json = readGlbJSON(file);
          if (!json.extensionsRequired?.includes('KHR_draco_mesh_compression') || !json.meshes?.every(item => item.primitives.every(primitive => primitive.extensions?.KHR_draco_mesh_compression))) throw new Error('Draco compression is required for every primitive');
          const expectedNames = mesh.sourceDataset === 'BodyParts3D' ? sourceParts.map(part => part.sourceFile) : [zSource?.sourceObject];
          if (!expectedNames.length || expectedNames.some(name => !name || !json.meshes?.some(item => item.name === name)) || json.meshes?.some(item => !expectedNames.includes(item.name))) throw new Error('GLB source file identity disagrees with source mapping');
          if (mesh.sourceSha256 && json.meshes?.some(item => {
            const expectedHash = item.name === mesh.sourceFile || item.name === mesh.sourceObject ? mesh.sourceSha256 : mesh.sourceParts?.find(part => part.sourceFile === item.name)?.sourceSha256;
            return item.extras?.sourceSha256 !== expectedHash;
          })) throw new Error('GLB source checksum disagrees with provenance');
          const stats = documentStats(await io.read(file));
          lodCounts.push(stats.triangles);
          if (level === 'high') {
            totalTriangles += stats.triangles;
            if (mesh.sourceDataset === 'Z-Anatomy' && stats.triangles !== mesh.sourceTriangleCount) issues.push(`Decoded high LOD differs from source triangle count: ${label}`);
            // Small source ligaments can be deliberately thin atlas surfaces.
            // Only a verified source count/identity permits this exception; old
            // unproven placeholder geometry remains invalid.
            if (stats.triangles <= 12 && !(mesh.sourceDataset === 'Z-Anatomy' && mesh.geometryRepresentation === 'source-surface'
              && zSource?.geometryRepresentation === 'source-surface' && stats.triangles === mesh.sourceTriangleCount
              && stats.triangles === zSource.sourceTriangleCount)) issues.push(`Placeholder-sized high LOD geometry: ${label}`);
            if (finiteVector(mesh.position, 3) && finiteVector(mesh.boundingBox, 6)) {
              const world = stats.bounds.map((value, i) => value + mesh.position[i % 3]);
              // Existing manifest uses 5 decimal places; allow Draco quantization error.
              const tolerance = Math.max(0.0002, ...mesh.boundingBox.slice(0, 3).map((min, i) => (mesh.boundingBox[i + 3] - min) * 0.002));
              if (world.some((value, i) => Math.abs(value - mesh.boundingBox[i]) > tolerance)) issues.push(`Decoded high LOD bounds disagree with manifest: ${label}`);
            }
          }
          assetsChecked++;
        } catch (error) { issues.push(`${label} ${level}: ${error instanceof Error ? error.message : String(error)}`); }
      }
      if (lodCounts.length === 3 && (lodCounts[1] > lodCounts[0] || lodCounts[2] > lodCounts[1])) issues.push(`LOD triangle counts increase: ${label}`);
      if (lodCounts.length === 3 && lodCounts[0] === lodCounts[2]) warnings.push(`LOD simplification reached topology/error limit: ${label}`);
    }
    if (global.regions.length === 1 && JSON.stringify(registry) !== JSON.stringify(buildRegistry(manifest, mapping, options.dataset, zMapping))) issues.push('Registry is stale. Run npm run assets:registry');
  }
  for (const node of options.dataset.structures) if (node.asset && !allMeshIds.has(node.asset.meshId)) issues.push(`Graph asset missing from manifest: ${node.graphNodeId}`);
  if (mapping.mappings.length + (zMapping?.mappings.length ?? 0) !== allMeshIds.size) issues.push('Source mapping coverage does not match renderable assets');
  return { issues, warnings, meshCount: allMeshIds.size, assetsChecked, totalTriangles, relationshipCount: options.dataset.relationships.length };
}

async function main() {
  const { getBundledDataset } = await import(pathToFileURL(path.resolve('src/lib/anatomy-data.ts')).href) as { getBundledDataset(): AnatomyDataset };
  const report = await validateAssets({ dataset: getBundledDataset() });
  console.log(JSON.stringify(report, null, 2));
  if (report.issues.length) process.exitCode = 1;
  else console.log('PASS: asset integrity, graph bindings and ontology provenance. This is not medical certification.');
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/validate_assets.ts')) main().catch(error => { console.error(error); process.exitCode = 1; });
