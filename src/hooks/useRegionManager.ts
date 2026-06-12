import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AnatomySceneNode, RegionManifest } from '@/types/anatomy';

// Maps regionId -> URL
interface GlobalManifest {
  regions: string[];
  manifests: Record<string, string>;
}

export function useRegionManager() {
  const activeRegionIds = useAppStore(state => state.activeRegionIds);
  const [globalManifest, setGlobalManifest] = useState<GlobalManifest | null>(null);
  const [regionCache, setRegionCache] = useState<Record<string, RegionManifest>>({});
  const [activeMeshes, setActiveMeshes] = useState<AnatomySceneNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Load Global Manifest once
  useEffect(() => {
    fetch('/manifests/global_manifest.json')
      .then(res => res.json())
      .then(data => {
        setGlobalManifest(data);
      })
      .catch(err => console.error('Failed to load global manifest', err));
  }, []);

  // 2. Load missing active regions
  useEffect(() => {
    if (!globalManifest) return;

    let mounted = true;
    const fetchPromises: Promise<void>[] = [];
    const newCache = { ...regionCache };

    activeRegionIds.forEach(regionId => {
      if (!newCache[regionId] && globalManifest.manifests[regionId]) {
        const url = globalManifest.manifests[regionId];
        const p = fetch(url)
          .then(res => res.json())
          .then(data => {
            newCache[regionId] = data;
          })
          .catch(err => console.error(`Failed to load region ${regionId}`, err));
        fetchPromises.push(p);
      }
    });

    if (fetchPromises.length > 0) {
      setIsLoading(true);
      Promise.all(fetchPromises).then(() => {
        if (mounted) {
          setRegionCache(newCache);
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [activeRegionIds, globalManifest, regionCache]);

  // 3. Combine meshes from active regions
  useEffect(() => {
    if (isLoading) return;

    const meshes: AnatomySceneNode[] = [];
    activeRegionIds.forEach(regionId => {
      if (regionCache[regionId]) {
        meshes.push(...regionCache[regionId].meshes);
      }
    });

    setActiveMeshes(meshes);
  }, [activeRegionIds, regionCache, isLoading]);

  return {
    meshes: activeMeshes,
    isLoading
  };
}
