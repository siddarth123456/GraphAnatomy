'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';

export function MetadataPanel() {
  const { activeMeshNode, clearSelection } = useAppStore();

  if (!activeMeshNode) return null;

  return (
    <div className="absolute top-6 right-6 w-80 bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
        <div>
          <h3 className="text-lg font-bold text-white">{activeMeshNode.name}</h3>
          <p className="text-xs text-blue-400 font-mono uppercase tracking-wider">{activeMeshNode.system} System</p>
        </div>
        <button onClick={clearSelection} className="text-gray-400 hover:text-white transition-colors">
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        <div>
          <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">Graph Node ID</h4>
          <p className="text-sm font-mono bg-black/30 p-2 rounded text-gray-300">
            {activeMeshNode.graphNodeId}
          </p>
        </div>

        {activeMeshNode.clinicalTags.length > 0 && (
          <div>
            <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">Clinical Correlations</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {activeMeshNode.clinicalTags.map(tag => (
                <span key={tag} className="bg-purple-900/50 text-purple-200 border border-purple-700/50 text-xs px-2 py-1 rounded-full">
                  {tag.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
