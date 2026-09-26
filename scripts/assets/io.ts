import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { NodeIO, type Document } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import draco from 'draco3dgltf';

export type Vector3 = [number, number, number];
export type Bounds = [number, number, number, number, number, number];
export const LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';
export const ATTRIBUTION = 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International';
export const MAPPING_URL = 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_element_parts.txt';
export const sha256 = (bytes: Buffer | Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
export const readJSON = <T>(file: string): T => JSON.parse(fs.readFileSync(file, 'utf8')) as T;
export const finiteVector = (value: unknown, count: number): value is number[] => Array.isArray(value) && value.length === count && value.every(Number.isFinite);
export const isUrl = (value: unknown): value is string => typeof value === 'string' && /^https?:\/\/[^\s]+$/.test(value);

export function publicFile(publicDir: string, url: string) {
  if (typeof url !== 'string' || !url.startsWith('/') || url.includes('\\') || url.includes('?') || url.includes('#')) throw new Error(`Invalid public path: ${url}`);
  const resolved = path.resolve(publicDir, `.${url}`);
  if (!resolved.startsWith(path.resolve(publicDir) + path.sep)) throw new Error(`Path escapes public directory: ${url}`);
  return resolved;
}

export interface GlbJSON {
  asset: { version: string };
  meshes?: { name?: string; primitives: { extensions?: Record<string, unknown> }[] }[];
  buffers?: { uri?: string }[];
  images?: { uri?: string }[];
  extensionsRequired?: string[];
}

export function readGlbJSON(file: string): GlbJSON {
  const bytes = fs.readFileSync(file);
  if (bytes.length < 20 || bytes.toString('utf8', 0, 4) !== 'glTF' || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error(`Invalid GLB 2.0 header: ${file}`);
  const jsonLength = bytes.readUInt32LE(12);
  if (bytes.toString('utf8', 16, 20) !== 'JSON' || jsonLength % 4 || 20 + jsonLength > bytes.length) throw new Error(`Invalid GLB JSON chunk: ${file}`);
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength)) as GlbJSON;
  if (json.asset?.version !== '2.0' || [...(json.buffers ?? []), ...(json.images ?? [])].some(item => item.uri)) throw new Error(`GLB must be self-contained version 2.0: ${file}`);
  return json;
}

export async function createIO(encode = false) {
  const dependencies: Record<string, unknown> = { 'draco3d.decoder': await draco.createDecoderModule() };
  if (encode) dependencies['draco3d.encoder'] = await draco.createEncoderModule();
  return new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies(dependencies);
}

export function documentStats(document: Document) {
  let vertices = 0;
  let triangles = 0;
  for (const mesh of document.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      const position = primitive.getAttribute('POSITION');
      if (primitive.getMode() !== 4 || !position || position.getType() !== 'VEC3' || position.getCount() < 3) throw new Error('Expected triangle geometry with POSITION VEC3');
      const array = position.getArray();
      if (!array || !array.every(Number.isFinite)) throw new Error('Non-finite or absent vertex coordinates');
      const index = primitive.getIndices();
      const count = index?.getCount() ?? position.getCount();
      if (count % 3) throw new Error('Triangle index count is not divisible by three');
      if (index?.getArray()?.some(value => !Number.isInteger(value) || value < 0 || value >= position.getCount())) throw new Error('Triangle index exceeds vertex count');
      vertices += position.getCount();
      triangles += count / 3;
    }
  }
  const scenes = document.getRoot().listScenes();
  if (!triangles || scenes.length !== 1) throw new Error('Expected nonempty geometry and one scene');
  const { min, max } = getBounds(scenes[0]);
  const bounds = [...min, ...max] as Bounds;
  if (!finiteVector(bounds, 6) || min.some((value, axis) => value > max[axis])) throw new Error('Invalid decoded bounds');
  return { vertices, triangles, bounds };
}
