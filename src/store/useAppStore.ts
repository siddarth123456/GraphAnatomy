import { create } from 'zustand';
import { AnatomyLayer, HighlightState, AnatomySceneNode } from '@/types/anatomy';

export interface ClippingState {
  enabled: boolean;
  plane: 'axial' | 'sagittal' | 'coronal';
  position: number;
}

export type ViewPreset = 'SKELETON' | 'MUSCULOSKELETAL' | 'NEUROVASCULAR' | 'CLINICAL' | 'SURGICAL' | 'EDUCATIONAL' | 'CUSTOM';
export type LearningMode = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type GraphPanelMode = 'HIDDEN' | 'DRAWER' | 'FULLSCREEN';

interface AppState {
  // Global View State
  activeView: 'EXPLORE' | 'LEARN' | 'CLINICAL';
  setActiveView: (view: 'EXPLORE' | 'LEARN' | 'CLINICAL') => void;

  // New ViewerState
  selectedMeshId: string | null;
  hoveredMeshId: string | null;
  activePreset: ViewPreset;
  graphPanelMode: GraphPanelMode;
  learningMode: LearningMode;

  setHoveredMeshId: (id: string | null) => void;
  setActivePreset: (preset: ViewPreset) => void;
  setGraphPanelMode: (mode: GraphPanelMode) => void;
  setLearningMode: (mode: LearningMode) => void;

  // Highlight State Map (allows multiple overlapping highlights)
  meshHighlightStates: Record<string, HighlightState>;
  
  // Selection Context (for metadata panel)
  activeMeshNode: AnatomySceneNode | null;
  activeGraphNodeId: string | null;

  // Camera Bus
  cameraTargetBox: [number, number, number, number, number, number] | null;

  // Region Management
  activeRegionIds: string[];
  setActiveRegions: (regions: string[]) => void;

  // Visual Modes
  isolationMode: boolean;
  setIsolationMode: (enabled: boolean) => void;
  explosionAmount: number;
  setExplosionAmount: (amount: number) => void;

  // Clipping Management
  clippingState: ClippingState;
  setClippingState: (state: Partial<ClippingState>) => void;

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

  // New ViewerState
  selectedMeshId: null,
  hoveredMeshId: null,
  activePreset: 'EDUCATIONAL',
  graphPanelMode: 'HIDDEN',
  learningMode: 'BEGINNER',

  setHoveredMeshId: (id) => set({ hoveredMeshId: id }),
  setActivePreset: (preset) => set({ activePreset: preset }),
  setGraphPanelMode: (mode) => set({ graphPanelMode: mode }),
  setLearningMode: (mode) => set({ learningMode: mode }),

  meshHighlightStates: {},
  
  activeMeshNode: null,
  activeGraphNodeId: null,

  cameraTargetBox: null,

  activeRegionIds: ['Hand'], // Default region
  setActiveRegions: (regions) => set({ activeRegionIds: regions }),

  isolationMode: false,
  setIsolationMode: (enabled) => set({ isolationMode: enabled }),
  explosionAmount: 0,
  setExplosionAmount: (amount) => set({ explosionAmount: amount }),

  activeLayers: [AnatomyLayer.Skin, AnatomyLayer.Bone, AnatomyLayer.Nerve, AnatomyLayer.Muscle, AnatomyLayer.Artery],

  clippingState: {
    enabled: false,
    plane: 'axial',
    position: 0
  },
  setClippingState: (state) => set((prev) => ({ 
    clippingState: { ...prev.clippingState, ...state } 
  })),

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
      selectedMeshId: node.meshId,
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
      selectedMeshId: null,
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
