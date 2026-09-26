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

test('expanded canonical dataset retains unique sourced structures and honest ontology status', () => {
  assert.ok(dataset.structures.length >= 390);
  assert.ok(dataset.structures.filter((node) => node.asset).length >= 94);
  assert.ok(dataset.structures.every((node) => !node.ontologyValidated));
  const nerve = dataset.structures.find((node) => node.graphNodeId === 'NERVE_MEDIAN_NERVE')!;
  assert.equal(nerve.fmaId, null);
  const ids = new Set([...dataset.structures.map((node) => node.graphNodeId), ...dataset.clinicalConditions.map((node) => node.id)]);
  assert.equal(new Set(dataset.relationships.map((edge) => edge.id)).size, dataset.relationships.length);
  for (const edge of dataset.relationships) {
    assert.ok(ids.has(edge.source) && ids.has(edge.target));
    assert.ok(edge.citation.title && new URL(edge.citation.url).protocol === 'https:');
  }
});

test('retrieval preserves anatomical direction, source citations and branch qualification', () => {
  for (const query of ['What innervates abductor pollicis brevis?', 'What is the nerve supply of APB?', 'Which nerve supplies abductor pollicis brevis?']) {
    const result = retrieveEvidence(query, dataset);
    assert.equal(result.status, 'ok');
    assert.equal(result.evidence.length, 1);
    const edge = result.evidence[0];
    assert.equal(edge.sourceNode.graphNodeId, 'NERVE_MEDIAN_RECURRENT_BRANCH');
    assert.equal(edge.relationship, 'INNERVATES');
    assert.equal(edge.targetNode.graphNodeId, 'MUSCLE_ABDUCTOR_POLLICIS_BREVIS');
    assert.match(edge.description, /recurrent median branch/i);
    assert.match(edge.citation.url, /kenhub/);
    assert.equal(edge.sourceNode.ontologyValidated, false);
    assert.equal(edge.targetNode.ontologyValidated, false);
  }
  const parent = retrieveEvidence('What does the median nerve innervate?', dataset);
  assert.ok(parent.evidence.some(edge => edge.targetNode.graphNodeId === 'MUSCLE_FLEXOR_CARPI_RADIALIS'));
  assert.ok(parent.evidence.every(edge => edge.sourceNode.graphNodeId === 'NERVE_MEDIAN_NERVE'));
  const branch = retrieveEvidence('What does the recurrent branch of median nerve innervate?', dataset);
  assert.ok(branch.evidence.some(edge => edge.targetNode.graphNodeId === 'MUSCLE_ABDUCTOR_POLLICIS_BREVIS'));
  assert.ok(branch.evidence.every(edge => edge.sourceNode.graphNodeId === 'NERVE_MEDIAN_RECURRENT_BRANCH'));
  const both = retrieveEvidence('What do the median nerve and recurrent branch of median nerve innervate?', dataset);
  assert.ok(both.evidence.some(edge => edge.sourceNode.graphNodeId === 'NERVE_MEDIAN_NERVE'));
  assert.ok(both.evidence.some(edge => edge.sourceNode.graphNodeId === 'NERVE_MEDIAN_RECURRENT_BRANCH'));
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

test('anatomical passages are not overridden by overlapping clinical aliases', () => {
  const tunnel = retrieveEvidence('What passes through the carpal tunnel?', dataset);
  assert.equal(tunnel.intent, 'ANATOMY_RELATIONSHIP_QUERY');
  assert.equal(tunnel.evidence.length, 10, 'Median nerve plus nine flexor tendons');
  assert.ok(tunnel.evidence.every(edge => edge.relationship === 'PASSES_THROUGH' && edge.targetNode.graphNodeId === 'SPACE_CARPAL_TUNNEL'));
  assert.ok(tunnel.evidence.some(edge => edge.sourceNode.graphNodeId === 'NERVE_MEDIAN_NERVE'));
  assert.ok(!tunnel.extractedTerms.includes('Carpal Tunnel Syndrome'));
  const components = retrieveEvidence('What is part of the radiocarpal joint?', dataset);
  assert.ok(components.evidence.length);
  assert.ok(components.evidence.every(edge => edge.relationship === 'PART_OF'));
  for (const query of ['What structures are affected in carpal tunnel syndrome?', 'What is affected in carpal tunnel?', 'CTS']) {
    const result = retrieveEvidence(query, dataset);
    assert.equal(result.intent, 'CLINICAL_CONDITION_QUERY');
    assert.ok(result.evidence.every(edge => edge.relationship === 'AFFECTED_BY'));
    assert.ok(result.evidence.length);
  }
});

test('REST contracts and invalid retrieval bodies', async () => {
  const catalog = await anatomy();
  assert.equal(catalog.status, 200);
  assert.equal((await catalog.json()).metadata.renderableCount, dataset.structures.filter(node => node.asset).length);
  for (const value of [{}, null, [], { query: 42 }, { query: '' }, { query: '  ' }, { query: 'x'.repeat(501) }]) {
    assert.equal((await retrieval(request(value))).status, 400);
  }
  assert.equal((await retrieval(new Request('http://localhost/api/retrieval', { method: 'POST', body: '{' }))).status, 400);
  const response = await retrieval(request({ query: 'What supplies APB?' }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.evidence[0].sourceNode.graphNodeId, 'ARTERY_RADIAL_SUPERFICIAL_PALMAR_BRANCH');
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
  assert.equal(body.data.anatomicalStructures[0].innervatedBy[0].graphNodeId, 'NERVE_MEDIAN_RECURRENT_BRANCH');
  assert.equal(body.data.anatomicalStructures[0].asset.meshId, 'mesh_abductor_pollicis_brevis_01');
  assert.equal(body.data.anatomyGraph.metadata.structureCount, dataset.structures.length);
  const url = new URL('http://localhost/api/graphql');
  url.searchParams.set('query', '{ anatomyAssets(limit: 2) { meshId } clinicalConditions { id affectedStructures { graphNodeId } } }');
  const get = await graphGet(new Request(url));
  assert.equal(get.status, 200);
  assert.equal((await get.json()).data.anatomyAssets.length, 2);
});

test('GraphQL pagination reaches the full expanded catalog and exposes branch relationships', async () => {
  const ids: string[] = [];
  for (let offset = 0; offset < dataset.structures.length; offset += 100) {
    const response = await graphPost(request({ query: `query { anatomicalStructures(limit: 100, offset: ${offset}) { graphNodeId } }` }));
    const body = await response.json();
    assert.equal(body.errors, undefined);
    ids.push(...body.data.anatomicalStructures.map((node: { graphNodeId: string }) => node.graphNodeId));
  }
  assert.deepEqual(ids, dataset.structures.map(node => node.graphNodeId));
  assert.equal(new Set(ids).size, ids.length);
  const result = await graphPost(request({ query: '{ anatomicalStructure(graphNodeId: "NERVE_MEDIAN_RECURRENT_BRANCH") { branchesFrom { graphNodeId } innervates { graphNodeId } } }' }));
  const body = await result.json();
  assert.ok(body.data.anatomicalStructure.branchesFrom.some((node: { graphNodeId: string }) => node.graphNodeId === 'NERVE_MEDIAN_NERVE'));
  assert.ok(body.data.anatomicalStructure.innervates.some((node: { graphNodeId: string }) => node.graphNodeId === 'MUSCLE_ABDUCTOR_POLLICIS_BREVIS'));
  assert.equal((await graphPost(request({ query: '{ anatomicalStructures(offset: -1) { graphNodeId } }' }))).status, 400);
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
