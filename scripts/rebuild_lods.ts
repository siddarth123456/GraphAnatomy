import path from 'node:path';
import { cloneDocument, draco, simplify } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { createIO, documentStats, publicFile, readJSON } from './assets/io';
import type { AssetManifest } from './assets/registry';

async function main() {
  const meshIds = process.argv.slice(2);
  const manifest = readJSON<AssetManifest>('public/manifests/hand_region.json');
  if (!meshIds.length || meshIds.some(id => !manifest.meshes.some(mesh => mesh.meshId === id))) throw new Error('Usage: npx tsx scripts/rebuild_lods.ts <known mesh ID> [...]');
  const io = await createIO(true);
  await MeshoptSimplifier.ready;
  for (const mesh of manifest.meshes.filter(item => meshIds.includes(item.meshId))) {
    const source = await io.read(publicFile('public', mesh.lod.high));
    const counts = [documentStats(source).triangles];
    let previous = source;
    for (const [level, ratio] of [['medium', 0.5], ['low', 0.4]] as const) {
      const output = cloneDocument(previous);
      await output.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.01 }), draco({ quantizePosition: 14 }));
      const bytes = await io.writeBinary(output);
      const count = documentStats(await io.readBinary(bytes)).triangles;
      if (count > counts[counts.length - 1]) throw new Error(`Simplification increased triangle count: ${mesh.meshId} ${level}`);
      counts.push(count);
      previous = output;
      await io.write(path.resolve(publicFile('public', mesh.lod[level])), output);
    }
    console.log(`${mesh.meshId}: ${counts.join(' → ')} triangles (high → medium → low)`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
