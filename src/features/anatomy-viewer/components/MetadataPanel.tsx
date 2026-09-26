'use client';
import { ArrowUpRight, ExternalLink, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAnatomyData, useSelectStructure } from '@/providers/AnatomyDataProvider';
export function MetadataPanel() {
  const id = useAppStore((state) => state.activeGraphNodeId);
  const clearSelection = useAppStore((state) => state.clearSelection);
  const select = useSelectStructure();
  const { data, error, retry } = useAnatomyData();
  const node = data?.structures.find((item) => item.graphNodeId === id);
  const condition = data?.clinicalConditions.find((item) => item.id === id);
  const entry = node ?? condition;
  const relations = data?.relationships.filter((item) => item.source === id || item.target === id) ?? [];
  const nameOf = (nodeId: string) => data?.structures.find((item) => item.graphNodeId === nodeId)?.name ?? data?.clinicalConditions.find((item) => item.id === nodeId)?.name ?? nodeId;
  if (error) return <div className="panel-content" role="alert"><h2>Knowledge catalog unavailable</h2><p>{error}</p><button className="primary-button" onClick={retry}>Retry catalog</button></div>;
  if (!data) return <div className="panel-content" role="status">Loading anatomy knowledge…</div>;
  if (!entry) return <div className="panel-content welcome-panel">
    <p className="eyebrow">Explore / Right hand</p><h2>Anatomy, connected.</h2><p>Select a structure to connect what you see with what it does.</p>
    <div className="catalog-stats"><div><strong>{data.metadata.renderableCount}</strong><span>3D structures</span></div><div><strong>{data.metadata.relationshipCount}</strong><span>Cited relationships</span></div></div>
    <h3>Start exploring</h3>{['Scaphoid', 'Abductor Pollicis Brevis', 'Median Nerve'].map((name) => {
      const match = data.structures.find((item) => item.name.toLowerCase().includes(name.toLowerCase()));
      return match && <button className="explore-link" key={name} onClick={() => select(match.graphNodeId)}><span>{name}<small>{match.asset ? 'Explore in 3D' : 'Explore the knowledge graph'}</small></span><ArrowUpRight size={18} /></button>;
    })}
    <div className="scope-note">Hand anatomy learning demo. The catalog includes 29 bones, an artery, and a muscle in 3D. The median nerve is a graph entry.</div>
  </div>;
  return <div className="panel-content metadata-panel" data-testid="metadata-panel">
    <div className="detail-heading"><p className="eyebrow">{node?.category ?? 'Clinical connection'}</p><button className="icon-button" aria-label="Clear selection" onClick={clearSelection}><X size={18} /></button></div>
    <h2>{entry.name}</h2><span className="badge">{node?.asset ? 'Selected in 3D' : 'Graph entry · No 3D model'}</span>
    <p className="description">{entry.description}</p>
    {node?.fmaId && <div className="ontology-row"><span>FMA mapping</span><code>{node.fmaId}</code><small>{node.ontologyValidated ? 'Validated mapping' : 'Source mapping · not independently validated'}</small></div>}
    {entry.citation && <a className="source-link" href={entry.citation.url} target="_blank" rel="noreferrer">{entry.citation.title}<ExternalLink size={13} /></a>}
    <h3>Connected anatomy <span>{relations.length}</span></h3>
    {relations.length === 0 && <p className="hint">No curated relationships for this structure yet.</p>}
    {relations.map((relation) => <article className="relation-card" key={relation.id}>
      <p className="relationship-label">{relation.type.toLowerCase().replaceAll('_', ' ')}</p>
      <div className="relation-direction"><button onClick={() => select(relation.source)}>{nameOf(relation.source)}</button><span aria-hidden="true">→</span><button onClick={() => select(relation.target)}>{nameOf(relation.target)}</button></div>
      <p>{relation.description}</p><a href={relation.citation.url} target="_blank" rel="noreferrer">{relation.citation.title}<ExternalLink size={12} /></a>
    </article>)}
  </div>;
}
