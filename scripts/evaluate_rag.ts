import assert from 'node:assert/strict';
import type { RetrievalResponse } from '../src/lib/anatomy-types';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
async function run() {
  for (const [query, status, relation] of [
    ['What innervates abductor pollicis brevis?', 'ok', 'INNERVATES'],
    ['What passes through the carpal tunnel?', 'ok', 'PASSES_THROUGH'],
    ['What muscles are innervated by the median nerve?', 'ok', 'INNERVATES'],
    ['What structures are affected in carpal tunnel syndrome?', 'ok', 'AFFECTED_BY'],
    ['What articulates with the scaphoid?', 'ok', 'ARTICULATES_WITH'],
    ['What is near the scaphoid?', 'unsupported', null],
    ['What is the anatomy of an unknown structure zzzz?', 'no_results', null],
  ] as const) {
    const response = await fetch(`${base}/api/retrieval`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200, query);
    const result: RetrievalResponse = await response.json();
    assert.equal(result.status, status, query);
    if (relation) {
      assert.ok(result.evidence.length > 0, query);
      assert.ok(result.evidence.every((edge) => edge.relationship === relation && edge.citation.title && edge.citation.url.startsWith('https://') && edge.sourceNode.graphNodeId && edge.targetNode.graphNodeId), query);
    } else assert.equal(result.evidence.length, 0, query);
    console.log(`PASS ${query} (${result.evidence.length} evidence connections)`);
  }
}
run().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
