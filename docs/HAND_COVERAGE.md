# Right hand and wrist coverage

This atlas has a **defined gross-anatomy scope**, not a claim that every anatomical variation or microscopic structure has been modeled. The canonical checklist is [`handCoverageChecklist`](../src/lib/hand-expansion.ts). Each catalog entry has a stable ID, category, description, search terms and citation. Each entry participates in a cited graph relationship. A graph entry is not proof of independently segmented geometry.

The scope is the right hand and wrist, plus the radius, ulna and forearm muscles that act on the wrist or digits. Forearm structures retain their actual anatomical extent. A whole forearm muscle is not relabeled as its hand tendon. Proximal arm structures are context only where they belong to an imported parent nerve or vessel.

## What “covered” means

| Representation | Meaning |
| --- | --- |
| Individual mesh | A source object mapped to that canonical structure, with recorded source identity and validated geometry. |
| Group mesh | One original source object contains a named group, such as lumbricals, digital nerves, collateral ligaments or nail plates. It belongs to the group node. |
| Graph-only member | A real anatomical concept with descriptions and relationships, but no independently verified mesh. It must not inherit the complete group mesh. |
| Source-specific concept | A source label whose resolution or nomenclature differs from the conventional checklist. It remains explicit; it is not silently renamed to a convenient structure. |
| Variable concept | A structure or configuration that is not universal, identified as variable in its description. |

The publication inventory contains **190 renderable source structures: 93 BodyParts3D and 97 Z-Anatomy**. The canonical checklist contains **392 anatomical entries**, including **202 graph-only entries**. The public [`hand_region.json`](../public/manifests/hand_region.json) determines which entries can render. The API computes counts from the catalog; group, head and component entries are **not additive counts of whole muscles or tissue volume**. The full catalog and published asset inventory can grow without changing the interpretation of the anatomical checklist below.

## Anatomical checklist

### Bones

- **Eight carpals:** scaphoid, lunate, triquetrum, pisiform, trapezium, trapezoid, capitate and hamate.
- **Five metacarpals:** first through fifth.
- **Fourteen phalanges:** proximal and distal thumb phalanges; proximal, middle and distal phalanges of index, middle, ring and little fingers.
- **Wrist/forearm context:** radius and ulna. These are not counted among the 27 hand bones.
- **Two thumb MCP sesamoids:** radial and ulnar. These have graph entries; a source mesh is not invented when the datasets lack separate sesamoids.

The pisiform is itself a sesamoid in the FCU tendon and is already included in the eight carpals. Variable sesamoids at other MCP/IP joints and accessory ossicles are outside the fixed checklist. The graph preserves the articular disc between ulna and carpus; it does not create a direct ulna–carpal articulation.

Sources: [OpenStax upper-limb bones](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-2-bones-of-the-upper-limb), [MCP anatomy and thumb sesamoids](https://www.kenhub.com/en/library/anatomy/metacarpophalangeal-mcp-joints).

### Intrinsic muscles

| Group | Named units |
| --- | --- |
| Thenar/adductor | Abductor pollicis brevis, flexor pollicis brevis, opponens pollicis, adductor pollicis |
| Hypothenar and superficial palm | Abductor digiti minimi, flexor digiti minimi brevis, opponens digiti minimi, palmaris brevis |
| Lumbricals | First, second, third and fourth |
| Dorsal interossei | First, second, third and fourth |
| Conventional palmar interossei | Index, ring and little-finger palmar interossei, named by digit to avoid numbering ambiguity |
| Variable additional unit | Thumb palmar interosseous, explicitly marked variable/rudimentary |

This is **19 conventional units plus one variable thumb unit**. References differ between three- and four-palmar-interossei conventions. It would be misleading to assert 20 distinct intrinsic muscles in every hand. The catalog includes the thumb concept without claiming that it is present in the source specimen.

The three lumbrical/interosseous source groups have their own parents. Named constituent muscles remain separate graph concepts. Oblique/transverse adductor heads and superficial/deep FPB heads are component entries, not additional intrinsic muscles. Palmaris brevis remains an explicit gap when no verified source mesh is available.

Sources: [Hand overview](https://www.kenhub.com/en/library/anatomy/hand-anatomy), [palmar interossei and count conventions](https://www.kenhub.com/en/library/anatomy/palmar-interossei-muscles), [dorsal interossei](https://www.kenhub.com/en/library/anatomy/dorsal-interossei-muscles-of-the-hand), [lumbricals](https://www.kenhub.com/en/library/anatomy/lumbrical-muscles-of-the-hand), and individual muscle citations in the catalog.

### Extrinsic muscles and tendons

| Compartment/action group | Named muscles |
| --- | --- |
| Anterior wrist/finger flexors | Flexor carpi radialis, flexor carpi ulnaris, palmaris longus, flexor digitorum superficialis, flexor digitorum profundus, flexor pollicis longus |
| Posterior wrist extensors | Extensor carpi radialis longus, extensor carpi radialis brevis, extensor carpi ulnaris |
| Posterior digit extensors | Extensor digitorum, extensor indicis, extensor digiti minimi |
| Extrinsic thumb muscles | Abductor pollicis longus, extensor pollicis longus, extensor pollicis brevis |

There are 15 named extrinsic wrist/digit-action muscle units when palmaris longus is included. Palmaris longus is variable. FCU humeral/ulnar heads are represented separately where the source separates them, while their parent remains one muscle unit. Pronator teres, pronator quadratus, supinator and brachioradialis are not included in this wrist/digit-action count: their principal joint actions are forearm rotation or elbow movement.

The tendon checklist resolves the four FDS, four FDP and four extensor digitorum digital tendons individually. Each other listed muscle has one named distal-tendon entry, with accessory slips kept within the parent concept. This gives 24 extrinsic tendon entries. Individual tendon geometry is not inferred from a whole-muscle object or from a tendon-sheath object.

Each of the four finger extensor expansions is a separate group concept containing the central slip, lateral bands and terminal tendon. Their extrinsic and intrinsic contributions are connected in the graph. Extensor apparatus subdivisions and accessory tendon slips are not all separate meshes.

Sources: individual muscle articles linked on each entry; [extensor digitorum and extensor expansion](https://www.kenhub.com/en/library/anatomy/extensor-digitorum-muscle).

### Nerves

- Median, ulnar and radial parent nerves.
- Recurrent median branch; median palmar cutaneous branch; anterior interosseous nerve.
- Ulnar deep, superficial, palmar cutaneous and dorsal cutaneous branches.
- Radial deep and superficial branches; posterior interosseous nerve.
- Three conventional median common palmar digital divisions and the ulnar common palmar digital division.
- Radial and ulnar proper palmar digital nerves of each of the five digits.
- Grouped dorsal digital branches from superficial radial and dorsal ulnar nerves.
- Source-level common/proper palmar digital groups and median, ulnar and radial muscular-branch groups.
- Source-labeled median–ulnar communicating branch, marked as a variable communication without assigning an unverified eponym.

Named branch meshes remain attached to their actual source identity. In particular, **“muscular branches of median nerve” is not substituted for the recurrent median branch**. Individual proper/common digital branches remain graph-only where only the parent group is segmented. Skin and joint innervation edges describe contributions, not exclusive territories. Overlap, communications and branching variation are explicit.

The graph distinguishes the usual recurrent-median supply to APB/opponens/FPB superficial head from deep-ulnar supply to most other intrinsic muscles. FPB and FDP dual/variable innervation is stated in the relationship description. Median digital branches supply the lateral lumbricals; the recurrent branch is not used for them.

Sources: [median nerve](https://www.kenhub.com/en/library/anatomy/the-median-nerve), [ulnar nerve](https://www.kenhub.com/en/library/anatomy/the-ulnar-nerve), [radial nerve](https://www.kenhub.com/en/library/anatomy/radial-nerve), [hand neurovasculature](https://www.kenhub.com/en/library/anatomy/hand-anatomy).

### Arteries and veins

**Arteries:** radial and ulnar arteries; superficial/deep palmar arches; superficial palmar radial and deep palmar ulnar branches; radial/ulnar palmar and dorsal carpal branches; palmar/dorsal carpal networks; princeps pollicis; radialis indicis; palmar/dorsal metacarpal groups; dorsal digital group; perforating deep-palmar branches; common palmar digital arteries for web spaces 2–4; radial/ulnar proper palmar digital distributions for all digits; source-level common/proper digital groups.

The BodyParts3D element named **fourth common palmar digital artery** remains a distinct source-nomenclature entry. It is not silently mapped to the ulnar proper artery of the little finger. The conventional web-space numbering in this catalog is separate from the archive's ordinal numbering. Arch completeness, origin and digital branching are not claimed to be universal. No “end artery” or treatment recommendation is inferred.

**Veins:** dorsal venous network; dorsal/palmar metacarpal groups; superficial/deep palmar venous arches; common palmar digital venous group; dorsal/palmar digital groups for every digit; communicating veins; cephalic/basilic wrist routes; paired radial/ulnar venae comitantes. Source-level digital groups are distinct from individual digit concepts.

Vein edges show proximal drainage routes, not a claim that venous anatomy mirrors the arterial tree or has an invariant number of channels.

Sources: [radial artery](https://www.kenhub.com/en/library/anatomy/radial-artery), [ulnar artery](https://www.kenhub.com/en/library/anatomy/the-ulnar-artery), [hand vessels](https://www.kenhub.com/en/library/anatomy/hand-anatomy), official source labels for source-specific elements.

### Fascia, sheaths and passages

- Flexor and extensor retinacula; palmar aponeurosis; thenar, hypothenar and dorsal fascia; palmar intermuscular septa.
- Interosseous membrane of the forearm, as forearm context.
- FCR sheath, radial bursa/FPL sheath, ulnar bursa/common flexor sheath.
- Six extensor compartments and their separately named synovial sheaths: I APL/EPB, II ECRL/ECRB, III EPL, IV ED/EI, V EDM, VI ECU.
- Five digital flexor synovial sheaths and a source-level sheath group.
- Five fibrous digital sheath/pulley systems and their collective parent. Finger systems include A1–A5 and C1–C3 as named groups. The thumb is not assigned the other fingers' pulley pattern.
- Source-level cruciform pulley group, distinct from annular pulleys and from the entire fibrous sheath.
- Long/short vincula grouped by finger.
- Carpal tunnel and Guyon's canal, classified as **Space**, not Joint.

The carpal tunnel has the median nerve and nine long flexor tendons. FCR occupies its own sheath/canal; ulnar nerve and artery use Guyon's canal. Neither route is falsely placed inside the carpal tunnel. Sheath/bursa communications are variable. **A sheath is not a tendon**, and a source mesh of cruciform portions is not evidence for separately segmented A1–A5 annular pulleys.

Sources: [carpal tunnel](https://www.kenhub.com/en/library/anatomy/carpal-tunnel), [tendinous sheaths](https://www.kenhub.com/en/library/anatomy/carpal-tendinous-sheaths), [palmar aponeurosis](https://www.kenhub.com/en/library/anatomy/palmar-aponeurosis).

### Joints, ligaments and joint support

**Joints:** distal radioulnar, radiocarpal, midcarpal, intercarpal group, pisotriquetral, intermetacarpal group; all five CMC joints; all five MCP joints; thumb IP plus four PIP and four DIP joints.

**Wrist capsular supports:** radioscaphocapitate, long/short radiolunate, radioscapholunate/Testut band, dorsal radiocarpal, radial/ulnar collateral wrist, ulnolunate, ulnotriquetral and ulnocapitate. Source-specific radiocapitate and dorsal ulnocarpal labels remain distinct rather than being equated to similarly named bands.

**Carpal supports:** scapholunate/lunotriquetral interosseous; dorsal/palmar intercarpal groups; distal-row interosseous group; pisohamate; pisometacarpal; pisotriquetral. Separately segmented source bands include palmar scaphotriquetral, palmar capitohamate, palmar trapezoideocapitate, palmar lunotriquetral, triquetrocapitate, triquetrohamate, scaphocapitate, trapezoideocapitate interosseous, trapeziotrapezoidal interosseous, capitohamate interosseous, scaphotrapeziotrapezoidal, dorsal scaphotriquetral and radiate carpal.

**TFCC:** parent complex, articular disc, palmar/dorsal radioulnar bands, meniscal homologue, ECU subsheath and referenced ulnocarpal/collateral components. A mesh of the disc is not assigned to the entire TFCC. TFCC definitions vary across references; the adopted definition is cited.

**Distal supports:** dorsal/palmar/interosseous CMC and intermetacarpal groups; thumb CMC capsular support; superficial/deep transverse metacarpal ligaments; radial/ulnar collateral complexes and volar plates of every MCP/IP joint. Proper/accessory collateral portions stay within their side-specific complexes. Source MCP/PIP/DIP capsule groups, MCP/IP collateral groups and IP palmar-ligament group remain separate from individual-joint entries.

Articular cartilage, synovial lining, every individual capsular fascicle and every ligament enthesis are not separate reconstructions. Named subdivisions differ between references. Source-specific band labels carry atlas provenance; that is distinct from independent medical review of every boundary.

Sources: [wrist/TFCC](https://www.kenhub.com/en/library/anatomy/the-wrist-joint), [intercarpal joints](https://www.kenhub.com/en/library/anatomy/intercarpal-joints), [finger CMC joints](https://www.kenhub.com/en/library/anatomy/carpometacarpal-cmc-joints), [thumb CMC](https://www.kenhub.com/en/library/anatomy/trapeziometacarpal-joint), [MCP](https://www.kenhub.com/en/library/anatomy/metacarpophalangeal-mcp-joints), [IP](https://www.kenhub.com/en/library/anatomy/interphalangeal-joints-of-the-hand).

### Surface and superficial tissues

- Hand skin, palm, dorsum, palmar/dorsal digital groups, individual digital-skin concepts, palmar/dorsal wrist regions.
- Thenar/hypothenar eminences, anatomical snuffbox/radial foveola, palmar/digital creases and interdigital webs.
- Subcutaneous tissue and the five digital pulp pads.
- Each digit's nail apparatus as a concept, plus distinct source-level nail-plate and perionyx groups.

Nail plate geometry does not imply meshes for nail bed, matrix or all nail folds. A skin surface has no invented thickness or fat layer. The published surface uses the separately named Z-Anatomy regions. A BodyParts3D skin crop was evaluated but excluded from the publication to avoid duplicating the donor surface; `SKIN_HAND` remains a graph-only regional parent. Surface and tissue groups must not be treated as additive volumes.

Sources: [skin layers](https://openstax.org/books/anatomy-and-physiology-2e/pages/5-1-layers-of-the-skin), [skin appendages/nails](https://openstax.org/books/anatomy-and-physiology-2e/pages/5-2-accessory-structures-of-the-skin), [anatomical snuffbox](https://www.kenhub.com/en/library/anatomy/anatomical-snuffbox), source surface labels.

## Geometry and ontology safeguards

1. **BodyParts3D** geometry retains the exact official element row and original source filenames. Its CC BY 4.0 attribution is preserved. Some inherited FMA concepts are generic, others right-specific; those scopes are not silently changed.
2. **Z-Anatomy** geometry retains exact FBX object names and its own CC BY-SA 4.0 license/provenance. `.r` source naming is laterality evidence, not an FMA mapping. No FMA is inferred from an English name or from shared geometry ancestry. See [publisher repository](https://github.com/LluisV/Z-Anatomy), [README](https://github.com/LluisV/Z-Anatomy/blob/PC-Version/README.md) and [license](https://github.com/LluisV/Z-Anatomy/blob/PC-Version/LICENSE).
3. Source registration must preserve all object transforms and be measured against corresponding right-hand bones before publishing soft tissues. Independent centering, arbitrary translations and mirror assumptions are not acceptable registration evidence. The importer records the actual transform and residuals.
4. The BodyParts3D “right FPB” row points to a mirrored left-side source element in the audited table. The physically right source is retained under its **generic FPB concept**, with the discrepancy documented in asset provenance. The generic concept is not promoted to a right-specific ontology assertion.
5. Source names alone do not establish body region. Foot dorsal digital/metacarpal vein elements were rejected despite tempting names. The Z-Anatomy **hand** dorsal digital-vein group is a different verified source object.
6. No SNOMED IDs are asserted. `ontologyValidated` remains false. Archive-row consistency and mesh registration do not certify a complete ontology or medical accuracy.

The import mapping and report are the authority for exact rendered source objects and their transformation/derivative history. [ASSETS.md](ASSETS.md) describes the publishing pipeline. Standalone tendons, palmaris brevis, individual sesamoids and other missing source objects stay graph-only until suitable licensed anatomy is verified.

## Graph semantics and audit

| Relationship | Direction and interpretation |
| --- | --- |
| `ARTICULATES_WITH` | A cited direct articulation between bones; it is not inferred from mesh proximity. |
| `INNERVATES` | Nerve → muscle, skin territory or joint. Partial/branch-specific/variable supply is stated in the description. |
| `SUPPLIES` | Artery → supplied structure. A contribution does not mean exclusive supply. |
| `ORIGINATES_ON`, `INSERTS_ON` | Muscle/tendon → attachment structure, preserving anatomical direction. |
| `BRANCHES_FROM` | Named branch → proximal parent route. When intermediate twigs are unresolved, the description says so. |
| `PART_OF` | Member/head/component → anatomical group or complex. It never grants the child a copy of the group mesh. |
| `CONTINUES_AS` | Proximal structure → named distal continuation, including deep radial → posterior interosseous nerve. |
| `COMMUNICATES_WITH` | A nerve communication and its connected nerve; this does not imply a physiological direction of transmission. |
| `PASSES_THROUGH` | Nerve/vessel/tendon → named passage or sheath. A tendon sheath is not substituted for its tendon. |
| `ATTACHES_TO` | Anatomical attachment or explicitly described connection, without implying flow direction. |
| `DRAINS_TO` | Venous structure → proximal drainage route; not a unique, universal tree. |

The legacy median-parent→APB and radial-parent→APB shortcuts are superseded by named recurrent-median and superficial-palmar-radial branch edges. Old bone-articulation and cited clinical-condition edges are retained when compatible. No new clinical diagnosis, injury prevalence, treatment or procedural recommendations are inferred from the expanded geometry.

The catalog audit checks unique IDs, source-mapping IDs present in the catalog, relationship endpoints, no duplicate edges, and that every catalog entry has at least one relationship. Geometry validation separately checks files, decoded bounds, alignment, source identities, license metadata and LODs. Passing these checks is not a substitute for expert anatomical review.

## Explicit scope limits

This is not a patient-specific vascular/nerve tree, a surgical planning model or a claim of universal “all anatomy.” Unenumerated details include accessory ossicles and muscle slips, every perforator and venous communicating channel, microscopic receptor/skin structures, all lymphatic channels, individual entheses and fascicles, and all variations of nail folds, pulp septa, extensor hood supports and digital motor twigs. Grouped named structures remain visible in the checklist, while their unsegmented subdivisions are clearly described. The catalog can be extended incrementally without filling absent anatomy with placeholder shapes.
