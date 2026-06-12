'use client';

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Grid } from '@react-three/drei';
import { Selection, EffectComposer, Outline } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { MeshInstance } from '../models/MeshRegistry';
import { CameraController } from './CameraController';
import { useAppStore } from '@/store/useAppStore';
import { RegionManifest } from '@/types/anatomy';

export function AnatomyCanvas() {
  const { clearSelection } = useAppStore();
  const [manifest, setManifest] = useState<RegionManifest | null>(null);

  // Simulate loading the JSON Manifest
  useEffect(() => {
    fetch('/manifests/hand_region.json')
      .then(res => res.json())
      .then(data => setManifest(data));
  }, []);

  return (
    <div className="w-full h-full bg-[#111827]">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        onPointerMissed={() => clearSelection()}
      >
        {/* Environment & Lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <Environment preset="studio" />

        {/* Replaces OrbitControls with Fly-To logic */}
        <CameraController />
        <Grid args={[20, 20]} sectionColor="#4b5563" cellColor="#374151" fadeDistance={30} />

        {/* Highlight Pipeline & Dynamic Scene Loading */}
        <Selection>
          <EffectComposer autoClear={false}>
            {/* Standard Green Selection Outline */}
            <Outline
              blendFunction={BlendFunction.SCREEN}
              visibleEdgeColor={0x4ade80}
              hiddenEdgeColor={0x22c55e}
              edgeStrength={10}
              width={1000}
            />
          </EffectComposer>
          
          {manifest?.meshes.map(node => (
            <MeshInstance key={node.meshId} node={node} />
          ))}
        </Selection>
      </Canvas>
    </div>
  );
}
