import { create } from 'zustand';
import { AnatomyLayer, HighlightState, AnatomySceneNode } from '@/types/anatomy';

interface AppState {
  // Global View State
  activeView: 'EXPLORE' | 'LEARN' | 'CLINICAL';
  setActiveView: (view: 'EXPLORE' | 'LEARN' | 'CLINICAL') => void;

  // Highlight State Map (allows multiple overlapping highlights)
  meshHighlightStates: Record<string, HighlightState>;
  
  // Selection Context (for metadata panel)
  activeMeshNode: AnatomySceneNode | null;
  activeGraphNodeId: string | null;

  // Camera Bus
  cameraTargetBox: [number, number, number, number, number, number] | null;

  // Layer Management
  activeLayers: AnatomyLayer[];

  // Actions
  setMeshHighlight: (meshId: string, state: HighlightState) => void;
  clearHighlights: (stateType?: HighlightState) => void;
  
  selectAnatomy: (node: AnatomySceneNode) => void;
  clearSelection: () => void;
  
  toggleLayer: (layer: AnatomyLayer) => void;
  setLayers: (layers: AnatomyLayer[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'EXPLORE',
  setActiveView: (view) => set({ activeView: view }),

  meshHighlightStates: {},
  
  activeMeshNode: null,
  activeGraphNodeId: null,

  cameraTargetBox: null,

  activeLayers: [AnatomyLayer.Skin, AnatomyLayer.Bone, AnatomyLayer.Nerve, AnatomyLayer.Muscle],

  setMeshHighlight: (meshId, state) => set((prev) => ({
    meshHighlightStates: {
      ...prev.meshHighlightStates,
      [meshId]: state
    }
  })),

  clearHighlights: (stateType) => set((prev) => {
    if (!stateType) return { meshHighlightStates: {} };
    
    // Clear only specific state (e.g. clear all hover states, keep selected)
    const newState = { ...prev.meshHighlightStates };
    Object.keys(newState).forEach(key => {
      if (newState[key] === stateType) delete newState[key];
    });
    return { meshHighlightStates: newState };
  }),

  selectAnatomy: (node) => set((prev) => {
    // Clear previous SELECTED highlights
    const newHighlights = { ...prev.meshHighlightStates };
    Object.keys(newHighlights).forEach(key => {
      if (newHighlights[key] === HighlightState.Selected) delete newHighlights[key];
    });

    // Set new selected highlight
    newHighlights[node.meshId] = HighlightState.Selected;

    return { 
      activeMeshNode: node,
      activeGraphNodeId: node.graphNodeId,
      meshHighlightStates: newHighlights,
      cameraTargetBox: node.boundingBox
    };
  }),

  clearSelection: () => set((prev) => {
    const newHighlights = { ...prev.meshHighlightStates };
    Object.keys(newHighlights).forEach(key => {
      if (newHighlights[key] === HighlightState.Selected) delete newHighlights[key];
    });
    
    return { 
      activeMeshNode: null, 
      activeGraphNodeId: null,
      cameraTargetBox: null,
      meshHighlightStates: newHighlights
    };
  }),

  toggleLayer: (layer) => set((state) => ({
    activeLayers: state.activeLayers.includes(layer)
      ? state.activeLayers.filter((l) => l !== layer)
      : [...state.activeLayers, layer].sort()
  })),

  setLayers: (layers) => set({ activeLayers: [...layers].sort() })
}));
