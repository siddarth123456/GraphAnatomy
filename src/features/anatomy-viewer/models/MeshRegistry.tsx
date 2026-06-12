import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getMaterial } from '../materials/MaterialRegistry';
import { Select } from '@react-three/postprocessing';
import { AnatomySceneNode, HighlightState } from '@/types/anatomy';

// Temporary placeholder geometries until we load the BodyParts3D GLB pipeline
const Placeholders = {
  "mesh_median_nerve_01": <cylinderGeometry args={[0.2, 0.2, 5, 32]} />,
  "mesh_apb_01": <boxGeometry args={[2, 1, 3]} />
};

export function MeshInstance({ node }: { node: AnatomySceneNode }) {
  const { 
    meshHighlightStates, 
    activeLayers, 
    selectAnatomy, 
    setMeshHighlight, 
    clearHighlights 
  } = useAppStore();
  
  // Layer Management: Unmount if layer is disabled
  const isVisible = activeLayers.includes(node.layer);
  if (!isVisible) return null;

  const currentState = meshHighlightStates[node.meshId] || HighlightState.None;
  const isHighlighted = currentState !== HighlightState.None;
  const material = getMaterial(node.materialId);

  // Position mock geometry using bounding box center approximation
  const centerX = (node.boundingBox[0] + node.boundingBox[3]) / 2;
  const centerY = (node.boundingBox[1] + node.boundingBox[4]) / 2;
  const centerZ = (node.boundingBox[2] + node.boundingBox[5]) / 2;

  return (
    <Select enabled={isHighlighted}>
      <mesh
        position={[centerX, centerY, centerZ]}
        material={material}
        onClick={(e) => {
          e.stopPropagation();
          selectAnatomy(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (currentState !== HighlightState.Selected) {
            setMeshHighlight(node.meshId, HighlightState.Hovered);
          }
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          if (currentState === HighlightState.Hovered) {
            clearHighlights(HighlightState.Hovered);
          }
          document.body.style.cursor = 'auto';
        }}
      >
        {Placeholders[node.meshId as keyof typeof Placeholders] || <sphereGeometry args={[1, 32, 32]} />}
      </mesh>
    </Select>
  );
}
