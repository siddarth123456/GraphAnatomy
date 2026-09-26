'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bone, BookOpen, Layers, Network, RotateCcw, Search } from 'lucide-react';
import { AnatomyCanvas } from '@/features/anatomy-viewer/components/AnatomyCanvas';
import { MetadataPanel } from '@/features/anatomy-viewer/components/MetadataPanel';
import { ViewerSidebar } from '@/features/anatomy-viewer/components/ui/ViewerSidebar';
import { SearchBar } from '@/features/anatomy-viewer/components/ui/SearchBar';
import { KnowledgeGraphView } from '@/features/knowledge-graph/components/KnowledgeGraphView';
import { EvidencePanel } from '@/features/retrieval/components/EvidencePanel';
import { AnatomyDataProvider, useAnatomyData } from '@/providers/AnatomyDataProvider';
import { useAppStore } from '@/store/useAppStore';
type Panel = 'anatomy' | 'graph' | 'evidence';
function Workspace() {
  const [panel, setPanel] = useState<Panel>('anatomy');
  const [controls, setControls] = useState(false);
  const id = useAppStore((state) => state.activeGraphNodeId);
  const reset = useAppStore((state) => state.resetView);
  const { data } = useAnatomyData();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setControls(false); useAppStore.getState().clearSelection(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <main className="app-shell">
    <header className="app-header"><Link className="brand" href="/" aria-label="GraphAnatomy home"><span className="brand-mark"><Bone size={21} /></span><span>Graph<span className="brand-light">Anatomy</span><small>ANATOMY IN CONTEXT</small></span></Link>
      <nav aria-label="Workspace panels">{([{ id: 'anatomy', label: 'Explore', icon: BookOpen }, { id: 'graph', label: 'Knowledge graph', icon: Network }, { id: 'evidence', label: 'Find evidence', icon: Search }] as const).map((item) => <button key={item.id} aria-pressed={panel === item.id} onClick={() => setPanel(item.id)}><item.icon size={16} /><span>{item.label}</span></button>)}</nav>
      <div className="header-status"><span className="status-dot" />{data?.mode === 'neo4j' ? 'Neo4j connected' : 'Right hand anatomy'}</div>
    </header>
    <div className={`workspace ${controls ? 'controls-open' : ''}`}>
      {controls && <button className="controls-backdrop" aria-label="Dismiss controls" onClick={() => setControls(false)} />}
      <ViewerSidebar onClose={() => setControls(false)} />
      <section className="viewer-stage" aria-label="3D anatomy workspace">
        <div className="viewer-toolbar"><button className="mobile-only icon-button" aria-label="Open controls" onClick={() => setControls(true)}><Layers size={18} /></button><SearchBar /><button className="reset-button" onClick={() => { reset(); setPanel('anatomy'); }} title="Reset all viewer controls"><RotateCcw size={16} /><span>Reset view</span></button></div>
        <AnatomyCanvas />
        <div className="viewer-caption"><span>RIGHT HAND <span className="caption-dot">/</span> {id ? data?.structures.find((node) => node.graphNodeId === id)?.name ?? 'Graph selection' : 'Palmar view'}</span><small>Drag to rotate · Scroll to zoom · Right-drag to pan</small></div>
      </section>
      <aside className="inspector" aria-label="Anatomy knowledge panel">
        {panel === 'anatomy' && <MetadataPanel />}
        {panel === 'graph' && <><KnowledgeGraphView />{id && <div className="graph-selection"><MetadataPanel /></div>}</>}
        {panel === 'evidence' && <><EvidencePanel />{id && <details className="selected-details" open><summary>Selected anatomy</summary><MetadataPanel /></details>}</>}
      </aside>
    </div>
    <footer className="app-footer"><span>{data ? [...new Set(data.structures.flatMap(node => node.asset ? [node.asset.sourceDataset] : []))].join(' + ') : 'Anatomy sources'} · Educational exploration</span><span>{data ? `${data.metadata.renderableCount} 3D models · ${data.metadata.structureCount} catalog entries · ${data.metadata.relationshipCount} relationships` : 'Loading catalog…'}</span></footer>
  </main>;
}
export default function Home() { return <AnatomyDataProvider><Workspace /></AnatomyDataProvider>; }
