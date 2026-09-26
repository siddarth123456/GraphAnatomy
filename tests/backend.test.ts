import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getBundledDataset } from '../src/lib/anatomy-data';
import { retrieveEvidence } from '../src/lib/retrieval';
import { getDataMode } from '../src/lib/anatomy-repository';
import { GET as anatomy } from '../src/app/api/anatomy/route';
import { POST as retrieval } from '../src/app/api/retrieval/route';
import { GET as graphGet, POST as graphPost } from '../src/app/api/graphql/route';
import { closeNeo4jDriver } from '../src/lib/neo4j';

process.env.ANATOMY_DATA_MODE = 'bundled';
const dataset = getBundledDataset();
const request = (payload: unknown) => new Request('http://localhost/api/retrieval', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

test('canonical dataset maps 31 assets and a graph-only median nerve without asserted ontology validation', () => {
  assert.equal(dataset.structures.length, 32);
  assert.equal(dataset.structures.filter((node) => node.asset).length, 31);
  assert.ok(dataset.structures.every((node) => !node.ontologyValidated));
  const nerve = dataset.structures.find((node) => node.graphNodeId === 'NERVE_MEDIAN_NERVE')!;
  assert.equal(nerve.asset, null);
  assert.equal(nerve.fmaId, null);
  const ids = new Set([...dataset.structures.map((node) => node.graphNodeId), ...dataset.clinicalConditions.map((node) => node.id)]);
  assert.equal(new Set(dataset.relationships.map((edge) => edge.id)).size, dataset.relationships.length);
  for (const edge of dataset.relationships) {
    assert.ok(ids.has(edge.source) && ids.has(edge.target));
    assert.ok(edge.citation.title && new URL(edge.citation.url).protocol === 'https:');
  }
});

test('retrieval preserves anatomical direction, source citations and branch qualification', () => {
  for (const query of ['What does the median nerve innervate?', 'What innervates abductor pollicis brevis?', 'What is the nerve supply of APB?', 'Which nerve supplies abductor pollicis brevis?', 'Is APB supplied by the median nerve?']) {
    const result = retrieveEvidence(query, dataset);
    assert.equal(result.status, 'ok');
    assert.equal(result.evidence.length, 1);
    const edge = result.evidence[0];
    assert.equal(edge.sourceNode.graphNodeId, 'NERVE_MEDIAN_NERVE');
    assert.equal(edge.relationship, 'INNERVATES');
    assert.equal(edge.targetNode.graphNodeId, 'MUSCLE_ABDUCTOR_POLLICIS_BREVIS');
    assert.match(edge.description, /recurrent branch/i);
    assert.match(edge.citation.url, /kenhub/);
    assert.equal(edge.sourceNode.ontologyValidated, false);
    assert.equal(edge.targetNode.ontologyValidated, false);
  }
});

test('clinical aliases retrieve anatomy → condition and spatial queries remain unsupported', () => {
  const clinical = retrieveEvidence('What is affected by CTS?', dataset);
  assert.equal(clinical.intent, 'CLINICAL_CONDITION_QUERY');
  assert.equal(clinical.evidence[0].sourceNode.graphNodeId, 'NERVE_MEDIAN_NERVE');
  assert.equal(clinical.evidence[0].targetNode.graphNodeId, 'CLINICAL_CARPAL_TUNNEL_SYNDROME');
  assert.equal(clinical.evidence[0].relationship, 'AFFECTED_BY');
  const spatial = retrieveEvidence('What is near the median nerve?', dataset);
  assert.equal(spatial.status, 'unsupported');
  assert.deepEqual(spatial.evidence, []);
  assert.equal(retrieveEvidence('zzzzunknown', dataset).status, 'no_results');
  assert.equal(retrieveEvidence('Which arteries supply the median nerve?', dataset).status, 'no_results');
  for (const query of ['What is posterior to the scaphoid?', 'What lies superficial to APB?', 'Which bones are distal to the radius?']) {
    assert.equal(retrieveEvidence(query, dataset).status, 'unsupported');
  }
  assert.equal(retrieveEvidence('What articulates with the distal phalanx of thumb?', dataset).status, 'ok');
});

test('REST contracts and invalid retrieval bodies', async () => {
  const catalog = await anatomy();
  assert.equal(catalog.status, 200);
  assert.equal((await catalog.json()).metadata.renderableCount, 31);
  for (const value of [{}, null, [], { query: 42 }, { query: '' }, { query: '  ' }, { query: 'x'.repeat(501) }]) {
    assert.equal((await retrieval(request(value))).status, 400);
  }
  assert.equal((await retrieval(new Request('http://localhost/api/retrieval', { method: 'POST', body: '{' }))).status, 400);
  const response = await retrieval(request({ query: 'What supplies APB?' }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.evidence[0].sourceNode.graphNodeId, 'ARTERY_RADIAL_ARTERY');
  assert.equal(body.evidence[0].relationship, 'SUPPLIES');
});

test('GraphQL exposes list, detail, asset, relationship and graph reads', async () => {
  const response = await graphPost(request({
    query: 'query Detail($id: ID!) { anatomicalStructures(where: {graphNodeId: $id}, limit: 1) { graphNodeId asset { meshId glbPath } innervatedBy { graphNodeId } relationships { source target type citation { url } } } anatomyGraph { mode metadata { structureCount relationshipCount } } }',
    variables: { id: 'MUSCLE_ABDUCTOR_POLLICIS_BREVIS' },
  }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.errors, undefined);
  assert.equal(body.data.anatomicalStructures[0].innervatedBy[0].graphNodeId, 'NERVE_MEDIAN_NERVE');
  assert.equal(body.data.anatomicalStructures[0].asset.meshId, 'mesh_abductor_pollicis_brevis_01');
  assert.equal(body.data.anatomyGraph.metadata.structureCount, 32);
  const url = new URL('http://localhost/api/graphql');
  url.searchParams.set('query', '{ anatomyAssets(limit: 2) { meshId } clinicalConditions { id affectedStructures { graphNodeId } } }');
  const get = await graphGet(new Request(url));
  assert.equal(get.status, 200);
  assert.equal((await get.json()).data.anatomyAssets.length, 2);
});

test('GraphQL rejects mutations, bad variables and malformed queries', async () => {
  for (const value of [{ query: 'mutation { deleteAnatomicalStructures { nodesDeleted } }' }, { query: '{ broken' }, { query: '{ anatomyAssets { meshId } }', variables: [] }, { query: 42 }, {}]) {
    assert.equal((await graphPost(request(value))).status, 400);
  }
  assert.equal((await graphPost(request({ query: '{ anatomyAssets(limit: -1) { meshId } }' }))).status, 400);
});

test('invalid data mode fails explicitly without a bundled fallback', () => {
  const original = process.env.ANATOMY_DATA_MODE;
  try { process.env.ANATOMY_DATA_MODE = 'broken'; assert.throws(getDataMode, /bundled or neo4j/); }
  finally { process.env.ANATOMY_DATA_MODE = original; }
});

test('unavailable configured Neo4j returns 503 across APIs without demo fallback', async () => {
  const keys = ['ANATOMY_DATA_MODE', 'NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD'] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    await closeNeo4jDriver();
    process.env.ANATOMY_DATA_MODE = 'neo4j';
    process.env.NEO4J_URI = 'bolt://127.0.0.1:1';
    process.env.NEO4J_USER = 'unavailable-test';
    process.env.NEO4J_PASSWORD = 'unavailable-test';
    assert.equal((await anatomy()).status, 503);
    assert.equal((await retrieval(request({ query: 'What innervates APB?' }))).status, 503);
    assert.equal((await graphPost(request({ query: '{ anatomyGraph { mode } }' }))).status, 503);
  } finally {
    await closeNeo4jDriver();
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
  }
});
