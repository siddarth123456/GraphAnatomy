import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useAppStore } from '@/store/useAppStore';
import { MedicalMaterials } from '../materials/MaterialRegistry';

export function ClippingManager() {
  const { gl } = useThree();
  const clippingState = useAppStore(state => state.clippingState);

  // Enable global clipping in the renderer
  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  // The actual clipping plane
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), []);

  useEffect(() => {
    // Update plane normal based on selection
    if (clippingState.plane === 'axial') {
      plane.normal.set(0, -1, 0); // Y-axis slice
    } else if (clippingState.plane === 'sagittal') {
      plane.normal.set(-1, 0, 0); // X-axis slice
    } else if (clippingState.plane === 'coronal') {
      plane.normal.set(0, 0, -1); // Z-axis slice
    }

    // Update plane distance
    plane.constant = clippingState.position;

    // Apply to all materials
    Object.values(MedicalMaterials).forEach(mat => {
      if (clippingState.enabled) {
        mat.clippingPlanes = [plane];
      } else {
        mat.clippingPlanes = [];
      }
      mat.needsUpdate = true;
    });

  }, [clippingState, plane]);

  return null;
}
