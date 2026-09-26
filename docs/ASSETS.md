# BodyParts3D assets and validation

The hand MVP publishes 31 structures (29 bones, one muscle, one artery), each with high, medium, and low Draco-compressed GLBs. The median nerve remains a graph-only structure: the old 12-triangle placeholder is not registered or rendered. Adding a mesh requires a real source, a canonical graph node, a manifest binding, and provenance.

## Source and attribution

**BodyParts3D, © The Database Center for Life Science licensed under [CC Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).**

- [Official download page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html)
- [Official license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), updated 2025-02-27; checked 2026-09-26. Older project pages still show CC BY-SA 2.1 Japan; this pipeline uses the archive and its current CC BY 4.0 terms.
- [BodyParts3D 4.0 IS-A archive, 99% polygon reduction](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip)
- [Official FMA-to-element-file table](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_element_parts.txt)

`scripts/assets/bodyparts3d-mapping.json` preserves the 31 exact source-table rows and the SHA-256 of the complete downloaded table. Every published GLB contains its original `FJ*.obj` mesh name; validation checks that name against the source row and FMA ID. This confirms archive mapping consistency. It does not independently certify anatomy, clinical claims, SNOMED concepts, or the FMA ontology. `ontologyValidated` remains false. The table includes both generic and right-specific concepts: the MVP retains its existing FMA concept scope rather than silently changing IDs.

The existing GLBs predate this reproducible pipeline; their source names are retained lineage, not a claim of byte-for-byte historical reproduction. New imports record source and output SHA-256 values. Derivative processing centers and scales vertices, simplifies geometry, and compresses it with Draco. Preserve attribution when distributing the models.

## Reproduce the source conversion

Requires Node.js, installed project dependencies (`npm ci`), and Python 3 only for downloading. Run from the repository root.

1. Download only the required members of the official archive. The downloader uses HTTP ranges, ZIP CRC checks, and an archive ETag to avoid downloading the entire 136 MiB archive or mixing changed archive versions.

   ```sh
   python3 scripts/fetch_bodyparts.py --output /tmp/graphanatomy-source --mesh-id mesh_scaphoid_01
   ```

   Omit `--mesh-id` to fetch all 31 registered sources, or repeat it to select several. If the host does not support ranges, download the linked ZIP and supply `--archive /path/to/isa_BP3D_4.0_obj_99.zip`. Each fetch emits the OBJ files and `import-config.json` containing their hashes.

2. Convert to a new, empty staging directory.

   ```sh
   npm run assets:import -- --config /tmp/graphanatomy-source/import-config.json --input /tmp/graphanatomy-source --output /tmp/graphanatomy-converted
   ```

   The importer checks source hashes and exact FMA/source mappings before writing. It produces `models/*.glb`, `manifests/hand_region.json`, and `import-report.json`. The report records source centers, hashes, triangle counts, decoded bounds, transformation parameters, license, and mapping provenance. An existing nonempty output directory is rejected.

3. Review the staged manifest and output. A selected-source run emits a partial manifest; merge its entries into the existing hand manifest instead of replacing all 31 entries. Copy the reviewed GLBs into `public/models/`. For an existing structure retain its mesh ID and graph node ID. New structures also need canonical data and reviewed relationships in `src/lib/anatomy-data.ts` and an official mapping row.

4. Regenerate the registry and validate the full application dataset.

   ```sh
   npm run assets:registry
   npm run validate
   npm test
   ```

The checked-in real source fixture makes the conversion test runnable without network access:

```sh
npm run assets:import -- --config tests/fixtures/bodyparts3d/import-config.json --input tests/fixtures/bodyparts3d --output /tmp/graphanatomy-fixture-output
```

`FJ3383.obj` is the actual reduced right scaphoid element from the official archive. Its checksum and attribution are included beside the file. No generated shape is substituted for anatomy.

## Coordinates and LOD policy

Each OBJ remains aligned with the other anatomical parts using a shared region centroid and scale:

```text
local vertex = (source vertex - source bounding-box center) × coordinateScale
manifest position = (source bounding-box center - regionCentroid) × coordinateScale
world vertex = local vertex + manifest position
```

The importer writes decoded high-LOD world bounds to the manifest. The viewer uses `position` once; do not also bake it into the GLB. All LODs retain the same local origin and scene transforms.

High detail retains the input mesh. Medium targets 50% of high; low targets 40% of medium (approximately 20% of high). Simplification permits 1% relative error per stage; errors accumulate across stages. Topology and the error bound can stop reduction early, so target ratios are not promised counts. Lower LODs are derived sequentially and decoded counts must never increase. Thin or small anatomical structures often retain more triangles than the target.

Existing lower LODs can be rebuilt from the registered high mesh without changing its transform:

```sh
npx tsx scripts/rebuild_lods.ts mesh_lunate_01 mesh_capitate_01 mesh_hamate_01
npm run validate
```

The lockfile pins glTF Transform, meshoptimizer, Draco and Three.js. Pin the Node version as well when comparing output hashes across machines.

## What validation proves

`npm run validate` exits nonzero on structural failures. It:

- checks every region entry, all 31 mesh IDs and graph bindings, all 93 LOD paths, and current registry equality;
- rejects duplicate IDs/paths, unbounded paths, missing files, malformed GLB headers, external GLB resources, absent Draco compression, invalid indices, and non-finite decoded coordinates;
- compares decoded high geometry to finite manifest bounds and checks monotonic LOD triangle counts;
- compares FMA IDs to the recorded archive mapping and checks source versions, original source filenames, citation URLs and titles;
- checks graph/clinical IDs, relationship endpoints, category-compatible relationship types, relationship duplicates, metadata counts and unsupported ontology-certification claims.

The asset tests also mutate identities, bounds, paths, relationships, ontology identifiers and citations to verify rejection, then convert the real source fixture and decode all three outputs. Validation is integrity and provenance checking, not medical certification. Medical review and independent ontology validation remain separate requirements before clinical use.
