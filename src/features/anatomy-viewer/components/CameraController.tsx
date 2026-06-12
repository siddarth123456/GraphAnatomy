import React, { useEffect, useRef } from 'react';
import { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';

export function CameraController() {
  const cameraControlsRef = useRef<CameraControls>(null);
  const { cameraTargetBox } = useAppStore();

  useEffect(() => {
    if (cameraControlsRef.current && cameraTargetBox) {
      // Convert the [minX, minY, minZ, maxX, maxY, maxZ] to a THREE.Box3
      const box = new THREE.Box3(
        new THREE.Vector3(cameraTargetBox[0], cameraTargetBox[1], cameraTargetBox[2]),
        new THREE.Vector3(cameraTargetBox[3], cameraTargetBox[4], cameraTargetBox[5])
      );
      
      // Fly to the bounding box
      cameraControlsRef.current.fitToBox(box, true, { paddingTop: 2, paddingLeft: 2, paddingRight: 2, paddingBottom: 2 });
    }
  }, [cameraTargetBox]);

  return <CameraControls ref={cameraControlsRef} makeDefault dampingFactor={0.1} />;
}
