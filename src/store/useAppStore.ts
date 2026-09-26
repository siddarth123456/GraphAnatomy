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
  activeView: 'EXPLORE' | 'LEARN' | 'CLINICAL';
  setActiveView: (view: 'EXPLORE' | 'LEARN' | 'CLINICAL') => void;
  selectedMeshId: string | null;
  hoveredMeshId: string | null;
  activePreset: ViewPreset;
  graphPanelMode: GraphPanelMode;
  learningMode: LearningMode;
  setHoveredMeshId: (id: string | null) => void;
  setActivePreset: (preset: ViewPreset) => void;
  setGraphPanelMode: (mode: GraphPanelMode) => void;
  setLearningMode: (mode: LearningMode) => void;
  meshHighlightStates: Record<string, HighlightState>;
  activeMeshNode: AnatomySceneNode | null;
  activeGraphNodeId: string | null;
  cameraTargetBox: AnatomySceneNode['boundingBox'] | null;
  viewResetKey: number;
  resetView: () => void;
  activeRegionIds: string[];
  setActiveRegions: (regions: string[]) => void;
  isolationMode: boolean;
  setIsolationMode: (enabled: boolean) => void;
  explosionAmount: number;
  setExplosionAmount: (amount: number) => void;
  clippingState: ClippingState;
  setClippingState: (state: Partial<ClippingState>) => void;
  activeLayers: AnatomyLayer[];
  setMeshHighlight: (meshId: string, state: HighlightState) => void;
  clearHighlights: (stateType?: HighlightState) => void;
  selectAnatomy: (node: AnatomySceneNode) => void;
  selectGraphNode: (id: string) => void;
  clearSelection: () => void;
  toggleLayer: (layer: AnatomyLayer) => void;
  setLayers: (layers: AnatomyLayer[]) => void;
}

function clearSelectionState(state: AppState) {
  return {
    activeMeshNode: null,
    activeGraphNodeId: null,
    selectedMeshId: null,
    hoveredMeshId: null,
    cameraTargetBox: null,
    isolationMode: false,
    meshHighlightStates: Object.fromEntries(
      Object.entries(state.meshHighlightStates).filter(([, value]) =>
        value !== HighlightState.Selected && value !== HighlightState.Hovered),
    ),
  };
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'EXPLORE',
  setActiveView: (activeView) => set({ activeView }),
  selectedMeshId: null,
  hoveredMeshId: null,
  activePreset: 'EDUCATIONAL',
  graphPanelMode: 'HIDDEN',
  learningMode: 'BEGINNER',
  setHoveredMeshId: (hoveredMeshId) => set({ hoveredMeshId }),
  setActivePreset: (activePreset) => set({ activePreset }),
  setGraphPanelMode: (graphPanelMode) => set({ graphPanelMode }),
  setLearningMode: (learningMode) => set({ learningMode }),
  meshHighlightStates: {},
  activeMeshNode: null,
  activeGraphNodeId: null,
  cameraTargetBox: null,
  viewResetKey: 0,
  resetView: () => set((state) => ({
    ...clearSelectionState(state),
    meshHighlightStates: {},
    activeLayers: Object.values(AnatomyLayer),
    activePreset: 'EDUCATIONAL',
    explosionAmount: 0,
    clippingState: { enabled: false, plane: 'axial', position: 0 },
    viewResetKey: state.viewResetKey + 1,
  })),
  activeRegionIds: ['Hand'],
  setActiveRegions: (regions) => set((state) => ({
    ...clearSelectionState(state),
    activeRegionIds: [...new Set(regions)],
    viewResetKey: state.viewResetKey + 1,
  })),
  isolationMode: false,
  setIsolationMode: (enabled) => set((state) => ({ isolationMode: enabled && !!state.selectedMeshId })),
  explosionAmount: 0,
  setExplosionAmount: (amount) => set({ explosionAmount: Number.isFinite(amount) ? Math.max(0, Math.min(2, amount)) : 0 }),
  activeLayers: Object.values(AnatomyLayer),
  clippingState: { enabled: false, plane: 'axial', position: 0 },
  setClippingState: (state) => set((prev) => ({
    hoveredMeshId: null,
    clippingState: {
      ...prev.clippingState,
      ...state,
      position: state.position === undefined || !Number.isFinite(state.position)
        ? prev.clippingState.position : state.position,
    },
  })),
  setMeshHighlight: (meshId, state) => set((prev) => ({
    meshHighlightStates: { ...prev.meshHighlightStates, [meshId]: state },
  })),
  clearHighlights: (stateType) => set((prev) => ({
    meshHighlightStates: stateType
      ? Object.fromEntries(Object.entries(prev.meshHighlightStates).filter(([, value]) => value !== stateType))
      : {},
    ...(!stateType || stateType === HighlightState.Hovered ? { hoveredMeshId: null } : {}),
  })),
  selectAnatomy: (node) => set((prev) => ({
    activeMeshNode: node,
    activeGraphNodeId: node.graphNodeId,
    selectedMeshId: node.meshId,
    hoveredMeshId: null,
    meshHighlightStates: {
      ...Object.fromEntries(Object.entries(prev.meshHighlightStates).filter(([, value]) => value !== HighlightState.Selected)),
      [node.meshId]: HighlightState.Selected,
    },
    activeLayers: prev.activeLayers.includes(node.layer) ? prev.activeLayers : [...prev.activeLayers, node.layer],
    activePreset: prev.activeLayers.includes(node.layer) ? prev.activePreset : 'CUSTOM',
    cameraTargetBox: [...node.boundingBox],
  })),
  selectGraphNode: (id) => set((state) => ({ ...clearSelectionState(state), activeGraphNodeId: id })),
  clearSelection: () => set(clearSelectionState),
  toggleLayer: (layer) => set((state) => {
    const activeLayers = state.activeLayers.includes(layer)
      ? state.activeLayers.filter((item) => item !== layer) : [...state.activeLayers, layer];
    return {
      ...(state.activeMeshNode && !activeLayers.includes(state.activeMeshNode.layer) ? clearSelectionState(state) : {}),
      hoveredMeshId: null,
      activeLayers,
      activePreset: 'CUSTOM',
    };
  }),
  setLayers: (layers) => set((state) => ({
    ...(state.activeMeshNode && !layers.includes(state.activeMeshNode.layer) ? clearSelectionState(state) : {}),
    hoveredMeshId: null,
    activeLayers: [...new Set(layers)],
  })),
}));
