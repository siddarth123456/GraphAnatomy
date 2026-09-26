'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D, { type ForceGraphMethods } from 'react-force-graph-3d';
import type { GraphNode, GraphLink, IGraphRendererProps } from '@/types/graph';
export default function ForceGraphRenderer({ data, onNodeClick, highlightedNodes }: IGraphRendererProps) {
  const ref = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 350, height: 340 });
  // The renderer mutates positions and edge endpoints; isolate those from application data.
  const graph = useMemo(() => ({ nodes: data.nodes.map((node) => ({ ...node })), links: data.links.map((link) => ({ ...link })) }), [data]);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div className="force-graph" ref={container} aria-label="Interactive anatomy knowledge graph">
    <ForceGraph3D<GraphNode, GraphLink> ref={ref} width={size.width} height={size.height} graphData={graph}
      nodeLabel="name" nodeColor={(node) => highlightedNodes?.has(node.id) ? '#ffffff' : node.color}
      nodeVal={(node) => highlightedNodes?.has(node.id) ? 7 : node.val} linkLabel={(link) => link.type.toLowerCase().replaceAll('_', ' ')}
      linkColor={() => '#62738c'} linkWidth={0.6} linkDirectionalArrowLength={2} linkDirectionalArrowRelPos={0.85}
      onNodeClick={(node) => onNodeClick?.(node.id, node.visualBinding?.meshId)}
      onEngineStop={() => ref.current?.zoomToFit(350, 35)} cooldownTicks={80} backgroundColor="#111827" showNavInfo={false} />
  </div>;
}
