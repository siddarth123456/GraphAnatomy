import fs from 'node:fs';
import path from 'node:path';
import { Mesh } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { createIO, readJSON } from './io';
import type { AssetManifest } from './registry';

async function main() {
const directory = process.argv[2] ?? 'output/hand-expansion/z-anatomy';
const initial = readJSON<{ landmarks: { graphNodeId: string; sourceObject: string }[] }>('scripts/assets/z-anatomy-registration.json');
const manifest = readJSON<AssetManifest>('public/manifests/hand_region.json');
const bytes = fs.readFileSync(path.join(directory, 'source/SkeletalSystem100.fbx'));
const scene = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
scene.updateMatrixWorld(true);
const donor = new Map<string, { vertices: number[]; indices: number[] }>();
scene.traverse(child => {
  if (!(child instanceof Mesh)) return;
  const name = child.userData.originalName ?? child.name;
  if (!initial.landmarks.some(item => item.sourceObject === name)) return;
  const geometry = child.geometry.clone().applyMatrix4(child.matrixWorld);
  const positions = geometry.getAttribute('position');
  const vertices: number[] = [];
  for (let i = 0; i < positions.count; i++) vertices.push(positions.getX(i), positions.getY(i), positions.getZ(i));
  donor.set(name, { vertices, indices: geometry.index ? Array.from(geometry.index.array, Number) : Array.from({ length: vertices.length / 3 }, (_, i) => i) });
  geometry.dispose();
});
const io = await createIO();
const surfaces = [];
for (const pair of initial.landmarks) {
  const mesh = manifest.meshes.find(item => item.graphNodeId === pair.graphNodeId)!;
  const document = await io.read(path.join('public', mesh.lod.high));
  const vertices: number[] = [], indices: number[] = [];
  for (const model of document.getRoot().listMeshes()) for (const primitive of model.listPrimitives()) {
    const offset = vertices.length / 3;
    const positions = primitive.getAttribute('POSITION')!.getArray()!;
    vertices.push(...Array.from(positions, (value, i) => (value + mesh.position[i % 3]) / manifest.coordinateScale + manifest.regionCentroid[i % 3]));
    const triangleIndices = primitive.getIndices()?.getArray() ?? Array.from({ length: positions.length / 3 }, (_, i) => i);
    indices.push(...Array.from(triangleIndices, value => value + offset));
  }
  surfaces.push({ ...pair, donor: donor.get(pair.sourceObject), target: { vertices, indices } });
}
fs.writeFileSync(path.join(directory, 'registration-surfaces.json'), JSON.stringify(surfaces));
console.log(`Exported ${surfaces.length} matched bone surfaces for independent registration verification.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
