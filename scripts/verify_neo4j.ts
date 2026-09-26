import assert from 'node:assert/strict';
import { loadEnvConfig } from '@next/env';
import { getBundledDataset } from '../src/lib/anatomy-data';
import { getAnatomyDataset } from '../src/lib/anatomy-repository';
import { seedAnatomy } from '../src/lib/seed';
import { closeNeo4jDriver, withNeo4jSession } from '../src/lib/neo4j';
import { retrieveEvidence } from '../src/lib/retrieval';
loadEnvConfig(process.cwd());
process.env.ANATOMY_DATA_MODE = 'neo4j';
async function verify() {
  try {
    const first = await seedAnatomy();
    const second = await seedAnatomy();
    assert.deepEqual(second, first, 'Repeated seeding must be idempotent');
    const actual = await getAnatomyDataset();
    assert.deepEqual({ ...actual, mode: 'bundled' }, getBundledDataset(), 'Neo4j and bundled modes must expose the same canonical graph');
    const query = 'What muscles are innervated by the median nerve?';
    const evidence = retrieveEvidence(query, actual);
    assert.equal(evidence.evidence[0].relationship, 'INNERVATES');
    assert.equal(evidence.metadata.mode, 'neo4j');
    const counts = await withNeo4jSession(async (session) => {
      const result = await session.run('MATCH (n:AnatomicalStructure) RETURN count(n) AS structures');
      return result.records[0].get('structures').toNumber();
    });
    assert.ok(counts >= getBundledDataset().structures.length);
    console.log('Neo4j verified: two idempotent seeds, catalog parity, relationships, assets, and retrieval.', first);
  } finally { await closeNeo4jDriver(); }
}
verify().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Neo4j verification failed'); process.exitCode = 1; });
