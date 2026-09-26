'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AnatomyDataset } from '@/lib/anatomy-types';
import { useRegionManager } from '@/hooks/useRegionManager';
import { useAppStore } from '@/store/useAppStore';
const Context = createContext<{ data: AnatomyDataset | null; error: string | null; retry: () => void }>({ data: null, error: null, retry: () => {} });
export function AnatomyDataProvider({ children }: { children: React.ReactNode }) {
  const { meshes } = useRegionManager();
  const [data, setData] = useState<AnatomyDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => { setError(null); setAttempt((value) => value + 1); }, []);
  useEffect(() => {
    const state = useAppStore.getState();
    const selected = meshes.find((mesh) => mesh.graphNodeId === state.activeGraphNodeId);
    if (selected && !state.activeMeshNode) state.selectAnatomy(selected);
  }, [meshes]);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort('timeout'), 20000);
    fetch('/api/anatomy', { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error('The knowledge catalog is unavailable. Check the server connection and retry.');
      const result: AnatomyDataset = await response.json();
      if (!Array.isArray(result.structures) || !Array.isArray(result.relationships)) throw new Error('The knowledge catalog is invalid.');
      setData(result);
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted || controller.signal.reason === 'timeout') setError(reason instanceof Error ? reason.message : 'The knowledge catalog timed out. Please retry.');
    }).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [attempt]);
  return <Context.Provider value={{ data, error, retry }}>{children}</Context.Provider>;
}
export const useAnatomyData = () => useContext(Context);
export function useSelectStructure() {
  const { meshes } = useRegionManager();
  return useCallback((id: string) => {
    const mesh = meshes.find((node) => node.graphNodeId === id);
    if (mesh) useAppStore.getState().selectAnatomy(mesh);
    else useAppStore.getState().selectGraphNode(id);
  }, [meshes]);
}
