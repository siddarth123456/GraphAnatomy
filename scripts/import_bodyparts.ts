import fs from 'node:fs';
import path from 'node:path';
import { Document } from '@gltf-transform/core';
import { cloneDocument, draco, simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { Box3, BufferGeometry, Float32BufferAttribute, Mesh, Vector3 as ThreeVector3 } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { ATTRIBUTION, LICENSE_URL, createIO, documentStats, finiteVector, isUrl, readJSON, sha256, type Vector3 } from './assets/io';
import type { MappingSnapshot } from './assets/registry';

export interface ImportConfig {
  dataset: 'BodyParts3D';
  sourceVersion: string;
  sourceUrl: string;
  regionId: string;
  regionName: string;
  regionCentroid: Vector3;
  coordinateScale: number;
  meshes: {
    meshId: string; graphNodeId: string; fmaId: string; name: string;
    category: string; system: string; layer: string; materialId: string;
    sourceFile: string; sha256: string;
    sourceParts?: { sourceFile: string; sha256: string }[];
    sourceCrop?: { bounds: [number, number, number, number, number, number]; method: 'retain-contained-triangles'; note: string };
  }[];
}

export async function importBodyParts(config: ImportConfig, inputDirectory: string, outputDirectory: string, mapping: MappingSnapshot) {
  if (config.dataset !== 'BodyParts3D' || config.sourceVersion !== mapping.version || !config.regionId || !isUrl(config.sourceUrl) || !finiteVector(config.regionCentroid, 3) || !Number.isFinite(config.coordinateScale) || config.coordinateScale <= 0 || !config.meshes.length) throw new Error('Invalid BodyParts3D import configuration');
  const seen = new Set<string>();
  const records = config.meshes.map(item => {
    if (!/^mesh_[a-z0-9_]+$/.test(item.meshId) || !/^FJ\d+M?\.obj$/.test(item.sourceFile) || !/^FMA[1-9]\d*$/.test(item.fmaId)) throw new Error(`Invalid identity: ${item.meshId}`);
    if (!item.name || !item.category || !item.system || !item.layer || !item.materialId || !item.graphNodeId) throw new Error(`Incomplete metadata: ${item.meshId}`);
    if (item.sourceCrop && (item.sourceCrop.method !== 'retain-contained-triangles' || !finiteVector(item.sourceCrop.bounds, 6) || !item.sourceCrop.note || ![0, 1, 2].every(axis => item.sourceCrop!.bounds[axis] < item.sourceCrop!.bounds[axis + 3]))) throw new Error(`Invalid source crop: ${item.meshId}`);
    for (const id of [item.meshId, item.graphNodeId]) {
      if (seen.has(id)) throw new Error(`Duplicate import identity: ${id}`);
      seen.add(id);
    }
    const source = mapping.mappings.find(row => row.meshId === item.meshId && row.graphNodeId === item.graphNodeId && row.fmaId === item.fmaId);
    const mappedParts = source ? [source, ...(source.sourceParts ?? [])] : [];
    const parts = [{ sourceFile: item.sourceFile, sha256: item.sha256 }, ...(item.sourceParts ?? [])];
    if (mappedParts.length !== parts.length) throw new Error(`FMA/source pair absent from checked archive mapping: ${item.meshId}`);
    const sources = parts.map(part => {
      if (!/^FJ\d+M?\.obj$/.test(part.sourceFile) || seen.has(part.sourceFile)) throw new Error(`Duplicate/invalid source identity: ${part.sourceFile}`);
      seen.add(part.sourceFile);
      if (!mappedParts.some(row => row.sourceFile === part.sourceFile)) throw new Error(`FMA/source pair absent from checked archive mapping: ${item.meshId}`);
      const bytes = fs.readFileSync(path.join(inputDirectory, part.sourceFile));
      if (!/^[a-f0-9]{64}$/.test(part.sha256) || sha256(bytes) !== part.sha256) throw new Error(`Source checksum mismatch: ${part.sourceFile}`);
      return { ...part, bytes };
    });
    return { item, sources };
  });
  // Refuse to overwrite existing output. Review the generated manifest before publishing it.
  if (fs.existsSync(outputDirectory) && fs.readdirSync(outputDirectory).length) throw new Error('Output directory must be empty');
  fs.mkdirSync(path.join(outputDirectory, 'models'), { recursive: true });
  fs.mkdirSync(path.join(outputDirectory, 'manifests'), { recursive: true });
  const io = await createIO(true);
  await MeshoptSimplifier.ready;
  const meshes = [];
  const audit = [];
  for (const { item, sources } of records) {
    const geometries: { source: typeof sources[number]; geometry: BufferGeometry }[] = [];
    for (const source of sources) {
      const object = new OBJLoader().parse(source.bytes.toString('utf8'));
      object.updateMatrixWorld(true);
      object.traverse(child => {
        if (!(child instanceof Mesh)) return;
        let geometry = child.geometry.clone().applyMatrix4(child.matrixWorld);
        if (item.sourceCrop) {
          const flat = geometry.index ? geometry.toNonIndexed() : geometry;
          const positions = flat.getAttribute('position');
          const normals = flat.getAttribute('normal');
          const keptPositions: number[] = [], keptNormals: number[] = [];
          const crop = item.sourceCrop.bounds;
          for (let vertex = 0; vertex < positions.count; vertex += 3) {
            const inside = [0, 1, 2].every(offset => [0, 1, 2].every(axis => {
              const value = positions.getComponent(vertex + offset, axis);
              return value >= crop[axis] && value <= crop[axis + 3];
            }));
            if (!inside) continue;
            for (let offset = 0; offset < 3; offset++) for (let axis = 0; axis < 3; axis++) {
              keptPositions.push(positions.getComponent(vertex + offset, axis));
              if (normals) keptNormals.push(normals.getComponent(vertex + offset, axis));
            }
          }
          geometry.dispose();
          if (flat !== geometry) flat.dispose();
          geometry = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(keptPositions, 3));
          if (keptNormals.length) geometry.setAttribute('normal', new Float32BufferAttribute(keptNormals, 3));
        }
        if (geometry.getAttribute('position').count) geometries.push({ source, geometry });
        else geometry.dispose();
      });
    }
    const bounds = new Box3();
    for (const { geometry } of geometries) {
      geometry.computeBoundingBox();
      bounds.union(geometry.boundingBox!);
    }
    const center = bounds.getCenter(new ThreeVector3());
    if (bounds.isEmpty() || ![...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)) throw new Error(`Empty/non-finite OBJ: ${item.sourceFile}`);
    const document = new Document();
    const buffer = document.createBuffer();
    const scene = document.createScene(config.regionName);
    for (const { source, geometry } of geometries) {
      geometry.translate(-center.x, -center.y, -center.z);
      geometry.scale(config.coordinateScale, config.coordinateScale, config.coordinateScale);
      if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
      const positions = geometry.getAttribute('position');
      const normals = geometry.getAttribute('normal');
      const primitive = document.createPrimitive()
        .setAttribute('POSITION', document.createAccessor().setType('VEC3').setArray(Float32Array.from(positions.array)).setBuffer(buffer))
        .setAttribute('NORMAL', document.createAccessor().setType('VEC3').setArray(Float32Array.from(normals.array)).setBuffer(buffer));
      if (geometry.index) primitive.setIndices(document.createAccessor().setType('SCALAR').setArray(Uint32Array.from(geometry.index.array)).setBuffer(buffer));
      const mesh = document.createMesh(source.sourceFile).addPrimitive(primitive).setExtras({ sourceFile: source.sourceFile, sourceSha256: source.sha256, fmaId: item.fmaId });
      scene.addChild(document.createNode(item.meshId).setMesh(mesh));
      geometry.dispose();
    }
    await document.transform(weld());
    const sourceStats = documentStats(document);
    const position = center.toArray().map((value, axis) => (value - config.regionCentroid[axis]) * config.coordinateScale) as Vector3;
    const lod = { high: `/models/${item.meshId}.glb`, medium: `/models/${item.meshId}_med.glb`, low: `/models/${item.meshId}_low.glb` };
    let previous = document;
    const statistics = {} as Record<keyof typeof lod, ReturnType<typeof documentStats> & { bytes: number; sha256: string }>;
    for (const [level, ratio] of [['high', 1], ['medium', 0.5], ['low', 0.4]] as const) {
      const variant = cloneDocument(previous);
      if (ratio < 1) await variant.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.01 }));
      previous = variant;
      await variant.transform(draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 10 }));
      const file = path.join(outputDirectory, lod[level].slice(1));
      await io.write(file, variant);
      const result = documentStats(await io.read(file));
      const previousCount = level === 'medium' ? statistics.high.triangles : level === 'low' ? statistics.medium.triangles : sourceStats.triangles;
      if (result.triangles > previousCount) throw new Error(`LOD triangle count increased: ${item.meshId} ${level}`);
      const output = fs.readFileSync(file);
      statistics[level] = { ...result, bytes: output.length, sha256: sha256(output) };
    }
    const boundingBox = statistics.high.bounds.map((value, axis) => value + position[axis % 3]);
    meshes.push({ meshId: item.meshId, graphNodeId: item.graphNodeId, fmaId: item.fmaId, name: item.name, category: item.category, system: item.system,
      sourceDataset: config.dataset, sourceVersion: config.sourceVersion, sourceFile: item.sourceFile, sourceSha256: item.sha256,
      ...(item.sourceParts?.length ? { sourceParts: item.sourceParts.map(part => ({ sourceFile: part.sourceFile, sourceSha256: part.sha256 })) } : {}),
      ...(item.sourceCrop ? { sourceCrop: item.sourceCrop } : {}),
      position, boundingBox, layer: item.layer, materialId: item.materialId, lod,
      explosionDirection: [0, 0, 0], searchableTerms: [item.name, item.fmaId], clinicalTags: [],
    });
    audit.push({ meshId: item.meshId, sourceFile: item.sourceFile, sourceSha256: item.sha256,
      ...(item.sourceParts?.length ? { sourceParts: item.sourceParts.map(part => ({ sourceFile: part.sourceFile, sourceSha256: part.sha256 })) } : {}),
      ...(item.sourceCrop ? { sourceCrop: item.sourceCrop } : {}),
      sourceCenter: center.toArray(), sourceTriangles: sourceStats.triangles, lod: statistics });
  }
  const manifest = { version: '3.0', region: config.regionId, regionId: config.regionId, name: config.regionName,
    dataset: config.dataset, datasetVersion: config.sourceVersion, pipelineVersion: '3.0',
    regionCentroid: config.regionCentroid, coordinateScale: config.coordinateScale, coordinateUnit: 'source millimeters * coordinateScale', meshes };
  fs.writeFileSync(path.join(outputDirectory, 'manifests', `${config.regionId.toLowerCase()}_region.json`), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(outputDirectory, 'import-report.json'), JSON.stringify({ pipelineVersion: '3.0', sourceUrl: config.sourceUrl,
    attribution: ATTRIBUTION, licenseUrl: LICENSE_URL, mappingUrl: mapping.sourceUrl, mappingSha256: mapping.sourceSha256,
    transform: 'local=(source-sourceCenter)*scale; position=(sourceCenter-regionCentroid)*scale',
    lodPolicy: { high: 1, medium: 0.5, low: 0.2, maximumRelativeErrorPerStage: 0.01, note: 'Medium targets 50% of high; low targets 40% of medium (20% of high). Staged reduction ensures monotonic counts; errors accumulate and topology/error constraints may retain more triangles.' },
    scope: 'Conversion and archive mapping checks. No clinical/ontology certification.', assets: audit }, null, 2) + '\n');
  return { manifest, audit };
}

async function main() {
  const args = process.argv.slice(2);
  const argument = (name: string) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
  const configPath = argument('--config');
  const input = argument('--input');
  const output = argument('--output');
  if (!configPath || !input || !output) throw new Error('Usage: npm run assets:import -- --config <json> --input <OBJ directory> --output <empty output directory>');
  const result = await importBodyParts(readJSON<ImportConfig>(configPath), path.resolve(input), path.resolve(output), readJSON<MappingSnapshot>('scripts/assets/bodyparts3d-mapping.json'));
  console.log(`Imported ${result.manifest.meshes.length} BodyParts3D structures with three Draco LODs each into ${path.resolve(output)}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/import_bodyparts.ts')) main().catch(error => { console.error(error); process.exitCode = 1; });
