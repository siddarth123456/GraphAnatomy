'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import type { RetrievalResponse } from '@/lib/anatomy-types';
import { useSelectStructure } from '@/providers/AnatomyDataProvider';
const examples = ['What muscles are innervated by the median nerve?', 'What structures are affected in carpal tunnel syndrome?', 'What articulates with the scaphoid?'];
export function EvidencePanel() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<RetrievalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const select = useSelectStructure();
  useEffect(() => () => controller.current?.abort(), []);
  async function ask(text: string) {
    if (!text.trim()) return;
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    const timeout = setTimeout(() => request.abort('timeout'), 20000);
    setQuery(text); setLoading(true); setError(null); setResult(null);
    try {
      const response = await fetch('/api/retrieval', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: text }), signal: request.signal });
      if (!response.ok) throw new Error(response.status === 400 ? 'Enter a question between 1 and 500 characters.' : 'Evidence retrieval is unavailable. Please retry.');
      const payload: RetrievalResponse = await response.json();
      if (controller.current === request) setResult(payload);
    } catch (reason) {
      if (controller.current === request && (!request.signal.aborted || request.signal.reason === 'timeout')) setError(reason instanceof Error ? reason.message : 'Evidence retrieval failed.');
    } finally { clearTimeout(timeout); if (controller.current === request) setLoading(false); }
  }
  return <div className="panel-content evidence-panel">
    <p className="eyebrow">Graph-grounded retrieval</p><h2>Follow the evidence.</h2><p>Ask about the hand. Explore cited connections from the anatomy graph.</p>
    <form onSubmit={(event) => { event.preventDefault(); void ask(query); }}>
      <label htmlFor="anatomy-question">Your anatomy question</label><textarea id="anatomy-question" value={query} maxLength={500} rows={3} placeholder="What does the median nerve innervate?" onChange={(event) => setQuery(event.target.value)} />
      <button type="submit" className="primary-button" disabled={loading || !query.trim()}><Search size={16} />{loading ? 'Finding evidence…' : 'Find evidence'}</button>
    </form>
    <div aria-live="polite">{error && <p role="alert" className="error-message">{error}</p>}{result && <>
      <h3>{result.evidence.length} evidence {result.evidence.length === 1 ? 'connection' : 'connections'}</h3><p className="hint">{result.message}</p>
      {result.evidence.map((evidence) => <article className="relation-card" key={evidence.id}>
        <p className="relationship-label">{evidence.relationship.toLowerCase().replaceAll('_', ' ')}</p>
        <div className="relation-direction"><button onClick={() => select(evidence.sourceNode.graphNodeId)}>{evidence.sourceNode.name}</button><span>→</span><button onClick={() => select(evidence.targetNode.graphNodeId)}>{evidence.targetNode.name}</button></div>
        <p>{evidence.description}</p><a href={evidence.citation.url} target="_blank" rel="noreferrer">{evidence.citation.title}<ArrowUpRight size={13} /></a>
      </article>)}
    </>}</div>
    <div className="example-questions"><h3>Try a question</h3>{examples.map((example) => <button key={example} onClick={() => void ask(example)}>{example}<ArrowUpRight size={15} /></button>)}</div>
    <p className="scope-note">Educational reference only. Results are curated graph evidence, not generated medical advice. Spatial reasoning is not supported in this version.</p>
  </div>;
}
