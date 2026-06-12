import React from 'react';
import { EffectComposer, Outline } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useAppStore } from '@/store/useAppStore';

export function HighlightManager({ children }: { children: React.ReactNode }) {
  // Outline is applied to anything wrapped in a <Select enabled={true}> tag.
  // The MeshInstance handles the Selection logic based on Zustand state.
  return (
    <>
      {children}
      <EffectComposer autoClear={false}>
        <Outline
          blendFunction={BlendFunction.SCREEN} // Highlight logic
          visibleEdgeColor={0x4ade80} // Green highlight
          hiddenEdgeColor={0x22c55e}  // Darker green if occluded
          edgeStrength={10}
          width={1000} // resolution dependent
        />
      </EffectComposer>
    </>
  );
}
