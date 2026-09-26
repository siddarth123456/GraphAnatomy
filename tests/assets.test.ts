import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { getBundledDataset } from '../src/lib/anatomy-data';
import { validateAssets, validateOntology } from '../scripts/validate_assets';
import { importBodyParts, type ImportConfig } from '../scripts/import_bodyparts';
import { createIO, documentStats, publicFile, readGlbJSON, readJSON } from '../scripts/assets/io';
import type { AssetManifest, MappingSnapshot } from '../scripts/assets/registry';

const dataset = getBundledDataset();

test('all published LODs decode and agree with graph bindings, source rows and registry', async () => {
  const report = await validateAssets({ dataset });
  assert.deepEqual(report.issues, []);
  assert.equal(report.assetsChecked, 93);
});

test('ontology validation rejects duplicate IDs, dangling relationships, invalid IDs and unsupported certification', () => {
  const broken = structuredClone(dataset);
  broken.structures.push(structuredClone(broken.structures[0]));
  broken.structures[0].ontologyValidated = true;
  broken.structures[0].fmaId = 'not-FMA';
  broken.structures[1].snomedId = 'garbage';
  broken.relationships[0].target = 'missing-node';
  broken.relationships[1].citation.url = '';
  broken.relationships.push(structuredClone(broken.relationships[1]));
  const issues = validateOntology(broken).join('\n');
  for (const expected of ['Duplicate graph node', 'Duplicate asset binding', 'Invalid FMA', 'Invalid SNOMED', 'Unsupported ontology certification', 'Invalid relationship endpoints', 'Missing relationship provenance', 'Duplicate/missing relationship']) assert.ok(issues.includes(expected), expected);
});

test('asset validation fails on missing LODs, finite but wrong bounds, duplicate identities and stale registry', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'graphanatomy-invalid-assets-'));
  try {
    fs.mkdirSync(path.join(root, 'scripts/assets'), { recursive: true });
    fs.cpSync('public/manifests', path.join(root, 'public/manifests'), { recursive: true });
    fs.cpSync('public/models', path.join(root, 'public/models'), { recursive: true });
    fs.copyFileSync('scripts/assets/bodyparts3d-mapping.json', path.join(root, 'scripts/assets/bodyparts3d-mapping.json'));
    const file = path.join(root, 'public/manifests/hand_region.json');
    const manifest = readJSON<AssetManifest>(file);
    manifest.meshes[0].lod.low = '/models/missing.glb';
    manifest.meshes[1].boundingBox[0] -= 1;
    manifest.meshes[2].meshId = manifest.meshes[3].meshId;
    fs.writeFileSync(file, JSON.stringify(manifest));
    const report = await validateAssets({ root, dataset });
    const issues = report.issues.join('\n');
    for (const expected of ['missing.glb', 'bounds disagree', 'Duplicate/invalid mesh ID', 'Registry is stale', 'Asset-to-graph mismatch']) assert.ok(issues.includes(expected), expected);
    fs.writeFileSync(path.join(root, 'public/models/bad.glb'), Buffer.from('not a GLB'));
    assert.throws(() => readGlbJSON(path.join(root, 'public/models/bad.glb')), /Invalid GLB/);
    assert.throws(() => publicFile(path.join(root, 'public'), '/../private.glb'), /escapes/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('real BodyParts3D OBJ roundtrips to centered, scaled, compressed LODs with source hashes', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'graphanatomy-import-test-'));
  try {
    const config = readJSON<ImportConfig>('tests/fixtures/bodyparts3d/import-config.json');
    const mapping = readJSON<MappingSnapshot>('scripts/assets/bodyparts3d-mapping.json');
    const { manifest, audit } = await importBodyParts(config, 'tests/fixtures/bodyparts3d', path.join(root, 'output'), mapping);
    const io = await createIO();
    const mesh = manifest.meshes[0];
    const counts = [];
    for (const level of ['high', 'medium', 'low'] as const) {
      const file = path.join(root, 'output', mesh.lod[level]);
      assert.ok(readGlbJSON(file).extensionsRequired?.includes('KHR_draco_mesh_compression'));
      const stats = documentStats(await io.read(file));
      counts.push(stats.triangles);
      assert.equal(audit[0].lod[level].sha256.length, 64);
      if (level === 'high') {
        const extent = Math.max(...stats.bounds.slice(0, 3).map((min, axis) => stats.bounds[axis + 3] - min));
        for (let axis = 0; axis < 3; axis++) {
          assert.ok(Math.abs(stats.bounds[axis] + stats.bounds[axis + 3]) < extent * 0.002, 'Geometry centered in local space');
          assert.ok(Math.abs(mesh.position[axis] - (audit[0].sourceCenter[axis] - config.regionCentroid[axis]) * config.coordinateScale) < 1e-8, 'Position preserves source anatomy assembly');
          assert.ok(Math.abs(stats.bounds[axis] + mesh.position[axis] - mesh.boundingBox[axis]) < 1e-8);
        }
      }
    }
    assert.ok(counts[0] > counts[1] && counts[1] > counts[2], 'Real LOD triangle reductions');
    const badConfig = structuredClone(config);
    badConfig.meshes[0].sha256 = '0'.repeat(64);
    await assert.rejects(importBodyParts(badConfig, 'tests/fixtures/bodyparts3d', path.join(root, 'bad'), mapping), /checksum mismatch/);
    badConfig.meshes[0].sha256 = config.meshes[0].sha256;
    badConfig.meshes[0].fmaId = 'FMA1';
    await assert.rejects(importBodyParts(badConfig, 'tests/fixtures/bodyparts3d', path.join(root, 'bad'), mapping), /absent from checked archive mapping/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
