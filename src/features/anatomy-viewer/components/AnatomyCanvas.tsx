'use client';

import { Component, ReactNode, Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import { MeshInstance } from '../models/MeshRegistry';
import { CameraController } from './CameraController';
import { ClippingManager } from './ClippingManager';
import { HighlightManager } from './HighlightManager';
import { useAppStore } from '@/store/useAppStore';
import { useRegionManager } from '@/hooks/useRegionManager';
import { AnatomyLabels } from './ui/AnatomyLabels';

class ViewerErrorBoundary extends Component<
  { children: ReactNode; onRetry: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) { return { error }; }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="flex h-full items-center justify-center p-6 text-center">
          <div className="max-w-sm rounded-xl border border-rose-900 bg-slate-900 p-6 text-slate-200">
            <p className="font-semibold">The 3D anatomy could not be loaded.</p>
            <p className="mt-2 text-sm text-slate-400">Retry loading the models. If the problem continues, check your connection and browser graphics support.</p>
            <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white" onClick={() => {
              this.props.onRetry();
              this.setState({ error: null });
            }}>Retry 3D viewer</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AnatomyCanvas() {
  const clearSelection = useAppStore((state) => state.clearSelection);
  const activeLayers = useAppStore((state) => state.activeLayers);
  const { meshes, isLoading, error, retry } = useRegionManager();
  const [loadAttempt, setLoadAttempt] = useState(0);
  const visibleCount = meshes.filter((node) => activeLayers.includes(node.layer)).length;

  if (error) return (
    <div role="alert" className="flex h-full items-center justify-center bg-[#111827] p-6 text-center text-slate-200">
      <div><p>{error}</p><button onClick={retry} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm">Retry anatomy data</button></div>
    </div>
  );

  if (isLoading) return <div role="status" className="flex h-full items-center justify-center bg-[#111827] text-sm text-slate-300">Loading hand anatomy…</div>;

  return (
    <div className="relative h-full w-full bg-[#111827]" aria-label="Interactive 3D hand anatomy">
      <ViewerErrorBoundary onRetry={() => {
        meshes.forEach((node) => useGLTF.clear(node.lod.high));
        setLoadAttempt((attempt) => attempt + 1);
      }}>
        <Canvas
          key={loadAttempt}
          camera={{ position: [0, -7, 1], up: [0, 0, -1], fov: 42, near: 0.01, far: 100 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
          onPointerMissed={(event) => { if (event.type === 'click') clearSelection(); }}
          fallback={<div role="alert" className="p-8 text-center text-slate-300">This browser cannot display 3D anatomy. Enable WebGL 2 or open the viewer in a supported browser.</div>}
        >
          <color attach="background" args={['#111827']} />
          <ambientLight intensity={1.2} />
          <directionalLight position={[3, -5, -4]} intensity={2.2} />
          <directionalLight position={[-3, 3, 4]} intensity={1.1} />
          <ClippingManager />
          <Suspense fallback={<Html center><div role="status" className="whitespace-nowrap rounded-lg bg-slate-900 px-4 py-3 text-sm text-slate-200">Loading 3D models…</div></Html>}>
            <CameraController meshes={meshes} />
            <HighlightManager>
              {meshes.map((node) => <MeshInstance key={node.meshId} node={node} />)}
              <AnatomyLabels meshes={meshes} />
            </HighlightManager>
          </Suspense>
        </Canvas>
      </ViewerErrorBoundary>
      {visibleCount === 0 && <div role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-sm text-slate-300">No anatomy layers are visible. Enable a layer to continue.</div>}
    </div>
  );
}
