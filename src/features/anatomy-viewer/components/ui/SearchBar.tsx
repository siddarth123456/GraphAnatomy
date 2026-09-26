'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useAnatomyData, useSelectStructure } from '@/providers/AnatomyDataProvider';
export function SearchBar() {
  const { data } = useAnatomyData();
  const select = useSelectStructure();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const normalized = query.toLowerCase().replace(/[^a-z0-9]/g, '');
  const results = (data?.structures ?? []).filter((node) => [node.name, node.fmaId ?? '', ...node.searchableTerms].some((value) => value.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalized))).slice(0, 10);
  const choose = (id: string, name: string) => { select(id); setQuery(name); setOpen(false); };
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return <div className="anatomy-search" ref={root}>
    <Search size={18} aria-hidden="true" />
    <input aria-label="Search anatomy" role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={open && results[index] ? `${listId}-${index}` : undefined}
      placeholder="Search a structure or FMA ID…" value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setIndex(0); setOpen(true); }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
        if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setIndex((value) => Math.max(0, Math.min(value + 1, results.length - 1))); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setIndex((value) => Math.max(0, value - 1)); }
        if (event.key === 'Enter' && open && results[index]) { event.preventDefault(); choose(results[index].graphNodeId, results[index].name); }
      }} />
    {query && <button aria-label="Clear search" onClick={() => { setQuery(''); setIndex(0); setOpen(false); }}><X size={16} /></button>}
    {open && <div className="search-results" id={listId} role="listbox" aria-label="Anatomy search results">
      {!data ? <p>Loading the anatomy catalog…</p> : results.length === 0 ? <p>No structures match “{query}”. Try a bone, artery, or muscle name.</p> : results.map((node, i) =>
        <button key={node.graphNodeId} id={`${listId}-${i}`} role="option" aria-selected={i === index} onClick={() => choose(node.graphNodeId, node.name)} onPointerMove={() => setIndex(i)}>
          <span>{node.name}<small>{node.category} · {node.asset ? '3D structure' : 'Graph entry'}</small></span>
        </button>)}
    </div>}
  </div>;
}
