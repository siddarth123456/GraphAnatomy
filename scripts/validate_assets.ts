import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const MANIFESTS_DIR = path.join(PUBLIC_DIR, 'manifests');

function parseGlb(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 20) return null;

  const magic = buffer.toString('utf8', 0, 4);
  if (magic !== 'glTF') return null;

  const chunkLength = buffer.readUInt32LE(12);
  const chunkType = buffer.toString('utf8', 16, 20);

  if (chunkType !== 'JSON') return null;

  const jsonString = buffer.toString('utf8', 20, 20 + chunkLength);
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
}

function getGltfStats(gltfData: any) {
  let meshCount = gltfData.meshes ? gltfData.meshes.length : 0;
  let materialCount = gltfData.materials ? gltfData.materials.length : 0;
  let vertexCount = 0;
  let triangleCount = 0;

  if (gltfData.meshes) {
    for (const mesh of gltfData.meshes) {
      if (mesh.primitives) {
        for (const prim of mesh.primitives) {
          // Triangles
          if (prim.indices !== undefined && gltfData.accessors) {
            const accessor = gltfData.accessors[prim.indices];
            if (accessor && accessor.count) {
              triangleCount += Math.floor(accessor.count / 3);
            }
          }
          // Vertices
          if (prim.attributes && prim.attributes.POSITION !== undefined && gltfData.accessors) {
            const accessor = gltfData.accessors[prim.attributes.POSITION];
            if (accessor && accessor.count) {
              vertexCount += accessor.count;
            }
          }
        }
      }
    }
  }

  return { meshCount, materialCount, vertexCount, triangleCount };
}

function validateAssets() {
  console.log('--- Anatomy Asset Validation Report ---\n');

  console.log('1. Manifest Audit');
  const manifestFiles = fs.readdirSync(MANIFESTS_DIR).filter(f => f.endsWith('.json'));
  let allMeshes: any[] = [];
  
  for (const file of manifestFiles) {
    if (file === 'global_manifest.json' || file === 'registry.json') continue;
    const filePath = path.join(MANIFESTS_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (data.meshes && Array.isArray(data.meshes)) {
        console.log(`  [OK] Validated ${file} (${data.meshes.length} meshes)`);
        allMeshes = allMeshes.concat(data.meshes);
      } else {
        console.warn(`  [WARN] ${file} does not contain a 'meshes' array.`);
      }
    } catch (e) {
      console.error(`  [ERROR] Failed to parse ${file}: ${e}`);
    }
  }

  console.log('\n2. Asset resolution & Linkage Audit');
  const missingAssets: string[] = [];
  const foundAssets: string[] = [];
  const issues: string[] = [];

  for (const mesh of allMeshes) {
    if (!mesh.meshId) issues.push(`Missing meshId in node: ${mesh.name}`);
    if (!mesh.graphNodeId) issues.push(`Missing graphNodeId in node: ${mesh.meshId}`);
    
    if (mesh.lod && mesh.lod.high) {
      const glbPath = path.join(PUBLIC_DIR, mesh.lod.high);
      if (fs.existsSync(glbPath)) {
        foundAssets.push(mesh.lod.high);
        const stats = fs.statSync(glbPath);
        
        console.log(`\n${path.basename(mesh.lod.high)}`);
        console.log(`Size: ${stats.size} bytes`);
        
        const gltfData = parseGlb(glbPath);
        if (gltfData) {
          const { meshCount, materialCount, vertexCount, triangleCount } = getGltfStats(gltfData);
          console.log(`Meshes: ${meshCount}`);
          console.log(`Materials: ${materialCount}`);
          console.log(`Vertices: ${vertexCount}`);
          console.log(`Triangles: ${triangleCount}`);

          if (triangleCount < 500 || vertexCount < 500 || stats.size < 50000) {
            console.log(`\nWARNING:\nLikely placeholder geometry.`);
            issues.push(`Asset ${mesh.lod.high} has low complexity (triangles: ${triangleCount}, vertices: ${vertexCount}, size: ${Math.round(stats.size/1024)}KB). Likely a placeholder.`);
          }
        } else {
          console.log(`WARNING: Could not parse GLB structure.`);
        }
      } else {
        missingAssets.push(mesh.lod.high);
      }
    } else {
      issues.push(`Missing lod.high path for ${mesh.meshId}`);
    }
  }

  console.log(`\n  Found Assets: ${foundAssets.length}`);
  console.log(`  Missing Assets: ${missingAssets.length}`);
  missingAssets.forEach(a => console.log(`    - ${a}`));

  console.log('\n3. Issues Detected:');
  if (issues.length === 0) {
    console.log('  None');
  } else {
    issues.forEach(i => console.log(`  - ${i}`));
  }
}

validateAssets();
