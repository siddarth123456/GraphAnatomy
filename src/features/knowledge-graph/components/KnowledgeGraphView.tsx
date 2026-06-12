'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/useAppStore';
import { GraphData } from '@/types/graph';
import { HighlightState, RegionManifest } from '@/types/anatomy';

const ForceGraphRenderer = dynamic(
  () => import('./ForceGraphRenderer'),
  { ssr: false, loading: () => <div className="text-gray-400">Loading Engine...</div> }
);

interface KnowledgeGraphViewProps {
  data: GraphData;
  engine?: 'force-graph' | 'cytoscape' | 'webgpu';
}

export function KnowledgeGraphView({ data, engine = 'force-graph' }: KnowledgeGraphViewProps) {
  const { selectAnatomy, activeGraphNodeId } = useAppStore();
  const [manifest, setManifest] = useState<RegionManifest | null>(null);

  // Load manifest to sync graph clicks to full 3D nodes
  useEffect(() => {
    fetch('/manifests/hand_region.json')
      .then(res => res.json())
      .then(data => setManifest(data));
  }, []);

  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());

  const handleNodeClick = (nodeId: string, meshId?: string) => {
    if (meshId && manifest) {
      // Find the full AnatomySceneNode from the JSON manifest
      const targetNode = manifest.meshes.find(m => m.meshId === meshId);
      if (targetNode) {
        selectAnatomy(targetNode);
      }
    }
  };

  React.useEffect(() => {
    if (activeGraphNodeId) {
      setHighlightedNodes(new Set([activeGraphNodeId]));
    } else {
      setHighlightedNodes(new Set());
    }
  }, [activeGraphNodeId]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {engine === 'force-graph' && (
        <ForceGraphRenderer
          data={data}
          onNodeClick={handleNodeClick}
          highlightedNodes={highlightedNodes}
        />
      )}
    </div>
  );
}
