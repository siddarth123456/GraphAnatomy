import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getBundledDataset } from '../src/lib/anatomy-data';
import { handCoverageChecklist } from '../src/lib/hand-expansion';
import { validateRegistration } from '../scripts/validate_assets';
import { readJSON } from '../scripts/assets/io';
import type { ZAnatomyMapping } from '../scripts/assets/registry';

const dataset = getBundledDataset();
const nodes = new Map(dataset.structures.map(node => [node.graphNodeId, node]));

test('gross hand coverage contains the complete conventional bone and muscle sets', () => {
  // These domain counts are independent of the available mesh inventory.
  for (const [group, count] of Object.entries({ 'hand-bones': 27, 'forearm-context': 2, 'thumb-sesamoids': 2,
    'intrinsic-muscles': 19, 'variable-intrinsic-muscle': 1, 'extrinsic-muscles': 15, 'extrinsic-tendons': 24 })) {
    assert.equal(handCoverageChecklist[group].length, count, group);
  }
  const requiredIntrinsic = ['ABDUCTOR_POLLICIS_BREVIS', 'FLEXOR_POLLICIS_BREVIS', 'OPPONENS_POLLICIS', 'ADDUCTOR_POLLICIS',
    'ABDUCTOR_DIGITI_MINIMI', 'FLEXOR_DIGITI_MINIMI_BREVIS', 'OPPONENS_DIGITI_MINIMI', 'PALMARIS_BREVIS',
    ...[1, 2, 3, 4].map(number => `LUMBRICAL_${number}`), ...[1, 2, 3, 4].map(number => `DORSAL_INTEROSSEOUS_${number}`),
    ...['INDEX_FINGER', 'RING_FINGER', 'LITTLE_FINGER'].map(digit => `PALMAR_INTEROSSEOUS_${digit}`)];
  for (const id of requiredIntrinsic) assert.ok(nodes.has(`MUSCLE_${id}`), id);
  for (const ids of Object.values(handCoverageChecklist)) for (const id of ids) assert.ok(nodes.has(id), id);
  const linked = new Set(dataset.relationships.flatMap(edge => [edge.source, edge.target]));
  for (const node of dataset.structures) assert.ok(linked.has(node.graphNodeId), `Isolated catalog entry: ${node.graphNodeId}`);
});

test('new real sources are bound while grouped and unavailable anatomy remains truthful', () => {
  assert.equal(dataset.structures.filter(node => node.asset?.sourceDataset === 'BodyParts3D').length, 93);
  assert.equal(dataset.structures.filter(node => node.asset?.sourceDataset === 'Z-Anatomy').length, 97);
  for (const id of ['NERVE_MEDIAN_NERVE', 'NERVE_ULNAR_NERVE', 'NERVE_RADIAL_NERVE', 'LIGAMENT_SCAPHOLUNATE_INTEROSSEOUS',
    'FASCIA_PALMAR_APONEUROSIS', 'SKIN_NAIL_PLATES', 'SKIN_PALM', 'VEIN_DORSAL_VENOUS_NETWORK']) {
    assert.ok(nodes.get(id)?.asset, `Missing expected sourced 3D structure: ${id}`);
  }
  assert.equal(nodes.get('SKIN_NAIL_THUMB')?.asset, null, 'A group of nail plates does not imply a segmented thumb nail apparatus');
  assert.equal(nodes.get('BONE_THUMB_RADIAL_SESAMOID')?.asset, null, 'Foot sesamoids are not substituted for hand sesamoids');
  assert.ok(nodes.get('MUSCLE_LUMBRICALS')?.asset);
  for (const number of [1, 2, 3, 4]) {
    assert.equal(nodes.get(`MUSCLE_LUMBRICAL_${number}`)?.asset, null);
    assert.ok(dataset.relationships.some(edge => edge.source === `MUSCLE_LUMBRICAL_${number}` && edge.type === 'PART_OF' && edge.target === 'MUSCLE_LUMBRICALS'));
  }
  for (const node of dataset.structures.filter(node => node.asset?.sourceDataset === 'Z-Anatomy')) {
    assert.equal(node.fmaId, null, 'Z-Anatomy source names are not invented FMA mappings');
    assert.match(node.asset!.licenseUrl!, /by-sa\/4\.0/);
  }
});

test('registration rejects shifted, mirrored and unverified atlas transforms', () => {
  const mapping = readJSON<ZAnatomyMapping>('scripts/assets/z-anatomy-mapping.json');
  assert.deepEqual(validateRegistration(mapping.registration), []);
  const shifted = structuredClone(mapping.registration);
  shifted.matrix[12] += 10;
  assert.ok(validateRegistration(shifted).length);
  const mirrored = structuredClone(mapping.registration);
  mirrored.matrix[0] *= -1;
  assert.ok(validateRegistration(mirrored).length);
  const unverified = structuredClone(mapping.registration);
  unverified.acceptance = { passed: false };
  assert.ok(validateRegistration(unverified).length);
});
