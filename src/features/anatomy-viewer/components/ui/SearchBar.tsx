'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useAnatomyData, useSelectStructure } from '@/providers/AnatomyDataProvider';
import { categoryLabel } from '../../anatomy-presentation';

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function SearchBar() {
  const { data, error, retry } = useAnatomyData();
  const select = useSelectStructure();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const searchIndex = useMemo(() => (data?.structures ?? []).map((node) => ({
    node,
    name: normalize(node.name),
    terms: [node.name, node.fmaId ?? '', node.category, categoryLabel(node.category), node.system.name, ...node.searchableTerms].map(normalize),
  })), [data]);
  const results = useMemo(() => {
    const normalized = normalize(query);
    const words = query.trim().split(/\s+/).map(normalize).filter(Boolean);
    return searchIndex.filter((entry) => !normalized || entry.terms.some((term) => term.includes(normalized))
      || words.every((word) => entry.terms.some((term) => term.includes(word))))
      .sort((a, b) => {
        const rank = (entry: typeof a) => entry.name === normalized ? 0 : entry.name.startsWith(normalized) ? 1 : 2;
        return rank(a) - rank(b) || a.node.name.localeCompare(b.node.name);
      }).map((entry) => entry.node);
  }, [query, searchIndex]);
  const activeIndex = Math.min(index, Math.max(0, results.length - 1));
  const choose = (id: string, name: string) => { select(id); setQuery(name); setOpen(false); };
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, listId, query]);
  return <div className="anatomy-search" ref={root}>
    <Search size={18} aria-hidden="true" />
    <input aria-label="Search anatomy" role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={open && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
      placeholder="Search structure, tissue, or FMA ID…" value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setIndex(0); setOpen(true); }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
        if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setIndex(Math.max(0, Math.min(activeIndex + 1, results.length - 1))); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setIndex(Math.max(0, activeIndex - 1)); }
        if (event.key === 'Enter' && open && results[activeIndex]) { event.preventDefault(); choose(results[activeIndex].graphNodeId, results[activeIndex].name); }
      }} />
    {query && <button aria-label="Clear search" onClick={() => { setQuery(''); setIndex(0); setOpen(false); }}><X size={16} /></button>}
    {open && <div className="search-results">
      {error ? <div role="alert" className="search-message"><p>The anatomy catalog could not be loaded.</p><button onClick={retry}>Retry search catalog</button></div>
        : !data ? <p role="status">Loading the anatomy catalog…</p>
          : <><div className="search-result-summary" role="status">{results.length} {results.length === 1 ? 'match' : 'matches'}{!query && ' · Search all tissues'}</div>
            <div className="search-options" id={listId} role="listbox" aria-label="Anatomy search results">
              {results.map((node, i) => <button key={node.graphNodeId} id={`${listId}-${i}`} role="option" aria-selected={i === activeIndex} onClick={() => choose(node.graphNodeId, node.name)} onPointerMove={() => setIndex(i)}>
                <span>{node.name}<small>{categoryLabel(node.category)} · {node.asset ? '3D structure' : 'Catalog only · No 3D model'}</small></span>
              </button>)}
            </div>
            {results.length === 0 && <p>No structures match “{query}”. Try a structure name, tissue category, or FMA ID.</p>}
          </>}
    </div>}
  </div>;
}
