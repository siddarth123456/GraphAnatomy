'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { IGraphRendererProps } from '@/types/graph';

export default function ForceGraphRenderer({
  data,
  onNodeClick,
  onNodeHover,
  highlightedNodes,
  highlightedLinks,
}: IGraphRendererProps) {
  const fgRef = useRef<any>(null);

  // Center camera on the graph when data loads
  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      fgRef.current.d3Force('charge').strength(-120);
      fgRef.current.zoomToFit(400, 100);
    }
    // Deep equality or primitive dependency to prevent infinite loops from object recreation
  }, [data.nodes.length]);

  const handleNodeClick = useCallback((node: any) => {
    // Fly to the node
    if (fgRef.current) {
      const distance = 40;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
      
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node, 
        3000 // ms transition duration
      );
    }

    // Trigger external event bus
    if (onNodeClick) {
      // Pass both the graph ID and the associated 3D mesh ID
      onNodeClick(node.id, node.visualBinding?.meshId);
    }
  }, [onNodeClick]);

  return (
    <div className="w-full h-full bg-[#0f0f11]">
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        nodeLabel="name"
        nodeColor={(node: any) => {
          if (highlightedNodes && highlightedNodes.has(node.id)) return '#ffffff';
          return node.color || '#9ca3af';
        }}
        nodeVal={(node: any) => node.val || 1}
        linkColor={(link: any) => {
          if (highlightedLinks && highlightedLinks.has(link.id)) return '#ffffff';
          return link.color || '#374151';
        }}
        linkWidth={(link: any) => (highlightedLinks && highlightedLinks.has(link.id) ? 2 : 1)}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={(link: any) => (highlightedLinks && highlightedLinks.has(link.id) ? 4 : 0)}
        onNodeClick={handleNodeClick}
        onNodeHover={(node: any) => onNodeHover?.(node ? node.id : null)}
        backgroundColor="#0f0f11"
        showNavInfo={false}
      />
    </div>
  );
}
