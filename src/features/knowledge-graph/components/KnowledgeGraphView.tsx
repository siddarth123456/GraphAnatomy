'use client';
import { Component, type ReactNode, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/useAppStore';
import { useAnatomyData, useSelectStructure } from '@/providers/AnatomyDataProvider';
import { toGraphData } from '../utils/GraphAdapter';
const Renderer = dynamic(() => import('./ForceGraphRenderer'), { ssr: false, loading: () => <div role="status" className="graph-loading">Loading knowledge graph…</div> });

class GraphRenderBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <p role="status" className="panel-content hint">The interactive graph could not be rendered. Use the node directory below to explore the same relationships.</p>;
    return this.props.children;
  }
}
export function KnowledgeGraphView() {
  const { data, error, retry } = useAnatomyData();
  const select = useSelectStructure();
  const activeId = useAppStore((state) => state.activeGraphNodeId);
  const [filter, setFilter] = useState('');
  const graph = useMemo(() => data ? toGraphData(data) : null, [data]);
  const highlightedNodes = useMemo(() => new Set(activeId ? [activeId] : []), [activeId]);
  if (error) return <div className="panel-content" role="alert"><p>{error}</p><button onClick={retry}>Retry graph</button></div>;
  if (!graph) return <div role="status" className="panel-content">Loading knowledge graph…</div>;
  return <div className="knowledge-panel">
    <div className="panel-content graph-intro"><p className="eyebrow">Anatomical relationships</p><h2>See the connections.</h2><p>{graph.nodes.length} nodes · {graph.links.length} cited connections. Select a node to explore its anatomy.</p></div>
    <GraphRenderBoundary><Renderer data={graph} onNodeClick={select} highlightedNodes={highlightedNodes} /></GraphRenderBoundary>
    <div className="panel-content graph-directory"><label htmlFor="graph-filter">Find a graph node</label><input id="graph-filter" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter nodes…" />
      <div className="graph-node-list">{graph.nodes.filter((node) => node.name.toLowerCase().includes(filter.toLowerCase())).map((node) => <button aria-pressed={node.id === activeId} key={node.id} onClick={() => select(node.id)}><span className="layer-dot" style={{ background: node.color }} />{node.name}<small>{node.visualBinding.meshId ? '3D' : 'Graph'}</small></button>)}</div>
    </div>
  </div>;
}
