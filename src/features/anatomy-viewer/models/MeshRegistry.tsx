import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';
import { getMaterial } from '../materials/MaterialRegistry';
import { AnatomySceneNode, HighlightState } from '@/types/anatomy';

export function getExplosionOffset(node: AnatomySceneNode, amount: number): [number, number, number] {
  const direction = new THREE.Vector3(...node.explosionDirection);
  // Older manifests have zero vectors. Spread those meshes from the palm origin.
  if (direction.lengthSq() === 0) {
    const box = node.boundingBox;
    direction.set((box[0] + box[3]) / 2, (box[1] + box[4]) / 2, (box[2] + box[5]) / 2);
    if (direction.lengthSq() === 0) direction.set(1, 0, 0);
    direction.normalize();
  }
  return direction.multiplyScalar(amount).toArray();
}

export function getNodeBounds(node: AnatomySceneNode, amount = 0): AnatomySceneNode['boundingBox'] {
  const [x, y, z] = getExplosionOffset(node, amount);
  const [a, b, c, d, e, f] = node.boundingBox;
  return [a + x, b + y, c + z, d + x, e + y, f + z];
}

export function MeshInstance({ node }: { node: AnatomySceneNode }) {
  const currentState = useAppStore((state) => state.selectedMeshId === node.meshId
    ? HighlightState.Selected : state.hoveredMeshId === node.meshId
      ? HighlightState.Hovered : state.meshHighlightStates[node.meshId] || HighlightState.None);
  const visible = useAppStore((state) => state.activeLayers.includes(node.layer)
    && (!state.isolationMode || state.selectedMeshId === node.meshId));
  const explosionAmount = useAppStore((state) => state.explosionAmount);
  const selectAnatomy = useAppStore((state) => state.selectAnatomy);
  const setHoveredMeshId = useAppStore((state) => state.setHoveredMeshId);
  const { gl } = useThree();
  const { scene } = useGLTF(node.lod.high, '/draco/');

  const instance = useMemo(() => {
    const object = scene.clone(true);
    const materials: THREE.MeshPhysicalMaterial[] = [];
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = getMaterial(node.materialId).clone();
        materials.push(material);
        child.material = material;
      }
    });
    if (materials.length === 0) throw new Error(`The model for ${node.name} contains no anatomy geometry.`);
    return { object, materials };
  }, [scene, node.materialId, node.name]);

  useEffect(() => () => { instance.materials.forEach((material) => material.dispose()); }, [instance]);

  useEffect(() => {
    const selected = currentState === HighlightState.Selected;
    const highlighted = currentState !== HighlightState.None;
    instance.materials.forEach((material) => {
      material.emissive.set(selected ? '#21b8aa' : '#94bfff');
      material.emissiveIntensity = highlighted ? (selected ? 0.55 : 0.25) : 0;
    });
  }, [currentState, instance]);

  const offset = getExplosionOffset(node, explosionAmount);
  const position = (node.position || [0, 0, 0]).map((value, index) => value + offset[index]) as [number, number, number];

  function isClipped(event: ThreeEvent<PointerEvent | MouseEvent>) {
    return gl.clippingPlanes.some((plane) => plane.distanceToPoint(event.point) < 0);
  }

  function hover(event: ThreeEvent<PointerEvent>) {
    if (isClipped(event)) {
      if (useAppStore.getState().hoveredMeshId === node.meshId) setHoveredMeshId(null);
      return;
    }
    event.stopPropagation();
    setHoveredMeshId(node.meshId);
  }

  // Three.js raycasts invisible meshes, so detach hidden structures from the scene.
  if (!visible) return null;

  return (
    <group position={position} rotation={node.rotation}>
      <primitive
        object={instance.object}
        dispose={null}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          if (isClipped(event)) return;
          event.stopPropagation();
          selectAnatomy(node);
        }}
        onPointerOver={hover}
        onPointerMove={hover}
        onPointerOut={() => {
          if (useAppStore.getState().hoveredMeshId === node.meshId) setHoveredMeshId(null);
        }}
      />
    </group>
  );
}
