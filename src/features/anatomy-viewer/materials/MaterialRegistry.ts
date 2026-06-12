import * as THREE from 'three';

// Neutral, scientifically accurate material palettes using Physical Materials for realism
export const MedicalMaterials = {
  BONE: new THREE.MeshPhysicalMaterial({
    color: '#e2dcca',
    roughness: 0.65,
    metalness: 0.05,
    clearcoat: 0.1,
    clearcoatRoughness: 0.3,
    side: THREE.DoubleSide,
    clipShadows: true
  }),
  MUSCLE: new THREE.MeshPhysicalMaterial({
    color: '#b23a3a',
    roughness: 0.4,
    metalness: 0.0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    transmission: 0.1, // Subsurface approximation
    thickness: 1.0,
    side: THREE.DoubleSide,
    clipShadows: true
  }),
  NERVE: new THREE.MeshPhysicalMaterial({
    color: '#e6c229',
    roughness: 0.5,
    metalness: 0.1,
    clearcoat: 0.2,
    clearcoatRoughness: 0.4,
    side: THREE.DoubleSide,
    clipShadows: true
  }),
  ARTERY: new THREE.MeshPhysicalMaterial({
    color: '#d91e1e',
    roughness: 0.3,
    metalness: 0.1,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
    clipShadows: true
  }),
  VEIN: new THREE.MeshPhysicalMaterial({
    color: '#1e3a8a',
    roughness: 0.3,
    metalness: 0.1,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
    clipShadows: true
  }),
  DEFAULT: new THREE.MeshPhysicalMaterial({
    color: '#9ca3af',
    roughness: 0.7,
    metalness: 0.2,
    side: THREE.DoubleSide,
    clipShadows: true
  })
};

// Enable local clipping on all materials
Object.values(MedicalMaterials).forEach(mat => {
  mat.clippingPlanes = []; // Array managed by ClippingManager
  mat.clipIntersection = false;
});

export function getMaterial(materialId: string): THREE.Material {
  switch (materialId) {
    case 'mat_muscle': return MedicalMaterials.MUSCLE;
    case 'mat_nerve': return MedicalMaterials.NERVE;
    case 'mat_bone': return MedicalMaterials.BONE;
    case 'mat_artery': return MedicalMaterials.ARTERY;
    case 'mat_vein': return MedicalMaterials.VEIN;
    default: return MedicalMaterials.DEFAULT;
  }
}
