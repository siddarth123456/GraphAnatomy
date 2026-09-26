import { useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useAppStore } from '@/store/useAppStore';

export function ClippingManager() {
  const getSceneState = useThree((state) => state.get);
  const clippingState = useAppStore((state) => state.clippingState);

  useEffect(() => {
    const { gl } = getSceneState();
    const plane = new THREE.Plane();
    // BodyParts3D uses Z for the long axis, X left/right and Y front/back.
    if (clippingState.plane === 'axial') plane.normal.set(0, 0, -1);
    else if (clippingState.plane === 'sagittal') plane.normal.set(-1, 0, 0);
    else plane.normal.set(0, -1, 0);
    plane.constant = clippingState.position;
    // Renderer-level clipping also reaches cloned GLTF materials and highlights.
    gl.clippingPlanes = clippingState.enabled ? [plane] : [];
    return () => { gl.clippingPlanes = []; };
  }, [clippingState, getSceneState]);

  return null;
}
