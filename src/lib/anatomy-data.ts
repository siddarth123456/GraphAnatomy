import manifest from '../../public/manifests/hand_region.json';
import type { AnatomicalStructure, AnatomyDataset, AnatomyRelationship, Citation } from './anatomy-types';

export const DATASET_ID = 'hand-anatomy-mvp';
export const DATASET_VERSION = '1.0.0';
export const sources = {
  bones: { title: 'OpenStax Anatomy and Physiology 2e — Bones of the Upper Limb', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/8-2-bones-of-the-upper-limb' },
  muscle: { title: 'Kenhub — Abductor pollicis brevis: origin, insertion and function', url: 'https://www.kenhub.com/en/library/anatomy/abductor-pollicis-brevis-muscle' },
  carpalTunnel: { title: 'Kenhub — Carpal tunnel: anatomy and clinical relations', url: 'https://www.kenhub.com/en/library/anatomy/carpal-tunnel' },
} satisfies Record<string, Citation>;

const descriptions: Record<string, string> = {
  MUSCLE_ABDUCTOR_POLLICIS_BREVIS: 'A superficial thenar muscle that abducts the thumb. Its recurrent median nerve innervation and selected bone attachments are represented in this graph.',
  ARTERY_RADIAL_ARTERY: 'The radial artery contributes to the blood supply of the hand. Its superficial palmar branch supplies abductor pollicis brevis.',
  BONE_RIGHT_RADIUS: 'The lateral forearm bone. Its distal end articulates with the scaphoid and lunate at the wrist.',
  BONE_RIGHT_ULNA: 'The medial forearm bone. It articulates with the radius; a fibrocartilage disc separates it from the carpal bones.',
};

const structures: AnatomicalStructure[] = manifest.meshes.map((mesh) => ({
  graphNodeId: mesh.graphNodeId,
  name: mesh.name,
  fmaId: mesh.fmaId || null,
  snomedId: null,
  ontologyValidated: false,
  category: mesh.category,
  system: { id: `SYSTEM_${mesh.system.toUpperCase()}`, name: mesh.system },
  asset: { meshId: mesh.meshId, glbPath: mesh.lod.high, manifestPath: '/manifests/hand_region.json', sourceDataset: mesh.sourceDataset, sourceVersion: mesh.sourceVersion },
  searchableTerms: [...new Set([...mesh.searchableTerms, mesh.name.replace(/^Right /, ''), ...(mesh.graphNodeId === 'MUSCLE_ABDUCTOR_POLLICIS_BREVIS' ? ['APB'] : []), ...(mesh.graphNodeId === 'BONE_TRIQUETRAL' ? ['Triquetrum'] : [])])],
  description: descriptions[mesh.graphNodeId] ?? `${mesh.name} is a bone in the right hand asset set. The graph contains selected, cited relationships rather than a complete anatomical atlas.`,
  citation: mesh.category === 'Bone' ? sources.bones : sources.muscle,
}));

structures.push({
  graphNodeId: 'NERVE_MEDIAN_NERVE', name: 'Median Nerve', fmaId: null, snomedId: null,
  ontologyValidated: false, category: 'Nerve', system: { id: 'SYSTEM_NERVOUS', name: 'Nervous' },
  asset: null, searchableTerms: ['median nerve', 'recurrent branch of median nerve'],
  description: 'The median nerve passes through the carpal tunnel; its recurrent branch supplies abductor pollicis brevis. This is a graph-only structure: no anatomical median nerve mesh is supplied.',
  citation: sources.carpalTunnel,
});

const relationships: AnatomyRelationship[] = [];
function relate(source: string, type: AnatomyRelationship['type'], target: string, description: string, citation: Citation) {
  relationships.push({ id: `${source}__${type}__${target}`, source, target, type, description, citation });
}
function joint(source: string, target: string, description: string) {
  relate(source, 'ARTICULATES_WITH', target, description, sources.bones);
}

joint('BONE_RIGHT_RADIUS', 'BONE_RIGHT_ULNA', 'The radius and ulna articulate at the proximal and distal radioulnar joints.');
joint('BONE_RIGHT_RADIUS', 'BONE_SCAPHOID', 'The distal radius articulates with the scaphoid at the radiocarpal joint.');
joint('BONE_RIGHT_RADIUS', 'BONE_LUNATE', 'The distal radius articulates with the lunate at the radiocarpal joint.');
joint('BONE_PISIFORM', 'BONE_TRIQUETRAL', 'The pisiform articulates with the anterior surface of the triquetrum (triquetral bone).');
joint('BONE_TRAPEZIUM', 'BONE_FIRST_METACARPAL', 'The first metacarpal articulates with the trapezium at the thumb carpometacarpal joint.');

const digits = [
  ['FIRST', 'THUMB', 'thumb'], ['SECOND', 'INDEX_FINGER', 'index finger'],
  ['THIRD', 'MIDDLE_FINGER', 'middle finger'], ['FOURTH', 'RING_FINGER', 'ring finger'],
  ['FIFTH', 'LITTLE_FINGER', 'little finger'],
];
for (const [ordinal, digit, label] of digits) {
  joint(`BONE_${ordinal}_METACARPAL`, `BONE_PROXIMAL_PHALANX_OF_${digit}`, `The ${label} metacarpal articulates with its proximal phalanx at the metacarpophalangeal joint.`);
  if (digit === 'THUMB') {
    joint('BONE_PROXIMAL_PHALANX_OF_THUMB', 'BONE_DISTAL_PHALANX_OF_THUMB', 'The thumb has two phalanges, which articulate at its interphalangeal joint.');
  } else {
    joint(`BONE_PROXIMAL_PHALANX_OF_${digit}`, `BONE_MIDDLE_PHALANX_OF_${digit}`, `The proximal and middle phalanges of the ${label} articulate at the proximal interphalangeal joint.`);
    joint(`BONE_MIDDLE_PHALANX_OF_${digit}`, `BONE_DISTAL_PHALANX_OF_${digit}`, `The middle and distal phalanges of the ${label} articulate at the distal interphalangeal joint.`);
  }
}
const apb = 'MUSCLE_ABDUCTOR_POLLICIS_BREVIS';
relate('NERVE_MEDIAN_NERVE', 'INNERVATES', apb, 'The recurrent branch of the median nerve innervates abductor pollicis brevis (C8–T1). The branch is represented by its parent nerve in this MVP.', sources.muscle);
relate('ARTERY_RADIAL_ARTERY', 'SUPPLIES', apb, 'The superficial palmar branch of the radial artery supplies abductor pollicis brevis. The branch is represented by its parent artery in this MVP.', sources.muscle);
relate(apb, 'ORIGINATES_ON', 'BONE_SCAPHOID', 'Abductor pollicis brevis has an origin on the tubercle of the scaphoid. Its other origins include the trapezium and flexor retinaculum.', sources.muscle);
relate(apb, 'ORIGINATES_ON', 'BONE_TRAPEZIUM', 'Abductor pollicis brevis has an origin on the tubercle of the trapezium. Its other origins include the scaphoid and flexor retinaculum.', sources.muscle);
relate(apb, 'INSERTS_ON', 'BONE_PROXIMAL_PHALANX_OF_THUMB', 'Abductor pollicis brevis inserts on the radial aspect of the base of the proximal phalanx of the thumb.', sources.muscle);
relate('NERVE_MEDIAN_NERVE', 'AFFECTED_BY', 'CLINICAL_CARPAL_TUNNEL_SYNDROME', 'Carpal tunnel syndrome results from compression of the median nerve as it passes through the carpal tunnel.', sources.carpalTunnel);

const dataset: AnatomyDataset = {
  mode: 'bundled', structures,
  clinicalConditions: [{
    id: 'CLINICAL_CARPAL_TUNNEL_SYNDROME', name: 'Carpal Tunnel Syndrome',
    synonyms: ['CTS', 'carpal tunnel', 'median nerve compression'],
    description: 'Signs and symptoms caused by compression of the median nerve within the carpal tunnel. This educational graph is not a diagnostic tool.',
    citation: sources.carpalTunnel,
  }],
  relationships,
  metadata: {
    datasetId: DATASET_ID, version: DATASET_VERSION, structureCount: structures.length,
    renderableCount: structures.filter((item) => item.asset).length, relationshipCount: relationships.length,
    ontologyStatus: 'Unverified: FMA identifiers are inherited from the supplied manifest, not checked against an authoritative ontology. No SNOMED CT mappings are asserted.',
    scope: 'Right hand and forearm assets with selected sourced relationships; 31 renderable structures and one graph-only median nerve. Educational MVP, not a complete atlas or clinical decision tool.',
  },
};

/** Shared canonical data for the API, seed and validator. Callers receive an isolated copy. */
export function getBundledDataset(): AnatomyDataset {
  return structuredClone(dataset);
}
