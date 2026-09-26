import { Html } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';
import { AnatomySceneNode } from '@/types/anatomy';
import { getNodeBounds } from '../../models/MeshRegistry';

export function AnatomyLabels({ meshes }: { meshes: AnatomySceneNode[] }) {
  const selectedId = useAppStore((state) => state.selectedMeshId);
  const hoveredId = useAppStore((state) => state.hoveredMeshId);
  const activeLayers = useAppStore((state) => state.activeLayers);
  const isolationMode = useAppStore((state) => state.isolationMode);
  const explosionAmount = useAppStore((state) => state.explosionAmount);
  const clipping = useAppStore((state) => state.clippingState);

  const nodes = meshes.filter((node) => (node.meshId === selectedId || node.meshId === hoveredId)
    && activeLayers.includes(node.layer) && (!isolationMode || node.meshId === selectedId));

  return <>{nodes.map((node) => {
    const bounds = getNodeBounds(node, explosionAmount);
    const position: [number, number, number] = [
      (bounds[0] + bounds[3]) / 2,
      (bounds[1] + bounds[4]) / 2,
      (bounds[2] + bounds[5]) / 2,
    ];
    const axis = clipping.plane === 'axial' ? 2 : clipping.plane === 'sagittal' ? 0 : 1;
    if (clipping.enabled && position[axis] > clipping.position) return null;
    const selected = node.meshId === selectedId;
    return (
      <Html key={node.meshId} position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`-translate-y-8 whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-semibold shadow-lg ${selected ? 'border-teal-400 bg-teal-950/95 text-teal-50' : 'border-slate-500 bg-slate-900/95 text-slate-200'}`}>
          {node.name}
        </div>
      </Html>
    );
  })}</>;
}
