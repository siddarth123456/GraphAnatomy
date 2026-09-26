import type { AnatomicalStructure, AnatomyRelationship, Citation } from './anatomy-types';

/**
 * Curated gross-anatomy scope, independent of the source-mesh inventory.
 * Null assets and ontology IDs are intentional. anatomy-data merges verified
 * manifest bindings by canonical ID; existence in this catalog never implies
 * that a mesh, a lateralized FMA concept, or clinical validation exists.
 */
const kenhub = (title: string, slug: string): Citation => ({
  title: `Kenhub — ${title}`,
  url: `https://www.kenhub.com/en/library/anatomy/${slug}`,
});

export const handSources = {
  overview: kenhub('Hand anatomy: bones, muscles, arteries and nerves', 'hand-anatomy'),
  bones: { title: 'OpenStax Anatomy and Physiology 2e — Bones of the Upper Limb', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/8-2-bones-of-the-upper-limb' },
  palmarInterossei: kenhub('Palmar interossei muscles; three/four-muscle conventions', 'palmar-interossei-muscles'),
  dorsalInterossei: kenhub('Dorsal interossei muscles of the hand', 'dorsal-interossei-muscles-of-the-hand'),
  lumbricals: kenhub('Lumbrical muscles of the hand', 'lumbrical-muscles-of-the-hand'),
  wrist: kenhub('Radiocarpal joint: anatomy and ligaments', 'the-wrist-joint'),
  intercarpal: kenhub('Intercarpal joints: anatomy and ligaments', 'intercarpal-joints'),
  cmc: kenhub('Carpometacarpal joints', 'carpometacarpal-cmc-joints'),
  thumbCmc: kenhub('Trapeziometacarpal joint', 'trapeziometacarpal-joint'),
  mcp: kenhub('Metacarpophalangeal joints', 'metacarpophalangeal-mcp-joints'),
  ip: kenhub('Interphalangeal joints of the hand', 'interphalangeal-joints-of-the-hand'),
  sheaths: kenhub('Carpal tendinous sheaths', 'carpal-tendinous-sheaths'),
  tunnel: kenhub('Carpal tunnel', 'carpal-tunnel'),
  fascia: kenhub('Palmar aponeurosis', 'palmar-aponeurosis'),
  median: kenhub('Median nerve: course and branches', 'the-median-nerve'),
  ulnar: kenhub('Ulnar nerve: course and branches', 'the-ulnar-nerve'),
  radialNerve: kenhub('Radial nerve: course and branches', 'radial-nerve'),
  radialArtery: kenhub('Radial artery: course and branches', 'radial-artery'),
  ulnarArtery: kenhub('Ulnar artery: course and branches', 'the-ulnar-artery'),
  snuffbox: kenhub('Anatomical snuffbox', 'anatomical-snuffbox'),
  skin: { title: 'OpenStax Anatomy and Physiology 2e — Layers of the Skin', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/5-1-layers-of-the-skin' },
  nails: { title: 'OpenStax Anatomy and Physiology 2e — Accessory Structures of the Skin', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/5-2-accessory-structures-of-the-skin' },
  sourceElements: { title: 'BodyParts3D 4.0 — official element-part mapping table', url: 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_element_parts.txt' },
  zAnatomy: { title: 'Z-Anatomy — publisher anatomical model collection and source labels', url: 'https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models/FBX' },
} satisfies Record<string, Citation>;

export const handStructures: AnatomicalStructure[] = [];
export const handRelationships: AnatomyRelationship[] = [];
export const handCoverageChecklist: Record<string, string[]> = {};

function add(group: string, id: string, name: string, category: string, description: string, citation: Citation, terms: string[] = []) {
  const system = category === 'Nerve' ? 'Nervous' : ['Artery', 'Vein'].includes(category) ? 'Cardiovascular'
    : ['Skin', 'Fat'].includes(category) ? 'Integumentary' : ['Bone', 'Joint', 'Space', 'Ligament'].includes(category) ? 'Skeletal' : 'Muscular';
  handStructures.push({
    graphNodeId: id, name: `Right ${name}`, category, system: { id: `SYSTEM_${system.toUpperCase()}`, name: system },
    asset: null, fmaId: null, snomedId: null, ontologyValidated: false,
    searchableTerms: [...new Set([name, ...terms])], description, citation,
  });
  (handCoverageChecklist[group] ??= []).push(id);
  return id;
}

function edge(source: string, type: AnatomyRelationship['type'], target: string, description: string, citation: Citation) {
  handRelationships.push({ id: `${source}__${type}__${target}`, source, type, target, description, citation });
}
function branch(id: string, parent: string, description: string, citation: Citation) {
  edge(id, 'BRANCHES_FROM', parent, description, citation);
}

const digits = [
  { id: 'THUMB', label: 'thumb', ordinal: 'FIRST', number: 1 },
  { id: 'INDEX_FINGER', label: 'index finger', ordinal: 'SECOND', number: 2 },
  { id: 'MIDDLE_FINGER', label: 'middle finger', ordinal: 'THIRD', number: 3 },
  { id: 'RING_FINGER', label: 'ring finger', ordinal: 'FOURTH', number: 4 },
  { id: 'LITTLE_FINGER', label: 'little finger', ordinal: 'FIFTH', number: 5 },
] as const;

// The 27 conventional hand bones; the pisiform is itself a sesamoid bone.
for (const [id, name, row] of [
  ['SCAPHOID', 'scaphoid', 'proximal'], ['LUNATE', 'lunate', 'proximal'], ['TRIQUETRAL', 'triquetrum', 'proximal'], ['PISIFORM', 'pisiform', 'proximal'],
  ['TRAPEZIUM', 'trapezium', 'distal'], ['TRAPEZOID', 'trapezoid', 'distal'], ['CAPITATE', 'capitate', 'distal'], ['HAMATE', 'hamate', 'distal'],
]) {
  add('hand-bones', `BONE_${id}`, name, 'Bone', `A carpal bone in the ${row} row of the wrist.${id === 'PISIFORM' ? ' The pisiform is a sesamoid in the flexor carpi ulnaris tendon; it is already counted among the eight carpals.' : ''}`, handSources.bones, id === 'TRIQUETRAL' ? ['triquetral bone'] : []);
}
for (const digit of digits) {
  add('hand-bones', `BONE_${digit.ordinal}_METACARPAL`, `${digit.ordinal.toLowerCase()} metacarpal`, 'Bone', `The metacarpal of the ${digit.label}, between the carpus and proximal phalanx.`, handSources.bones, [`metacarpal ${digit.number}`]);
  for (const level of digit.id === 'THUMB' ? ['PROXIMAL', 'DISTAL'] : ['PROXIMAL', 'MIDDLE', 'DISTAL']) {
    add('hand-bones', `BONE_${level}_PHALANX_OF_${digit.id}`, `${level.toLowerCase()} phalanx of ${digit.label}`, 'Bone', `The ${level.toLowerCase()} phalanx of the ${digit.label}. The thumb has two phalanges; each other digit has three.`, handSources.bones);
  }
}
add('forearm-context', 'BONE_RIGHT_RADIUS', 'radius', 'Bone', 'Lateral forearm bone; the distal radial articular surface meets the scaphoid and lunate at the wrist. Forearm context is retained because many hand-action muscles originate proximally.', handSources.bones);
add('forearm-context', 'BONE_RIGHT_ULNA', 'ulna', 'Bone', 'Medial forearm bone. Its distal end articulates with the radius; an articular disc separates the ulnar head from the carpus.', handSources.wrist);
for (const side of ['RADIAL', 'ULNAR']) {
  add('thumb-sesamoids', `BONE_THUMB_${side}_SESAMOID`, `${side.toLowerCase()} sesamoid of thumb MCP joint`, 'Bone', `One of the paired sesamoid bones at the palmar thumb metacarpophalangeal joint. ${side === 'RADIAL' ? 'The radial sesamoid is associated with the flexor pollicis brevis insertion.' : 'The ulnar sesamoid is associated with the adductor pollicis insertion.'} Additional sesamoids elsewhere in the hand vary between individuals and are outside the fixed inventory.`, side === 'RADIAL' ? kenhub('Flexor pollicis brevis', 'flexor-pollicis-brevis-muscle') : kenhub('Adductor pollicis', 'adductor-pollicis-muscle'), [`${side === 'RADIAL' ? 'lateral' : 'medial'} thumb sesamoid`]);
}

// Named intrinsic muscle units. Heads are described within their parent unit.
const intrinsic: Array<[string, string, string, string, string[]]> = [
  ['ABDUCTOR_POLLICIS_BREVIS', 'abductor pollicis brevis', 'Abducts the thumb; a superficial thenar muscle supplied by the recurrent median branch.', 'abductor-pollicis-brevis-muscle', ['APB']],
  ['FLEXOR_POLLICIS_BREVIS', 'flexor pollicis brevis', 'Flexes the thumb. Its superficial and deep heads commonly receive median and ulnar innervation respectively; patterns vary.', 'flexor-pollicis-brevis-muscle', ['FPB', 'superficial head of flexor pollicis brevis', 'deep head of flexor pollicis brevis']],
  ['OPPONENS_POLLICIS', 'opponens pollicis', 'Rotates and positions the first metacarpal for thumb opposition.', 'opponens-pollicis-muscle', []],
  ['ADDUCTOR_POLLICIS', 'adductor pollicis', 'Adducts the thumb. Its oblique and transverse heads are represented as one muscle unit.', 'adductor-pollicis-muscle', ['oblique head of adductor pollicis', 'transverse head of adductor pollicis']],
  ['ABDUCTOR_DIGITI_MINIMI', 'abductor digiti minimi of hand', 'Abducts the little finger; one of the hypothenar muscles.', 'abductor-digiti-minimi-muscle-of-hand', ['ADM']],
  ['FLEXOR_DIGITI_MINIMI_BREVIS', 'flexor digiti minimi brevis of hand', 'Flexes the little finger at its metacarpophalangeal joint.', 'flexor-digiti-minimi-brevis-muscle-of-hand', ['FDMB']],
  ['OPPONENS_DIGITI_MINIMI', 'opponens digiti minimi of hand', 'Moves the fifth metacarpal to help cup the palm and oppose the little finger.', 'opponens-digiti-minimi-muscle', []],
  ['PALMARIS_BREVIS', 'palmaris brevis', 'A superficial intrinsic muscle that wrinkles the skin over the hypothenar eminence; supplied by the superficial ulnar branch.', 'palmaris-brevis-muscle', []],
];
for (const [id, name, description, slug, terms] of intrinsic) add('intrinsic-muscles', `MUSCLE_${id}`, name, 'Muscle', description, kenhub(name, slug), terms);
for (let i = 1; i <= 4; i++) {
  const digit = digits[i];
  add('intrinsic-muscles', `MUSCLE_LUMBRICAL_${i}`, `lumbrical ${i} of hand`, 'Muscle', `The lumbrical associated with the ${digit.label}; arises from flexor digitorum profundus tendon(s) and reaches the radial side of the extensor expansion. It contributes to MCP flexion and interphalangeal extension.`, handSources.lumbricals, [`${['first', 'second', 'third', 'fourth'][i - 1]} lumbrical`]);
  add('intrinsic-muscles', `MUSCLE_DORSAL_INTEROSSEOUS_${i}`, `dorsal interosseous ${i} of hand`, 'Muscle', `A bipennate muscle in the ${['first', 'second', 'third', 'fourth'][i - 1]} intermetacarpal space. Dorsal interossei abduct the index, middle and ring fingers relative to the middle-finger axis, and assist MCP flexion and IP extension.`, handSources.dorsalInterossei, [`${['first', 'second', 'third', 'fourth'][i - 1]} dorsal interosseous`, 'DAB']);
}
for (const digit of [digits[1], digits[3], digits[4]]) {
  add('intrinsic-muscles', `MUSCLE_PALMAR_INTEROSSEOUS_${digit.id}`, `palmar interosseous of ${digit.label}`, 'Muscle', `Adducts the ${digit.label} toward the middle-finger axis and contributes to MCP flexion and IP extension. Named by destination digit to avoid the conflicting three- and four-muscle numbering conventions.`, handSources.palmarInterossei, ['PAD']);
}

add('variable-intrinsic-muscle', 'MUSCLE_PALMAR_INTEROSSEOUS_THUMB', 'palmar interosseous of thumb (variable)', 'Muscle', 'A variable or rudimentary thumb palmar interosseous, included by the four-palmar-interossei convention. Nineteen conventional intrinsic muscle units plus this explicitly variable unit give twenty catalog entries; this does not assert twenty separate muscles in every hand.', handSources.palmarInterossei, ['pollical palmar interosseous', 'first palmar interosseous in four-muscle convention']);

// Extrinsic muscles with wrist/digit actions; pronators, supinator and brachioradialis act on forearm/elbow and are not counted here.
const extrinsic: Array<[string, string, string, string[]]> = [
  ['FLEXOR_CARPI_RADIALIS', 'flexor carpi radialis', 'Flexes and radially deviates the wrist. Its tendon runs in its own canal at the trapezium, outside the carpal tunnel proper.', ['FCR']],
  ['FLEXOR_CARPI_ULNARIS', 'flexor carpi ulnaris', 'Flexes and ulnarly deviates the wrist. Its distal tendon reaches the pisiform, with force transmitted through the pisohamate and pisometacarpal ligaments.', ['FCU']],
  ['PALMARIS_LONGUS', 'palmaris longus', 'Tenses the palmar aponeurosis and assists wrist flexion. This muscle and its tendon are congenitally absent in some individuals.', ['PL']],
  ['FLEXOR_DIGITORUM_SUPERFICIALIS', 'flexor digitorum superficialis', 'Provides four digital tendons; each divides around profundus and inserts on the middle phalanx, principally flexing the PIP joint.', ['FDS']],
  ['FLEXOR_DIGITORUM_PROFUNDUS', 'flexor digitorum profundus', 'Provides four tendons to the distal phalanges of fingers 2–5, principally flexing their DIP joints. Radial and ulnar portions have different nerve supplies.', ['FDP']],
  ['FLEXOR_POLLICIS_LONGUS', 'flexor pollicis longus', 'Its tendon passes through the carpal tunnel and inserts on the distal thumb phalanx to flex the thumb IP joint.', ['FPL']],
  ['EXTENSOR_CARPI_RADIALIS_LONGUS', 'extensor carpi radialis longus', 'Extends and radially deviates the wrist; its tendon inserts at the base of the second metacarpal.', ['ECRL']],
  ['EXTENSOR_CARPI_RADIALIS_BREVIS', 'extensor carpi radialis brevis', 'Extends and radially deviates the wrist; its tendon inserts at the base of the third metacarpal.', ['ECRB']],
  ['EXTENSOR_CARPI_ULNARIS', 'extensor carpi ulnaris', 'Extends and ulnarly deviates the wrist; its tendon inserts at the base of the fifth metacarpal.', ['ECU']],
  ['EXTENSOR_DIGITORUM', 'extensor digitorum', 'Provides tendons to the extensor expansions of fingers 2–5, contributing to finger and wrist extension.', ['ED', 'extensor digitorum communis', 'EDC']],
  ['EXTENSOR_INDICIS', 'extensor indicis', 'An additional extensor of the index finger whose tendon joins its extensor expansion.', ['EI', 'extensor indicis proprius', 'EIP']],
  ['EXTENSOR_DIGITI_MINIMI', 'extensor digiti minimi', 'An additional extensor of the little finger whose tendon reaches its extensor expansion.', ['EDM']],
  ['ABDUCTOR_POLLICIS_LONGUS', 'abductor pollicis longus', 'Abducts the thumb at its carpometacarpal joint; tendon slips and distal attachments can vary.', ['APL']],
  ['EXTENSOR_POLLICIS_LONGUS', 'extensor pollicis longus', 'Extends the thumb, particularly at its interphalangeal joint; its tendon turns around the dorsal radial tubercle.', ['EPL', "Lister's tubercle"]],
  ['EXTENSOR_POLLICIS_BREVIS', 'extensor pollicis brevis', 'Extends the thumb principally at its metacarpophalangeal joint.', ['EPB']],
];
for (const [id, name, description, terms] of extrinsic) add('extrinsic-muscles', `MUSCLE_${id}`, name, 'Muscle', description, kenhub(name, `${name.replaceAll(' ', '-')}-muscle`), terms);

// BodyParts3D supplies certain muscle groups or heads as one source element.
// Keep those identities rather than assigning one group mesh to each member.
for (const [id, name, memberPrefix, citation] of [
  ['LUMBRICALS', 'lumbricals of hand (group)', 'MUSCLE_LUMBRICAL_', handSources.lumbricals],
  ['DORSAL_INTEROSSEI', 'dorsal interossei of hand (group)', 'MUSCLE_DORSAL_INTEROSSEOUS_', handSources.dorsalInterossei],
  ['PALMAR_INTEROSSEI', 'palmar interossei of hand (group)', 'MUSCLE_PALMAR_INTEROSSEOUS_', handSources.palmarInterossei],
] as Array<[string, string, string, Citation]>) {
  add('muscle-groups-and-heads', `MUSCLE_${id}`, name, 'Muscle', 'An explicitly grouped anatomical/source unit. Its named member muscles remain separate graph entries; a group mesh must not be presented as independent geometry for each member. The variable thumb palmar interosseous is not assumed to be present in the source mesh.', citation);
  for (const member of handStructures.filter((s) => s.graphNodeId.startsWith(memberPrefix))) {
    edge(member.graphNodeId, 'PART_OF', `MUSCLE_${id}`, `${member.name.replace(/^Right /, '')} belongs to this anatomical group${member.graphNodeId.endsWith('_THUMB') ? ' when present; this does not assert its presence in the source specimen' : ''}.`, citation);
  }
}
for (const [id, name, parent, description, citation] of [
  ['FLEXOR_CARPI_ULNARIS_HUMERAL_HEAD', 'humeral head of flexor carpi ulnaris', 'FLEXOR_CARPI_ULNARIS', 'Humeral component arising through the common flexor origin at the medial epicondyle; represented separately because the official source provides a head-specific element.', kenhub('Flexor carpi ulnaris', 'flexor-carpi-ulnaris-muscle')],
  ['FLEXOR_CARPI_ULNARIS_ULNAR_HEAD', 'ulnar head of flexor carpi ulnaris', 'FLEXOR_CARPI_ULNARIS', 'Ulnar component arising from the olecranon and posterior ulna; represented separately because the official source provides a head-specific element.', kenhub('Flexor carpi ulnaris', 'flexor-carpi-ulnaris-muscle')],
  ['ADDUCTOR_POLLICIS_OBLIQUE_HEAD', 'oblique head of adductor pollicis', 'ADDUCTOR_POLLICIS', 'Oblique component of adductor pollicis, arising from the capitate and adjacent second/third metacarpal bases.', kenhub('Adductor pollicis', 'adductor-pollicis-muscle')],
  ['ADDUCTOR_POLLICIS_TRANSVERSE_HEAD', 'transverse head of adductor pollicis', 'ADDUCTOR_POLLICIS', 'Transverse component arising from the anterior third metacarpal shaft and converging toward the thumb insertion.', kenhub('Adductor pollicis', 'adductor-pollicis-muscle')],
  ['FLEXOR_POLLICIS_BREVIS_SUPERFICIAL_HEAD', 'superficial head of flexor pollicis brevis', 'FLEXOR_POLLICIS_BREVIS', 'Superficial component of FPB, typically supplied by the recurrent median branch. Its separate source mesh is a component, not another muscle unit.', kenhub('Flexor pollicis brevis', 'flexor-pollicis-brevis-muscle')],
  ['FLEXOR_POLLICIS_BREVIS_DEEP_HEAD', 'deep head of flexor pollicis brevis', 'FLEXOR_POLLICIS_BREVIS', 'Deep component of FPB, commonly supplied by the deep ulnar branch; anatomical variation occurs. This head is not counted as another intrinsic muscle unit.', kenhub('Flexor pollicis brevis', 'flexor-pollicis-brevis-muscle')],
] as Array<[string, string, string, string, Citation]>) {
  add('muscle-groups-and-heads', `MUSCLE_${id}`, name, 'Muscle', description, citation);
  edge(`MUSCLE_${id}`, 'PART_OF', `MUSCLE_${parent}`, 'This separately represented head is part of the parent muscle; it is not an additional muscle in the intrinsic/extrinsic unit count.', citation);
}

// Individual long tendons. Multi-digit muscles are resolved to their four digital tendons.
for (const [muscle, name, , terms] of extrinsic) {
  const digital = ['FLEXOR_DIGITORUM_SUPERFICIALIS', 'FLEXOR_DIGITORUM_PROFUNDUS', 'EXTENSOR_DIGITORUM'].includes(muscle);
  const citation = kenhub(name, `${name.replaceAll(' ', '-')}-muscle`);
  for (const digit of digital ? digits.slice(1) : [null]) {
    const id = `TENDON_${muscle}${digit ? `_OF_${digit.id}` : ''}`;
    const label = `${name} tendon${digit ? ` of ${digit.label}` : ''}`;
    add('extrinsic-tendons', id, label, 'Tendon', `${label[0].toUpperCase()}${label.slice(1)} transmits force from its forearm muscle into the hand. ${muscle === 'PALMARIS_LONGUS' ? 'It is variable and may be absent with the muscle.' : digital ? 'This entry represents the named digit-specific tendon, not the entire parent muscle.' : 'Tendon subdivisions and accessory slips are not separately counted.'}`, citation, terms.map((term) => `${term} tendon${digit ? ` ${digit.label}` : ''}`));
    edge(id, 'PART_OF', `MUSCLE_${muscle}`, `${label} is the distal tendinous component of ${name}.`, citation);
    if (muscle === 'FLEXOR_DIGITORUM_SUPERFICIALIS' && digit) edge(id, 'INSERTS_ON', `BONE_MIDDLE_PHALANX_OF_${digit.id}`, `The FDS tendon divides around profundus and attaches to the middle phalanx of the ${digit.label}.`, citation);
    if (muscle === 'FLEXOR_DIGITORUM_PROFUNDUS' && digit) edge(id, 'INSERTS_ON', `BONE_DISTAL_PHALANX_OF_${digit.id}`, `The FDP tendon attaches to the base of the distal phalanx of the ${digit.label}.`, citation);
    if (['FLEXOR_DIGITORUM_SUPERFICIALIS', 'FLEXOR_DIGITORUM_PROFUNDUS', 'FLEXOR_POLLICIS_LONGUS'].includes(muscle)) edge(id, 'PASSES_THROUGH', 'SPACE_CARPAL_TUNNEL', `${label} passes through the carpal tunnel beneath the flexor retinaculum.`, handSources.tunnel);
  }
}

const tendonInsertions: Array<[string, string, string]> = [
  ['FLEXOR_CARPI_RADIALIS', 'BONE_SECOND_METACARPAL', 'The principal insertion is the palmar base of the second metacarpal, with a slip often reaching the third.'],
  ['FLEXOR_CARPI_ULNARIS', 'BONE_PISIFORM', 'The FCU tendon inserts on the pisiform; the pisohamate and pisometacarpal ligaments continue its line of pull.'],
  ['FLEXOR_POLLICIS_LONGUS', 'BONE_DISTAL_PHALANX_OF_THUMB', 'The FPL tendon inserts on the palmar base of the distal phalanx of the thumb.'],
  ['EXTENSOR_CARPI_RADIALIS_LONGUS', 'BONE_SECOND_METACARPAL', 'The ECRL tendon inserts on the dorsal base of the second metacarpal.'],
  ['EXTENSOR_CARPI_RADIALIS_BREVIS', 'BONE_THIRD_METACARPAL', 'The ECRB tendon inserts on the dorsal base of the third metacarpal.'],
  ['EXTENSOR_CARPI_ULNARIS', 'BONE_FIFTH_METACARPAL', 'The ECU tendon inserts on the base of the fifth metacarpal.'],
  ['ABDUCTOR_POLLICIS_LONGUS', 'BONE_FIRST_METACARPAL', 'The principal APL insertion is the base of the first metacarpal; accessory slips vary.'],
  ['EXTENSOR_POLLICIS_LONGUS', 'BONE_DISTAL_PHALANX_OF_THUMB', 'The EPL tendon inserts on the dorsal base of the distal thumb phalanx.'],
  ['EXTENSOR_POLLICIS_BREVIS', 'BONE_PROXIMAL_PHALANX_OF_THUMB', 'The EPB tendon inserts on the dorsal base of the proximal thumb phalanx.'],
];
for (const [muscle, target, description] of tendonInsertions) edge(`TENDON_${muscle}`, 'INSERTS_ON', target, description, handStructures.find((s) => s.graphNodeId === `MUSCLE_${muscle}`)!.citation!);

// Nerve parents, named wrist branches and individually named palmar digital nerves.
const nerves: Array<[string, string, string, Citation, string?]> = [
  ['MEDIAN_NERVE', 'median nerve', 'Enters the hand through the carpal tunnel. Recurrent and digital branches supply selected intrinsic muscles and cutaneous territories.', handSources.median],
  ['ULNAR_NERVE', 'ulnar nerve', 'Enters the hand through the ulnar canal and divides into superficial and deep terminal branches.', handSources.ulnar],
  ['RADIAL_NERVE', 'radial nerve', 'Parent of the superficial sensory branch to the hand and the deep branch supplying posterior forearm muscles.', handSources.radialNerve],
  ['MEDIAN_RECURRENT_BRANCH', 'recurrent branch of median nerve', 'Motor branch supplying thenar muscles; its course and branching pattern vary.', handSources.median, 'MEDIAN_NERVE'],
  ['MEDIAN_PALMAR_CUTANEOUS_BRANCH', 'palmar cutaneous branch of median nerve', 'Cutaneous branch arising in the forearm and reaching the lateral palm superficial to the flexor retinaculum.', handSources.median, 'MEDIAN_NERVE'],
  ['ANTERIOR_INTEROSSEOUS_NERVE', 'anterior interosseous nerve', 'A median-nerve branch supplying FPL and the radial portion of FDP in the forearm; terminal articular fibers reach the wrist.', handSources.median, 'MEDIAN_NERVE'],
  ['ULNAR_DEEP_BRANCH', 'deep branch of ulnar nerve', 'Predominantly motor branch supplying most intrinsic hand muscles, including interossei, adductor pollicis and the medial lumbricals.', handSources.ulnar, 'ULNAR_NERVE'],
  ['ULNAR_SUPERFICIAL_BRANCH', 'superficial branch of ulnar nerve', 'Terminal branch giving palmar digital sensory branches and motor supply to palmaris brevis.', handSources.ulnar, 'ULNAR_NERVE'],
  ['ULNAR_PALMAR_CUTANEOUS_BRANCH', 'palmar cutaneous branch of ulnar nerve', 'Cutaneous branch to the medial palm arising proximal to the wrist.', handSources.ulnar, 'ULNAR_NERVE'],
  ['ULNAR_DORSAL_CUTANEOUS_BRANCH', 'dorsal cutaneous branch of ulnar nerve', 'Branch arising proximal to the wrist and giving dorsal digital branches to the medial hand.', handSources.ulnar, 'ULNAR_NERVE'],
  ['RADIAL_SUPERFICIAL_BRANCH', 'superficial branch of radial nerve', 'Sensory branch crossing toward the dorsoradial hand and supplying dorsal digital branches; territories overlap and vary.', handSources.radialNerve, 'RADIAL_NERVE'],
  ['RADIAL_DEEP_BRANCH', 'deep branch of radial nerve', 'Motor branch in the proximal forearm that continues as the posterior interosseous nerve after passing through supinator.', handSources.radialNerve, 'RADIAL_NERVE'],
  ['POSTERIOR_INTEROSSEOUS_NERVE', 'posterior interosseous nerve', 'Continuation of the deep radial branch in the posterior forearm; supplies most long extensor muscles and sends terminal articular fibers to the wrist.', handSources.radialNerve],
  ['RADIAL_DORSAL_DIGITAL_BRANCHES', 'dorsal digital branches of superficial radial nerve', 'Grouped variable dorsal digital branches from the superficial radial nerve. This catalog does not imply sharply bounded or identical sensory territories in every person.', handSources.overview, 'RADIAL_SUPERFICIAL_BRANCH'],
  ['ULNAR_DORSAL_DIGITAL_BRANCHES', 'dorsal digital branches of ulnar nerve', 'Grouped dorsal digital branches from the dorsal cutaneous ulnar branch to the medial digits. Communicating branches and precise cutaneous boundaries vary.', handSources.overview, 'ULNAR_DORSAL_CUTANEOUS_BRANCH'],
];
for (const [id, name, description, citation, parent] of nerves) {
  add('nerves', `NERVE_${id}`, name, 'Nerve', description, citation);
  if (parent) branch(`NERVE_${id}`, `NERVE_${parent}`, `${name} arises from ${parent.toLowerCase().replaceAll('_', ' ')}.`, citation);
}
edge('NERVE_RADIAL_DEEP_BRANCH', 'CONTINUES_AS', 'NERVE_POSTERIOR_INTEROSSEOUS_NERVE', 'The deep radial branch continues as the posterior interosseous nerve distal to supinator.', handSources.radialNerve);
for (let i = 1; i <= 3; i++) {
  const id = `NERVE_MEDIAN_COMMON_PALMAR_DIGITAL_${i}`;
  add('nerves', id, `common palmar digital nerve ${i} of median nerve`, 'Nerve', 'One of the named median palmar digital divisions. Digital division patterns and communications vary; this node records the conventional branching group rather than a fabricated individual mesh.', handSources.median);
  branch(id, 'NERVE_MEDIAN_NERVE', 'The median nerve gives common palmar digital divisions in the palm.', handSources.median);
}
add('nerves', 'NERVE_ULNAR_COMMON_PALMAR_DIGITAL', 'common palmar digital nerve of ulnar nerve', 'Nerve', 'The common palmar digital branch for the adjacent sides of ring and little fingers, arising from the superficial ulnar branch.', handSources.ulnar);
branch('NERVE_ULNAR_COMMON_PALMAR_DIGITAL', 'NERVE_ULNAR_SUPERFICIAL_BRANCH', 'The superficial ulnar branch gives a common palmar digital nerve to the fourth web space.', handSources.ulnar);
for (const digit of digits) {
  for (const side of ['RADIAL', 'ULNAR']) {
    const ulnar = digit.id === 'LITTLE_FINGER' || (digit.id === 'RING_FINGER' && side === 'ULNAR');
    const id = `NERVE_PROPER_PALMAR_DIGITAL_${side}_${digit.id}`;
    add('nerves', id, `${side.toLowerCase()} proper palmar digital nerve of ${digit.label}`, 'Nerve', `Digital sensory branch along the ${side.toLowerCase()} side of the ${digit.label}. The usual parent territory is ${ulnar ? 'ulnar' : 'median'}; overlap and communicating branches are not individually enumerated.`, handSources.overview, [`${digit.label} digital nerve`]);
    // Parent nerve is used when smaller divisions vary; description preserves that resolution.
    const parent = ulnar ? 'NERVE_ULNAR_SUPERFICIAL_BRANCH' : 'NERVE_MEDIAN_NERVE';
    branch(id, parent, `The ${side.toLowerCase()} proper palmar digital nerve of the ${digit.label} is in the usual ${ulnar ? 'ulnar' : 'median'} distribution. This edge identifies the parent nerve, not an invariant immediate branching point.`, handSources.overview);
  }
}

const recurrentTargets = ['ABDUCTOR_POLLICIS_BREVIS', 'OPPONENS_POLLICIS', 'FLEXOR_POLLICIS_BREVIS'];
for (const target of recurrentTargets) edge('NERVE_MEDIAN_RECURRENT_BRANCH', 'INNERVATES', `MUSCLE_${target}`, target === 'FLEXOR_POLLICIS_BREVIS' ? 'The recurrent median branch usually supplies the superficial head of FPB; the deep head commonly receives deep ulnar supply and variation occurs.' : `The recurrent median branch supplies ${target.toLowerCase().replaceAll('_', ' ')}.`, handStructures.find((s) => s.graphNodeId === `MUSCLE_${target}`)!.citation!);
for (let i = 1; i <= 4; i++) edge(i <= 2 ? 'NERVE_MEDIAN_NERVE' : 'NERVE_ULNAR_DEEP_BRANCH', 'INNERVATES', `MUSCLE_LUMBRICAL_${i}`, i <= 2 ? `Median digital branches supply lumbrical ${i}; the parent nerve is represented here because the individual motor twig is not cataloged.` : `The deep ulnar branch supplies lumbrical ${i}.`, handSources.lumbricals);
for (const id of handCoverageChecklist['intrinsic-muscles']) {
  if (id.includes('INTEROSSEOUS') || ['MUSCLE_ADDUCTOR_POLLICIS', 'MUSCLE_ABDUCTOR_DIGITI_MINIMI', 'MUSCLE_FLEXOR_DIGITI_MINIMI_BREVIS', 'MUSCLE_OPPONENS_DIGITI_MINIMI', 'MUSCLE_FLEXOR_POLLICIS_BREVIS'].includes(id)) edge('NERVE_ULNAR_DEEP_BRANCH', 'INNERVATES', id, id === 'MUSCLE_FLEXOR_POLLICIS_BREVIS' ? 'The deep ulnar branch commonly supplies the deep head of FPB; innervation varies.' : `The deep ulnar branch supplies ${handStructures.find((s) => s.graphNodeId === id)!.name.replace(/^Right /, '')}.`, handStructures.find((s) => s.graphNodeId === id)!.citation!);
}
edge('NERVE_ULNAR_SUPERFICIAL_BRANCH', 'INNERVATES', 'MUSCLE_PALMARIS_BREVIS', 'The superficial ulnar branch supplies palmaris brevis.', kenhub('Palmaris brevis', 'palmaris-brevis-muscle'));
for (const target of ['FLEXOR_CARPI_RADIALIS', 'PALMARIS_LONGUS', 'FLEXOR_DIGITORUM_SUPERFICIALIS']) edge('NERVE_MEDIAN_NERVE', 'INNERVATES', `MUSCLE_${target}`, `The median nerve supplies ${target.toLowerCase().replaceAll('_', ' ')} in the forearm.`, handStructures.find((s) => s.graphNodeId === `MUSCLE_${target}`)!.citation!);
edge('NERVE_ANTERIOR_INTEROSSEOUS_NERVE', 'INNERVATES', 'MUSCLE_FLEXOR_POLLICIS_LONGUS', 'The anterior interosseous nerve supplies flexor pollicis longus.', kenhub('Flexor pollicis longus', 'flexor-pollicis-longus-muscle'));
edge('NERVE_ANTERIOR_INTEROSSEOUS_NERVE', 'INNERVATES', 'MUSCLE_FLEXOR_DIGITORUM_PROFUNDUS', 'The anterior interosseous nerve supplies the radial FDP portion, usually for the index and middle fingers; this is not a claim of exclusive supply to the whole muscle.', kenhub('Flexor digitorum profundus', 'flexor-digitorum-profundus-muscle'));
edge('NERVE_ULNAR_NERVE', 'INNERVATES', 'MUSCLE_FLEXOR_DIGITORUM_PROFUNDUS', 'The ulnar nerve supplies the ulnar FDP portion, usually for the ring and little fingers.', kenhub('Flexor digitorum profundus', 'flexor-digitorum-profundus-muscle'));
edge('NERVE_ULNAR_NERVE', 'INNERVATES', 'MUSCLE_FLEXOR_CARPI_ULNARIS', 'The ulnar nerve supplies flexor carpi ulnaris in the forearm.', kenhub('Flexor carpi ulnaris', 'flexor-carpi-ulnaris-muscle'));
for (const [id] of extrinsic.filter(([id]) => id.startsWith('EXTENSOR_') || id === 'ABDUCTOR_POLLICIS_LONGUS')) {
  const source = id === 'EXTENSOR_CARPI_RADIALIS_LONGUS' ? 'NERVE_RADIAL_NERVE' : id === 'EXTENSOR_CARPI_RADIALIS_BREVIS' ? 'NERVE_RADIAL_DEEP_BRANCH' : 'NERVE_POSTERIOR_INTEROSSEOUS_NERVE';
  edge(source, 'INNERVATES', `MUSCLE_${id}`, `${id.toLowerCase().replaceAll('_', ' ')} is supplied through ${source.replace('NERVE_', '').toLowerCase().replaceAll('_', ' ')}.${id === 'EXTENSOR_CARPI_RADIALIS_BREVIS' ? ' Branch origin may vary.' : ''}`, handStructures.find((s) => s.graphNodeId === `MUSCLE_${id}`)!.citation!);
}

// Arterial loops and branches are anatomical concepts, not promises of invariant arch completeness.
const arteries: Array<[string, string, string, Citation, string?]> = [
  ['RADIAL_ARTERY', 'radial artery', 'Major radial-side arterial route to the wrist and hand; it crosses the anatomical snuffbox and is the principal contributor to the deep palmar arch.', handSources.radialArtery],
  ['ULNAR_ARTERY', 'ulnar artery', 'Major ulnar-side arterial route to the hand, passing through Guyon’s canal and contributing principally to the superficial palmar arch.', handSources.ulnarArtery],
  ['SUPERFICIAL_PALMAR_ARCH', 'superficial palmar arterial arch', 'Arterial anastomotic pathway predominantly supplied by the ulnar artery, commonly completed by a radial contribution. Completeness and branching vary.', handSources.overview],
  ['DEEP_PALMAR_ARCH', 'deep palmar arterial arch', 'Arterial pathway predominantly supplied by the radial artery and commonly completed by a deep ulnar branch.', handSources.radialArtery],
  ['RADIAL_SUPERFICIAL_PALMAR_BRANCH', 'superficial palmar branch of radial artery', 'Radial branch to the thenar region and a common contributor to the superficial palmar arch.', handSources.radialArtery, 'RADIAL_ARTERY'],
  ['ULNAR_DEEP_PALMAR_BRANCH', 'deep palmar branch of ulnar artery', 'Ulnar contribution to the deep palmar arterial arch.', handSources.ulnarArtery, 'ULNAR_ARTERY'],
  ['RADIAL_PALMAR_CARPAL_BRANCH', 'palmar carpal branch of radial artery', 'Contributes to the palmar carpal arterial network.', handSources.radialArtery, 'RADIAL_ARTERY'],
  ['RADIAL_DORSAL_CARPAL_BRANCH', 'dorsal carpal branch of radial artery', 'Contributes to the dorsal carpal arterial network.', handSources.radialArtery, 'RADIAL_ARTERY'],
  ['ULNAR_PALMAR_CARPAL_BRANCH', 'palmar carpal branch of ulnar artery', 'Contributes to the palmar carpal arterial network.', handSources.ulnarArtery, 'ULNAR_ARTERY'],
  ['ULNAR_DORSAL_CARPAL_BRANCH', 'dorsal carpal branch of ulnar artery', 'Contributes to the dorsal carpal arterial network.', handSources.ulnarArtery, 'ULNAR_ARTERY'],
  ['PALMAR_CARPAL_NETWORK', 'palmar carpal arterial network', 'Anastomotic network at the palmar wrist, with radial, ulnar and interosseous contributions.', handSources.radialArtery],
  ['DORSAL_CARPAL_NETWORK', 'dorsal carpal arterial network', 'Anastomotic network at the dorsal wrist, contributing to dorsal metacarpal arteries.', handSources.radialArtery],
  ['PRINCEPS_POLLICIS', 'princeps pollicis artery', 'A principal arterial route to the palmar thumb, commonly arising from the radial/deep palmar system; origin and sharing with radialis indicis vary.', handSources.radialArtery, 'RADIAL_ARTERY'],
  ['RADIALIS_INDICIS', 'radialis indicis artery', 'Arterial route along the radial side of the index finger, usually from the radial/deep palmar system.', handSources.radialArtery, 'RADIAL_ARTERY'],
  ['PALMAR_METACARPAL_ARTERIES', 'palmar metacarpal arteries', 'Grouped metacarpal branches of the deep palmar arch; they communicate with the digital circulation. Individual small branches are grouped at this scope.', handSources.overview, 'DEEP_PALMAR_ARCH'],
  ['DORSAL_METACARPAL_ARTERIES', 'dorsal metacarpal arteries', 'Grouped dorsal metacarpal arteries. The first commonly arises directly from the radial artery; others arise through the dorsal carpal network.', handSources.overview],
  ['DORSAL_DIGITAL_ARTERIES', 'dorsal digital arteries', 'Grouped dorsal digital branches with connections to the palmar digital circulation; individual small branches vary.', handSources.overview],
  ['PALMAR_PERFORATING_BRANCHES', 'perforating branches of deep palmar arch', 'Grouped perforating branches linking the deep palmar and dorsal metacarpal arterial routes.', handSources.overview, 'DEEP_PALMAR_ARCH'],
];
for (const [id, name, description, citation, parent] of arteries) {
  add('arteries', `ARTERY_${id}`, name, 'Artery', description, citation);
  if (parent) branch(`ARTERY_${id}`, `ARTERY_${parent}`, description, citation);
}
add('arteries', 'ARTERY_FOURTH_COMMON_PALMAR_DIGITAL', 'fourth common palmar digital artery (source nomenclature)', 'Artery', 'Source-specific element named fourth common palmar digital artery in BodyParts3D. This is retained separately from the conventional web-space labels; its identity is not silently changed to a proper digital artery. Archive mapping is provenance evidence, not independent anatomical certification.', handSources.sourceElements, ['BodyParts3D fourth common palmar digital artery']);
edge('ARTERY_ULNAR_ARTERY', 'CONTINUES_AS', 'ARTERY_SUPERFICIAL_PALMAR_ARCH', 'The ulnar artery is the predominant continuation into the superficial palmar arch; the arch’s completeness varies.', handSources.ulnarArtery);
edge('ARTERY_RADIAL_ARTERY', 'CONTINUES_AS', 'ARTERY_DEEP_PALMAR_ARCH', 'The radial artery is the principal continuation into the deep palmar arch.', handSources.radialArtery);
for (const [source, target] of [['RADIAL_SUPERFICIAL_PALMAR_BRANCH', 'SUPERFICIAL_PALMAR_ARCH'], ['ULNAR_DEEP_PALMAR_BRANCH', 'DEEP_PALMAR_ARCH'], ['RADIAL_PALMAR_CARPAL_BRANCH', 'PALMAR_CARPAL_NETWORK'], ['ULNAR_PALMAR_CARPAL_BRANCH', 'PALMAR_CARPAL_NETWORK'], ['RADIAL_DORSAL_CARPAL_BRANCH', 'DORSAL_CARPAL_NETWORK'], ['ULNAR_DORSAL_CARPAL_BRANCH', 'DORSAL_CARPAL_NETWORK']]) edge(`ARTERY_${source}`, 'PART_OF', `ARTERY_${target}`, 'This named arterial contribution participates in the usual anastomotic network; completeness and configuration vary.', handSources.radialArtery);
for (let i = 2; i <= 4; i++) {
  const id = `ARTERY_COMMON_PALMAR_DIGITAL_${i}`;
  add('arteries', id, `common palmar digital artery of web space ${i}`, 'Artery', `A common digital artery to the ${i === 2 ? 'index–middle' : i === 3 ? 'middle–ring' : 'ring–little'} web space, dividing into proper digital vessels for adjacent finger sides.`, handSources.overview);
  branch(id, 'ARTERY_SUPERFICIAL_PALMAR_ARCH', 'Common palmar digital arteries arise from the superficial palmar arch in the conventional pattern.', handSources.overview);
}
for (const digit of digits) for (const side of ['RADIAL', 'ULNAR']) {
  const id = `ARTERY_PROPER_PALMAR_DIGITAL_${side}_${digit.id}`;
  add('arteries', id, `${side.toLowerCase()} proper palmar digital artery of ${digit.label}`, 'Artery', `Palmar digital arterial route along the ${side.toLowerCase()} side of the ${digit.label}. Anastomoses, caliber and upstream origin vary; this is a named distribution, not an individual vascular reconstruction.`, handSources.overview);
  const parent = digit.id === 'THUMB' ? 'ARTERY_PRINCEPS_POLLICIS' : digit.id === 'INDEX_FINGER' && side === 'RADIAL' ? 'ARTERY_RADIALIS_INDICIS' : digit.id === 'LITTLE_FINGER' && side === 'ULNAR' ? 'ARTERY_SUPERFICIAL_PALMAR_ARCH' : `ARTERY_COMMON_PALMAR_DIGITAL_${side === 'ULNAR' ? digit.number : digit.number - 1}`;
  branch(id, parent, 'This edge records the usual proximal digital arterial route; individual arch and branching patterns vary.', handSources.overview);
}
edge('ARTERY_RADIAL_SUPERFICIAL_PALMAR_BRANCH', 'SUPPLIES', 'MUSCLE_ABDUCTOR_POLLICIS_BREVIS', 'The superficial palmar branch of the radial artery supplies abductor pollicis brevis.', kenhub('Abductor pollicis brevis', 'abductor-pollicis-brevis-muscle'));

// Veins are explicitly networks or paired groups where no fixed individual tree is implied.
const veins: Array<[string, string, string]> = [
  ['DORSAL_VENOUS_NETWORK', 'dorsal venous network of hand', 'Superficial venous network over the metacarpal dorsum, draining toward cephalic and basilic veins.'],
  ['DORSAL_METACARPAL_VEINS', 'dorsal metacarpal veins', 'Grouped dorsal metacarpal tributaries of the dorsal venous network.'],
  ['PALMAR_METACARPAL_VEINS', 'palmar metacarpal veins', 'Grouped palmar metacarpal tributaries associated with the deep venous routes.'],
  ['SUPERFICIAL_PALMAR_VENOUS_ARCH', 'superficial palmar venous arch', 'Palmar venous anastomotic pathway receiving digital tributaries.'],
  ['DEEP_PALMAR_VENOUS_ARCH', 'deep palmar venous arch', 'Deep palmar venous pathway draining toward the paired forearm veins.'],
  ['COMMUNICATING_VEINS', 'communicating veins of hand', 'Grouped connections between palmar and dorsal venous pathways; individual number and location vary.'],
  ['CEPHALIC_VEIN', 'cephalic vein at wrist', 'Superficial vein receiving the lateral side of the dorsal venous network and continuing along the radial forearm.'],
  ['BASILIC_VEIN', 'basilic vein at wrist', 'Superficial vein receiving the medial side of the dorsal venous network and continuing along the ulnar forearm.'],
  ['RADIAL_VENAE_COMITANTES', 'radial venae comitantes', 'Paired deep veins accompanying the radial artery; represented as a pair, not as two invented source meshes.'],
  ['ULNAR_VENAE_COMITANTES', 'ulnar venae comitantes', 'Paired deep veins accompanying the ulnar artery; represented as a pair.'],
];
for (const [id, name, description] of veins) add('veins', `VEIN_${id}`, name, 'Vein', description, handSources.overview);
add('veins', 'VEIN_COMMON_PALMAR_DIGITAL_VEINS', 'common palmar digital veins', 'Vein', 'Grouped common digital venous channels joining the palmar digital circulation to the palmar venous arches. The official source supplies a combined element rather than independent veins for every web space.', handSources.overview);
edge('VEIN_COMMON_PALMAR_DIGITAL_VEINS', 'DRAINS_TO', 'VEIN_SUPERFICIAL_PALMAR_VENOUS_ARCH', 'Common digital venous channels drain proximally into the superficial palmar venous system; other communications exist.', handSources.overview);
for (const digit of digits) for (const aspect of ['DORSAL', 'PALMAR']) {
  const id = `VEIN_${aspect}_DIGITAL_${digit.id}`;
  add('veins', id, `${aspect.toLowerCase()} digital veins of ${digit.label}`, 'Vein', `Grouped ${aspect.toLowerCase()} superficial digital venous channels of the ${digit.label}. Vein numbers and interconnections vary between individuals.`, handSources.overview);
  edge(id, 'DRAINS_TO', aspect === 'DORSAL' ? 'VEIN_DORSAL_VENOUS_NETWORK' : 'VEIN_SUPERFICIAL_PALMAR_VENOUS_ARCH', 'This is a principal proximal drainage route; communicating pathways also exist.', handSources.overview);
}
for (const [source, target] of [['DORSAL_VENOUS_NETWORK', 'CEPHALIC_VEIN'], ['DORSAL_VENOUS_NETWORK', 'BASILIC_VEIN'], ['DORSAL_METACARPAL_VEINS', 'DORSAL_VENOUS_NETWORK'], ['PALMAR_METACARPAL_VEINS', 'DEEP_PALMAR_VENOUS_ARCH'], ['DEEP_PALMAR_VENOUS_ARCH', 'RADIAL_VENAE_COMITANTES'], ['DEEP_PALMAR_VENOUS_ARCH', 'ULNAR_VENAE_COMITANTES']]) edge(`VEIN_${source}`, 'DRAINS_TO', `VEIN_${target}`, 'This directed edge represents a proximal venous drainage route rather than an exclusive pathway.', handSources.overview);

// Wrist fascia, sheaths, joints and separately categorized anatomical passages.
const connective: Array<[string, string, string, string, Citation]> = [
  ['FASCIA_FLEXOR_RETINACULUM', 'flexor retinaculum', 'Fascia', 'Strong fibrous roof of the carpal tunnel, attached radially to scaphoid/trapezium and ulnarly to pisiform/hamate. Also called the transverse carpal ligament.', handSources.tunnel],
  ['FASCIA_EXTENSOR_RETINACULUM', 'extensor retinaculum', 'Fascia', 'Dorsal wrist thickening of deep fascia. Septa beneath it establish six extensor tendon compartments.', handSources.sheaths],
  ['FASCIA_PALMAR_APONEUROSIS', 'palmar aponeurosis', 'Fascia', 'Central thickened palmar fascia with longitudinal digital bands; connected to the palmaris longus tendon when that tendon is present.', handSources.fascia],
  ['FASCIA_THENAR', 'thenar fascia', 'Fascia', 'Deep fascial covering over the thenar muscles, continuous with the palmar fascia.', handSources.fascia],
  ['FASCIA_HYPOTHENAR', 'hypothenar fascia', 'Fascia', 'Deep fascial covering over the hypothenar muscles, continuous with the palmar fascia.', handSources.fascia],
  ['FASCIA_DORSAL_HAND', 'dorsal fascia of hand', 'Fascia', 'Fascial covering on the dorsum of the hand over the extensor apparatus and deeper structures.', handSources.overview],
  ['FASCIA_PALMAR_INTERMUSCULAR_SEPTA', 'palmar intermuscular septa', 'Fascia', 'Grouped fascial partitions extending from palmar fascia and helping separate the palmar compartments.', handSources.fascia],
  ['FASCIA_INTEROSSEOUS_MEMBRANE_FOREARM', 'interosseous membrane of forearm', 'Fascia', 'Fibrous sheet spanning the interosseous borders of radius and ulna. It provides forearm context and origins for several extrinsic hand-action muscles.', handSources.bones],
  ['FASCIA_RADIAL_BURSA', 'radial bursa (FPL synovial sheath)', 'Fascia', 'Synovial sheath around the flexor pollicis longus tendon; distinct from the fibrous digital pulley system. Communications vary.', handSources.sheaths],
  ['FASCIA_ULNAR_BURSA', 'ulnar bursa (common flexor synovial sheath)', 'Fascia', 'Common synovial sheath around FDS and FDP tendons at the wrist. Its distal communications with digital sheaths vary.', handSources.sheaths],
  ['FASCIA_FLEXOR_CARPI_RADIALIS_SHEATH', 'flexor carpi radialis tendon sheath', 'Fascia', 'Separate sheath for FCR at the trapezial groove, outside the carpal tunnel proper.', handSources.sheaths],
  ['SPACE_CARPAL_TUNNEL', 'carpal tunnel', 'Space', 'An osteofibrous passage, not a synovial joint. Contains the median nerve and nine long flexor tendons: four FDS, four FDP and one FPL.', handSources.tunnel],
  ['SPACE_GUYON_CANAL', 'ulnar canal (Guyon’s canal)', 'Space', 'A named osteofibrous passage, not a synovial joint. Transmits the ulnar nerve and artery superficial to the flexor retinaculum.', handSources.ulnarArtery],
  ['JOINT_RADIOCARPAL', 'radiocarpal joint', 'Joint', 'Synovial wrist articulation between distal radius/articular disc and the proximal carpal row. The ulna does not directly articulate with the carpal bones.', handSources.wrist],
  ['JOINT_DISTAL_RADIOULNAR', 'distal radioulnar joint', 'Joint', 'Articulation between the ulnar head and the sigmoid notch of the distal radius, supported by the radioulnar ligaments and TFCC.', handSources.wrist],
  ['JOINT_MIDCARPAL', 'midcarpal joint', 'Joint', 'Compound articulation between proximal and distal carpal rows.', handSources.intercarpal],
  ['JOINT_INTERCARPAL', 'intercarpal joints', 'Joint', 'Grouped articulations within the carpal rows, including scapholunate, lunotriquetral and distal-row articulations; midcarpal and pisotriquetral joints have separate entries.', handSources.intercarpal],
  ['JOINT_PISOTRIQUETRAL', 'pisotriquetral joint', 'Joint', 'Articulation between the pisiform and the palmar surface of the triquetrum.', handSources.intercarpal],
  ['JOINT_INTERMETACARPAL', 'intermetacarpal joints', 'Joint', 'Grouped articulations between the bases of metacarpals 2–5; supported by dorsal, palmar and interosseous ligaments.', handSources.cmc],
];
for (const [id, name, category, description, citation] of connective) add(['Joint', 'Space'].includes(category) ? 'joints-and-passages' : 'fascia-and-sheaths', id, name, category, description, citation, id === 'FASCIA_FLEXOR_RETINACULUM' ? ['transverse carpal ligament'] : id === 'SPACE_GUYON_CANAL' ? ['Guyon canal', 'ulnar tunnel'] : []);
edge('NERVE_MEDIAN_NERVE', 'PASSES_THROUGH', 'SPACE_CARPAL_TUNNEL', 'The median nerve traverses the carpal tunnel deep to the flexor retinaculum.', handSources.tunnel);
edge('NERVE_ULNAR_NERVE', 'PASSES_THROUGH', 'SPACE_GUYON_CANAL', 'The ulnar nerve enters the hand via Guyon’s canal.', handSources.ulnar);
edge('ARTERY_ULNAR_ARTERY', 'PASSES_THROUGH', 'SPACE_GUYON_CANAL', 'The ulnar artery passes with the ulnar nerve through Guyon’s canal, outside the carpal tunnel.', handSources.ulnarArtery);
edge('TENDON_PALMARIS_LONGUS', 'ATTACHES_TO', 'FASCIA_PALMAR_APONEUROSIS', 'When present, the palmaris longus tendon continues into the palmar aponeurosis.', kenhub('Palmaris longus', 'palmaris-longus-muscle'));
for (const bone of ['SCAPHOID', 'TRAPEZIUM', 'PISIFORM', 'HAMATE']) edge('FASCIA_FLEXOR_RETINACULUM', 'ATTACHES_TO', `BONE_${bone}`, `The flexor retinaculum attaches to the ${bone === 'HAMATE' ? 'hook of the hamate' : bone === 'SCAPHOID' || bone === 'TRAPEZIUM' ? `tubercle of the ${bone.toLowerCase()}` : 'pisiform'}.`, handSources.tunnel);
for (const [index, tendonNames] of [
  [1, ['ABDUCTOR_POLLICIS_LONGUS', 'EXTENSOR_POLLICIS_BREVIS']],
  [2, ['EXTENSOR_CARPI_RADIALIS_LONGUS', 'EXTENSOR_CARPI_RADIALIS_BREVIS']],
  [3, ['EXTENSOR_POLLICIS_LONGUS']],
  [4, ['EXTENSOR_INDICIS', ...digits.slice(1).map((d) => `EXTENSOR_DIGITORUM_OF_${d.id}`)]],
  [5, ['EXTENSOR_DIGITI_MINIMI']], [6, ['EXTENSOR_CARPI_ULNARIS']],
] as Array<[number, string[]]>) {
  const id = `FASCIA_EXTENSOR_COMPARTMENT_${index}`;
  add('fascia-and-sheaths', id, `extensor tendon compartment ${index}`, 'Fascia', `Dorsal wrist compartment ${index} beneath the extensor retinaculum. Contents: ${tendonNames.map((n) => n.toLowerCase().replaceAll('_', ' ')).join(', ')}. The compartment is distinct from the separately represented synovial sheath and enclosed tendons.`, handSources.sheaths);
  edge(id, 'PART_OF', 'FASCIA_EXTENSOR_RETINACULUM', 'Septa of the extensor retinaculum define this dorsal tendon compartment.', handSources.sheaths);
  for (const tendon of tendonNames) edge(`TENDON_${tendon}`, 'PASSES_THROUGH', id, `This tendon passes through dorsal wrist extensor compartment ${index}.`, handSources.sheaths);
}

// Major named wrist ligaments, TFCC components and grouped distal-row bands.
const ligaments: Array<[string, string, string, Citation]> = [
  ['RADIOSCAPHOCAPITATE', 'radioscaphocapitate ligament', 'Palmar radiocarpal band from distal radius toward scaphoid/capitate.', handSources.wrist],
  ['LONG_RADIOLUNATE', 'long radiolunate ligament', 'Palmar radiocarpal band from the distal radius to the lunate.', handSources.wrist],
  ['SHORT_RADIOLUNATE', 'short radiolunate ligament', 'Short palmar band from the distal radial lunate fossa to the lunate.', handSources.wrist],
  ['RADIOSCAPHOLUNATE', 'radioscapholunate ligament (Testut)', 'Neurovascular connective band blending with the scapholunate ligament; it is not always classified as a true mechanical ligament.', handSources.wrist],
  ['DORSAL_RADIOCARPAL', 'dorsal radiocarpal ligament', 'Dorsal radiotriquetral ligament complex contributing to wrist stability.', handSources.wrist],
  ['RADIAL_COLLATERAL_WRIST', 'radial collateral ligament of wrist', 'Radial capsular support between the radial styloid and radial carpus; descriptions of its separate boundaries vary.', handSources.wrist],
  ['ULNAR_COLLATERAL_WRIST', 'ulnar collateral ligament of wrist', 'Ulnar capsular support associated with the ulnar styloid and ulnar carpus; terminology overlaps with the ulnocarpal/TFCC complex.', handSources.wrist],
  ['ULNOLUNATE', 'ulnolunate ligament', 'Palmar ulnocarpal band to the lunate, associated with the TFCC.', handSources.wrist],
  ['ULNOTRIQUETRAL', 'ulnotriquetral ligament', 'Palmar ulnocarpal band to the triquetrum, associated with the TFCC.', handSources.wrist],
  ['ULNOCAPITATE', 'ulnocapitate ligament', 'Palmar ulnocarpal band extending toward the capitate.', handSources.wrist],
  ['SCAPHOLUNATE_INTEROSSEOUS', 'scapholunate interosseous ligament', 'Connects scaphoid and lunate. Dorsal, proximal membranous and palmar portions are kept within one named ligament.', handSources.intercarpal],
  ['LUNOTRIQUETRAL_INTEROSSEOUS', 'lunotriquetral interosseous ligament', 'Connects lunate and triquetrum; its portions are grouped in one named ligament.', handSources.intercarpal],
  ['DORSAL_INTERCARPAL', 'dorsal intercarpal ligament', 'Dorsal intercarpal bands extending across the carpus, including triquetral attachments.', handSources.intercarpal],
  ['PALMAR_INTERCARPAL', 'palmar intercarpal ligaments', 'Grouped palmar bands between carpals, including scaphocapitate and triquetrocapitate contributions; small individual fascicles are not separately enumerated.', handSources.intercarpal],
  ['DISTAL_ROW_INTEROSSEOUS', 'distal-row interosseous carpal ligaments', 'Grouped interosseous bands between trapezium, trapezoid, capitate and hamate.', handSources.intercarpal],
  ['PISOHAMATE', 'pisohamate ligament', 'Connects the pisiform with the hook of hamate; continues the FCU line of pull.', handSources.intercarpal],
  ['PISOMETACARPAL', 'pisometacarpal ligament', 'Connects the pisiform with the base of the fifth metacarpal.', handSources.intercarpal],
  ['TFCC', 'triangular fibrocartilage complex', 'TFCC: an ulnar wrist support complex, not one ligament. Disc, radioulnar bands, ulnocarpal components, meniscal homologue and ECU subsheath are represented at the named-component level.', handSources.wrist],
  ['TFCC_ARTICULAR_DISC', 'articular disc of distal radioulnar joint', 'Triangular fibrocartilage disc between the ulnar head and carpus; a component of the TFCC.', handSources.wrist],
  ['PALMAR_RADIOULNAR', 'palmar radioulnar ligament', 'Palmar radioulnar stabilizing band within the TFCC; superficial and deep fibers are grouped.', handSources.wrist],
  ['DORSAL_RADIOULNAR', 'dorsal radioulnar ligament', 'Dorsal radioulnar stabilizing band within the TFCC; superficial and deep fibers are grouped.', handSources.wrist],
  ['TFCC_MENISCAL_HOMOLOGUE', 'meniscal homologue of TFCC', 'Ulnar-sided connective component of the TFCC; boundaries and attachment descriptions vary.', handSources.wrist],
  ['ECU_SUBSHEATH', 'extensor carpi ulnaris subsheath', 'Fibrous retaining sheath around the ECU tendon at the distal ulna, associated with the TFCC.', handSources.wrist],
  ['DORSAL_CARPOMETACARPAL', 'dorsal carpometacarpal ligaments', 'Grouped dorsal capsular bands of the finger CMC joints.', handSources.cmc],
  ['PALMAR_CARPOMETACARPAL', 'palmar carpometacarpal ligaments', 'Grouped palmar capsular bands of the finger CMC joints.', handSources.cmc],
  ['INTEROSSEOUS_CARPOMETACARPAL', 'interosseous carpometacarpal ligaments', 'Grouped deep supporting bands of the finger CMC joints.', handSources.cmc],
  ['INTERMETACARPAL', 'intermetacarpal ligaments', 'Dorsal, palmar and interosseous bands linking the bases of adjacent metacarpals 2–5, grouped at this scale.', handSources.cmc],
  ['THUMB_CMC_CAPSULAR', 'thumb CMC capsular ligaments', 'Thumb CMC stabilizing ligament complex including radial carpometacarpal, anterior oblique and posterior oblique components. Named subdivisions differ across references and are kept as a group.', handSources.thumbCmc],
  ['DEEP_TRANSVERSE_METACARPAL', 'deep transverse metacarpal ligaments', 'Connect the palmar plates of adjacent finger MCP joints across metacarpals 2–5.', handSources.mcp],
];
for (const [id, name, description, citation] of ligaments) add('ligaments-and-joint-support', `LIGAMENT_${id}`, name, 'Ligament', description, citation, id.startsWith('TFCC') ? ['TFCC'] : []);
for (const component of ['TFCC_ARTICULAR_DISC', 'PALMAR_RADIOULNAR', 'DORSAL_RADIOULNAR', 'TFCC_MENISCAL_HOMOLOGUE', 'ECU_SUBSHEATH', 'ULNOLUNATE', 'ULNOTRIQUETRAL', 'ULNAR_COLLATERAL_WRIST']) edge(`LIGAMENT_${component}`, 'PART_OF', 'LIGAMENT_TFCC', 'This structure is included in the referenced TFCC description; the TFCC is a complex rather than a single tissue.', handSources.wrist);
for (const [id, bones] of [['SCAPHOLUNATE_INTEROSSEOUS', ['SCAPHOID', 'LUNATE']], ['LUNOTRIQUETRAL_INTEROSSEOUS', ['LUNATE', 'TRIQUETRAL']], ['PISOHAMATE', ['PISIFORM', 'HAMATE']], ['PISOMETACARPAL', ['PISIFORM', 'FIFTH_METACARPAL']]] as Array<[string, string[]]>) for (const bone of bones) edge(`LIGAMENT_${id}`, 'ATTACHES_TO', `BONE_${bone}`, `The ${id.toLowerCase().replaceAll('_', ' ')} ligament attaches to the ${bone.toLowerCase().replaceAll('_', ' ')}.`, handSources.intercarpal);

for (const digit of digits) {
  for (const [joint, label, citation] of [['CMC', 'carpometacarpal', handSources.cmc], ['MCP', 'metacarpophalangeal', handSources.mcp], ...(digit.id === 'THUMB' ? [['IP', 'interphalangeal', handSources.ip]] : [['PIP', 'proximal interphalangeal', handSources.ip], ['DIP', 'distal interphalangeal', handSources.ip]])] as Array<[string, string, Citation]>) {
    const id = `JOINT_${joint}_${digit.id}`;
    add('joints-and-passages', id, `${label} joint of ${digit.label}`, 'Joint', `Named ${joint} articulation of the ${digit.label}.${joint === 'CMC' && digit.id === 'THUMB' ? ' The trapeziometacarpal saddle joint permits thumb opposition.' : ''} Articular cartilage, synovium and capsule are not separately meshed.`, joint === 'CMC' && digit.id === 'THUMB' ? handSources.thumbCmc : citation, [`${digit.label} ${joint} joint`]);
    if (joint !== 'CMC') {
      for (const side of ['RADIAL', 'ULNAR']) {
        const ligament = `LIGAMENT_${side}_COLLATERAL_${joint}_${digit.id}`;
        add('ligaments-and-joint-support', ligament, `${side.toLowerCase()} collateral ligament of ${digit.label} ${joint} joint`, 'Ligament', `The ${side.toLowerCase()} collateral supporting complex of the ${digit.label} ${joint} joint. Proper and accessory portions are grouped where described.`, citation, [`${digit.label} ${joint} ${side === 'ULNAR' ? 'UCL' : 'RCL'}`]);
        edge(ligament, 'PART_OF', id, 'The collateral complex supports the named joint capsule.', citation);
      }
      const plate = `LIGAMENT_VOLAR_PLATE_${joint}_${digit.id}`;
      add('ligaments-and-joint-support', plate, `volar plate of ${digit.label} ${joint} joint`, 'Ligament', `Fibrocartilaginous palmar support of the ${digit.label} ${joint} joint; also called the palmar ligament.`, citation, [`palmar plate ${digit.label} ${joint}`]);
      edge(plate, 'PART_OF', id, 'The palmar plate is a supporting component of this joint.', citation);
    }
  }
  const sheath = `FASCIA_DIGITAL_FLEXOR_SHEATH_${digit.id}`;
  add('fascia-and-sheaths', sheath, `flexor synovial sheath of ${digit.label}`, 'Fascia', `Synovial sheath allowing the digital flexor tendon${digit.id === 'THUMB' ? '' : 's'} to glide in the ${digit.label}. Continuity with wrist bursae varies and is not assumed.`, handSources.sheaths);
  const pulley = `LIGAMENT_FLEXOR_PULLEY_SYSTEM_${digit.id}`;
  add('ligaments-and-joint-support', pulley, `fibrous flexor sheath and pulleys of ${digit.label}`, 'Ligament', digit.id === 'THUMB' ? 'Thumb fibrous flexor sheath retains FPL close to the phalanges. The thumb pulley apparatus is grouped and is not assigned the five-annular/three-cruciate pattern of the other fingers.' : `Fibrous flexor sheath of the ${digit.label}, including annular pulleys A1–A5 and cruciate pulleys C1–C3. These eight bands are a named group; this is not one indistinguishable individual pulley.`, handSources.sheaths, [`${digit.label} annular pulleys`, `${digit.label} A1 pulley`, `${digit.label} A2 pulley`, `${digit.label} cruciate pulleys`]);
  if (digit.id !== 'THUMB') {
    add('fascia-and-sheaths', `FASCIA_VINCULA_${digit.id}`, `vincula of flexor tendons of ${digit.label}`, 'Fascia', `Grouped long and short mesotendinous vincula accompanying the digital flexor tendons of the ${digit.label}; they convey small vessels to the tendons.`, handSources.sheaths);
    const expansion = `TENDON_EXTENSOR_EXPANSION_${digit.id}`;
    add('extensor-apparatus', expansion, `extensor expansion of ${digit.label}`, 'Tendon', `Dorsal digital extensor apparatus receiving extrinsic extensor, lumbrical and interosseous contributions. Central slip, paired lateral bands and terminal tendon are represented together, not as separate source meshes.`, kenhub('Extensor digitorum: digital extensor expansions', 'extensor-digitorum-muscle'), [`${digit.label} extensor hood`, `${digit.label} central slip`, `${digit.label} lateral bands`, `${digit.label} terminal tendon`]);
    edge(`TENDON_EXTENSOR_DIGITORUM_OF_${digit.id}`, 'ATTACHES_TO', expansion, `The extensor digitorum tendon contributes to the extensor expansion of the ${digit.label}.`, kenhub('Extensor digitorum', 'extensor-digitorum-muscle'));
    edge(`MUSCLE_LUMBRICAL_${digit.number - 1}`, 'ATTACHES_TO', expansion, 'This lumbrical joins the radial side of the digital extensor expansion.', handSources.lumbricals);
    if (digit.id === 'INDEX_FINGER' || digit.id === 'LITTLE_FINGER') edge(`TENDON_EXTENSOR_${digit.id === 'INDEX_FINGER' ? 'INDICIS' : 'DIGITI_MINIMI'}`, 'ATTACHES_TO', expansion, 'The dedicated digital extensor joins the corresponding extensor expansion.', kenhub(digit.id === 'INDEX_FINGER' ? 'Extensor indicis' : 'Extensor digiti minimi', digit.id === 'INDEX_FINGER' ? 'extensor-indicis-muscle' : 'extensor-digiti-minimi-muscle'));
  }
}

// Gross surface anatomy, with tissue-level rather than microscopic granularity.
add('surface', 'SKIN_HAND', 'skin of hand (regional parent)', 'Skin', 'The cutaneous covering of the hand, represented as a graph parent for its separately named regions and appendages. Regional source surfaces belong to their own nodes; this parent does not duplicate those meshes or imply a separate segmented tissue volume.', handSources.skin, ['hand skin']);
add('surface', 'SKIN_PALM', 'palmar skin', 'Skin', 'Thick, hairless skin of the palm. Epidermis and dermis are described as one surface unit rather than separately reconstructed layers.', handSources.skin, ['palm', 'glabrous skin']);
add('surface', 'SKIN_DORSUM', 'dorsal skin of hand', 'Skin', 'Skin covering the dorsum of the hand, thinner and more mobile than palmar skin.', handSources.skin, ['back of hand']);
add('surface', 'FAT_SUBCUTANEOUS_HAND', 'subcutaneous tissue of hand', 'Fat', 'Grouped superficial connective and fatty tissue of the hand; thickness and regional distribution vary.', handSources.skin, ['hypodermis', 'superficial fascia']);
add('surface', 'SKIN_THENAR_EMINENCE', 'thenar eminence', 'Skin', 'Surface prominence at the thumb base over the thenar muscles; a regional landmark, not an additional muscle.', handSources.overview);
add('surface', 'SKIN_HYPOTHENAR_EMINENCE', 'hypothenar eminence', 'Skin', 'Surface prominence at the little-finger side of the palm over the hypothenar muscles.', handSources.overview);
add('surface', 'SKIN_ANATOMICAL_SNUFFBOX', 'anatomical snuffbox', 'Skin', 'Dorsoradial surface depression bounded by APL/EPB tendons and EPL; the scaphoid and trapezium contribute to its floor and the radial artery crosses it.', handSources.snuffbox, ['anatomic snuff box']);
add('surface', 'SKIN_PALMAR_CREASES', 'palmar and digital flexion creases', 'Skin', 'Grouped surface skin creases at the palm and digits. Patterns vary and do not define exact underlying joint levels.', handSources.overview, ['palmar creases', 'wrist creases']);
add('surface', 'SKIN_INTERDIGITAL_WEBS', 'interdigital web spaces', 'Skin', 'Four soft-tissue web regions between adjacent digits; represented as regional surface anatomy.', handSources.overview, ['web spaces', 'first web space']);
for (const digit of digits) {
  add('surface', `SKIN_${digit.id}`, `skin of ${digit.label}`, 'Skin', `Palmar and dorsal cutaneous covering of the ${digit.label}. Sensory branches are separately represented; exact cutaneous territories vary.`, handSources.skin);
  add('surface', `FAT_PULP_${digit.id}`, `pulp pad of ${digit.label}`, 'Fat', `Soft tissue at the palmar tip of the ${digit.label}. The pulp is represented as a gross regional unit, not a reconstruction of each septum or receptor.`, handSources.overview, [`${digit.label} fingertip`]);
  add('surface', `SKIN_NAIL_${digit.id}`, `nail apparatus of ${digit.label}`, 'Skin', `The ${digit.label} nail unit, grouping nail plate, bed, matrix and folds. No microscopic nail structure or independently segmented source surface is implied.`, handSources.nails, [`${digit.label} nail`, 'nail plate', 'nail bed', 'nail matrix']);
}

// Anatomical connections for structures whose geometry is absent or grouped.
// These edges do not manufacture mesh identity or imply exclusive supply.
for (const [a, b] of [
  ['SCAPHOID', 'LUNATE'], ['SCAPHOID', 'TRAPEZIUM'], ['SCAPHOID', 'TRAPEZOID'], ['SCAPHOID', 'CAPITATE'],
  ['LUNATE', 'TRIQUETRAL'], ['LUNATE', 'CAPITATE'], ['TRIQUETRAL', 'HAMATE'], ['TRAPEZIUM', 'TRAPEZOID'],
  ['TRAPEZOID', 'CAPITATE'], ['CAPITATE', 'HAMATE'], ['TRAPEZOID', 'SECOND_METACARPAL'],
  ['CAPITATE', 'THIRD_METACARPAL'], ['HAMATE', 'FOURTH_METACARPAL'], ['HAMATE', 'FIFTH_METACARPAL'],
]) edge(`BONE_${a}`, 'ARTICULATES_WITH', `BONE_${b}`, `The ${a.toLowerCase().replaceAll('_', ' ')} articulates with the ${b.toLowerCase().replaceAll('_', ' ')}. This is a selected direct articulation; it does not enumerate every facet.`, handSources.overview);
for (const side of ['RADIAL', 'ULNAR']) edge(`BONE_THUMB_${side}_SESAMOID`, 'ARTICULATES_WITH', 'BONE_FIRST_METACARPAL', 'The thumb MCP sesamoid articulates with the palmar aspect of the first metacarpal head.', handSources.mcp);
for (const bone of ['RIGHT_RADIUS', 'RIGHT_ULNA']) edge('FASCIA_INTEROSSEOUS_MEMBRANE_FOREARM', 'ATTACHES_TO', `BONE_${bone}`, 'The interosseous membrane attaches along the corresponding interosseous border of the forearm bone.', handSources.bones);
for (const [id, bone] of [['RADIOSCAPHOCAPITATE', 'CAPITATE'], ['LONG_RADIOLUNATE', 'LUNATE'], ['SHORT_RADIOLUNATE', 'LUNATE'], ['DORSAL_RADIOCARPAL', 'TRIQUETRAL'], ['RADIAL_COLLATERAL_WRIST', 'SCAPHOID'], ['ULNOCAPITATE', 'CAPITATE']]) edge(`LIGAMENT_${id}`, 'ATTACHES_TO', `BONE_${bone}`, `This wrist capsular band has an attachment to the ${bone.toLowerCase()}; descriptions of peripheral fibers and boundaries vary.`, handSources.wrist);
edge('LIGAMENT_RADIOSCAPHOLUNATE', 'ATTACHES_TO', 'LIGAMENT_SCAPHOLUNATE_INTEROSSEOUS', 'The radioscapholunate neurovascular band blends with the scapholunate interosseous ligament.', handSources.wrist);
for (const id of ['DORSAL_INTERCARPAL', 'PALMAR_INTERCARPAL', 'DISTAL_ROW_INTEROSSEOUS']) edge(`LIGAMENT_${id}`, 'PART_OF', 'JOINT_INTERCARPAL', 'This named ligament group supports the intercarpal joint complex.', handSources.intercarpal);
for (const id of ['DORSAL_CARPOMETACARPAL', 'PALMAR_CARPOMETACARPAL', 'INTEROSSEOUS_CARPOMETACARPAL']) edge(`LIGAMENT_${id}`, 'ATTACHES_TO', 'BONE_THIRD_METACARPAL', 'The carpometacarpal supporting group includes attachments around the third metacarpal base; this is not the group’s only attachment.', handSources.cmc);
edge('LIGAMENT_INTERMETACARPAL', 'PART_OF', 'JOINT_INTERMETACARPAL', 'These bands support the articulations between adjacent metacarpal bases.', handSources.cmc);
edge('LIGAMENT_THUMB_CMC_CAPSULAR', 'PART_OF', 'JOINT_CMC_THUMB', 'This grouped capsular ligament system supports the trapeziometacarpal articulation.', handSources.thumbCmc);
edge('LIGAMENT_DEEP_TRANSVERSE_METACARPAL', 'ATTACHES_TO', 'LIGAMENT_VOLAR_PLATE_MCP_INDEX_FINGER', 'The deep transverse metacarpal ligaments connect adjacent finger MCP palmar plates, beginning between index and middle fingers.', handSources.mcp);
edge('LIGAMENT_PALMAR_RADIOULNAR', 'PART_OF', 'JOINT_DISTAL_RADIOULNAR', 'The palmar radioulnar ligament is a capsular stabilizer of the distal radioulnar articulation.', handSources.wrist);
for (const joint of ['RADIOCARPAL', 'MIDCARPAL', 'INTERCARPAL']) {
  edge('NERVE_ANTERIOR_INTEROSSEOUS_NERVE', 'INNERVATES', `JOINT_${joint}`, 'Terminal articular branches of the anterior interosseous nerve contribute to this wrist joint complex; they are represented by their parent nerve.', handSources.wrist);
  edge('NERVE_POSTERIOR_INTEROSSEOUS_NERVE', 'INNERVATES', `JOINT_${joint}`, 'Terminal articular branches of the posterior interosseous nerve contribute to this wrist joint complex; they are represented by their parent nerve.', handSources.intercarpal);
}
edge('JOINT_PISOTRIQUETRAL', 'PART_OF', 'JOINT_INTERCARPAL', 'The pisotriquetral articulation is a separately named component of the proximal intercarpal joint group.', handSources.intercarpal);
edge('LIGAMENT_INTERMETACARPAL', 'ATTACHES_TO', 'BONE_THIRD_METACARPAL', 'The intermetacarpal bands include attachments to the third metacarpal base and its adjacent bases.', handSources.cmc);
for (const digit of digits) {
  edge(digit.id === 'THUMB' ? 'NERVE_ANTERIOR_INTEROSSEOUS_NERVE' : 'NERVE_ULNAR_DEEP_BRANCH', 'INNERVATES', `JOINT_CMC_${digit.id}`, 'Articular fibers from this nerve contribute to the named carpometacarpal articulation; other articular sources also contribute.', digit.id === 'THUMB' ? handSources.thumbCmc : handSources.cmc);
  edge('NERVE_POSTERIOR_INTEROSSEOUS_NERVE', 'INNERVATES', `JOINT_MCP_${digit.id}`, 'Terminal articular branches of the posterior interosseous nerve contribute to MCP joint innervation, alongside palmar nerve contributions.', handSources.mcp);
  for (const joint of digit.id === 'THUMB' ? ['IP'] : ['PIP', 'DIP']) edge(`NERVE_PROPER_PALMAR_DIGITAL_RADIAL_${digit.id}`, 'INNERVATES', `JOINT_${joint}_${digit.id}`, 'Articular branches of the proper digital nerves contribute to innervation of this interphalangeal joint; the radial branch is one contribution, not its exclusive supply.', handSources.ip);
  const tendons = digit.id === 'THUMB' ? ['TENDON_FLEXOR_POLLICIS_LONGUS'] : [`TENDON_FLEXOR_DIGITORUM_SUPERFICIALIS_OF_${digit.id}`, `TENDON_FLEXOR_DIGITORUM_PROFUNDUS_OF_${digit.id}`];
  for (const tendon of tendons) {
    edge(tendon, 'PASSES_THROUGH', `FASCIA_DIGITAL_FLEXOR_SHEATH_${digit.id}`, 'This digital flexor tendon runs in the named digit’s synovial sheath.', handSources.sheaths);
    edge(tendon, 'PASSES_THROUGH', `LIGAMENT_FLEXOR_PULLEY_SYSTEM_${digit.id}`, 'The digital flexor tendon is retained in the fibrous sheath by the pulley apparatus.', handSources.sheaths);
    edge(tendon, 'PASSES_THROUGH', digit.id === 'THUMB' ? 'FASCIA_RADIAL_BURSA' : 'FASCIA_ULNAR_BURSA', 'At the wrist this long flexor tendon travels within the corresponding synovial bursa; distal digital communications vary.', handSources.sheaths);
  }
  if (digit.id !== 'THUMB') edge(`FASCIA_VINCULA_${digit.id}`, 'ATTACHES_TO', `TENDON_FLEXOR_DIGITORUM_PROFUNDUS_OF_${digit.id}`, 'The vincular group includes vascular mesotendinous connections to the digital flexor tendons; this edge names its profundus component.', handSources.sheaths);
  edge(`SKIN_${digit.id}`, 'PART_OF', 'SKIN_HAND', 'The digit’s skin is part of the hand’s cutaneous surface; no separate mesh is inferred from this relationship.', handSources.skin);
  edge(`SKIN_NAIL_${digit.id}`, 'PART_OF', `SKIN_${digit.id}`, 'The nail apparatus is a specialized cutaneous appendage of this digit.', handSources.nails);
  edge(`FAT_PULP_${digit.id}`, 'PART_OF', 'FAT_SUBCUTANEOUS_HAND', 'The digital pulp contains a regional fibrofatty compartment within the superficial tissues of the hand.', handSources.skin);
  for (const side of ['RADIAL', 'ULNAR']) {
    edge(`NERVE_PROPER_PALMAR_DIGITAL_${side}_${digit.id}`, 'INNERVATES', `SKIN_${digit.id}`, `This digital nerve supplies cutaneous territory on the ${side.toLowerCase()} side of the ${digit.label}; dorsal proximal skin can have other nerve contributions.`, handSources.overview);
    edge(`ARTERY_PROPER_PALMAR_DIGITAL_${side}_${digit.id}`, 'SUPPLIES', `FAT_PULP_${digit.id}`, 'This proper digital arterial route contributes to the fingertip/pulp circulation; it is not an exclusive or end-artery claim.', handSources.overview);
  }
}
for (const fascia of ['THENAR', 'HYPOTHENAR', 'PALMAR_INTERMUSCULAR_SEPTA']) edge(`FASCIA_${fascia}`, 'ATTACHES_TO', 'FASCIA_PALMAR_APONEUROSIS', 'This regional fascia is connected to the central palmar fascial system.', handSources.fascia);
edge('FASCIA_DORSAL_HAND', 'ATTACHES_TO', 'FASCIA_EXTENSOR_RETINACULUM', 'The dorsal wrist retinaculum is continuous with regional deep fascia.', handSources.sheaths);
edge('TENDON_FLEXOR_CARPI_RADIALIS', 'PASSES_THROUGH', 'FASCIA_FLEXOR_CARPI_RADIALIS_SHEATH', 'The FCR tendon has a separate sheath at the trapezium, outside the carpal tunnel proper.', handSources.sheaths);
branch('ARTERY_DORSAL_METACARPAL_ARTERIES', 'ARTERY_DORSAL_CARPAL_NETWORK', 'The dorsal carpal network gives dorsal metacarpal branches; the first dorsal metacarpal artery commonly arises directly from the radial artery.', handSources.radialArtery);
branch('ARTERY_DORSAL_DIGITAL_ARTERIES', 'ARTERY_DORSAL_METACARPAL_ARTERIES', 'Dorsal metacarpal arteries give digital branches toward the fingers, with palmar communications.', handSources.overview);
edge('VEIN_COMMUNICATING_VEINS', 'DRAINS_TO', 'VEIN_DORSAL_VENOUS_NETWORK', 'Palmar-to-dorsal venous communications provide a route toward the dorsal network.', handSources.overview);
for (const id of ['PALM', 'DORSUM', 'PALMAR_CREASES', 'INTERDIGITAL_WEBS']) edge(`SKIN_${id}`, 'PART_OF', 'SKIN_HAND', 'This is a named region or surface feature of the hand’s cutaneous covering.', handSources.overview);
for (const id of ['THENAR_EMINENCE', 'HYPOTHENAR_EMINENCE']) edge(`SKIN_${id}`, 'PART_OF', 'SKIN_PALM', 'This eminence is a regional prominence on the palmar hand surface.', handSources.overview);
edge('SKIN_ANATOMICAL_SNUFFBOX', 'PART_OF', 'SKIN_DORSUM', 'The anatomical snuffbox is a dorsoradial surface depression.', handSources.snuffbox);
edge('NERVE_MEDIAN_PALMAR_CUTANEOUS_BRANCH', 'INNERVATES', 'SKIN_PALM', 'The palmar cutaneous median branch supplies part of the lateral palm; it does not supply the whole palm.', handSources.median);
edge('NERVE_ULNAR_PALMAR_CUTANEOUS_BRANCH', 'INNERVATES', 'SKIN_PALM', 'The palmar cutaneous ulnar branch supplies part of the medial palm.', handSources.ulnar);
edge('NERVE_RADIAL_SUPERFICIAL_BRANCH', 'INNERVATES', 'SKIN_DORSUM', 'The superficial radial branch supplies dorsoradial hand skin; its territory does not include the entire dorsal hand.', handSources.radialNerve);
edge('NERVE_ULNAR_DORSAL_CUTANEOUS_BRANCH', 'INNERVATES', 'SKIN_DORSUM', 'The dorsal cutaneous ulnar branch supplies medial dorsal hand skin.', handSources.ulnar);
for (const [index, digitIndex, side] of [[1, 1, 'radial'], [2, 2, 'radial'], [3, 2, 'ulnar'], [4, 3, 'ulnar']] as Array<[number, number, string]>) {
  const digit = digits[digitIndex];
  edge(`MUSCLE_DORSAL_INTEROSSEOUS_${index}`, 'INSERTS_ON', `BONE_PROXIMAL_PHALANX_OF_${digit.id}`, `The ${index}th dorsal interosseous attaches to the ${side} base of the proximal phalanx of the ${digit.label}, with an extensor-expansion contribution.`, handSources.dorsalInterossei);
  edge(`MUSCLE_DORSAL_INTEROSSEOUS_${index}`, 'ATTACHES_TO', `TENDON_EXTENSOR_EXPANSION_${digit.id}`, 'The dorsal interosseous tendon also contributes to this digit’s extensor expansion.', handSources.dorsalInterossei);
}
for (const digit of [digits[1], digits[3], digits[4]]) {
  edge(`MUSCLE_PALMAR_INTEROSSEOUS_${digit.id}`, 'INSERTS_ON', `BONE_PROXIMAL_PHALANX_OF_${digit.id}`, `The palmar interosseous attaches to the ${digit.id === 'INDEX_FINGER' ? 'ulnar' : 'radial'} side of the proximal phalanx of the ${digit.label}, with an extensor-expansion contribution.`, handSources.palmarInterossei);
  edge(`MUSCLE_PALMAR_INTEROSSEOUS_${digit.id}`, 'ATTACHES_TO', `TENDON_EXTENSOR_EXPANSION_${digit.id}`, 'The palmar interosseous also contributes to the corresponding extensor expansion.', handSources.palmarInterossei);
}

// Z-Anatomy supplies additional group objects. Their source identities remain
// separate from the more granular educational graph and carry no invented FMA.
for (const nerve of ['MEDIAN', 'ULNAR']) {
  for (const kind of ['COMMON', 'PROPER']) {
    const id = `NERVE_${nerve}_${kind}_PALMAR_DIGITAL_BRANCHES`;
    add('nerve-source-groups', id, `${kind.toLowerCase()} palmar digital branches of ${nerve.toLowerCase()} nerve (group)`, 'Nerve', `Grouped ${kind.toLowerCase()} palmar digital branches of the ${nerve.toLowerCase()} nerve. A source group is not an individual digital nerve and is not assigned separately to each digit.`, nerve === 'MEDIAN' ? handSources.median : handSources.ulnar);
    branch(id, nerve === 'MEDIAN' ? 'NERVE_MEDIAN_NERVE' : 'NERVE_ULNAR_SUPERFICIAL_BRANCH', 'The named palmar digital branch group arises through this parent nerve; intermediate branching variations are not resolved.', nerve === 'MEDIAN' ? handSources.median : handSources.ulnar);
    const members = kind === 'COMMON'
      ? nerve === 'MEDIAN' ? [1, 2, 3].map((n) => `NERVE_MEDIAN_COMMON_PALMAR_DIGITAL_${n}`) : ['NERVE_ULNAR_COMMON_PALMAR_DIGITAL']
      : handRelationships.filter((r) => r.type === 'BRANCHES_FROM' && r.source.startsWith('NERVE_PROPER_PALMAR_DIGITAL_') && r.target === (nerve === 'MEDIAN' ? 'NERVE_MEDIAN_NERVE' : 'NERVE_ULNAR_SUPERFICIAL_BRANCH')).map((r) => r.source);
    for (const member of members) edge(member, 'PART_OF', id, 'This named digital branch belongs to the parent source group; no independent geometry is inferred.', handSources.overview);
  }
}
for (const nerve of ['MEDIAN', 'ULNAR', 'RADIAL']) {
  const id = `NERVE_${nerve}_MUSCULAR_BRANCHES`;
  add('nerve-source-groups', id, `muscular branches of ${nerve.toLowerCase()} nerve (source group)`, 'Nerve', `Source-named muscular branches of the ${nerve.toLowerCase()} nerve. They are not relabeled as a particular distal motor branch, and the source mesh does not certify an exhaustive motor-twig inventory.`, handSources.zAnatomy);
  branch(id, `NERVE_${nerve}_NERVE`, 'These source-labeled muscular branches arise from the named parent nerve.', handSources.zAnatomy);
}
add('nerve-source-groups', 'NERVE_MEDIAN_ULNAR_COMMUNICATING_BRANCH', 'communicating branch between median and ulnar nerves (source variant)', 'Nerve', 'A communicating branch explicitly labeled by the source atlas. The graph does not assume that this connection is present with the same course in every individual or assign it an unsupported eponym.', handSources.zAnatomy);
edge('NERVE_MEDIAN_ULNAR_COMMUNICATING_BRANCH', 'COMMUNICATES_WITH', 'NERVE_MEDIAN_NERVE', 'The source identifies this as a median–ulnar communicating connection, without establishing a physiological direction of transmission.', handSources.zAnatomy);
edge('NERVE_MEDIAN_ULNAR_COMMUNICATING_BRANCH', 'COMMUNICATES_WITH', 'NERVE_ULNAR_NERVE', 'The source identifies the ulnar nerve as the other connected nerve; this is an anatomical connection, not a direction-of-flow claim.', handSources.zAnatomy);

for (const [id, name, parent] of [
  ['PALMAR_SCAPHOTRIQUETRAL', 'palmar scaphotriquetral ligament', 'PALMAR_INTERCARPAL'],
  ['PALMAR_CAPITOHAMATE', 'palmar capitohamate ligament', 'PALMAR_INTERCARPAL'],
  ['PALMAR_TRAPEZOIDEOCAPITATE', 'palmar trapezoideocapitate ligament', 'PALMAR_INTERCARPAL'],
  ['PALMAR_LUNOTRIQUETRAL', 'palmar lunotriquetral ligament', 'PALMAR_INTERCARPAL'],
  ['DORSAL_METACARPAL', 'dorsal metacarpal ligaments', 'INTERMETACARPAL'],
  ['PALMAR_METACARPAL', 'palmar metacarpal ligaments', 'INTERMETACARPAL'],
  ['INTEROSSEOUS_METACARPAL', 'interosseous metacarpal ligaments', 'INTERMETACARPAL'],
  ['RADIATE_CARPAL', 'radiate carpal ligament', 'PALMAR_INTERCARPAL'],
  ['TRIQUETROCAPITATE', 'triquetrocapitate ligament', 'PALMAR_INTERCARPAL'],
  ['TRIQUETROHAMATE', 'triquetrohamate ligament', 'PALMAR_INTERCARPAL'],
  ['SCAPHOCAPITATE', 'scaphocapitate ligament', 'PALMAR_INTERCARPAL'],
  ['TRAPEZOIDEOCAPITATE_INTEROSSEOUS', 'trapezoideocapitate interosseous ligament', 'DISTAL_ROW_INTEROSSEOUS'],
  ['TRAPEZIOTRAPEZOIDAL_INTEROSSEOUS', 'trapeziotrapezoidal interosseous ligament', 'DISTAL_ROW_INTEROSSEOUS'],
  ['CAPITOHAMATE_INTEROSSEOUS', 'capitohamate interosseous ligament', 'DISTAL_ROW_INTEROSSEOUS'],
  ['SCAPHOTRAPEZIOTRAPEZOIDAL', 'scaphotrapeziotrapezoidal ligament', 'PALMAR_INTERCARPAL'],
  ['DORSAL_SCAPHOTRIQUETRAL', 'dorsal scaphotriquetral ligament', 'DORSAL_INTERCARPAL'],
]) {
  add('ligament-source-groups', `LIGAMENT_${id}`, name, 'Ligament', 'A separately named ligament or ligament group in the source atlas, retained at the original source resolution. Palmar and interosseous bands are not treated as interchangeable anatomy.', handSources.zAnatomy);
  edge(`LIGAMENT_${id}`, 'PART_OF', `LIGAMENT_${parent}`, 'This source-named band belongs to the broader regional ligament group.', id.includes('METACARPAL') ? handSources.cmc : handSources.intercarpal);
}
for (const [id, name, description, citation] of [
  ['MCP_CAPSULES', 'articular capsules of metacarpophalangeal joints (group)', 'Grouped source geometry for the MCP capsules, kept distinct from the joint spaces and collateral ligaments.', handSources.mcp],
  ['MCP_COLLATERAL_LIGAMENTS', 'collateral metacarpophalangeal ligaments (group)', 'Grouped source geometry for MCP collateral ligaments. Named joint-side ligament entries remain independent graph concepts.', handSources.mcp],
  ['IP_COLLATERAL_LIGAMENTS', 'collateral interphalangeal ligaments of hand (group)', 'Grouped IP collateral ligament source element; individual digit, joint and side subdivisions are not separately segmented.', handSources.ip],
  ['IP_PALMAR_LIGAMENTS', 'palmar interphalangeal ligaments (group)', 'Grouped palmar ligaments/volar plates of the IP joints. The source group is not equated to any single digital volar plate.', handSources.ip],
  ['RADIOCARPAL_CAPSULE', 'articular capsule of radiocarpal joint', 'Fibrous capsule around the radiocarpal articulation, distinct from the enclosed joint and its named reinforcing bands.', handSources.wrist],
  ['DORSAL_ULNOCARPAL', 'dorsal ulnocarpal ligament (source nomenclature)', 'A separately named dorsal ulnocarpal band in the source atlas. It is not substituted for the palmar ulnocarpal ligaments.', handSources.zAnatomy],
  ['DIP_CAPSULES', 'articular capsules of distal interphalangeal joints (group)', 'Grouped source geometry for the DIP capsules; individual joint spaces remain separate graph concepts.', handSources.ip],
  ['PIP_CAPSULES', 'articular capsules of proximal interphalangeal joints (group)', 'Grouped source geometry for the PIP capsules, separate from their collateral and palmar ligaments.', handSources.ip],
  ['PISOTRIQUETRAL', 'pisotriquetral ligament', 'Source-named fibrous support of the pisotriquetral articulation, distinct from the pisohamate and pisometacarpal ligaments.', handSources.zAnatomy],
  ['RADIOCAPITATE', 'radiocapitate ligament (source nomenclature)', 'A separate source-labeled radiocapitate band. It is not silently merged with the source’s radioscaphocapitate element.', handSources.zAnatomy],
  ['SUPERFICIAL_TRANSVERSE_METACARPAL', 'superficial transverse metacarpal ligament', 'Superficial transverse palmar fascial band, kept distinct from the deeper ligament connecting MCP palmar plates.', handSources.zAnatomy],
] as Array<[string, string, string, Citation]>) add('ligament-source-groups', `LIGAMENT_${id}`, name, 'Ligament', description, citation);
for (const id of ['RADIOCARPAL_CAPSULE', 'DORSAL_ULNOCARPAL']) edge(`LIGAMENT_${id}`, 'PART_OF', 'JOINT_RADIOCARPAL', 'This source-named capsule/supporting band belongs to the wrist articulation complex.', id === 'RADIOCARPAL_CAPSULE' ? handSources.wrist : handSources.zAnatomy);
for (const digit of digits) {
  edge('LIGAMENT_MCP_CAPSULES', 'ATTACHES_TO', `BONE_PROXIMAL_PHALANX_OF_${digit.id}`, 'The grouped MCP capsules include a phalangeal attachment at this digit’s MCP articulation.', handSources.mcp);
  for (const side of ['RADIAL', 'ULNAR']) edge(`LIGAMENT_${side}_COLLATERAL_MCP_${digit.id}`, 'PART_OF', 'LIGAMENT_MCP_COLLATERAL_LIGAMENTS', 'The named side-specific MCP collateral belongs to this source group; a source group does not establish a separate side-specific mesh.', handSources.mcp);
  for (const joint of digit.id === 'THUMB' ? ['IP'] : ['PIP', 'DIP']) {
    for (const side of ['RADIAL', 'ULNAR']) edge(`LIGAMENT_${side}_COLLATERAL_${joint}_${digit.id}`, 'PART_OF', 'LIGAMENT_IP_COLLATERAL_LIGAMENTS', 'The named IP collateral belongs to this grouped source concept.', handSources.ip);
    edge(`LIGAMENT_VOLAR_PLATE_${joint}_${digit.id}`, 'PART_OF', 'LIGAMENT_IP_PALMAR_LIGAMENTS', 'This digital palmar plate belongs to the grouped IP palmar ligament concept.', handSources.ip);
  }
  if (digit.id !== 'THUMB') for (const joint of ['PIP', 'DIP']) edge(`LIGAMENT_${joint}_CAPSULES`, 'ATTACHES_TO', `BONE_${joint === 'PIP' ? 'MIDDLE' : 'DISTAL'}_PHALANX_OF_${digit.id}`, 'The source capsule group includes attachments at the margins of the corresponding digital joint surfaces.', handSources.ip);
}
edge('LIGAMENT_PISOTRIQUETRAL', 'PART_OF', 'JOINT_PISOTRIQUETRAL', 'This source-named ligament supports the pisotriquetral articulation.', handSources.zAnatomy);
edge('LIGAMENT_RADIOCAPITATE', 'ATTACHES_TO', 'BONE_CAPITATE', 'The source-named radiocapitate band has a capitate attachment; its source identity is kept separate from the radioscaphocapitate element.', handSources.zAnatomy);
edge('LIGAMENT_SUPERFICIAL_TRANSVERSE_METACARPAL', 'ATTACHES_TO', 'FASCIA_PALMAR_APONEUROSIS', 'This superficial transverse palmar band belongs to the palmar fascial system rather than the deep MCP palmar-plate system.', handSources.zAnatomy);
for (let compartment = 1; compartment <= 6; compartment++) {
  const id = `FASCIA_EXTENSOR_COMPARTMENT_${compartment}_SHEATH`;
  add('sheath-source-groups', id, `synovial tendon sheath of extensor compartment ${compartment}`, 'Fascia', 'The source-named synovial sheath for the tendon content of this dorsal compartment, distinct from the entire fibro-osseous compartment and from the enclosed tendon.', handSources.sheaths);
  edge(id, 'PART_OF', `FASCIA_EXTENSOR_COMPARTMENT_${compartment}`, 'This synovial sheath lies within the named extensor compartment.', handSources.sheaths);
}
add('sheath-source-groups', 'FASCIA_DIGITAL_SYNOVIAL_SHEATHS', 'synovial sheaths of digits of hand (group)', 'Fascia', 'Grouped source synovial sheaths of the digits. The individual digital sheath records do not inherit this entire mesh.', handSources.sheaths);
for (const digit of digits) edge(`FASCIA_DIGITAL_FLEXOR_SHEATH_${digit.id}`, 'PART_OF', 'FASCIA_DIGITAL_SYNOVIAL_SHEATHS', 'This named digital sheath is a member of the grouped digital synovial-sheath concept.', handSources.sheaths);
add('sheath-source-groups', 'LIGAMENT_DIGITAL_CRUCIFORM_PULLEYS', 'cruciform parts of digital fibrous sheaths (group)', 'Ligament', 'Source-named grouped cruciform portions of the digital fibrous sheaths. This is not an annular pulley mesh, nor the entire pulley apparatus of a specific finger.', handSources.sheaths);
add('sheath-source-groups', 'LIGAMENT_DIGITAL_FIBROUS_SHEATHS', 'fibrous flexor sheaths of digits (group)', 'Ligament', 'The complete grouped digital fibrous sheath system, including annular and cruciform portions. A source mesh of cruciform portions alone does not cover this whole group.', handSources.sheaths);
edge('LIGAMENT_DIGITAL_CRUCIFORM_PULLEYS', 'PART_OF', 'LIGAMENT_DIGITAL_FIBROUS_SHEATHS', 'Cruciform portions are a subset of the grouped digital fibrous sheath apparatus.', handSources.sheaths);
for (const digit of digits) edge(`LIGAMENT_FLEXOR_PULLEY_SYSTEM_${digit.id}`, 'PART_OF', 'LIGAMENT_DIGITAL_FIBROUS_SHEATHS', 'This digit’s fibrous sheath is a member of the grouped digital fibrous sheath system.', handSources.sheaths);
for (const [id, name, citation] of [
  ['SKIN_PALMAR_DIGITAL_SURFACES', 'palmar surfaces of digits of hand (group)', handSources.skin],
  ['SKIN_DORSAL_DIGITAL_SURFACES', 'dorsal surfaces of digits of hand (group)', handSources.skin],
  ['SKIN_NAIL_PLATES', 'nail plates of hand (group)', handSources.nails],
  ['SKIN_PERIONYX', 'perionyx of hand (source group)', handSources.nails],
] as Array<[string, string, Citation]>) {
  add('surface-source-groups', id, name, 'Skin', id === 'SKIN_PERIONYX' ? 'Source-labeled perionyx/cuticular tissue around the nails, grouped for the hand. It is distinct from the nail plate, bed and matrix.' : id === 'SKIN_NAIL_PLATES' ? 'Grouped nail-plate source geometry. It does not include the nail beds, matrices or complete nail apparatuses, and is not independently segmented by digit.' : 'Grouped palmar or dorsal digital surface geometry. It does not provide an independently segmented cutaneous surface for every digit.', citation);
  edge(id, 'PART_OF', 'SKIN_HAND', 'This grouped cutaneous surface or appendage belongs to the hand surface; source elements can overlap and are not summed as distinct tissue volume.', citation);
}
for (const [id, name, continuation] of [['PALMAR_WRIST', 'palmar wrist surface', 'PALM'], ['DORSAL_WRIST', 'dorsal wrist surface', 'DORSUM']]) {
  add('surface-source-groups', `SKIN_${id}`, name, 'Skin', 'Source-named anterior or posterior wrist region, kept distinct from the hand and digital surface groups.', handSources.zAnatomy);
  edge(`SKIN_${id}`, 'CONTINUES_AS', `SKIN_${continuation}`, 'The wrist cutaneous surface continues distally onto the corresponding hand surface.', handSources.skin);
}
add('vein-source-groups', 'VEIN_DORSAL_DIGITAL_VEINS', 'dorsal digital veins of hand (group)', 'Vein', 'Source-named dorsal digital venous group for the hand. It is distinct from similarly named lower-limb elements and from independently segmented veins of each finger.', handSources.overview);
for (const digit of digits) edge(`VEIN_DORSAL_DIGITAL_${digit.id}`, 'PART_OF', 'VEIN_DORSAL_DIGITAL_VEINS', 'This digit-specific venous concept belongs to the source-level dorsal digital venous group.', handSources.overview);
edge('VEIN_DORSAL_DIGITAL_VEINS', 'DRAINS_TO', 'VEIN_DORSAL_VENOUS_NETWORK', 'Dorsal digital venous channels drain proximally toward the dorsal venous network.', handSources.overview);
add('vein-source-groups', 'VEIN_PALMAR_DIGITAL_VEINS', 'palmar digital veins of hand (group)', 'Vein', 'A combined source element for palmar digital veins, not an independently segmented vein for each digit or side.', handSources.overview);
for (const digit of digits) edge(`VEIN_PALMAR_DIGITAL_${digit.id}`, 'PART_OF', 'VEIN_PALMAR_DIGITAL_VEINS', 'This digit-specific venous concept is a member of the broader palmar digital venous group.', handSources.overview);
for (const kind of ['COMMON', 'PROPER']) {
  const id = `ARTERY_${kind}_PALMAR_DIGITAL_ARTERIES`;
  add('artery-source-groups', id, `${kind.toLowerCase()} palmar digital arteries (group)`, 'Artery', `Source-named ${kind.toLowerCase()} palmar digital arterial group. Its member branches remain separate graph concepts; source group geometry must not be copied onto each branch.`, handSources.overview);
  for (const member of handStructures.filter((s) => kind === 'COMMON' ? /^ARTERY_COMMON_PALMAR_DIGITAL_\d$/.test(s.graphNodeId) || s.graphNodeId === 'ARTERY_FOURTH_COMMON_PALMAR_DIGITAL' : s.graphNodeId.startsWith('ARTERY_PROPER_PALMAR_DIGITAL_') && s.graphNodeId !== id)) edge(member.graphNodeId, 'PART_OF', id, 'This named branch belongs to the grouped digital arterial concept. Source nomenclature is preserved and does not establish an invariant individual branching pattern.', member.graphNodeId === 'ARTERY_FOURTH_COMMON_PALMAR_DIGITAL' ? handSources.sourceElements : handSources.overview);
}

/** Legacy parent shortcuts now replaced by the named branch relationships. */
export const supersededHandRelationshipIds = [
  'NERVE_MEDIAN_NERVE__INNERVATES__MUSCLE_ABDUCTOR_POLLICIS_BREVIS',
  'ARTERY_RADIAL_ARTERY__SUPPLIES__MUSCLE_ABDUCTOR_POLLICIS_BREVIS',
];

export const HAND_COVERAGE_SCOPE = 'Right hand and wrist gross-anatomy reference catalog, including forearm muscles with wrist/digit actions. Named small-structure groups are explicit; variable anatomy, microscopic structures and individual patient branching are not exhaustively enumerated. Renderable coverage is determined separately by the verified source-mesh manifest.';
