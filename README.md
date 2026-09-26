# GraphAnatomy

An interactive right-hand and wrist atlas connecting 3D structures, a cited anatomical knowledge graph, and evidence retrieval.

## Run the demo

Requires **Node.js 22+** and npm. A database and AI API key are not required for the bundled demo.

```sh
npm ci
npm run build
npm start
```

Open **http://localhost:3000**. For development, use `npm run dev`.

Start with the **Skeleton** preset and search **Scaphoid**. Switch to **Nerves & vessels** and select **Right median nerve**. In Find evidence, try **“What innervates abductor pollicis brevis?”** to follow its named recurrent-median branch connection.

[Three-minute demo](docs/DEMO.md) · [Anatomical coverage and gaps](docs/HAND_COVERAGE.md) · [Asset provenance and import pipelines](docs/ASSETS.md)

## Current roadmap

The original **Current** roadmap is the acceptance checklist for this release. Its six items map to the following implemented scope:

| Roadmap item | Delivered behavior |
| --- | --- |
| Interactive Hand Anatomy MVP | 190 source meshes; searchable catalog, synchronized selection, tissue layers and presets, isolation, exploded view, three section planes, labels, camera fitting, and reset |
| Neo4j Knowledge Graph | 392 anatomical entries, one clinical condition, and 599 directed, cited relationships; optional Neo4j storage, constraints/full-text indexes, idempotent seeding, and explicit connection errors |
| GraphQL API Layer | Read-only list, detail, asset, relationship, and clinical queries at `/api/graphql`; bounded pagination and named branch/group traversal |
| Ontology Validation Engine | Identifier and source-mapping consistency, graph/mesh bindings, relationship categories, provenance, registration, decoded bounds, and all 570 LOD files; authoritative FMA/SNOMED certification remains outside the implementation |
| GraphRAG Foundation | Deterministic entity matching and direct, one-hop cited retrieval; stable IDs, no-match responses, unsupported spatial-query handling, and disclosed result truncation |
| BodyParts3D Asset Pipeline | Checksummed OBJ ingestion, multipart source mappings, regional cropping, centered/scaled GLBs, three Draco-compressed LODs, generated registry, and import reports |

The hand expansion adds a [pinned Z-Anatomy import pipeline](scripts/assets/Z_ANATOMY_IMPORT.md). The current inventory is **392 anatomical entries: 190 with geometry and 202 without a separate mesh**. Rendered anatomy includes 29 bones, 29 muscle source units, 22 nerves, 25 arteries, 15 veins, 46 ligaments, 15 fascia structures, and 9 skin/nail source units. These are asset counts: muscle groups, heads, and whole muscles must not be added together as a count of distinct muscles.

The scope is right-hand/wrist gross anatomy with necessary forearm context. The median nerve now has real geometry. Named groups such as lumbricals and nail plates retain one source mesh; individual members remain graph-only where they lack independent segmentation. Some original ligament meshes are low-polygon surfaces with no modeled anatomical thickness, disclosed on selection. Tendons, sesamoids, variable structures, and other missing source geometry remain explicit catalog entries. See the [coverage checklist](docs/HAND_COVERAGE.md) for exact inclusions and gaps.

FMA mappings are inherited from BodyParts3D and checked against the recorded source table; they are **not independently certified against the full ontology**. Z-Anatomy assets do not receive invented FMA identifiers. No SNOMED CT mappings are asserted. Atlas registration is measured against shared reference bones; it does not establish patient or clinical accuracy. Evidence is curated educational reference material, not diagnosis or generated medical advice.

### Upcoming

Full-body expansion, advanced graph/vector retrieval, an AI medical tutor, cloud-native infrastructure, clinical learning modules, and collaborative learning workspaces remain future work. The current retrieval service uses neither vector search nor a generative model.

## Optional Neo4j setup

The default `ANATOMY_DATA_MODE=bundled` serves the versioned catalog immediately. To use Neo4j, copy `.env.example` to `.env.local`, uncomment its connection settings, and set a unique local password of at least eight characters. Then:

```sh
docker compose --env-file .env.local up -d
npm run seed
npm run test:neo4j
```

The Docker service binds only to this machine: browser **http://localhost:17474**, Bolt **bolt://127.0.0.1:17687**. Wait for the container to become healthy before seeding (`docker compose --env-file .env.local ps`).

Set `ANATOMY_DATA_MODE=neo4j` in `.env.local` and restart the application. The header shows **Neo4j connected** after the catalog loads. Explicitly configured Neo4j failures return errors; they never silently substitute bundled data.

`npm run seed` upserts the canonical dataset and its indexes. It does not clear the database. Use a dedicated GraphAnatomy database because the seed owns its catalog node IDs and associated properties. `npm run db:indexes` creates only constraints and search indexes. `npm run test:neo4j` seeds twice, compares the full database catalog with the bundled catalog, and checks retrieval.

Stop the local database with `docker compose --env-file .env.local stop`. Its named volume preserves the data.

## API examples

`GET /api/anatomy` returns the active dataset, including its mode and coverage metadata. The frontend uses this same catalog as the graph and retrieval APIs.

GraphQL request to `POST /api/graphql`:

```json
{
  "query": "query($id: ID!) { anatomicalStructure(graphNodeId: $id) { name asset { meshId glbPath } innervatedBy { name } relationships { source target type citation { title url } } } }",
  "variables": { "id": "MUSCLE_ABDUCTOR_POLLICIS_BREVIS" }
}
```

Evidence request to `POST /api/retrieval`:

```json
{ "query": "What innervates abductor pollicis brevis?" }
```

The example returns **recurrent branch of median nerve → INNERVATES → abductor pollicis brevis**, with its citation. Retrieval follows direct edges only; query or select a named branch to explore its own connections. It does not infer all downstream targets from a parent nerve. The endpoint accepts 1–500 characters. Unknown questions return `no_results`; spatial questions return `unsupported` with no invented proximity evidence. GraphQL rejects mutations and bounds query size and nesting; list queries accept `offset` with `limit` capped at 100.

## Verification

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

`check` runs lint, TypeScript, behavioral/unit tests, asset and ontology validation, and a production build. Browser tests cover the demo journey, search, selection, evidence, mobile layout, and catalog failure/retry. Locally they start or reuse a development server on port 3100; CI tests the production server after the build. Set `TEST_BASE_URL` to test an already running production server.

With an app running on port 3000, `npm run test:retrieval` verifies the live HTTP evidence endpoint. `npm run test:neo4j` requires the configured local database. GitHub Actions runs the core checks, Chromium flows, and an independent Neo4j round-trip.

## Project map

- `public/manifests/hand_region.json`: geometry paths, transforms, bounds, and layers.
- `src/lib/anatomy-data.ts` and `hand-expansion.ts`: canonical metadata, coverage checklist, graph-only entries, relationships, and citations.
- `src/lib/anatomy-repository.ts`: explicit bundled/Neo4j backend selection.
- `src/lib/retrieval.ts`: evidence selection and unsupported-query handling.
- `src/features/anatomy-viewer`: 3D viewer and control interactions.
- `src/features/knowledge-graph`: synchronized graph and node directory.
- `scripts/`: seeding, validation, asset processing, and live verification.

## Attribution and configuration safety

**93 assets:** BodyParts3D, © The Database Center for Life Science, under [CC BY 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). **97 assets:** Z-Anatomy project, Lluís Vinent Juanico and contributors, under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Preserve each source’s attribution and the ShareAlike terms for Z-Anatomy derivatives; see [asset documentation](docs/ASSETS.md). Draco decoder files are vendored under their [Apache 2.0 license](public/draco/LICENSE), so rendering does not depend on a decoder CDN. Relationship references include OpenStax and Kenhub, linked per connection.

Keep connection secrets in `.env.local` or the deployment environment, never in source. Earlier repository history contained hardcoded Neo4j credentials in diagnostic scripts; those scripts have been removed. **Revoke or rotate those historical credentials before using the old remote database.** Removal from the current source does not remove them from Git history.
