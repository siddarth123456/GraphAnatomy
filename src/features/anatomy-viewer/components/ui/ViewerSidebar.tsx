'use client';
import { useAppStore, type ViewPreset } from '@/store/useAppStore';
import { AnatomyLayer } from '@/types/anatomy';
import { useRegionManager } from '@/hooks/useRegionManager';
import { Eye, EyeOff, Layers, X } from 'lucide-react';
const presets: { id: ViewPreset; name: string; layers: AnatomyLayer[] }[] = [
  { id: 'EDUCATIONAL', name: 'All structures', layers: Object.values(AnatomyLayer) },
  { id: 'SKELETON', name: 'Skeleton', layers: [AnatomyLayer.Bone] },
  { id: 'MUSCULOSKELETAL', name: 'Muscle & bone', layers: [AnatomyLayer.Bone, AnatomyLayer.Muscle] },
  { id: 'SURGICAL', name: 'Soft tissue', layers: [AnatomyLayer.Muscle, AnatomyLayer.Artery, AnatomyLayer.Nerve] },
];
const colors: Partial<Record<AnatomyLayer, string>> = { Bone: '#e8ddc6', Muscle: '#d7807d', Artery: '#ee6262', Nerve: '#f6cf65' };
export function ViewerSidebar({ onClose }: { onClose: () => void }) {
  const state = useAppStore();
  const { meshes } = useRegionManager();
  const layers = [...new Set(meshes.map((node) => node.layer))];
  const axis = { axial: 2, sagittal: 0, coronal: 1 }[state.clippingState.plane];
  const min = meshes.length ? Math.min(...meshes.map((node) => node.boundingBox[axis])) - state.explosionAmount : -1;
  const max = meshes.length ? Math.max(...meshes.map((node) => node.boundingBox[axis + 3])) + state.explosionAmount : 3;
  return <aside className="viewer-sidebar" aria-label="Viewer controls">
    <div className="panel-heading"><h2><Layers size={16} /> View controls</h2><button className="mobile-only icon-button" aria-label="Close controls" onClick={onClose}><X size={18} /></button></div>
    <section><h3>View presets</h3><div className="preset-grid">{presets.map((preset) => <button key={preset.id} aria-pressed={state.activePreset === preset.id} onClick={() => { state.setLayers(preset.layers); state.setActivePreset(preset.id); }}>{preset.name}</button>)}</div></section>
    <section><h3>Anatomy layers</h3><div className="layer-list">{layers.map((layer) => {
      const active = state.activeLayers.includes(layer);
      return <button key={layer} aria-pressed={active} onClick={() => { state.toggleLayer(layer); state.setActivePreset('CUSTOM'); }}>
        <span className="layer-dot" style={{ background: colors[layer] }} /><span>{layer === AnatomyLayer.Bone ? 'Bones' : layer}</span><small>{meshes.filter((node) => node.layer === layer).length}</small>{active ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>;
    })}</div><p className="hint">Only layers with available 3D assets are shown.</p></section>
    <section><h3>Explore the model</h3>
      <label className="check-control"><span>Isolate selected structure</span><input type="checkbox" checked={state.isolationMode} disabled={!state.selectedMeshId} onChange={(event) => state.setIsolationMode(event.target.checked)} /></label>
      <label className="range-control"><span>Exploded view <output>{Math.round(state.explosionAmount * 50)}%</output></span><input aria-label="Exploded view" type="range" min={0} max={2} step={0.02} value={state.explosionAmount} onChange={(event) => state.setExplosionAmount(Number(event.target.value))} /></label>
      <label className="check-control"><span>Cross section</span><input type="checkbox" checked={state.clippingState.enabled} onChange={(event) => state.setClippingState({ enabled: event.target.checked })} /></label>
      {state.clippingState.enabled && <div className="section-controls">
        <label>Section plane<select aria-label="Section plane" value={state.clippingState.plane} onChange={(event) => state.setClippingState({ plane: event.target.value as 'axial' | 'sagittal' | 'coronal', position: 0 })}><option value="axial">Axial</option><option value="sagittal">Sagittal</option><option value="coronal">Coronal</option></select></label>
        <label className="range-control"><span>Section position</span><input aria-label="Section position" type="range" min={min} max={max} step={0.01} value={state.clippingState.position} onChange={(event) => state.setClippingState({ position: Number(event.target.value) })} /></label>
      </div>}
    </section>
    <section><h3>Label detail</h3><div className="preset-grid">{(['BEGINNER', 'ADVANCED'] as const).map((mode) => <button key={mode} aria-pressed={state.learningMode === mode} onClick={() => state.setLearningMode(mode)}>{mode === 'BEGINNER' ? 'Focused' : 'All labels'}</button>)}</div></section>
    <div className="sidebar-foot"><span className="status-dot" /> Right hand · BodyParts3D</div>
  </aside>;
}
