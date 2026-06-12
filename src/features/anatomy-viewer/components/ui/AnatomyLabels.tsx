import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';
import { useRegionManager } from '@/hooks/useRegionManager';
import { HighlightState } from '@/types/anatomy';
import * as THREE from 'three';

export function AnatomyLabels() {
  const { meshes } = useRegionManager();
  const meshHighlightStates = useAppStore(state => state.meshHighlightStates);

  // Optimization: Only process nodes that are Hovered or Selected
  const activeLabels = useMemo(() => {
    const labels: Array<{ id: string, name: string, position: THREE.Vector3, state: HighlightState }> = [];
    
    Object.entries(meshHighlightStates).forEach(([meshId, state]) => {
      if (state === HighlightState.Hovered || state === HighlightState.Selected) {
        const node = meshes.find(m => m.meshId === meshId);
        if (node && node.boundingBox) {
          // Calculate center of bounding box for label placement
          const [minX, minY, minZ, maxX, maxY, maxZ] = node.boundingBox;
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          const centerZ = (minZ + maxZ) / 2;
          
          labels.push({
            id: meshId,
            name: node.name,
            position: new THREE.Vector3(centerX, centerY, centerZ),
            state
          });
        }
      }
    });
    
    return labels;
  }, [meshHighlightStates, meshes]);

  if (activeLabels.length === 0) return null;

  return (
    <>
      {activeLabels.map(label => (
        <Html 
          key={label.id} 
          position={label.position} 
          center 
          distanceFactor={10}
          zIndexRange={[100, 0]}
          className="pointer-events-none"
        >
          <div className={`
            px-3 py-1.5 rounded-md backdrop-blur-md border shadow-lg text-sm font-bold whitespace-nowrap transition-all
            ${label.state === HighlightState.Selected 
              ? 'bg-blue-900/80 border-blue-400 text-white scale-110' 
              : 'bg-gray-900/80 border-gray-600 text-gray-200'
            }
          `}>
            {label.name}
            {label.state === HighlightState.Hovered && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-600 rotate-45 border-r border-b border-gray-600"></div>
            )}
            {label.state === HighlightState.Selected && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-900 rotate-45 border-r border-b border-blue-400"></div>
            )}
          </div>
        </Html>
      ))}
    </>
  );
}
