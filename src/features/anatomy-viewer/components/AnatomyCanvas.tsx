'use client';

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Grid, PerformanceMonitor, Stats } from '@react-three/drei';
import { EffectComposer, SSAO } from '@react-three/postprocessing';
import { MeshInstance } from '../models/MeshRegistry';
import { CameraController } from './CameraController';
import { ClippingManager } from './ClippingManager';
import { useAppStore } from '@/store/useAppStore';
import { useRegionManager } from '@/hooks/useRegionManager';
import { AnatomyLabels } from './ui/AnatomyLabels';

export function AnatomyCanvas() {
  const clearSelection = useAppStore(state => state.clearSelection);
  const { meshes, isLoading } = useRegionManager();
  const [dpr, setDpr] = useState(1);

  console.log('AnatomyCanvas rendered. active meshes:', meshes.length);

  return (
    <div className="w-full h-full bg-[#111827]">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        dpr={dpr}
        onPointerMissed={() => clearSelection()}
      >
        <PerformanceMonitor 
          onIncline={() => setDpr(2)} 
          onDecline={() => setDpr(1)} 
        />
        <Stats className="!absolute !right-0 !top-0 !left-auto" />
        <ClippingManager />
        
        {/* Environment & Lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <Environment preset="studio" />

        {/* Removed SSAO temporarily to resolve NormalPass requirement until proper rendering pipeline is setup */}

        {/* Replaces OrbitControls with Fly-To logic */}
        <CameraController />
        <Grid args={[20, 20]} sectionColor="#4b5563" cellColor="#374151" fadeDistance={30} />

        <group>
          {meshes.map(node => (
            <MeshInstance key={node.meshId} node={node} />
          ))}
        </group>

        <AnatomyLabels />
      </Canvas>
    </div>
  );
}
