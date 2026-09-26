import fs from 'node:fs';
import path from 'node:path';
import { Document } from '@gltf-transform/core';
import { cloneDocument, draco, simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { BufferGeometry, Float32BufferAttribute, Matrix4, Mesh, Vector3 } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { handStructures } from '../src/lib/hand-expansion';
import { createIO, documentStats, finiteVector, readJSON, sha256 } from './assets/io';
import type { AssetManifest, AssetMesh, ZAnatomyMapping } from './assets/registry';

const VERSION = '6c7f9016bd5899ac8edafd31b9900c151df42ed6';
const LICENSE = 'https://creativecommons.org/licenses/by-sa/4.0/';
const ATTRIBUTION = 'Z-Anatomy project; PC model collection by Lluís Vinent Juanico and contributors. Licensed under Creative Commons Attribution-ShareAlike 4.0 International.';
const CROP = [-350, -225, 640, -150, 0, 1055];
type Source = { sourceFile: string; sourceUrl: string; sourceSha256: string; bytes: number };
type Canonical = { graphNodeId: string; sourceFile: string; sourceObject: string };
type Registration = ZAnatomyMapping['registration'] & { acceptance: { passed: boolean }; matrixConvention: string };

function cropToRegion(geometry: BufferGeometry) {
  geometry.computeBoundingBox();
  const bounds = [...geometry.boundingBox!.min.toArray(), ...geometry.boundingBox!.max.toArray()];
  if ([0, 1, 2].every(axis => bounds[axis] >= CROP[axis] && bounds[axis + 3] <= CROP[axis + 3])) return { geometry, cropped: false };
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  const positions = flat.getAttribute('position'), normals = flat.getAttribute('normal');
  const keptPositions: number[] = [], keptNormals: number[] = [];
  for (let vertex = 0; vertex < positions.count; vertex += 3) {
    if (![0, 1, 2].every(offset => [0, 1, 2].every(axis => {
      const value = positions.getComponent(vertex + offset, axis);
      return value >= CROP[axis] && value <= CROP[axis + 3];
    }))) continue;
    for (let offset = 0; offset < 3; offset++) for (let axis = 0; axis < 3; axis++) {
      keptPositions.push(positions.getComponent(vertex + offset, axis));
      if (normals) keptNormals.push(normals.getComponent(vertex + offset, axis));
    }
  }
  const result = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(keptPositions, 3));
  if (keptNormals.length) result.setAttribute('normal', new Float32BufferAttribute(keptNormals, 3));
  geometry.dispose();
  if (flat !== geometry) flat.dispose();
  return { geometry: result, cropped: true };
}

export async function importZAnatomy(inputDirectory: string, outputDirectory: string, canonicalPath: string, registrationPath: string, existingManifestPath: string, mappingPath: string, sourcesPath = 'scripts/assets/z-anatomy-sources.json') {
  if (fs.existsSync(outputDirectory) && fs.readdirSync(outputDirectory).length) throw new Error('Output directory must be empty; this importer never overwrites public assets.');
  const sourceIndex = readJSON<{ sourceVersion: string; sources: Source[] }>(sourcesPath);
  if (sourceIndex.sourceVersion !== VERSION) throw new Error('Unpinned source version');
  const registration = readJSON<Registration>(registrationPath);
  if (!registration.acceptance.passed || !finiteVector(registration.matrix, 16) || !registration.matrixConvention.startsWith('column-major')) throw new Error('Verified column-major anatomical registration is required');
  const transform = new Matrix4().fromArray(registration.matrix);
  if (transform.determinant() <= 0) throw new Error('Registration must preserve anatomical laterality');
  const existing = readJSON<AssetManifest>(existingManifestPath);
  if (existing.coordinateScale !== 0.01 || existing.regionCentroid.some((value, i) => value !== [-261.34, -140.69, 756.46][i])) throw new Error('Unexpected target coordinate frame');
  const canonical = readJSON<{ mappings: Canonical[] }>(canonicalPath).mappings;
  // Existing Z-Anatomy bindings are reproducible; preserve established BP3D identities.
  const skippedExisting = canonical.filter(item => existing.meshes.some(mesh => mesh.sourceDataset === 'BodyParts3D' && mesh.graphNodeId === item.graphNodeId));
  const selected = canonical.filter(item => !skippedExisting.includes(item));
  const ids = new Set<string>(), sourceObjects = new Set<string>();
  for (const item of selected) {
    const key = `${item.sourceFile}:${item.sourceObject}`;
    if (ids.has(item.graphNodeId) || sourceObjects.has(key) || !item.sourceObject.endsWith('.r')) throw new Error(`Duplicate or non-right-hand source: ${key}`);
    if (!handStructures.some(node => node.graphNodeId === item.graphNodeId)) throw new Error(`Unknown canonical node: ${item.graphNodeId}`);
    ids.add(item.graphNodeId); sourceObjects.add(key);
  }
  fs.mkdirSync(path.join(outputDirectory, 'models'), { recursive: true });
  fs.mkdirSync(path.join(outputDirectory, 'manifests'), { recursive: true });
  const io = await createIO(true);
  await MeshoptSimplifier.ready;
  const meshes: AssetMesh[] = [], audit = [], excluded = [];
  const mapping: ZAnatomyMapping = {
    dataset: 'Z-Anatomy', version: VERSION,
    sourceUrl: `https://github.com/LluisV/Z-Anatomy/tree/${VERSION}/Resources/Models/FBX`,
    licenseUrl: LICENSE, attribution: ATTRIBUTION, registration, mappings: [],
  };
  for (const sourceFile of new Set(selected.map(item => item.sourceFile))) {
    const source = sourceIndex.sources.find(item => item.sourceFile === sourceFile);
    if (!source || sourceFile !== path.basename(sourceFile) || !/^[a-f0-9]{64}$/.test(source.sourceSha256) || !source.sourceUrl.includes(VERSION)) throw new Error(`Missing pinned source: ${sourceFile}`);
    const bytes = fs.readFileSync(path.join(inputDirectory, sourceFile));
    if (bytes.length !== source.bytes || sha256(bytes) !== source.sourceSha256) throw new Error(`Source checksum mismatch: ${sourceFile}`);
    const scene = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
    scene.updateMatrixWorld(true);
    const sourceMeshes = new Map<string, Mesh>();
    scene.traverse(child => {
      if (!(child instanceof Mesh)) return;
      const name = child.userData.originalName ?? child.name;
      if (!selected.some(item => item.sourceFile === sourceFile && item.sourceObject === name)) return;
      if (sourceMeshes.has(name)) throw new Error(`Ambiguous duplicate source object: ${name}`);
      sourceMeshes.set(name, child);
    });
    for (const item of selected.filter(row => row.sourceFile === sourceFile)) {
      const sourceMesh = sourceMeshes.get(item.sourceObject);
      if (!sourceMesh) throw new Error(`No actual FBX mesh for ${item.sourceObject}`);
      const node = handStructures.find(row => row.graphNodeId === item.graphNodeId)!;
      const meshId = `mesh_z_${item.graphNodeId.toLowerCase()}`;
      let geometry = sourceMesh.geometry.clone().applyMatrix4(sourceMesh.matrixWorld).applyMatrix4(transform);
      const originalTriangles = (geometry.index?.count ?? geometry.getAttribute('position').count) / 3;
      geometry.computeBoundingBox();
      const registeredSourceBounds = [...geometry.boundingBox!.min.toArray(), ...geometry.boundingBox!.max.toArray()];
      const crop = cropToRegion(geometry);
      geometry = crop.geometry;
      if (!geometry.getAttribute('position').count) {
        excluded.push({ ...item, reason: 'No source triangles wholly inside the documented hand/forearm region', registeredSourceBounds });
        geometry.dispose(); continue;
      }
      geometry.computeBoundingBox();
      const box = geometry.boundingBox!;
      if (box.max.x >= 0 || ![...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite)) throw new Error(`Invalid right-hand bounds: ${item.sourceObject}`);
      const center = box.getCenter(new Vector3());
      geometry.translate(-center.x, -center.y, -center.z).scale(existing.coordinateScale, existing.coordinateScale, existing.coordinateScale);
      if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
      const document = new Document(), buffer = document.createBuffer();
      const primitive = document.createPrimitive()
        .setAttribute('POSITION', document.createAccessor().setType('VEC3').setArray(Float32Array.from(geometry.getAttribute('position').array)).setBuffer(buffer))
        .setAttribute('NORMAL', document.createAccessor().setType('VEC3').setArray(Float32Array.from(geometry.getAttribute('normal').array)).setBuffer(buffer));
      if (geometry.index) primitive.setIndices(document.createAccessor().setType('SCALAR').setArray(Uint32Array.from(geometry.index.array)).setBuffer(buffer));
      const model = document.createMesh(item.sourceObject).addPrimitive(primitive).setExtras({ sourceFile, sourceObject: item.sourceObject, sourceSha256: source.sourceSha256, sourceDataset: 'Z-Anatomy', sourceVersion: VERSION, registrationId: registration.id });
      document.createScene('Registered right hand').addChild(document.createNode(meshId).setMesh(model));
      geometry.dispose();
      await document.transform(weld());
      const sourceStats = documentStats(document);
      const sourceTriangleCount = sourceStats.triangles;
      const geometryRepresentation = sourceTriangleCount < 64 ? 'source-surface' as const : 'source-mesh' as const;
      const position = center.toArray().map((value, axis) => (value - existing.regionCentroid[axis]) * existing.coordinateScale);
      const lod = { high: `/models/${meshId}.glb`, medium: `/models/${meshId}_med.glb`, low: `/models/${meshId}_low.glb` };
      const statistics = {} as Record<keyof typeof lod, ReturnType<typeof documentStats> & { bytes: number; sha256: string }>;
      let previous = document;
      for (const [level, ratio] of [['high', 1], ['medium', 0.5], ['low', 0.4]] as const) {
        const variant = cloneDocument(previous);
        // Preserve very small source ligaments instead of collapsing their few faces.
        if (ratio < 1 && sourceStats.triangles >= 64) await variant.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.005 }));
        previous = variant;
        await variant.transform(draco({ method: 'edgebreaker', quantizePosition: 16, quantizeNormal: 10 }));
        const file = path.join(outputDirectory, lod[level].slice(1));
        await io.write(file, variant);
        const decoded = await io.read(file), result = documentStats(decoded);
        const decodedMesh = decoded.getRoot().listMeshes()[0];
        if (decodedMesh.getName() !== item.sourceObject || decodedMesh.getExtras().sourceSha256 !== source.sourceSha256) throw new Error(`Lost provenance in ${file}`);
        if (level === 'high' && result.triangles !== sourceTriangleCount) throw new Error(`High LOD changed source triangle count: ${meshId}`);
        const previousCount = level === 'medium' ? statistics.high.triangles : level === 'low' ? statistics.medium.triangles : sourceStats.triangles;
        if (result.triangles > previousCount) throw new Error(`LOD count increased: ${meshId}/${level}`);
        const output = fs.readFileSync(file);
        statistics[level] = { ...result, bytes: output.length, sha256: sha256(output) };
      }
      const sourceCrop: AssetMesh['sourceCrop'] = crop.cropped ? {
        bounds: CROP, method: 'retain-contained-triangles',
        note: 'Bounds are in registered BodyParts3D millimeters. Retains only complete source triangles inside the right hand/forearm box; proximal boundary is 2.548 mm above the reference ulna. Open cut, no generated cap or thickness.',
      } : undefined;
      const mesh: AssetMesh = {
        meshId, graphNodeId: item.graphNodeId, fmaId: null, name: node.name, category: node.category, system: node.system.name,
        layer: node.category, materialId: `mat_${node.category.toLowerCase()}`,
        sourceDataset: 'Z-Anatomy', sourceVersion: VERSION, sourceFile, sourceObject: item.sourceObject,
        sourceSha256: source.sourceSha256, sourceUrl: source.sourceUrl, licenseUrl: LICENSE, attribution: ATTRIBUTION,
        sourceTriangleCount, geometryRepresentation,
        registrationId: registration.id, ...(sourceCrop ? { sourceCrop } : {}),
        position, boundingBox: statistics.high.bounds.map((value, axis) => value + position[axis % 3]),
        explosionDirection: [0, 0, 0], lod, searchableTerms: [...new Set([...node.searchableTerms, item.sourceObject])], clinicalTags: [],
      };
      meshes.push(mesh);
      mapping.mappings.push({ meshId, graphNodeId: item.graphNodeId, sourceFile, sourceObject: item.sourceObject, sourceSha256: source.sourceSha256, sourceUrl: source.sourceUrl, sourceTriangleCount, geometryRepresentation });
      audit.push({ meshId, graphNodeId: item.graphNodeId, sourceFile, sourceObject: item.sourceObject, sourceSha256: source.sourceSha256,
        originalTriangles, registeredSourceBounds, registeredCenterMm: center.toArray(), sourceTriangles: sourceStats.triangles, sourceTriangleCount, geometryRepresentation,
        sourceRepresentation: 'Exact source object preserved as one selectable unit; no connected-component or individual-digit relabeling.',
        ...(sourceCrop ? { sourceCrop } : {}), lod: statistics });
      console.log(`${meshes.length}: ${item.sourceObject} (${sourceStats.triangles} triangles)`);
    }
    scene.traverse(child => { if (child instanceof Mesh) child.geometry.dispose(); });
  }
  const manifest = { version: '4.0', region: 'HAND', regionId: 'HAND', name: 'Right hand and forearm — Z-Anatomy additions', dataset: 'Z-Anatomy', datasetVersion: VERSION,
    pipelineVersion: '4.0', regionCentroid: existing.regionCentroid, coordinateScale: existing.coordinateScale, coordinateUnit: 'registered BodyParts3D millimeters * coordinateScale', meshes };
  fs.writeFileSync(path.join(outputDirectory, 'manifests/hand_region.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2) + '\n');
  const report = { pipelineVersion: '4.0', dataset: 'Z-Anatomy', sourceVersion: VERSION, sourceUrl: mapping.sourceUrl, licenseUrl: LICENSE, attribution: ATTRIBUTION,
    modifications: 'Selected exact right-sided source objects, applied one verified anatomical registration, optionally retained triangles inside documented regional bounds, recentered without changing anatomical placement, generated three Draco-compressed LODs. No invented geometry or unsupported source-group splitting.',
    transform: 'registered=matrix*FBXLoaderWorldVertex; local=(registered-registeredCenter)*0.01; position=(registeredCenter-[-261.34,-140.69,756.46])*0.01',
    registration, lodPolicy: { high: 1, mediumTarget: 0.5, lowTargetOfMedium: 0.4, maximumRelativeErrorPerStage: 0.005, minimumSourceTrianglesForReduction: 64, note: 'Topological/error constraints may retain more faces; lower LODs approximate the high source geometry.' },
    skippedExisting, excluded, assets: audit };
  fs.writeFileSync(path.join(outputDirectory, 'import-report.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(outputDirectory, 'LICENSE-CC-BY-SA-4.0.txt'), `${ATTRIBUTION}\n${LICENSE}\nSource: ${mapping.sourceUrl}\n\nChanges: ${report.modifications}\nDerived model assets are distributed under CC BY-SA 4.0. The application code is a separate work.\n`);
  return { manifest, report, mapping };
}

async function main() {
  const args = process.argv.slice(2);
  const arg = (name: string, fallback: string) => { const index = args.indexOf(name); return index < 0 ? fallback : args[index + 1]; };
  const base = 'output/hand-expansion/z-anatomy';
  const result = await importZAnatomy(arg('--input', `${base}/source`), arg('--output', `${base}/staged`), arg('--canonical', 'scripts/assets/z-anatomy-canonical-map.json'), arg('--registration', 'scripts/assets/z-anatomy-registration.json'), arg('--existing', 'public/manifests/hand_region.json'), arg('--mapping', 'scripts/assets/z-anatomy-mapping.json'), arg('--sources', 'scripts/assets/z-anatomy-sources.json'));
  console.log(`Staged ${result.manifest.meshes.length} real source objects, ${result.manifest.meshes.length * 3} Draco GLBs; skipped ${result.report.skippedExisting.length} existing bindings and ${result.report.excluded.length} out-of-region objects.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/import_z_anatomy.ts')) main().catch(error => { console.error(error); process.exitCode = 1; });
