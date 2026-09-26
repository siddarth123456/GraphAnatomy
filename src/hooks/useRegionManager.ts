import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AnatomyLayer, AnatomySceneNode, RegionManifest } from '@/types/anatomy';

interface GlobalManifest {
  regions: string[];
  manifests: Record<string, string>;
}

interface ManifestCache {
  global: GlobalManifest | null;
  regions: Record<string, RegionManifest>;
  errors: Record<string, string>;
}

const initialCache: ManifestCache = { global: null, regions: {}, errors: {} };
let cache = initialCache;
const listeners = new Set<() => void>();
const requests = new Map<string, Promise<void>>();
const GLOBAL = '__global__';

function publish(next: ManifestCache) {
  cache = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

async function fetchJSON(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Could not load anatomy data (HTTP ${response.status}).`);
  return response.json();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isVector(value: unknown, length: number) {
  return Array.isArray(value) && value.length === length && value.every((part) => typeof part === 'number' && Number.isFinite(part));
}

function validateRegion(value: unknown, regionId: string): RegionManifest {
  if (!isRecord(value) || value.regionId !== regionId || !Array.isArray(value.meshes) || value.meshes.length === 0) {
    throw new Error(`The ${regionId} anatomy manifest is invalid or empty.`);
  }
  const ids = new Set<string>();
  for (const node of value.meshes) {
    if (!isRecord(node) || typeof node.meshId !== 'string' || ids.has(node.meshId)
      || typeof node.name !== 'string' || typeof node.graphNodeId !== 'string'
      || !Object.values(AnatomyLayer).includes(node.layer as AnatomyLayer)
      || !isRecord(node.lod) || typeof node.lod.high !== 'string' || !node.lod.high.startsWith('/models/')
      || !isVector(node.boundingBox, 6) || !isVector(node.explosionDirection, 3)
      || (node.position !== undefined && !isVector(node.position, 3))) {
      throw new Error(`The ${regionId} anatomy manifest contains an invalid structure.`);
    }
    ids.add(node.meshId);
  }
  return value as unknown as RegionManifest;
}

function request(key: string, load: () => Promise<void>) {
  if (requests.has(key)) return requests.get(key)!;
  if (cache.errors[key]) return Promise.resolve();
  const promise = load().catch((error: unknown) => {
    publish({ ...cache, errors: { ...cache.errors, [key]: error instanceof Error ? error.message : 'Anatomy data could not be loaded.' } });
  }).finally(() => { requests.delete(key); });
  requests.set(key, promise);
  return promise;
}

async function loadRegions(regionIds: string[]) {
  if (!cache.global) {
    await request(GLOBAL, async () => {
      const value = await fetchJSON('/manifests/global_manifest.json');
      if (!isRecord(value) || !Array.isArray(value.regions) || !isRecord(value.manifests)
        || !value.regions.every((id) => typeof id === 'string' && typeof (value.manifests as Record<string, unknown>)[id] === 'string')) {
        throw new Error('The anatomy region index is invalid.');
      }
      publish({ ...cache, global: value as unknown as GlobalManifest });
    });
  }
  const global = cache.global;
  if (!global) return;
  await Promise.all(regionIds.map((id) => {
    if (cache.regions[id]) return Promise.resolve();
    return request(id, async () => {
      const url = global.manifests[id];
      if (!url) throw new Error(`The ${id} region is not available.`);
      const region = validateRegion(await fetchJSON(url), id);
      publish({ ...cache, regions: { ...cache.regions, [id]: region } });
    });
  }));
}

/** All viewer panels share one cache and one request per manifest. */
export function useRegionManager() {
  const activeRegionIds = useAppStore((state) => state.activeRegionIds);
  const snapshot = useSyncExternalStore(subscribe, () => cache, () => initialCache);

  useEffect(() => { void loadRegions(activeRegionIds); }, [activeRegionIds]);

  const meshes = useMemo<AnatomySceneNode[]>(() => {
    const nodes = new Map<string, AnatomySceneNode>();
    activeRegionIds.forEach((id) => snapshot.regions[id]?.meshes.forEach((node) => nodes.set(node.meshId, node)));
    return [...nodes.values()];
  }, [activeRegionIds, snapshot.regions]);

  const retry = useCallback(() => {
    const errors = { ...cache.errors };
    delete errors[GLOBAL];
    activeRegionIds.forEach((id) => { delete errors[id]; });
    publish({ ...cache, errors });
    void loadRegions(activeRegionIds);
  }, [activeRegionIds]);

  const error = snapshot.errors[GLOBAL] || activeRegionIds.map((id) => snapshot.errors[id]).find(Boolean) || null;
  return {
    meshes,
    isLoading: !error && (!snapshot.global || activeRegionIds.some((id) => !snapshot.regions[id])),
    error,
    retry,
  };
}
