'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/useAppStore';
import { GraphData } from '@/types/graph';

// Dynamically import the renderer to disable SSR (since WebGL requires the window object)
// This fulfills Task 6: Abstract GraphRenderer Interface
const ForceGraphRenderer = dynamic(
  () => import('./ForceGraphRenderer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#0f0f11] text-gray-400">
        Loading Knowledge Graph Engine...
      </div>
    )
  }
);

interface KnowledgeGraphViewProps {
  data: GraphData;
  engine?: 'force-graph' | 'cytoscape' | 'webgpu'; // Future-proofing
}

export function KnowledgeGraphView({ data, engine = 'force-graph' }: KnowledgeGraphViewProps) {
  const { selectAnatomy, setHoveredAnatomy, selectedGraphNodeId } = useAppStore();
  
  // Local state for graph-specific highlights (e.g. paths)
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightedLinks, setHighlightedLinks] = useState<Set<string>>(new Set());

  // Sync Neo4j graph clicks to the global Zustand store, which will trigger Three.js
  const handleNodeClick = (nodeId: string, meshId?: string) => {
    if (meshId) {
      selectAnatomy(meshId, nodeId);
    }
  };

  const handleNodeHover = (nodeId: string | null) => {
    // Could sync with 3D mesh hover state here
  };

  // Keep the selected node highlighted in the graph
  React.useEffect(() => {
    if (selectedGraphNodeId) {
      setHighlightedNodes(new Set([selectedGraphNodeId]));
    } else {
      setHighlightedNodes(new Set());
    }
  }, [selectedGraphNodeId]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Renderer Abstraction */}
      {engine === 'force-graph' && (
        <ForceGraphRenderer
          data={data}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          highlightedNodes={highlightedNodes}
          highlightedLinks={highlightedLinks}
        />
      )}
      
      {/* 
        Future engines can be added here without touching the Neo4j or 3D layers:
        {engine === 'cytoscape' && <CytoscapeRenderer ... />} 
      */}
    </div>
  );
}
