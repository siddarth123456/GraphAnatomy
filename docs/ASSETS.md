# Anatomy assets and validation

The hand atlas publishes **190 source meshes, each with high, medium, and low Draco-compressed GLBs (570 files)**: 93 from BodyParts3D and 97 from Z-Anatomy. They bind to 190 of the catalog's 392 anatomical entries; the remaining 202 entries have no separate mesh. Geometry availability is independent of graph coverage. Adding a mesh requires a licensed source, a canonical graph node, a manifest binding, and provenance.

## Sources and attribution

| Source | Published assets | License and lineage |
| --- | --- | --- |
| BodyParts3D 4.0 | 93 | © The Database Center for Life Science; [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Z-Anatomy | 97 | Z-Anatomy project, Lluís Vinent Juanico and contributors; [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); commit `6c7f9016bd5899ac8edafd31b9900c151df42ed6` |

Preserve the attribution and source links for both collections and the ShareAlike terms for distributed Z-Anatomy derivatives. The manifest and metadata panel identify each asset's source and license; the mixed collection is not uniformly CC BY 4.0.

**BodyParts3D references:** [download page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html), [archive license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), [4.0 IS-A OBJ archive, 99% polygon reduction](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip), and [FMA-to-element table](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_element_parts.txt). The archive license was updated 2025-02-27 and checked 2026-09-26; older project pages display different terms.

[`bodyparts3d-mapping.json`](../scripts/assets/bodyparts3d-mapping.json) records source-table rows and the SHA-256 of the downloaded table. Each GLB retains its original `FJ*.obj` mesh names. Multipart anatomy uses one primary source plus `sourceParts`; every part retains its own identity and, for new imports, source hash. The 31 original MVP assets predate the importer: their source names preserve lineage, not byte-for-byte historical reproducibility. New imports record source and output hashes.

**Z-Anatomy references:** [pinned FBX collection](https://github.com/LluisV/Z-Anatomy/tree/6c7f9016bd5899ac8edafd31b9900c151df42ed6/Resources/Models/FBX) and the [reproduction guide](../scripts/assets/Z_ANATOMY_IMPORT.md). Committed source checksums, exact object mappings, registration measurements, and license metadata make the conversion independent of an earlier ignored staging folder. Z assets preserve the exact source-object name and full FBX hash. They have no asserted FMA identifier.

Source-row consistency is not independent certification of anatomy, FMA, or SNOMED CT. `ontologyValidated` remains false. The catalog retains generic versus right-specific FMA scope explicitly. Verified source discrepancies and excluded mislocated geometry are documented in the [coverage audit](HAND_COVERAGE.md).

## Representation and alignment

Named source groups remain a single selectable mesh. Individual lumbricals, interossei, digital branches, or nail components do not receive duplicates of a parent group mesh. `PART_OF` relationships connect a graph-only member to its group. Standalone tendons, palmaris brevis, thumb sesamoids, and other unavailable source objects remain graph-only.

Some Z-Anatomy objects are original low-polygon surfaces, including 12-triangle ligament objects. `geometryRepresentation: "source-surface"` identifies these simplified source representations, and `sourceTriangleCount` records their actual high-detail triangle count after any documented crop. The UI states that anatomical thickness is not modeled. These are verified source facets, not substituted placeholder solids. A `source-mesh` label also does not certify tissue volume or clinical accuracy.

All BodyParts3D meshes share one region centroid and scale:

```text
regionCentroid = [-261.34, -140.69, 756.46] source millimeters
coordinateScale = 0.01
local vertex = (source vertex - source bounding-box center) × coordinateScale
manifest position = (source bounding-box center - regionCentroid) × coordinateScale
world vertex = local vertex + manifest position
```

Z-Anatomy geometry first passes through one orientation-preserving similarity transform fitted to 29 corresponding right-hand/forearm bones, then uses the same region frame. There is no individual tissue fitting. The [committed registration report](../scripts/assets/z-anatomy-registration.json) records fitted landmark RMS **0.175 mm**, held-out landmark RMS **0.261 mm**, and bidirectional surface RMS **0.201 mm** (p95 **0.345 mm**, maximum **3.615 mm**). These measure agreement between atlases, not accuracy for a patient.

Cephalic/basilic veins and four proximal nerve objects are regionally cropped. Only complete original triangles within recorded bounds are retained; cuts remain open with no generated caps or thickness. Crop bounds and method stay in the manifest and import report. The viewer applies `position` once; all LODs retain the same local origin and scene transforms.

## Reproduce BodyParts3D conversion

Requires Node.js 22+, installed dependencies (`npm ci`), and Python 3 for downloading. Run from the repository root.

1. Download selected members of the official archive. The downloader uses HTTP ranges, ZIP CRC checks, and an archive ETag to avoid downloading the full archive or mixing changed versions.

   ```sh
   python3 scripts/fetch_bodyparts.py --output /tmp/graphanatomy-source --mesh-id mesh_scaphoid_01
   ```

   Omit `--mesh-id` to fetch all registered BodyParts3D sources, or repeat it to select several. If the host does not support ranges, download the linked ZIP and supply `--archive /path/to/isa_BP3D_4.0_obj_99.zip`. Each fetch emits OBJ files and an `import-config.json` with hashes, multipart inputs, and any recorded crops.

2. Convert to a new, empty staging directory.

   ```sh
   npm run assets:import -- --config /tmp/graphanatomy-source/import-config.json --input /tmp/graphanatomy-source --output /tmp/graphanatomy-converted
   ```

   The importer verifies source hashes and FMA/source mappings. It writes `models/*.glb`, `manifests/hand_region.json`, and `import-report.json`, recording hashes, triangle counts, decoded bounds, transforms, license, and provenance. A nonempty output directory is rejected.

3. Inspect the staged manifest, report, and geometry. Merge selected entries into the published hand manifest; a partial conversion must not replace the full mixed-source inventory. Copy reviewed GLBs into `public/models/`. Retain existing mesh/graph IDs; new structures need canonical metadata and reviewed relationships as well as source mappings.

4. Regenerate the registry and validate the full dataset.

   ```sh
   npm run assets:registry
   npm run validate
   npm test
   ```

The checked-in real-source fixture runs without network access:

```sh
npm run assets:import -- --config tests/fixtures/bodyparts3d/import-config.json --input tests/fixtures/bodyparts3d --output /tmp/graphanatomy-fixture-output
```

`FJ3383.obj` is the reduced right scaphoid from the official archive; its checksum and attribution accompany it.

## Reproduce Z-Anatomy conversion

Follow the [pinned Z-Anatomy import guide](../scripts/assets/Z_ANATOMY_IMPORT.md) to fetch and verify the six FBXs, recheck registration using Blender, and generate a fresh staging directory. The checked-in source index, canonical map, and registration inputs live under `scripts/assets/`. Established BodyParts3D bindings are preserved; existing Z bindings can be regenerated.

Inspect the report and all three LODs before merging the staged entries into the published manifest. Retain source names, hashes, representation labels, registration/crop records, and CC BY-SA 4.0 notices. Finish with the same registry and validation commands above.

## LOD policy

High detail retains the source triangles after any declared crop. Medium targets 50% of high; low targets 40% of medium (approximately 20% of high). Simplification permits 1% relative error per stage; errors accumulate. Topology and error bounds can stop reduction early, and small source surfaces stay unchanged. Target ratios are not guaranteed counts; decoded counts must never increase from high to medium to low.

Existing lower LODs can be rebuilt without changing the high mesh transform:

```sh
npx tsx scripts/rebuild_lods.ts mesh_lunate_01 mesh_capitate_01 mesh_hamate_01
npm run validate
```

The lockfile pins glTF Transform, meshoptimizer, Draco, and Three.js. Pin Node when comparing output hashes across machines. The viewer loads visible geometry on demand, uses medium detail for large visible sets, and uses high detail for the selected model.

## What validation proves

`npm run validate` exits nonzero on structural failures. It checks:

- All 190 mesh IDs, graph bindings, 570 LOD paths, and generated registry equality.
- Unique IDs/paths, contained file paths, GLB headers, local resources, Draco compression, valid indices, finite decoded coordinates, manifest bounds, and monotonic LOD counts.
- Original source names, hashes where recorded, multipart lineage, source versions, mappings, licenses, citations, and exact triangle counts for declared source surfaces. Unverified tiny placeholders remain invalid.
- Z-Anatomy's finite, orientation-preserving registration, recomputed landmark residuals, and held-out/surface acceptance measurements.
- Graph/clinical IDs, relationship endpoints and categories, duplicate relationships, coverage counts, and unsupported ontology-certification claims.

Tests exercise corrupted identities, bounds, paths, relationships, source mappings, citations, and registration, plus real fixture conversion. Validation establishes data integrity and recorded provenance. It does not certify clinical anatomy, universal branching patterns, microscopic completeness, or authoritative ontology agreement.
