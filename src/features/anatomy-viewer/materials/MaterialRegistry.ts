import * as THREE from 'three';

// Neutral, scientifically accurate material palettes
export const MedicalMaterials = {
  BONE: new THREE.MeshStandardMaterial({
    color: '#F5F0E1',
    roughness: 0.8,
    metalness: 0.1,
  }),
  MUSCLE: new THREE.MeshStandardMaterial({
    color: '#ef4444',
    roughness: 0.6,
    metalness: 0.05,
  }),
  NERVE: new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    roughness: 0.5,
    metalness: 0.1,
  }),
  DEFAULT: new THREE.MeshStandardMaterial({
    color: '#9ca3af',
    roughness: 0.7,
    metalness: 0.2,
  })
};

export function getMaterial(materialId: string): THREE.Material {
  switch (materialId) {
    case 'mat_muscle_red': return MedicalMaterials.MUSCLE;
    case 'mat_nerves_yellow': return MedicalMaterials.NERVE;
    case 'mat_bone_ivory': return MedicalMaterials.BONE;
    default: return MedicalMaterials.DEFAULT;
  }
}
