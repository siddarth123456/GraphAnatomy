import { Html } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';
import { AnatomySceneNode } from '@/types/anatomy';
import { getNodeBounds } from '../../models/MeshRegistry';

const overviewLimit = 12;

export function AnatomyLabels({ meshes }: { meshes: AnatomySceneNode[] }) {
  const selectedId = useAppStore((state) => state.selectedMeshId);
  const hoveredId = useAppStore((state) => state.hoveredMeshId);
  const activeLayers = useAppStore((state) => state.activeLayers);
  const isolationMode = useAppStore((state) => state.isolationMode);
  const explosionAmount = useAppStore((state) => state.explosionAmount);
  const clipping = useAppStore((state) => state.clippingState);
  const learningMode = useAppStore((state) => state.learningMode);

  const axis = clipping.plane === 'axial' ? 2 : clipping.plane === 'sagittal' ? 0 : 1;
  const visible = meshes.filter((node) => {
    if (!activeLayers.includes(node.layer) || (isolationMode && node.meshId !== selectedId)) return false;
    const bounds = getNodeBounds(node, explosionAmount);
    return !clipping.enabled || (bounds[axis] + bounds[axis + 3]) / 2 <= clipping.position;
  });
  const focused = visible.filter((node) => node.meshId === selectedId || node.meshId === hoveredId);
  const nodes = [...focused];
  if (learningMode === 'ADVANCED') {
    // Round-robin through layers so a large bone group cannot occupy every label.
    const groups = [...new Set(visible.map((node) => node.layer))].map((layer) =>
      visible.filter((node) => node.layer === layer && !focused.includes(node)));
    for (let index = 0; nodes.length < focused.length + overviewLimit && groups.some((group) => group[index]); index++) {
      for (const group of groups) {
        if (group[index] && nodes.length < focused.length + overviewLimit) nodes.push(group[index]);
      }
    }
  }

  return <>{nodes.map((node) => {
    const bounds = getNodeBounds(node, explosionAmount);
    const position: [number, number, number] = [
      (bounds[0] + bounds[3]) / 2,
      (bounds[1] + bounds[4]) / 2,
      (bounds[2] + bounds[5]) / 2,
    ];
    const selected = node.meshId === selectedId;
    const isFocused = selected || node.meshId === hoveredId;
    return (
      <Html key={node.meshId} position={position} center zIndexRange={isFocused ? [20, 10] : [9, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`anatomy-label -translate-y-8 rounded-md border px-3 py-1.5 text-xs font-semibold text-white shadow-lg ${selected ? 'border-teal-400 bg-teal-950/95' : 'border-slate-500 bg-slate-900/95'}`}>
          {node.name}
        </div>
      </Html>
    );
  })}</>;
}
