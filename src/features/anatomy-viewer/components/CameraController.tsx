import { useEffect, useMemo, useRef } from 'react';
import { CameraControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { AnatomySceneNode } from '@/types/anatomy';
import { getNodeBounds } from '../models/MeshRegistry';

export function CameraController({ meshes }: { meshes: AnatomySceneNode[] }) {
  const controls = useRef<CameraControls>(null);
  const lastReset = useRef(-1);
  const cameraTargetBox = useAppStore((state) => state.cameraTargetBox);
  const selected = useAppStore((state) => state.activeMeshNode);
  const explosionAmount = useAppStore((state) => state.explosionAmount);
  const activeLayers = useAppStore((state) => state.activeLayers);
  const viewResetKey = useAppStore((state) => state.viewResetKey);
  const size = useThree((state) => state.size);

  const sceneBox = useMemo(() => {
    const box = new THREE.Box3();
    meshes.filter((node) => activeLayers.includes(node.layer)).forEach((node) => {
      const bounds = getNodeBounds(node, explosionAmount);
      box.expandByPoint(new THREE.Vector3(...bounds.slice(0, 3)));
      box.expandByPoint(new THREE.Vector3(...bounds.slice(3, 6)));
    });
    return box;
  }, [meshes, activeLayers, explosionAmount]);

  useEffect(() => {
    const controller = controls.current;
    if (!controller || sceneBox.isEmpty()) return;
    const reset = lastReset.current !== viewResetKey;
    const target = selected && cameraTargetBox ? getNodeBounds(selected, explosionAmount) : null;
    const box = target ? new THREE.Box3(
      new THREE.Vector3(target[0], target[1], target[2]),
      new THREE.Vector3(target[3], target[4], target[5]),
    ) : sceneBox;
    if (reset) {
      const center = sceneBox.getCenter(new THREE.Vector3());
      void controller.setLookAt(center.x, center.y - 7, center.z, center.x, center.y, center.z, false);
      lastReset.current = viewResetKey;
    }
    const padding = Math.max(box.getSize(new THREE.Vector3()).length() * 0.14, 0.06);
    void controller.fitToBox(box, !reset, {
      paddingTop: padding, paddingBottom: padding, paddingLeft: padding, paddingRight: padding,
    });
  }, [sceneBox, cameraTargetBox, selected, explosionAmount, viewResetKey, size.width, size.height]);

  return <CameraControls ref={controls} makeDefault smoothTime={0.2} minDistance={0.08} maxDistance={30} />;
}
