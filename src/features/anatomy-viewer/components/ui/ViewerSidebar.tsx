import React from 'react';
import { useAppStore, ViewPreset } from '@/store/useAppStore';
import { AnatomyLayer } from '@/types/anatomy';
import { 
  Bone, 
  Dna, 
  Activity, 
  Droplets, 
  ActivitySquare, 
  Layers, 
  Scissors,
  GraduationCap,
  Eye,
  EyeOff
} from 'lucide-react';

const PRESETS: { id: ViewPreset, label: string, icon: React.ReactNode, layers: AnatomyLayer[] }[] = [
  { id: 'SKELETON', label: 'Skeleton', icon: <Bone className="w-4 h-4" />, layers: [AnatomyLayer.Bone] },
  { id: 'MUSCULOSKELETAL', label: 'Musculoskeletal', icon: <Dna className="w-4 h-4" />, layers: [AnatomyLayer.Bone, AnatomyLayer.Muscle, AnatomyLayer.Tendon] },
  { id: 'NEUROVASCULAR', label: 'Neurovascular', icon: <Activity className="w-4 h-4" />, layers: [AnatomyLayer.Bone, AnatomyLayer.Nerve, AnatomyLayer.Artery, AnatomyLayer.Vein] },
  { id: 'CLINICAL', label: 'Clinical View', icon: <ActivitySquare className="w-4 h-4" />, layers: [AnatomyLayer.Bone, AnatomyLayer.Nerve, AnatomyLayer.Artery] },
  { id: 'SURGICAL', label: 'Surgical View', icon: <Scissors className="w-4 h-4" />, layers: [AnatomyLayer.Muscle, AnatomyLayer.Nerve, AnatomyLayer.Artery, AnatomyLayer.Ligament] },
  { id: 'EDUCATIONAL', label: 'Educational', icon: <GraduationCap className="w-4 h-4" />, layers: Object.values(AnatomyLayer) },
];

const LAYER_CONFIG = [
  { id: AnatomyLayer.Skin, label: 'Skin', color: 'bg-[#E5C298]' },
  { id: AnatomyLayer.Muscle, label: 'Muscles', color: 'bg-[#C4464A]' },
  { id: AnatomyLayer.Bone, label: 'Bones', color: 'bg-[#F5F0E1]' },
  { id: AnatomyLayer.Nerve, label: 'Nerves', color: 'bg-[#F2D64B]' },
  { id: AnatomyLayer.Artery, label: 'Arteries', color: 'bg-[#C0392B]' },
  { id: AnatomyLayer.Vein, label: 'Veins', color: 'bg-[#2E6BA6]' },
  { id: AnatomyLayer.Tendon, label: 'Tendons', color: 'bg-[#F0EDE8]' },
  { id: AnatomyLayer.Ligament, label: 'Ligaments', color: 'bg-[#E5DDD0]' },
  { id: AnatomyLayer.Fat, label: 'Fat', color: 'bg-[#F5E6B8]' },
  { id: AnatomyLayer.Fascia, label: 'Fascia', color: 'bg-[#D4C4A8]' },
];

export const ViewerSidebar = () => {
  const { 
    activePreset, setActivePreset, 
    activeLayers, setLayers, toggleLayer,
    isolationMode, setIsolationMode,
    clippingState, setClippingState,
    learningMode
  } = useAppStore();

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.id);
    setLayers(preset.layers);
  };

  const handleLayerToggle = (layer: AnatomyLayer) => {
    toggleLayer(layer);
    setActivePreset('CUSTOM'); // Clear preset if manual override
  };

  return (
    <div className="w-72 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800 flex flex-col h-full pointer-events-auto shadow-2xl">
      <div className="p-5 border-b border-gray-800 flex items-center gap-3">
        <Layers className="w-6 h-6 text-blue-400" />
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Anatomy View</h2>
          <p className="text-xs text-gray-400 font-mono">Layer Control Panel</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
        
        {/* VIEW PRESETS */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  activePreset === preset.id 
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {preset.icon}
                <span className="text-[10px] mt-2 font-medium uppercase tracking-wider">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-800" />

        {/* LAYER CONTROLS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Hierarchy Layers</h3>
            <span className="text-[10px] text-gray-400 font-mono">{activeLayers.length} Active</span>
          </div>
          <div className="space-y-1">
            {LAYER_CONFIG.map(layer => {
              const isActive = activeLayers.includes(layer.id);
              return (
                <button
                  key={layer.id}
                  onClick={() => handleLayerToggle(layer.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-md transition-all ${
                    isActive ? 'bg-gray-800 text-white' : 'hover:bg-gray-800/50 text-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${layer.color} ${!isActive && 'opacity-20'}`} />
                    <span className="text-sm font-medium">{layer.label}</span>
                  </div>
                  {isActive ? <Eye className="w-4 h-4 text-blue-400" /> : <EyeOff className="w-4 h-4 opacity-50" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-gray-800" />

        {/* ADVANCED MODES */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Advanced Tools</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm font-medium block mb-2">Learning Mode</span>
              <div className="flex bg-gray-900 rounded-md p-1">
                {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => useAppStore.getState().setLearningMode(mode)}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all ${
                      learningMode === mode ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {mode.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
              <span className="text-sm font-medium">Isolation Mode</span>
              <input 
                type="checkbox" 
                checked={isolationMode} 
                onChange={(e) => setIsolationMode(e.target.checked)}
                className="toggle-checkbox"
              />
            </label>
            
            <label className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
              <span className="text-sm font-medium">Cross Section (Axial)</span>
              <input 
                type="checkbox" 
                checked={clippingState.enabled} 
                onChange={(e) => setClippingState({ enabled: e.target.checked, plane: 'axial' })}
                className="toggle-checkbox"
              />
            </label>
            
            {clippingState.enabled && (
              <div className="px-3">
                <input 
                  type="range" 
                  min="-10" max="10" step="0.1" 
                  value={clippingState.position} 
                  onChange={(e) => setClippingState({ position: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500"
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
