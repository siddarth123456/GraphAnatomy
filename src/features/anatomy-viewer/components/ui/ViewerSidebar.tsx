'use client';
import { useMemo } from 'react';
import { useAppStore, DEFAULT_ANATOMY_LAYERS, type ViewPreset } from '@/store/useAppStore';
import { AnatomyLayer } from '@/types/anatomy';
import { useRegionManager } from '@/hooks/useRegionManager';
import { useAnatomyData } from '@/providers/AnatomyDataProvider';
import { layerPresentation } from '../../anatomy-presentation';
import { Eye, EyeOff, Layers, X } from 'lucide-react';
const presets: { id: ViewPreset; name: string; layers: AnatomyLayer[] }[] = [
  { id: 'EDUCATIONAL', name: 'Anatomy', layers: DEFAULT_ANATOMY_LAYERS },
  { id: 'SKELETON', name: 'Skeleton', layers: [AnatomyLayer.Bone] },
  { id: 'MUSCULOSKELETAL', name: 'Muscle & bone', layers: [AnatomyLayer.Bone, AnatomyLayer.Muscle, AnatomyLayer.Tendon, AnatomyLayer.Ligament] },
  { id: 'SURGICAL', name: 'Soft tissue', layers: Object.values(AnatomyLayer).filter((layer) => layer !== AnatomyLayer.Bone) },
  { id: 'NEUROVASCULAR', name: 'Nerves & vessels', layers: [AnatomyLayer.Nerve, AnatomyLayer.Artery, AnatomyLayer.Vein] },
  { id: 'SURFACE', name: 'Surface', layers: [AnatomyLayer.Skin, AnatomyLayer.Fat] },
  { id: 'COMPLETE', name: 'All structures', layers: Object.values(AnatomyLayer) },
];
export function ViewerSidebar({ onClose }: { onClose: () => void }) {
  const state = useAppStore();
  const { meshes } = useRegionManager();
  const { data } = useAnatomyData();
  const layers = useMemo(() => Object.values(AnatomyLayer).map((layer) => ({
    layer,
    count: meshes.filter((node) => node.layer === layer).length,
    catalogCount: data?.structures.filter((node) => node.category === layer).length ?? 0,
  })).filter((entry) => entry.count || entry.catalogCount), [meshes, data]);
  const axis = { axial: 2, sagittal: 0, coronal: 1 }[state.clippingState.plane];
  const min = meshes.length ? Math.min(...meshes.map((node) => node.boundingBox[axis])) - state.explosionAmount : -1;
  const max = meshes.length ? Math.max(...meshes.map((node) => node.boundingBox[axis + 3])) + state.explosionAmount : 3;
  return <aside className="viewer-sidebar" aria-label="Viewer controls">
    <div className="panel-heading"><h2><Layers size={16} /> View controls</h2><button className="mobile-only icon-button" aria-label="Close controls" onClick={onClose}><X size={18} /></button></div>
    <section><h3>View presets</h3><div className="preset-grid">{presets.map((preset) => <button key={preset.id} aria-pressed={state.activePreset === preset.id} onClick={() => { state.setLayers(preset.layers); state.setActivePreset(preset.id); }}>{preset.name}</button>)}</div></section>
    <section><h3>Anatomy layers</h3><div className="layer-list">{layers.map(({ layer, count, catalogCount }) => {
      const active = count > 0 && state.activeLayers.includes(layer);
      return <button key={layer} aria-pressed={active} disabled={count === 0} title={count ? `${count} available 3D structures${catalogCount > count ? `; ${catalogCount - count} additional catalog entries have no 3D model` : ''}` : 'Catalog entries are searchable; no 3D geometry is available for this layer.'} onClick={() => { state.toggleLayer(layer); state.setActivePreset('CUSTOM'); }}>
        <span className="layer-dot" style={{ background: layerPresentation[layer].color }} /><span>{layerPresentation[layer].label}</span><small>{count ? `${count} 3D` : 'No 3D'}</small>{active ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>;
    })}</div><p className="hint">Counts show available 3D models. Entries without geometry remain searchable in the catalog.</p>{meshes.some((node) => node.layer === AnatomyLayer.Skin || node.layer === AnatomyLayer.Fat) && <p className="hint">Hide skin and fat to expose deeper structures.</p>}</section>
    <section><h3>Explore the model</h3>
      <label className="check-control"><span>Isolate selected structure</span><input type="checkbox" checked={state.isolationMode} disabled={!state.selectedMeshId} onChange={(event) => state.setIsolationMode(event.target.checked)} /></label>
      <label className="range-control"><span>Exploded view <output>{Math.round(state.explosionAmount * 50)}%</output></span><input aria-label="Exploded view" type="range" min={0} max={2} step={0.02} value={state.explosionAmount} onChange={(event) => state.setExplosionAmount(Number(event.target.value))} /></label>
      <label className="check-control"><span>Cross section</span><input type="checkbox" checked={state.clippingState.enabled} onChange={(event) => state.setClippingState({ enabled: event.target.checked })} /></label>
      {state.clippingState.enabled && <div className="section-controls">
        <label>Section plane<select aria-label="Section plane" value={state.clippingState.plane} onChange={(event) => state.setClippingState({ plane: event.target.value as 'axial' | 'sagittal' | 'coronal', position: 0 })}><option value="axial">Axial</option><option value="sagittal">Sagittal</option><option value="coronal">Coronal</option></select></label>
        <label className="range-control"><span>Section position</span><input aria-label="Section position" type="range" min={min} max={max} step={0.01} value={state.clippingState.position} onChange={(event) => state.setClippingState({ position: Number(event.target.value) })} /></label>
      </div>}
    </section>
    <section><h3>Label detail</h3><div className="preset-grid">{(['BEGINNER', 'ADVANCED'] as const).map((mode) => <button key={mode} aria-pressed={state.learningMode === mode} onClick={() => state.setLearningMode(mode)}>{mode === 'BEGINNER' ? 'Focused' : 'Overview'}</button>)}</div><p className="hint">Focused labels follow selection and hover. Overview adds up to 12 labels across visible layers.</p></section>
    <div className="sidebar-foot"><span className="status-dot" /> Right hand · Layered atlas</div>
  </aside>;
}
