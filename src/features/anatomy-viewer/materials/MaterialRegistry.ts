import * as THREE from 'three';

// Consistent teaching colors distinguish tissue layers without replacing source geometry.
export const MedicalMaterials = {
  SKIN: new THREE.MeshPhysicalMaterial({
    color: '#c69c85', roughness: 0.85, metalness: 0, side: THREE.DoubleSide, clipShadows: true
  }),
  NAIL: new THREE.MeshPhysicalMaterial({
    color: '#e7d8cc', roughness: 0.35, metalness: 0, clearcoat: 0.35, side: THREE.DoubleSide, clipShadows: true
  }),
  FAT: new THREE.MeshPhysicalMaterial({
    color: '#e6c378', roughness: 0.8, metalness: 0, side: THREE.DoubleSide, clipShadows: true
  }),
  FASCIA: new THREE.MeshPhysicalMaterial({
    color: '#b9b8cb', roughness: 0.7, metalness: 0, side: THREE.DoubleSide, clipShadows: true
  }),
  TENDON: new THREE.MeshPhysicalMaterial({
    color: '#c6d6dc', roughness: 0.6, metalness: 0, clearcoat: 0.15, side: THREE.DoubleSide, clipShadows: true
  }),
  LIGAMENT: new THREE.MeshPhysicalMaterial({
    color: '#95bcb5', roughness: 0.7, metalness: 0, side: THREE.DoubleSide, clipShadows: true
  }),
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

export function getMaterial(materialId: string): THREE.MeshPhysicalMaterial {
  switch (materialId) {
    case 'mat_skin': return MedicalMaterials.SKIN;
    case 'mat_nail': return MedicalMaterials.NAIL;
    case 'mat_fat': return MedicalMaterials.FAT;
    case 'mat_fascia': return MedicalMaterials.FASCIA;
    case 'mat_tendon': return MedicalMaterials.TENDON;
    case 'mat_ligament': return MedicalMaterials.LIGAMENT;
    case 'mat_muscle': return MedicalMaterials.MUSCLE;
    case 'mat_nerve': return MedicalMaterials.NERVE;
    case 'mat_bone': return MedicalMaterials.BONE;
    case 'mat_artery': return MedicalMaterials.ARTERY;
    case 'mat_vein': return MedicalMaterials.VEIN;
    default: return MedicalMaterials.DEFAULT;
  }
}
