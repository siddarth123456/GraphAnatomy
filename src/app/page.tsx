'use client';

import React, { useState } from 'react';
import { KnowledgeGraphView } from '@/features/knowledge-graph/components/KnowledgeGraphView';
import { AnatomyCanvas } from '@/features/anatomy-viewer/components/AnatomyCanvas';
import { MetadataPanel } from '@/features/anatomy-viewer/components/MetadataPanel';
import { ViewerSidebar } from '@/features/anatomy-viewer/components/ui/ViewerSidebar';
import { SearchBar } from '@/features/anatomy-viewer/components/ui/SearchBar';
import { GraphData } from '@/types/graph';
import { useAppStore } from '@/store/useAppStore';
import { Network, X } from 'lucide-react';

// Mock data based on the Neo4j System Architecture Schema
const mockHandGraph: GraphData = {
  nodes: [
    {
      id: "NERVE_MEDIAN",
      name: "Median Nerve",
      system: "NERVOUS",
      color: "#fbbf24", // Yellow
      val: 8,
      visualBinding: { meshId: "mesh_median_nerve_01" }
    },
    {
      id: "BONE_SCAPHOID",
      name: "Scaphoid",
      system: "SKELETAL",
      color: "#e5e7eb", // Bone white
      val: 6,
      visualBinding: { meshId: "mesh_scaphoid_01" }
    },
    {
      id: "MUSC_APB",
      name: "Abductor Pollicis Brevis",
      system: "MUSCULAR",
      color: "#ef4444", // Red
      val: 7,
      visualBinding: { meshId: "mesh_abductor_pollicis_brevis_01" }
    },
    {
      id: "ART_RADIAL",
      name: "Radial Artery",
      system: "CARDIOVASCULAR",
      color: "#dc2626", // Deep Red
      val: 5,
      visualBinding: { meshId: "mesh_radial_artery_01" }
    }
  ],
  links: [
    {
      source: "NERVE_MEDIAN",
      target: "MUSC_APB",
      type: "INNERVATES",
      color: "#fbbf24"
    },
    {
      source: "ART_RADIAL",
      target: "BONE_SCAPHOID",
      type: "SUPPLIES",
      color: "#dc2626"
    }
  ]
};

export default function Home() {
  const activeMeshNode = useAppStore(state => state.activeMeshNode);
  const graphPanelMode = useAppStore(state => state.graphPanelMode);
  const setGraphPanelMode = useAppStore(state => state.setGraphPanelMode);

  return (
    <main className="relative h-screen w-screen bg-[#0f0f11] text-white overflow-hidden flex">
      
      {/* LEFT SIDEBAR: Controls */}
      <div className="z-20 h-full">
        <ViewerSidebar />
      </div>

      {/* TOP: Search Bar */}
      <SearchBar />

      {/* CENTER: 3D Scene (React Three Fiber) */}
      <div className="absolute inset-0 z-0">
        <AnatomyCanvas />
      </div>

      {/* RIGHT/BOTTOM: Floating Overlays */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none flex flex-col items-end gap-4">
        {/* Toggle Graph Button */}
        <button 
          onClick={() => setGraphPanelMode(graphPanelMode === 'DRAWER' ? 'HIDDEN' : 'DRAWER')}
          className="pointer-events-auto bg-gray-900/80 hover:bg-gray-800 text-white p-3 rounded-full border border-gray-700 shadow-lg backdrop-blur-sm transition-colors flex items-center justify-center"
          title="Toggle Knowledge Graph"
        >
          <Network className="w-5 h-5 text-blue-400" />
        </button>

        {/* Floating Metadata Panel */}
        <MetadataPanel />
      </div>
      
      {/* Developer Diagnostic Layer Panel (Hidden for UX, but kept for debugging) */}
      {/* <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className="bg-gray-900/80 backdrop-blur-md p-4 rounded border border-gray-800 text-sm font-mono text-gray-300">
          <h3 className="text-gray-500 mb-2">Active Node State:</h3>
          <p>Selected Mesh ID: <span className="text-blue-400">{activeMeshNode?.meshId || 'none'}</span></p>
          <p>Fly-To Target: <span className="text-blue-400">{activeMeshNode?.name || 'none'}</span></p>
        </div>
      </div> */}

      {/* GRAPH DRAWER: Obsidian Knowledge Graph */}
      <div 
        className={`absolute top-0 right-0 h-full w-[500px] bg-gray-950 border-l border-gray-800 z-30 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          graphPanelMode === 'DRAWER' ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="absolute top-4 left-4 z-40 pointer-events-auto flex items-center justify-between w-[calc(100%-2rem)]">
          <div>
            <h2 className="text-lg font-bold tracking-tight px-2 bg-gray-900/80 rounded backdrop-blur">Medical Knowledge Graph</h2>
          </div>
          <button 
            onClick={() => setGraphPanelMode('HIDDEN')}
            className="p-1 hover:bg-gray-800 rounded bg-gray-900/80 backdrop-blur"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <KnowledgeGraphView data={mockHandGraph} engine="force-graph" />
      </div>

    </main>
  );
}
