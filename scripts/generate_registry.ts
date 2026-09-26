import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readJSON } from './assets/io';
import { buildRegistry, type AssetManifest, type MappingSnapshot } from './assets/registry';
import type { AnatomyDataset } from '../src/lib/anatomy-types';

async function main() {
  const manifest = readJSON<AssetManifest>('public/manifests/hand_region.json');
  const mapping = readJSON<MappingSnapshot>('scripts/assets/bodyparts3d-mapping.json');
  const { getBundledDataset } = await import(pathToFileURL(path.resolve('src/lib/anatomy-data.ts')).href) as { getBundledDataset(): AnatomyDataset };
  fs.writeFileSync('public/manifests/registry.json', JSON.stringify(buildRegistry(manifest, mapping, getBundledDataset()), null, 2) + '\n');
  console.log(`Regenerated registry for ${manifest.meshes.length} renderable meshes.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
