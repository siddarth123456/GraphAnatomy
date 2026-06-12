import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { getMaterial } from '../materials/MaterialRegistry';
import { AnatomySceneNode, HighlightState } from '@/types/anatomy';
import { Outlines, useGLTF } from '@react-three/drei';

function MissingAssetProxy({ node }: { node: AnatomySceneNode }) {
  // Use the bounding box from manifest if available, otherwise default size
  let boxArgs: [number, number, number] = [1, 1, 1];
  let proxyPosition: [number, number, number] = node.position || [0, 0, 0];
  
  if (node.boundingBox && node.boundingBox.length === 6) {
    const [minX, minY, minZ, maxX, maxY, maxZ] = node.boundingBox;
    boxArgs = [Math.max(0.1, maxX - minX), Math.max(0.1, maxY - minY), Math.max(0.1, maxZ - minZ)];
    // If no position field, derive from bounding box center
    if (!node.position) {
      proxyPosition = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
    }
  }

  return (
    <group position={proxyPosition}>
      <mesh>
        <boxGeometry args={boxArgs} />
        <meshBasicMaterial color="#ef4444" wireframe={true} />
      </mesh>
    </group>
  );
}

export function MeshInstance({ node }: { node: AnatomySceneNode }) {
  const currentState = useAppStore(state => state.meshHighlightStates[node.meshId] || HighlightState.None);
  const activeLayers = useAppStore(state => state.activeLayers);
  const selectAnatomy = useAppStore(state => state.selectAnatomy);
  const activeMeshNode = useAppStore(state => state.activeMeshNode);
  const isolationMode = useAppStore(state => state.isolationMode);
  const explosionAmount = useAppStore(state => state.explosionAmount);
  const setMeshHighlight = useAppStore(state => state.setMeshHighlight);
  const clearHighlights = useAppStore(state => state.clearHighlights);

  // Layer string matching
  const isVisible = activeLayers.includes(node.layer);

  // Pre-load the gltf scene unconditionally so React hooks rules are not broken
  // In a future advanced LOD system, this would dynamically switch between low/med/high
  // based on camera distance or PerformanceMonitor feedback.
  const { scene } = useGLTF(node.lod.high, true); // true enables DRACO loader using CDN

  if (!isVisible) return null;

  console.groupCollapsed(`Loading ${node.meshId}`);
  console.log("Path", node.lod.high);
  console.log("Layer", node.layer);
  console.log("Material", node.materialId);
  if (node.position) console.log("Position", node.position);
  console.groupEnd();

  const isHighlighted = currentState !== HighlightState.None;
  const isSelected = currentState === HighlightState.Selected;
  const material = getMaterial(node.materialId) as THREE.MeshPhysicalMaterial;

  // Handle Isolation Mode logic
  const shouldIsolate = isolationMode && activeMeshNode && activeMeshNode.meshId !== node.meshId;
  
  // Single clone pass: apply materials and count meshes
  const clonedScene = scene.clone();
  let meshCount = 0;
  clonedScene.traverse((child) => {
    if ((child as any).isMesh) {
      meshCount++;
      const matClone = material.clone();
      if (shouldIsolate) {
        matClone.transparent = true;
        matClone.opacity = 0.15;
        matClone.depthWrite = false; // Prevent ghosting overlap issues
      }
      (child as any).material = matClone;
    }
  });

  if (meshCount === 0) {
    console.warn(`[WARN] Loaded GLB for ${node.meshId} contains no meshes. Ensure Blender export includes mesh data.`);
    return <MissingAssetProxy node={node} />;
  }

  // Base position from manifest (world-space origin for centered meshes)
  const basePosition: [number, number, number] = node.position || [0, 0, 0];

  // Calculate System-Grouped Explosion offset
  const finalPosition: [number, number, number] = [
    basePosition[0] + node.explosionDirection[0] * explosionAmount,
    basePosition[1] + node.explosionDirection[1] * explosionAmount,
    basePosition[2] + node.explosionDirection[2] * explosionAmount
  ];

  return (
    <primitive 
      object={clonedScene}
      position={finalPosition}
      onClick={(e: any) => {
        e.stopPropagation();
        selectAnatomy(node);
      }}
      onPointerOver={(e: any) => {
        e.stopPropagation();
        if (currentState !== HighlightState.Selected) {
          setMeshHighlight(node.meshId, HighlightState.Hovered);
        }
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e: any) => {
        if (currentState === HighlightState.Hovered) {
          clearHighlights(HighlightState.Hovered);
        }
        document.body.style.cursor = 'auto';
      }}
    >
      {/* High-performance Drei Outlines instead of Postprocessing context */}
      {isHighlighted && (
        <Outlines 
          thickness={isSelected ? 0.05 : 0.02} 
          color={isSelected ? "#4ade80" : "#ffffff"} 
        />
      )}
    </primitive>
  );
}
