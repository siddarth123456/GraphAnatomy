# GraphAnatomy

An interactive hand-anatomy demo connecting 3D structures, a medical knowledge graph, and source-backed evidence retrieval.

## Run the demo

Requires **Node.js 22+** and npm. A database and AI API key are not required for the bundled demo.

```sh
npm ci
npm run build
npm start
```

Open **http://localhost:3000**. For development, use `npm run dev`.

Start with **Scaphoid** in Explore, inspect the model, then follow **Median Nerve → Abductor Pollicis Brevis** in Knowledge graph. In Find evidence, try **“What muscles are innervated by the median nerve?”**

[Three-minute demo script and recovery steps](docs/DEMO.md) · [Asset provenance and import pipeline](docs/ASSETS.md)

## What the MVP includes

| Capability | Delivered behavior |
| --- | --- |
| Interactive hand viewer | 31 Draco-compressed anatomical meshes, keyboard search, selection, layers and presets, isolation, exploded view, three section planes, labels, camera fitting, and reset |
| Knowledge graph | 32 anatomical structures (31 with meshes), one clinical condition, and 25 directed, cited relationships; 3D and graph selections stay synchronized |
| GraphQL API | Bounded read-only list, detail, asset, relationship, and clinical queries at `/api/graphql` |
| Neo4j | Optional real graph database, constraints/full-text indexes, idempotent seeding, shared data contract, and connection error handling |
| Ontology and asset validation | Checks identifiers, source mappings, provenance, relationship categories, graph/mesh bindings, decoded bounds, and all 93 LOD files; invalid data exits nonzero |
| GraphRAG foundation | Deterministic entity matching and one-hop retrieval with citations, stable IDs, explicit no-match responses, and unsupported spatial-query handling |
| BodyParts3D pipeline | Source OBJ checksums and mappings, centered/scaled GLB generation, three compressed LODs, generated manifests, and import reports |

The 3D subset has **29 bones, the radial artery, and abductor pollicis brevis**. The median nerve is explicitly **graph-only**; placeholder nerve geometry is never rendered. This is a selected educational atlas, not complete hand coverage.

FMA mappings are inherited from BodyParts3D and checked against the included source-mapping snapshot. They are **not independently certified against the complete FMA ontology**. No SNOMED CT mappings are asserted. Evidence is curated educational reference material, not diagnosis or generated medical advice. Vector retrieval, a generative AI tutor, full-body coverage, cloud infrastructure, and clinical decision support remain future work.

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
{ "query": "What muscles are innervated by the median nerve?" }
```

Results preserve anatomical edge direction, cite the source, and qualify branches represented by a parent nerve/artery. The endpoint accepts 1–500 characters. Unknown questions return `no_results`; spatial questions return `unsupported` with no invented proximity evidence. GraphQL rejects mutations and bounds query size, nesting, and result limits.

## Verification

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

`check` runs lint, TypeScript, behavioral/unit tests, asset and ontology validation, and a production build. Browser tests cover the demo journey, search, selection, evidence, mobile layout, and catalog failure/retry. By default they start or reuse a development server on port 3100. Set `TEST_BASE_URL` to test an already running production server.

With an app running on port 3000, `npm run test:retrieval` verifies the live HTTP evidence endpoint. `npm run test:neo4j` requires the configured local database. GitHub Actions runs the core checks, Chromium flows, and an independent Neo4j round-trip.

## Project map

- `public/manifests/hand_region.json`: geometry paths, transforms, bounds, and layers.
- `src/lib/anatomy-data.ts`: canonical structure metadata, graph-only entries, relationships, and citations.
- `src/lib/anatomy-repository.ts`: explicit bundled/Neo4j backend selection.
- `src/lib/retrieval.ts`: evidence selection and unsupported-query handling.
- `src/features/anatomy-viewer`: 3D viewer and control interactions.
- `src/features/knowledge-graph`: synchronized graph and node directory.
- `scripts/`: seeding, validation, asset processing, and live verification.

## Attribution and configuration safety

BodyParts3D, © The Database Center for Life Science, licensed under **CC Attribution 4.0 International**. See [the archive license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) and [asset documentation](docs/ASSETS.md). Draco decoder files are vendored under their [Apache 2.0 license](public/draco/LICENSE), so rendering does not depend on a decoder CDN. Relationship references include OpenStax and Kenhub, linked per connection.

Keep connection secrets in `.env.local` or the deployment environment, never in source. Earlier repository history contained hardcoded Neo4j credentials in diagnostic scripts; those scripts have been removed. **Revoke or rotate those historical credentials before using the old remote database.** Removal from the current source does not remove them from Git history.
