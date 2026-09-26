# Reproduce the Z-Anatomy hand assets

Run from the repository root with Node 22+, the locked npm dependencies, and Blender 5.2+ for registration verification. `npm ci` installs the conversion tools. The importer uses the existing BodyParts3D assets as the reference coordinate frame and preserves their canonical bindings.

The committed inputs are:

- `z-anatomy-sources.json`: six publisher FBX URLs pinned to commit `6c7f9016bd5899ac8edafd31b9900c151df42ed6`, byte sizes and SHA-256 checksums.
- `z-anatomy-canonical-map.json`: 107 exact right-sided source-object mappings. Ten already have BodyParts3D bindings, leaving 97 additions.
- `z-anatomy-registration.json`: the complete measured transform, corresponding landmarks, held-out test and bidirectional surface-distance report.
- `z-anatomy-mapping.json`: published source identities, triangle counts and geometry representation for the 97 selected objects.

Fetch or verify the source files with the standard-library script below. Existing matching files are reused; mismatching files stop the command. Downloads are approximately 212 MB in total. Do not commit the FBXs.

```sh
python3 - <<'PY'
import hashlib, json, pathlib, urllib.request
config = json.loads(pathlib.Path('scripts/assets/z-anatomy-sources.json').read_text())
folder = pathlib.Path('output/hand-expansion/z-anatomy/source')
folder.mkdir(parents=True, exist_ok=True)
for source in config['sources']:
    file = folder / source['sourceFile']
    if not file.exists():
        temporary = file.with_suffix('.fbx.download')
        urllib.request.urlretrieve(source['sourceUrl'], temporary)
        data = temporary.read_bytes()
        assert len(data) == source['bytes'] and hashlib.sha256(data).hexdigest() == source['sourceSha256'], file
        temporary.rename(file)
    data = file.read_bytes()
    assert len(data) == source['bytes'] and hashlib.sha256(data).hexdigest() == source['sourceSha256'], file
    print('Verified', source['sourceFile'])
PY
```

Recheck registration against the current published BodyParts3D bones:

```sh
npx tsx scripts/assets/verify_z_anatomy_registration.ts
blender --background --factory-startup --python scripts/assets/verify_z_anatomy_registration.py
```

The first command exports donor and decoded reference bone surfaces to the ignored output folder. The second writes a new `output/hand-expansion/z-anatomy/registration-report.json`. It independently refits alternating bone centers and evaluates the held-out centers. Surface verification uses all vertices against the opposing triangle surfaces. The published registration has held-out RMS 0.261 mm, surface RMS 0.201 mm, p95 0.345 mm and maximum surface deviation 3.615 mm. These atlas agreement measurements do not certify clinical accuracy.

Generate a fresh staging directory without changing the published manifest or checked mapping:

```sh
npx tsx scripts/import_z_anatomy.ts \
  --output output/hand-expansion/z-anatomy/rebuild \
  --mapping output/hand-expansion/z-anatomy/rebuilt-mapping.json
```

The output directory must be empty. The importer defaults to the committed source, canonical-map and registration configs. `--sources`, `--canonical`, `--registration`, `--input`, and `--existing` provide explicit replacements. Existing Z-Anatomy bindings can be regenerated; established BodyParts3D bindings are skipped. To evaluate a newly checked registration explicitly, pass `--registration output/hand-expansion/z-anatomy/registration-report.json`.

Inspect `rebuild/import-report.json`, the manifest and all three LODs before publication. The import verifies FBX hashes, exact source names, laterality, registered bounds, decoded provenance, exact high-LOD triangle counts and monotonically decreasing LOD counts.

## Source geometry limitations

`sourceTriangleCount` counts the actual source triangles after any documented regional crop and before LOD reduction. `geometryRepresentation` is `source-surface` when that count is below 64 and `source-mesh` otherwise. The 23 source surfaces include 14 original 12-triangle ligament objects. Their few facets are present in the publisher's FBX files and are preserved unchanged in the high LOD; they are simplified atlas representations, not evidence of anatomically measured volume or tissue thickness. Small objects are not decimated at any LOD. Larger meshes are also surface geometry; `source-mesh` does not assert volumetric accuracy.

Named grouped objects remain one selectable source unit. The importer does not convert grouped digital nerves, nail plates, ligaments or sheaths into unsupported individual structures. Four proximal nerve objects retain only complete triangles inside the documented registered hand/forearm bounds, leaving open cuts with no generated caps or thickness.

Derived assets retain CC BY-SA 4.0 attribution and the source links. Staging includes the license notice and a record of registration, crop and LOD changes.
