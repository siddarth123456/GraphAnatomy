'use client';

import React from 'react';
import { KnowledgeGraphView } from '@/features/knowledge-graph/components/KnowledgeGraphView';
import { AnatomyCanvas } from '@/features/anatomy-viewer/components/AnatomyCanvas';
import { MetadataPanel } from '@/features/anatomy-viewer/components/MetadataPanel';
import { GraphData } from '@/types/graph';
import { useAppStore } from '@/store/useAppStore';

// Mock data based on the Neo4j System Architecture Schema
const mockHandGraph: GraphData = {
  nodes: [
    {
      id: "NERV-01",
      name: "Median Nerve",
      system: "NERVOUS",
      color: "#fbbf24", // Yellow
      val: 8,
      visualBinding: {
        meshId: "mesh_median_nerve_01",
        glbObject: "median_nerve_main_geo",
        materialId: "mat_nerves_yellow",
        layerDepth: 6
      }
    },
    {
      id: "MUSC-01",
      name: "Abductor Pollicis Brevis",
      system: "MUSCULAR",
      color: "#ef4444", // Red
      val: 4,
      visualBinding: {
        meshId: "mesh_apb_01",
        glbObject: "apb.glb",
        materialId: "mat_muscle_red",
        layerDepth: 3
      }
    }
  ],
  links: [
    {
      source: "NERV-01",
      target: "MUSC-01",
      type: "INNERVATES",
      color: "#9ca3af" // Gray edge
    }
  ]
};

export default function Home() {
  const { activeMeshNode } = useAppStore();

  return (
    <main className="flex h-screen w-screen bg-[#0f0f11] text-white overflow-hidden">
      
      {/* LEFT PANEL: 3D Scene (React Three Fiber) */}
      <div className="flex-1 border-r border-gray-800 relative">
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <h1 className="text-xl font-bold tracking-tight">Interactive Anatomy (V2)</h1>
          <p className="text-sm text-gray-400">WebGL Production Engine</p>
        </div>
        
        <AnatomyCanvas />

        {/* Floating Metadata Panel (Triggered on Selection) */}
        <MetadataPanel />
        
        {/* Diagnostic Layer Panel */}
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
          <div className="bg-gray-900/80 backdrop-blur-md p-4 rounded border border-gray-800 text-sm font-mono text-gray-300">
            <h3 className="text-gray-500 mb-2">Active Node State:</h3>
            <p>Selected Mesh ID: <span className="text-blue-400">{activeMeshNode?.meshId || 'none'}</span></p>
            <p>Fly-To Target: <span className="text-blue-400">{activeMeshNode?.name || 'none'}</span></p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Obsidian Knowledge Graph */}
      <div className="flex-1 relative border-l border-gray-800">
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <h2 className="text-xl font-bold tracking-tight bg-gray-900/80 px-2 py-1 rounded">Medical Knowledge Graph</h2>
          <p className="text-sm text-gray-400 px-2">Neo4j Hybrid Resolver</p>
        </div>
        
        <KnowledgeGraphView data={mockHandGraph} engine="force-graph" />
      </div>

    </main>
  );
}
