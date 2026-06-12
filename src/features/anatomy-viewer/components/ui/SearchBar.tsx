import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useRegionManager } from '@/hooks/useRegionManager';
import { useAppStore } from '@/store/useAppStore';
import { AnatomySceneNode } from '@/types/anatomy';

export const SearchBar = () => {
  const { meshes } = useRegionManager();
  const selectAnatomy = useAppStore(state => state.selectAnatomy);
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnatomySceneNode[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const matches = meshes.filter(mesh => {
      if (mesh.name.toLowerCase().includes(lowerQuery)) return true;
      if (mesh.fmaId && mesh.fmaId.toLowerCase().includes(lowerQuery)) return true;
      if (mesh.searchableTerms && mesh.searchableTerms.some(t => t.toLowerCase().includes(lowerQuery))) return true;
      return false;
    });

    setResults(matches.slice(0, 8)); // Top 8 results
    setIsOpen(true);
  }, [query, meshes]);

  useEffect(() => {
    // Click outside to close
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (mesh: AnatomySceneNode) => {
    selectAnatomy(mesh);
    setQuery(mesh.name);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-[450px] pointer-events-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search anatomy (e.g., 'Scaphoid', 'FMA:23984')" 
          className="w-full bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-full py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xl transition-all"
        />
        
        {/* Dropdown Results */}
        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
            {results.map((result) => (
              <button
                key={result.meshId}
                onClick={() => handleSelect(result)}
                className="w-full text-left px-4 py-3 hover:bg-gray-800 border-b border-gray-800/50 last:border-0 flex items-center justify-between group transition-colors"
              >
                <div>
                  <div className="font-medium text-white">{result.name}</div>
                  <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                    <span className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 font-mono">{result.system}</span>
                    {result.fmaId && <span className="text-gray-600">{result.fmaId}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
