/* eslint-disable @typescript-eslint/no-require-imports -- Node CLI loads shared TypeScript through tsx. */
require('@next/env').loadEnvConfig(process.cwd());
require('tsx/cjs');
const { createIndexes } = require('../src/lib/seed.ts');
const { closeNeo4jDriver, AnatomyDataError } = require('../src/lib/neo4j.ts');

(async () => {
  try {
    const count = await createIndexes();
    console.log(`Verified ${count} anatomy constraints and fulltext indexes.`);
  } catch (error) {
    console.error(error instanceof AnatomyDataError ? error.message : 'Index creation failed. Check connection settings, database access and Neo4j logs.');
    process.exitCode = 1;
  } finally {
    await closeNeo4jDriver();
  }
})();
